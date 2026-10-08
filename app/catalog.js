"use strict";

// Catalog interpretation is pure: no DOM, browser storage, network or route state.
(function (root) {
function resolutionKey(file) {
  return file.width && file.height ? file.width + "x" + file.height : "unknown";
}

function resolutionLabel(file) {
  if (file.path.toLowerCase().endsWith(".svg")) return "SVG 矢量图";
  return file.width && file.height ? file.width + " × " + file.height : "尺寸读取中";
}

function orientation(file) {
  return !file.width || !file.height ? "unknown" : file.width === file.height ? "square" : file.width < file.height ? "portrait" : "landscape";
}

function inferDevice(width,height) {
  if (!width || !height) return "unknown";
  if (width < height && width >= 720 && width <= 1800 && height / width >= 1.9 && height / width <= 2.6) return "phone";
  const size = Math.min(width,height) + "x" + Math.max(width,height);
  if (["1536x2048","1668x2224","1668x2388","1640x2360","2048x2732"].includes(size)) return "tablet";
  if (width >= 1920 && width / height >= 1.7 && width / height <= 3.6) return "desktop";
  return "unknown";
}

function makeAsset(file,games = []) {
  const match = file.path.match(/^(?:wallpapers|avatars)\/([^/]+)\/(\d+)x(\d+)\//);
  const iconMatch = file.path.match(/^icons\/([^/]+)\//);
  const cardMatch = file.path.match(/^bank-cards\/(originals|custom)\/([^/]+)\/([^/]+)\//);
  const selectedCover = file.path.match(/^game-covers\/([^/]+)\/([^/]+)\.(?:jpg|png)$/);
  const extraCover = file.path.match(/^game-covers\/([^/]+)\/extras\/([^/]+)\/[^/]+\.(?:jpg|png)$/);
  const coverMatch = selectedCover || extraCover;
  const inferredKind = file.path.startsWith("wallpapers/") ? "wallpaper" : file.path.startsWith("avatars/") ? "avatar" : /^actresses\/portraits\/p\d{4,}\.(jpg|png|webp)$/.test(file.path) ? "actress" : iconMatch ? "icon" : cardMatch ? "bank-card" : coverMatch ? "game-cover" : "other";
  const filename = file.path.split("/").pop();
  const asset = {
    path: file.path, person: inferredKind === "actress" ? file.person : undefined, size: Number.isFinite(file.size) && file.size > 0 ? file.size : 0,
    sha: typeof file.sha === "string" && /^[a-f0-9]{40}$/.test(file.sha) ? file.sha : "",
    title: typeof file.title === "string" && file.title.trim() ? file.title : filename.replace(/\.[^.]+$/,"").replace(/-/g," "),
    kind: inferredKind,
    device: ["phone","desktop","tablet","unknown"].includes(file.device) ? file.device : "",
    category: match ? match[1] : iconMatch ? iconMatch[1] : cardMatch ? cardMatch[2] : coverMatch ? coverMatch[1] : "other",
    bank: cardMatch ? cardMatch[3] : "", game: coverMatch ? coverMatch[2] : "",
    edition: cardMatch ? cardMatch[1] : "", extra: Boolean(extraCover),
    cover: coverMatch && file.cover && typeof file.cover === "object" ? Object.fromEntries(Object.entries(file.cover).filter(([key,value]) => ["version","platform","region"].includes(key) && typeof value === "string")) : undefined,
    source: cardMatch ? file.source && typeof file.source === "object" && !Array.isArray(file.source) ? file.source : undefined : typeof file.source === "string" ? file.source : undefined,
    license: typeof file.license === "string" ? file.license : "",
    derivedFrom: cardMatch && typeof file.derivedFrom === "string" ? file.derivedFrom : undefined,
    width: Number.isFinite(file.width) && file.width > 0 ? file.width : match ? Number(match[2]) : 0,
    height: Number.isFinite(file.height) && file.height > 0 ? file.height : match ? Number(match[3]) : 0,
    note: typeof file.note === "string" ? file.note : "",
    thumbnail: typeof file.thumbnail === "string" && /^app\/previews\/[a-z0-9-]+\.webp$/.test(file.thumbnail) ? file.thumbnail : ""
  };
  if (asset.kind === "game-cover") asset.title = games.find(game => game.series === asset.category && game.id === asset.game)?.title || asset.title;
  if (asset.kind === "wallpaper" && !asset.device) asset.device = inferDevice(asset.width,asset.height);
  return asset;
}

function compareAssets(a,b,kind,sort,gameInfo) {
  const difference = (a.width || 0) * (a.height || 0) - (b.width || 0) * (b.height || 0);
  const byName = a.title.localeCompare(b.title,"zh-CN") || a.path.localeCompare(b.path);
  if (kind === "game-cover") return (gameInfo(a)?.firstReleaseYear || 0) - (gameInfo(b)?.firstReleaseYear || 0) || a.title.localeCompare(b.title,"zh-CN") || Number(a.extra) - Number(b.extra) || a.path.localeCompare(b.path);
  if (sort === "name" || (sort === "collection" && kind !== "wallpaper" && kind !== "avatar")) return byName;
  return (sort === "resolution-asc" ? difference : -difference) || byName;
}

function matchesQuery(file,query,{categoryLabel,deviceLabels,cardBank,gameInfo}) {
  const normalize = value => value.normalize("NFKC").toLocaleLowerCase().replace(/[-_/·・]+/g," ");
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const text = normalize([file.title,file.path,categoryLabel(file),deviceLabels[file.device] || "",cardBank(file)?.name || "",cardBank(file)?.englishName || "",file.source?.wallet || "",gameInfo(file)?.title || "",file.cover?.version || "",file.cover?.platform || "",file.cover?.region || ""].join(" "));
  return terms.every(term => text.includes(term));
}

const api = { resolutionKey, resolutionLabel, orientation, inferDevice, makeAsset, compareAssets, matchesQuery };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.AssetCatalog = api;
})(typeof window !== "undefined" ? window : globalThis);
