"use strict";

const repo = "zzpice/assets";
const base = new URL(".", document.baseURI);
const imagePattern = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
const categoryLabels = { anime: "动漫", people: "真人", animals: "动物", pixel: "像素", illustration: "插画", landscape: "风景", minimal: "极简", abstract: "抽象", gaming: "游戏", photography: "摄影", other: "其他" };
const orientationLabels = { portrait: "竖屏", landscape: "横屏", square: "方形", unknown: "方向未标注" };
const kindLabels = { wallpaper: "壁纸", avatar: "头像", other: "其他图片" };
const deviceLabels = { phone: "手机", desktop: "电脑", tablet: "平板", unknown: "待分类" };
const controls = Object.fromEntries(["search","device","category","resolution","orientation","sort"].map(id => [id,document.getElementById(id)]));
const gallery = document.getElementById("gallery");
const results = document.getElementById("results");
const reset = document.getElementById("reset");
const installButton = document.getElementById("install");
const previewDialog = document.getElementById("preview-dialog");
const previewImage = document.getElementById("preview-image");
let assets = [];
let kind = "wallpaper";
let deferredInstall = null;
let toastTimeout;
let activePreview;
let previewUsingThumbnail = false;
let visibleAssets = [];
let previewSequence = [];
let initialRoute = true;
let lockscreenEnabled = false;
let directoryLimited = false;
let favoritesOnly = false;
const favoriteKey = "zzpice-assets-favorites:" + base.pathname;
let favorites = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
  if (Array.isArray(saved)) favorites = new Set(saved.filter(path => typeof path === "string"));
} catch { /* Browsing remains available when local storage is restricted. */ }

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function isUserImage(file) {
  return file.type === "blob" && imagePattern.test(file.path) && !file.path.startsWith("app/");
}

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

function makeAsset(file, metadata) {
  const info = metadata.get(file.path) || {};
  const match = file.path.match(/^(?:wallpapers|avatars)\/([^/]+)\/(\d+)x(\d+)\//);
  const currentMetadata = !file.sha || !info.sha || file.sha === info.sha;
  const inferredKind = file.path.startsWith("wallpapers/") ? "wallpaper" : file.path.startsWith("avatars/") ? "avatar" : "other";
  const filename = file.path.split("/").pop();
  const asset = {
    path: file.path, size: file.size || info.size || 0,
    title: info.title || filename.replace(/\.[^.]+$/,"").replace(/-/g," "),
    kind: info.kind || inferredKind,
    device: ["phone","desktop","tablet","unknown"].includes(info.device) ? info.device : "",
    category: info.category || (match ? match[1] : "other"),
    width: (currentMetadata && info.width) || (match ? Number(match[2]) : 0),
    height: (currentMetadata && info.height) || (match ? Number(match[3]) : 0),
    note: currentMetadata ? info.note || "" : "", thumbnail: currentMetadata ? info.thumbnail || "" : ""
  };
  if (asset.kind === "wallpaper" && !asset.device) asset.device = inferDevice(asset.width,asset.height);
  return asset;
}

function fillSelect(select, entries, placeholder) {
  const old = select.value;
  select.replaceChildren(new Option(placeholder, ""));
  entries.forEach(([value,label]) => select.add(new Option(label,value)));
  if (entries.some(([value]) => value === old)) select.value = old;
}

function refreshControls() {
  const files = assets.filter(file => file.kind === kind);
  const devices = ["phone","desktop","tablet","unknown"].filter(device => files.some(file => file.device === device));
  fillSelect(controls.device,devices.map(value => [value,deviceLabels[value]]),"全部设备");
  controls.device.disabled = kind !== "wallpaper";
  controls.device.closest(".field").hidden = controls.device.disabled;
  if (controls.device.disabled) controls.device.value = "";
  const deviceFiles = files.filter(file => !controls.device.value || file.device === controls.device.value);
  const categories = [...new Set(deviceFiles.map(file => file.category))].sort();
  fillSelect(controls.category, categories.map(value => [value,categoryLabels[value] || value]), "全部种类");
  controls.category.disabled = kind === "other";
  controls.category.closest(".field").hidden = controls.category.disabled;
  if (controls.category.disabled) controls.category.value = "";
  const categoryFiles = deviceFiles.filter(file => !controls.category.value || file.category === controls.category.value);
  const sizes = [...new Map(categoryFiles.map(file => [resolutionKey(file),file])).entries()]
    .sort((a,b) => b[1].width * b[1].height - a[1].width * a[1].height);
  fillSelect(controls.resolution, sizes.map(([key,file]) => [key,key === "unknown" ? "尺寸未标注" : resolutionLabel(file)]), "全部尺寸");
  document.querySelectorAll(".tab").forEach(tab => {
    const count = assets.filter(file => file.kind === tab.dataset.kind).length;
    tab.querySelector("span").textContent = count;
    tab.hidden = tab.dataset.kind === "other" && !count;
    tab.disabled = !count;
    tab.setAttribute("aria-pressed", String(tab.dataset.kind === kind));
  });
  const wallpapers = assets.filter(file => file.kind === "wallpaper");
  const sizeCount = new Set(wallpapers.filter(file => file.width && file.height).map(resolutionKey)).size;
  const avatarCount = assets.filter(file => file.kind === "avatar").length;
  document.getElementById("summary").textContent = wallpapers.length + " 张壁纸 · " + sizeCount + " 种尺寸" + (avatarCount ? " · " + avatarCount + " 张头像" : "");
  refreshFavoriteCount();
}

function refreshFavoriteCount() {
  document.getElementById("favorite-count").textContent = assets.filter(file => file.kind === kind && favorites.has(file.path)).length;
  document.getElementById("show-favorites").setAttribute("aria-pressed", String(favoritesOnly));
}

function updateFavoriteButton(button,file) {
  const saved = favorites.has(file.path);
  button.setAttribute("aria-pressed",String(saved));
  button.setAttribute("aria-label",(saved ? "取消收藏" : "收藏") + file.title);
}

function toggleFavorite(file,button) {
  const saved = !favorites.has(file.path);
  if (saved) favorites.add(file.path); else favorites.delete(file.path);
  let persistent = true;
  try { localStorage.setItem(favoriteKey,JSON.stringify([...favorites])); } catch { persistent = false; }
  updateFavoriteButton(button,file); refreshFavoriteCount();
  showToast((saved ? "已收藏" : "已取消收藏") + (persistent ? "" : " · 仅当前页面"));
  if (favoritesOnly && !saved) {
    renderGallery(); document.getElementById("show-favorites").focus();
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const container = document.querySelector("dialog[open]") || document.body;
  if (toast.parentNode !== container) container.append(toast);
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.hidden = false;
  toastTimeout = setTimeout(() => { toast.hidden = true; }, 2400);
}

async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast("链接已复制");
  } catch {
    window.prompt("复制这个地址：", url);
  }
}

function imageUrl(path) {
  return new URL(path.split("/").map(encodeURIComponent).join("/"), base).href;
}

function previewUrl(file) {
  const url = new URL(base);
  url.hash = "image=" + encodeURIComponent(file.path);
  return url.href;
}

function previewPath() {
  return new URLSearchParams(location.hash.slice(1)).get("image");
}

function refreshPreviewNavigation() {
  const index = previewSequence.indexOf(activePreview?.path);
  document.getElementById("preview-position").textContent = index < 0 ? "" : (index + 1) + " / " + previewSequence.length;
  document.getElementById("preview-previous").disabled = index <= 0;
  document.getElementById("preview-next").disabled = index < 0 || index >= previewSequence.length - 1;
}

function updateLockscreen() {
  const available = activePreview?.kind === "wallpaper" && activePreview.device === "phone" && orientation(activePreview) === "portrait";
  if (!available) lockscreenEnabled = false;
  const button = document.getElementById("preview-lockscreen");
  button.hidden = !available;
  button.setAttribute("aria-pressed",String(lockscreenEnabled));
  document.getElementById("lockscreen-clock").hidden = !lockscreenEnabled || previewImage.hidden;
  document.getElementById("lockscreen-hint").hidden = !lockscreenEnabled;
  const now = new Date();
  document.getElementById("lock-date").textContent = new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(now);
  document.getElementById("lock-time").textContent = new Intl.DateTimeFormat("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false}).format(now);
}

function loadPreviewImage(force = false) {
  if (!activePreview) return;
  previewUsingThumbnail = false;
  previewImage.hidden = true;
  const status = document.getElementById("preview-status");
  status.textContent = "正在加载原图…"; status.hidden = false;
  const retry = document.getElementById("preview-retry");
  if (document.activeElement === retry) document.getElementById("preview-download").focus();
  retry.hidden = true;
  document.getElementById("preview-size").textContent = resolutionLabel(activePreview);
  document.getElementById("image-stage").style.setProperty("--image-ratio",activePreview.width && activePreview.height ? activePreview.width / activePreview.height : 1);
  const url = new URL(imageUrl(activePreview.path));
  if (force === true) url.searchParams.set("retry",Date.now());
  previewImage.src = url.href;
  updateLockscreen();
}

function openPreview(file,historyMode = "push",sequence = visibleAssets) {
  if (!previewDialog.open) {
    previewSequence = sequence.filter(item => item.kind === file.kind).map(item => item.path);
    if (!previewSequence.includes(file.path)) previewSequence = assets.filter(item => item.kind === file.kind).map(item => item.path);
    lockscreenEnabled = false;
  }
  activePreview = file;
  document.getElementById("preview-title").textContent = file.title;
  previewImage.alt = file.title;
  const download = document.getElementById("preview-download");
  download.href = imageUrl(file.path);
  download.download = file.path.split("/").pop();
  if (historyMode !== "none") {
    initialRoute = false;
    history[historyMode + "State"]({ ...history.state,assetPreview:true },"",previewUrl(file));
  }
  if (!previewDialog.open) previewDialog.showModal();
  document.body.style.overflow = "hidden";
  refreshPreviewNavigation(); loadPreviewImage();
}

function closePreview() {
  if (history.state?.assetPreview && previewPath()) history.back();
  else {
    const url = new URL(location.href); url.hash = "";
    history.replaceState({...history.state,assetPreview:false},"",url);
    previewDialog.close();
  }
}

function syncPreviewRoute() {
  const path = previewPath();
  if (!path) { if (previewDialog.open) previewDialog.close(); return; }
  const file = assets.find(item => item.path === path);
  if (!file) return;
  if (initialRoute) {
    // A shared image gets a gallery entry beneath it, so Back stays in the app.
    if (!history.state?.assetPreview) {
      const imageLink = location.href;
      const url = new URL(location.href); url.hash = "";
      history.replaceState({...history.state,assetPreview:false},"",url);
      history.pushState({...history.state,assetPreview:true},"",imageLink);
    }
    initialRoute = false;
  }
  if (kind !== file.kind) { kind = file.kind; clearFilters(); refreshControls(); renderGallery(); }
  if (activePreview?.path !== path || !previewDialog.open) openPreview(file,"none");
}

function movePreview(delta) {
  const index = previewSequence.indexOf(activePreview?.path) + delta;
  if (index < 0 || index >= previewSequence.length) return;
  const file = assets.find(item => item.path === previewSequence[index]);
  if (file) {
    openPreview(file,"replace");
    const preferred = document.getElementById(delta < 0 ? "preview-previous" : "preview-next");
    const other = document.getElementById(delta < 0 ? "preview-next" : "preview-previous");
    (preferred.disabled ? other : preferred).focus();
  }
}

function makeCard(file) {
  const url = imageUrl(file.path);
  const card = element("article", "card");
  const preview = element("button", "preview " + orientation(file));
  preview.type = "button";
  preview.setAttribute("aria-label", "预览" + file.title);
  preview.addEventListener("click", () => openPreview(file));
  const img = element("img");
  img.alt = file.title; img.loading = "lazy"; img.decoding = "async";
  if (file.width && file.height) { img.width = file.width; img.height = file.height; }
  let usingThumbnail = Boolean(file.thumbnail);
  const meta = element("div", "meta");
  const size = element("p", "resolution", resolutionLabel(file));
  const info = element("details", "asset-info");
  const details = element("p", "details");
  function updateDetails() {
    const format = file.path.split(".").pop().toUpperCase();
    details.textContent = (file.kind === "other" ? kindLabels[file.kind] : (categoryLabels[file.category] || file.category)) + (file.device ? " · " + deviceLabels[file.device] : "") + " · " + format + (file.size ? " · " + (file.size / 1048576).toFixed(1) + " MB" : "");
  }
  updateDetails();
  img.addEventListener("load", () => {
    // Preview pixels must never replace the full image dimensions.
    if (usingThumbnail || file.path.toLowerCase().endsWith(".svg")) return;
    if (img.naturalWidth && img.naturalHeight && (file.width !== img.naturalWidth || file.height !== img.naturalHeight)) {
      file.width = img.naturalWidth; file.height = img.naturalHeight;
      refreshControls(); renderGallery();
    }
  });
  img.addEventListener("error", () => {
    if (usingThumbnail) { usingThumbnail = false; img.src = url; return; }
    img.remove(); preview.append(element("span", "image-error", "图片暂时无法加载"));
  });
  img.src = imageUrl(file.thumbnail || file.path);
  preview.append(img);
  const previewWrap = element("div","preview-wrap");
  const favorite = element("button","favorite-toggle");
  favorite.type = "button"; updateFavoriteButton(favorite,file);
  const heart = document.createElementNS("http://www.w3.org/2000/svg","svg");
  heart.setAttribute("viewBox","0 0 24 24"); heart.setAttribute("aria-hidden","true");
  const heartPath = document.createElementNS("http://www.w3.org/2000/svg","path");
  heartPath.setAttribute("d","M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z");
  heart.append(heartPath); favorite.append(heart);
  favorite.addEventListener("click",() => toggleFavorite(file,favorite));
  previewWrap.append(preview,favorite);
  meta.append(element("h2", "", file.title), size);
  const actions = element("div", "actions");
  const download = element("a", "primary-button", "下载原图");
  download.href = url; download.download = file.path.split("/").pop();
  download.addEventListener("click",requireConnection);
  actions.append(download); meta.append(actions);
  info.append(element("summary", "", "图片信息"), details);
  if (file.note) info.append(element("p", "note", file.note));
  const filename = element("span", "filename", file.path.split("/").pop());
  filename.title = file.path; info.append(filename);
  const copy = element("button", "secondary-button", "复制链接");
  copy.type = "button"; copy.addEventListener("click", () => copyUrl(url));
  info.append(copy); meta.append(info);
  card.append(previewWrap, meta);
  return card;
}

function renderGallery() {
  const query = controls.search.value.trim().toLocaleLowerCase();
  const visible = assets.filter(file => file.kind === kind)
    .filter(file => !favoritesOnly || favorites.has(file.path))
    .filter(file => !controls.device.value || file.device === controls.device.value)
    .filter(file => !controls.category.value || file.category === controls.category.value)
    .filter(file => !controls.resolution.value || resolutionKey(file) === controls.resolution.value)
    .filter(file => !controls.orientation.value || orientation(file) === controls.orientation.value)
    .filter(file => !query || [file.title,file.path,categoryLabels[file.category] || "",deviceLabels[file.device] || ""].join(" ").toLocaleLowerCase().includes(query));
  visible.sort((a,b) => {
    const difference = (a.width || 0) * (a.height || 0) - (b.width || 0) * (b.height || 0);
    return controls.sort.value === "name" ? a.title.localeCompare(b.title,"zh-CN") : (controls.sort.value === "resolution-asc" ? difference : -difference) || a.title.localeCompare(b.title,"zh-CN");
  });
  visibleAssets = visible;
  if (visible.length) gallery.replaceChildren(...visible.map(makeCard));
  else {
    const empty = element("div","empty",favoritesOnly ? "这里还没有符合条件的收藏。点图片右上角的心形即可收藏，收藏保存在当前浏览器。" : "没有找到符合条件的图片。");
    const clear = element("button","secondary-button",favoritesOnly ? "浏览全部图片" : "清除筛选");
    clear.type = "button";
    clear.addEventListener("click", () => { clearFilters(); renderGallery(); });
    empty.append(element("br"),clear); gallery.replaceChildren(empty);
  }
  results.textContent = "显示 " + visible.length + " / " + assets.filter(file => file.kind === kind).length + " 张" + kindLabels[kind];
  const count = [controls.device.value,controls.category.value,controls.resolution.value,controls.orientation.value].filter(Boolean).length;
  document.getElementById("filter-summary").textContent = count ? count + " 项筛选" : "全部图片";
  reset.disabled = !query && !count && !favoritesOnly && controls.sort.value === "resolution-desc";
}

function clearFilters() {
  controls.search.value = ""; controls.device.value = ""; controls.category.value = "";
  controls.resolution.value = ""; controls.orientation.value = "";
  controls.sort.value = "resolution-desc";
  favoritesOnly = false; refreshFavoriteCount();
}

document.getElementById("filters-panel").open = !window.matchMedia("(max-width: 760px)").matches;
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  kind = tab.dataset.kind; clearFilters(); refreshControls(); renderGallery();
}));
Object.entries(controls).forEach(([name,control]) => control.addEventListener(name === "search" ? "input" : "change", () => {
  if (name === "device" || name === "category") refreshControls();
  renderGallery();
}));
reset.addEventListener("click", () => { clearFilters(); renderGallery(); });
document.getElementById("show-favorites").addEventListener("click",() => {
  favoritesOnly = !favoritesOnly; refreshFavoriteCount(); renderGallery();
});
document.getElementById("preview-copy").addEventListener("click", () => {
  if (activePreview) copyUrl(imageUrl(activePreview.path));
});
document.getElementById("preview-share").addEventListener("click",async () => {
  if (!activePreview) return;
  const data = {title:activePreview.title,url:previewUrl(activePreview)};
  if (navigator.share) {
    try { await navigator.share(data); return; }
    catch (error) { if (error.name === "AbortError") return; }
  }
  await copyUrl(data.url);
});
document.getElementById("preview-previous").addEventListener("click",() => movePreview(-1));
document.getElementById("preview-next").addEventListener("click",() => movePreview(1));
document.getElementById("preview-lockscreen").addEventListener("click",() => { lockscreenEnabled = !lockscreenEnabled; updateLockscreen(); });
document.getElementById("preview-retry").addEventListener("click",() => loadPreviewImage(true));
document.getElementById("preview-download").addEventListener("click",requireConnection);
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => {
  if (button.dataset.close === "preview-dialog") closePreview();
  else document.getElementById(button.dataset.close).close();
}));
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    const toast = document.getElementById("toast");
    if (toast.parentNode === dialog) document.body.append(toast);
  });
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
      if (dialog === previewDialog) closePreview(); else dialog.close();
    }
  });
});
previewDialog.addEventListener("cancel",event => { event.preventDefault(); closePreview(); });
previewDialog.addEventListener("keydown",event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest("input,select,textarea")) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault(); movePreview(event.key === "ArrowLeft" ? -1 : 1);
  }
});
let swipeStart;
document.getElementById("image-stage").addEventListener("touchstart",event => {
  swipeStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
},{passive:true});
document.getElementById("image-stage").addEventListener("touchend",event => {
  if (!swipeStart || event.touches.length || event.changedTouches.length !== 1) { swipeStart = null; return; }
  const dx = event.changedTouches[0].clientX - swipeStart.x;
  const dy = event.changedTouches[0].clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) movePreview(dx < 0 ? 1 : -1);
},{passive:true});
document.getElementById("image-stage").addEventListener("touchcancel",() => { swipeStart = null; },{passive:true});
previewDialog.addEventListener("close", () => { previewImage.removeAttribute("src"); activePreview = null; lockscreenEnabled = false; });
previewImage.addEventListener("load",() => {
  if (!activePreview) return;
  previewImage.hidden = false;
  if (previewImage.naturalWidth && previewImage.naturalHeight) document.getElementById("image-stage").style.setProperty("--image-ratio",previewImage.naturalWidth / previewImage.naturalHeight);
  document.getElementById("preview-status").hidden = true;
  updateLockscreen();
});
previewImage.addEventListener("error", () => {
  if (!activePreview) return;
  document.getElementById("preview-retry").hidden = false;
  if (activePreview.thumbnail && !previewUsingThumbnail) {
    previewUsingThumbnail = true;
    previewImage.src = imageUrl(activePreview.thumbnail);
    document.getElementById("preview-size").textContent = resolutionLabel(activePreview) + " · 当前显示预览图";
  } else {
    previewImage.hidden = true;
    const status = document.getElementById("preview-status");
    status.textContent = "当前无法加载图片，请联网后重试。"; status.hidden = false;
    updateLockscreen();
  }
});
window.addEventListener("popstate",syncPreviewRoute);
window.addEventListener("hashchange",syncPreviewRoute);

function requireConnection(event) {
  if (!navigator.onLine) { event.preventDefault(); showToast("请联网后下载原图"); }
}

function updateConnectionNotice() {
  const notice = document.getElementById("notice");
  notice.hidden = navigator.onLine && !directoryLimited;
  notice.textContent = navigator.onLine ? "当前显示已登记的图片，完整目录可稍后刷新。" : "当前离线，可浏览已缓存的预览；下载原图需要联网。";
}
window.addEventListener("offline",updateConnectionNotice);
window.addEventListener("online",() => { updateConnectionNotice(); load(); });

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

installButton.hidden = isStandalone();
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault(); deferredInstall = event;
  installButton.hidden = isStandalone();
});
window.addEventListener("appinstalled", () => {
  deferredInstall = null; installButton.hidden = true; showToast("已添加到桌面");
});
installButton.addEventListener("click", async () => {
  if (deferredInstall) {
    const prompt = deferredInstall; deferredInstall = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") installButton.hidden = true;
      return;
    } catch { /* Show browser-specific guidance when a prompt is unavailable. */ }
  }
  document.getElementById("install-dialog").showModal();
  document.body.style.overflow = "hidden";
});
document.getElementById("copy-site").addEventListener("click", () => copyUrl(base.href));

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

function applyFiles(files,metadata) {
  const next = [...files].map(file => makeAsset(file,metadata)).sort((a,b)=>a.path.localeCompare(b.path));
  if (JSON.stringify(next) === JSON.stringify(assets)) return;
  assets = next;
  if (assets.length && !assets.some(file => file.kind === kind)) kind = assets[0].kind;
  refreshControls(); renderGallery();
  syncPreviewRoute();
}

async function load() {
  const settle = promise => promise.then(value => ({status:"fulfilled",value}),reason => ({status:"rejected",reason}));
  const catalogTask = settle(fetchJson(new URL("catalog.json",base)));
  const treeTask = settle(fetchJson("https://api.github.com/repos/" + repo + "/git/trees/main?recursive=1"));
  const catalogResult = await catalogTask;
  const registered = catalogResult.status === "fulfilled" && Array.isArray(catalogResult.value.assets) ? catalogResult.value.assets : [];
  const metadata = new Map(registered.map(file => [file.path,file]));
  const registeredImages = registered.filter(file => imagePattern.test(file.path) && !file.path.startsWith("app/"));
  if (registeredImages.length) applyFiles(registeredImages,metadata);
  const treeResult = await treeTask;
  const treeAvailable = treeResult.status === "fulfilled" && Array.isArray(treeResult.value.tree);
  const tree = treeAvailable ? treeResult.value.tree : [];
  const files = new Map(tree.filter(isUserImage).map(file => [file.path,file]));
  if (!treeAvailable || treeResult.value.truncated) registered.forEach(file => {
    if (imagePattern.test(file.path) && !file.path.startsWith("app/") && !files.has(file.path)) files.set(file.path,file);
  });
  if (!files.size) {
    assets = []; refreshControls();
    const empty = element("div","empty",treeAvailable ? "仓库里还没有图片。" : "暂时无法读取图片目录。");
    if (!treeAvailable) {
      const retry = element("button","secondary-button","重新加载"); retry.type = "button";
      retry.addEventListener("click",load); empty.append(element("br"),retry);
    }
    gallery.replaceChildren(empty); results.textContent = "暂无可显示的图片";
    document.getElementById("summary").textContent = "壁纸、头像与其他图片"; return;
  }
  directoryLimited = !treeAvailable || Boolean(treeResult.value.truncated);
  updateConnectionNotice();
  applyFiles(files.values(),metadata);
  if (previewPath() && !assets.some(file => file.path === previewPath())) {
    const url = new URL(location.href); url.hash = "";
    history.replaceState({...history.state,assetPreview:false},"",url);
    if (previewDialog.open) previewDialog.close();
    showToast("这张图片已移除，已返回图库");
  }
  initialRoute = false;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(new URL("sw.js",base), { scope: base.pathname, updateViaCache: "none" }).catch(() => {});
}
load();
