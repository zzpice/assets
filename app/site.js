"use strict";

const { resolutionKey, resolutionLabel, orientation, inferDevice } = window.AssetCatalog;
const base = new URL(".", document.baseURI);
const imagePattern = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
// Insertion order is the browsing order; new categories follow the known ones.
const styleCategoryLabels = { anime: "动漫", illustration: "插画", landscape: "风景", photography: "摄影", people: "真人", animals: "动物", gaming: "游戏", pixel: "像素", minimal: "极简", abstract: "抽象", other: "其他" };
const iconCategoryLabels = {
  ai: "AI", "media-players": "媒体播放器", gaming: "游戏",
  finance: "银行、券商与金融机构", development: "开发工具",
  "proxy-clients": "代理客户端", routes: "线路与专线", regions: "国家与地区",
  media: "影音与资源", social: "社区与社交", productivity: "效率工具",
  learning: "学习", network: "网络工具", "self-hosted": "设备与自托管", cloud: "云与域名", adult: "成人网站"
};
const categoryLabels = { ...styleCategoryLabels, ...iconCategoryLabels };
const kindLabels = { wallpaper: "壁纸", avatar: "头像", icon: "图标", "bank-card": "银行卡面", "game-cover": "游戏封面", actress: "女优", other: "其他图片" };
const actressGallery = window.ActressGallery;
let actressData;
const deviceLabels = { phone: "手机", desktop: "电脑", tablet: "平板", unknown: "待分类" };
const orientationLabels = { portrait: "竖屏", landscape: "横屏", square: "方形", unknown: "未标注" };
const cardRegionLabels = { "hong-kong": "香港", "china-mainland": "中国内地", singapore: "新加坡" };
const cardEditionLabels = { originals: "原始卡面", custom: "修改版" };
const coverRegionLabels = { Japan: "日本", "North America": "北美", Europe: "欧洲", Worldwide: "全球" };
const controls = Object.fromEntries(["search","device","category","bank","edition","resolution","orientation","sort"].map(id => [id,document.getElementById(id)]));
const gallery = document.getElementById("gallery");
const results = document.getElementById("results");
const reset = document.getElementById("reset");
const installButton = document.getElementById("install");
const previewDialog = document.getElementById("preview-dialog");
const previewImage = document.getElementById("preview-image");
let assets = [];
let cardBanks = [];
let gameSeries = [];
let games = [];
let activeSeries = "";
let kind = "wallpaper";
let deferredInstall = null;
let toastTimeout;
let activePreview;
let previewTrigger;
let previewUsingThumbnail = false;
let visibleAssets = [];
let renderedViewKey = null;
let previewSequence = [];
let initialRoute = true;
let lockscreenEnabled = false;
let avatarRoundEnabled = false;
let directoryUnavailable = false;
let loadGeneration = 0;
let favoritesOnly = false;
const favoriteKey = "zzpice-assets-favorites:" + base.pathname;
const actressEntryKey = "zzpice-assets-actress-entry:" + base.pathname;
let actressEntryVisible = false;
try { actressEntryVisible = localStorage.getItem(actressEntryKey) === "1"; } catch { /* Direct links remain available. */ }
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









function makeAsset(file) { return window.AssetCatalog.makeAsset(file,games); }

function cardBank(file) {
  return cardBanks.find(bank => bank.region === file.category && bank.bank === file.bank);
}

function cardRegions() {
  return [...new Set([...cardBanks.map(bank => bank.region),...Object.keys(cardRegionLabels)])];
}

function gameInfo(file) {
  return games.find(game => game.series === file.category && game.id === file.game);
}

function collectionKey(file) {
  return file.category + "/" + file.bank;
}

function viewFiles() {
  return assets.filter(file => file.kind === kind && (kind !== "game-cover" || (activeSeries ? file.category === activeSeries : !file.extra)));
}

function categoryLabel(file) {
  if (file.kind === "game-cover") return gameSeries.find(series => series.id === file.category)?.title || file.category;
  return file.kind === "bank-card" ? cardRegionLabels[file.category] || file.category : categoryLabels[file.category] || file.category;
}

function orderedCategories(files) {
  const present = [...new Set(files.map(file => file.category))];
  const order = kind === "game-cover" ? gameSeries.map(series => series.id) : kind === "bank-card" ? cardRegions() : Object.keys(kind === "icon" ? iconCategoryLabels : styleCategoryLabels);
  return [...order.filter(value => present.includes(value)),...present.filter(value => !order.includes(value)).sort((a,b) => a.localeCompare(b,"zh-CN"))];
}

function defaultSort() {
  return "collection";
}

function fillSelect(select, entries, placeholder) {
  const old = select.value;
  select.replaceChildren(new Option(placeholder, ""));
  entries.forEach(([value,label]) => select.add(new Option(label,value)));
  if (entries.some(([value]) => value === old)) select.value = old;
}

function showFilter(control, available = true) {
  control.closest(".field").hidden = !available || (control.children.length <= 2 && !control.value);
}

function refreshControls() {
  const files = viewFiles();
  const isCover = kind === "game-cover";
  const isPerson = kind === "actress";
  document.getElementById("filters-panel").hidden = isCover || isPerson;
  document.getElementById("actress-navigation").hidden = !isPerson;
  document.getElementById("actress-entry-preference").hidden = !isPerson;
  document.getElementById("actress-keep-entry").checked = actressEntryVisible;
  document.getElementById("show-favorites").hidden = isPerson;
  controls.search.placeholder = isPerson ? "在当前栏目中搜索姓名、别名或罗马字" : isCover ? "在当前游戏封面中搜索作品、系列或平台" : kind === "bank-card" ? "在银行卡面中搜索名称、银行或钱包" : "在" + kindLabels[kind] + "中搜索名称、分类或文件名";
  document.querySelector('label[for="search"]').textContent = isPerson ? "搜索人物" : "搜索图片";
  document.getElementById("gallery").setAttribute("aria-label", isPerson ? "人物列表" : "图片列表");
  const devices = ["phone","desktop","tablet","unknown"].filter(device => files.some(file => file.device === device));
  fillSelect(controls.device,devices.map(value => [value,deviceLabels[value]]),"全部设备");
  controls.device.disabled = kind !== "wallpaper";
  controls.device.closest(".field").hidden = controls.device.disabled;
  if (controls.device.disabled) controls.device.value = "";
  const deviceFiles = files.filter(file => !controls.device.value || file.device === controls.device.value);
  const categories = orderedCategories(deviceFiles);
  fillSelect(controls.category, categories.map(value => [value,categoryLabel({kind,category:value})]), kind === "bank-card" ? "全部地区" : "全部种类");
  controls.category.disabled = kind === "other" || isCover;
  controls.category.closest(".field").hidden = controls.category.disabled;
  document.querySelector('label[for="category"]').textContent = kind === "bank-card" ? "地区" : kind === "icon" ? "用途分类" : "内容分类";
  if (controls.category.disabled) controls.category.value = "";
  controls.orientation.disabled = ["avatar","icon","bank-card","game-cover"].includes(kind);
  controls.orientation.closest(".field").hidden = controls.orientation.disabled;
  if (controls.orientation.disabled) controls.orientation.value = "";
  const categoryFiles = deviceFiles.filter(file => !controls.category.value || file.category === controls.category.value);
  const isCard = kind === "bank-card";
  [controls.bank,controls.edition].forEach(control => {
    control.disabled = !isCard; control.closest(".field").hidden = control.disabled;
    if (control.disabled) control.value = "";
  });
  const entries = cardBanks.filter(bank => categoryFiles.some(file => file.bank === bank.bank && file.category === bank.region))
    .map(bank => [bank.region + "/" + bank.bank,(controls.category.value ? "" : cardRegionLabels[bank.region] + " · ") + bank.name]);
  fillSelect(controls.bank,entries,"全部银行");
  const bankFiles = categoryFiles.filter(file => !controls.bank.value || collectionKey(file) === controls.bank.value);
  fillSelect(controls.edition,Object.keys(cardEditionLabels).filter(edition => bankFiles.some(file => file.edition === edition)).map(value => [value,cardEditionLabels[value]]),"全部版本");
  const editionFiles = bankFiles.filter(file => !controls.edition.value || file.edition === controls.edition.value);
  const directions = Object.keys(orientationLabels).filter(value => editionFiles.some(file => orientation(file) === value));
  fillSelect(controls.orientation,directions.map(value => [value,orientationLabels[value]]),"全部方向");
  if (controls.orientation.disabled) controls.orientation.value = "";
  const directionFiles = editionFiles.filter(file => !controls.orientation.value || orientation(file) === controls.orientation.value);
  const sizes = [...new Map(directionFiles.map(file => [resolutionKey(file),file])).entries()]
    .sort((a,b) => b[1].width * b[1].height - a[1].width * a[1].height);
  fillSelect(controls.resolution, sizes.map(([key,file]) => [key,key === "unknown" ? "尺寸未标注" : resolutionLabel(file)]), "全部尺寸");
  const sort = controls.sort.value;
  // Sorting is meaningful only when a rendered group contains different sizes.
  const groupSizes = new Map();
  directionFiles.filter(file => !controls.resolution.value || resolutionKey(file) === controls.resolution.value).forEach(file => {
    const key = [file.category,kind === "wallpaper" ? file.device : "",isCard ? file.bank : ""].join("/");
    if (!groupSizes.has(key)) groupSizes.set(key,new Set());
    groupSizes.get(key).add(resolutionKey(file));
  });
  const hasSizeOrder = [...groupSizes.values()].some(sizes => sizes.size > 1);
  const sortOptions = [["collection",isCard ? "地区与银行顺序" : kind === "wallpaper" ? "设备与种类顺序" : "分类顺序"]];
  if (hasSizeOrder) sortOptions.push(["resolution-desc","组内尺寸从大到小"],["resolution-asc","组内尺寸从小到大"],["name","组内按名称排序"]);
  controls.sort.replaceChildren(...sortOptions.map(([value,label]) => new Option(label,value)));
  controls.sort.value = sortOptions.some(([value]) => value === sort) ? sort : defaultSort();
  controls.resolution.disabled = isCover;
  if (isCover) { controls.resolution.value = ""; controls.sort.value = defaultSort(); }
  [controls.category,controls.bank,controls.edition,controls.orientation,controls.resolution].forEach(control => showFilter(control,!control.disabled));
  controls.sort.closest(".field").hidden = !hasSizeOrder;
  document.getElementById("filters-panel").hidden = isCover || isPerson || ![controls.category,controls.bank,controls.edition,controls.orientation,controls.resolution,controls.sort].some(control => !control.closest(".field").hidden);
  document.querySelectorAll(".tab").forEach(tab => {
    const count = assets.filter(file => file.kind === tab.dataset.kind && (file.kind !== "game-cover" || !file.extra)).length;
    tab.querySelector("span").textContent = count;
    // Unlisted by default; the owner can keep a shortcut in their own browser.
    tab.hidden = tab.dataset.kind === "actress" ? (!actressEntryVisible && kind !== "actress") || !count : ["icon","bank-card","game-cover","other"].includes(tab.dataset.kind) && !count;
    tab.disabled = !count;
    tab.setAttribute("aria-pressed", String(tab.dataset.kind === kind));
  });
  const wallpapers = assets.filter(file => file.kind === "wallpaper");
  const sizeCount = new Set(wallpapers.filter(file => file.width && file.height).map(resolutionKey)).size;
  const avatarCount = assets.filter(file => file.kind === "avatar").length;
  const iconCount = assets.filter(file => file.kind === "icon").length;
  const coverCount = assets.filter(file => file.kind === "game-cover" && !file.extra).length;
  const cardCount = assets.filter(file => file.kind === "bank-card").length;
  document.getElementById("summary").textContent = wallpapers.length + " 张壁纸 · " + sizeCount + " 种尺寸" + (avatarCount ? " · " + avatarCount + " 张头像" : "") + (iconCount ? " · " + iconCount + " 个图标" : "") + (cardCount ? " · " + cardCount + " 张卡面" : "") + (coverCount ? " · " + coverCount + " 张游戏封面" : "");
  document.getElementById("collection-title").textContent = kindLabels[kind] + (favoritesOnly ? " · 收藏" : "");
  refreshFavoriteCount();
}

function refreshFavoriteCount() {
  document.getElementById("favorite-count").textContent = viewFiles().filter(file => favorites.has(file.path)).length;
  document.getElementById("show-favorites").setAttribute("aria-pressed", String(favoritesOnly));
}

function updateFavoriteButton(button,file) {
  const saved = favorites.has(file.path);
  button.setAttribute("aria-pressed",String(saved));
  button.dataset.assetPath = file.path;
  button.setAttribute("aria-label",(saved ? "取消收藏" : "收藏") + file.title);
}

function toggleFavorite(file,button) {
  const saved = !favorites.has(file.path);
  if (saved) favorites.add(file.path); else favorites.delete(file.path);
  let persistent = true;
  try { localStorage.setItem(favoriteKey,JSON.stringify([...favorites])); } catch { persistent = false; }
  updateFavoriteButton(button,file); refreshFavoriteCount();
  document.querySelectorAll(".favorite-toggle").forEach(item => { if (item.dataset.assetPath === file.path) updateFavoriteButton(item,file); });
  if (activePreview?.path === file.path) updatePreviewFavorite();
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

function assetPreviewUrl(file) {
  const url = new URL(imageUrl(file.path));
  if (file.kind === "icon" && file.sha) url.searchParams.set("v",file.sha);
  return url.href;
}

function previewUrl(file) {
  const url = new URL(galleryViewUrl(file.kind,file.kind === "game-cover" && (activeSeries || file.extra) ? file.category : ""));
  const params = new URLSearchParams(url.hash.slice(1));
  params.set("image",file.path);
  url.hash = params.toString();
  return url.href;
}

function galleryViewUrl(nextKind = kind,series = activeSeries,preserve = true) {
  const url = new URL(base);
  const params = new URLSearchParams();
  if (nextKind === "game-cover") params.set(series ? "series" : "covers",series || "");
  else if (nextKind !== "wallpaper") params.set("kind",nextKind);
  if (preserve && nextKind === kind) {
    if (controls.search.value.trim()) params.set("q",controls.search.value.trim());
    if (favoritesOnly) params.set("favorites","1");
    if (nextKind !== "game-cover") {
      for (const name of ["device","category","bank","edition","orientation","resolution","sort"]) {
        const value = controls[name].value;
        if (value && (name !== "sort" || value !== defaultSort())) params.set(name,value);
      }
    }
  }
  url.hash = params.toString();
  return url.href;
}

function saveGalleryView() {
  if (kind !== "actress") history.replaceState({...history.state,galleryKind:kind,assetPreview:false},"",kind === "game-cover" ? coverViewUrl(activeSeries) : galleryViewUrl());
}

function coverViewUrl(series = "") {
  // Keep the long-established unfiltered overview URL readable.
  const url = new URL(galleryViewUrl("game-cover",series));
  if (url.hash === "#covers=") url.hash = "covers";
  return url.href;
}

function navigateCoverView(event,series = "") {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  saveGalleryView();
  history.pushState({galleryKind:"game-cover",assetPreview:false},"",coverViewUrl(series));
  syncRoute();
  // Scroll after saving the overview position, so Back can restore it.
  window.scrollTo(0,0);
}

function withoutPreviewUrl() {
  const url = new URL(location.href);
  const params = new URLSearchParams(url.hash.slice(1));
  params.delete("image");
  url.hash = params.toString();
  return url;
}

function listRouteKey(params = new URLSearchParams(location.hash.slice(1)), viewKind = kind) {
  const list = new URLSearchParams(params);
  list.delete("image"); list.delete("person"); list.sort();
  return viewKind + ":" + list.toString();
}

function syncRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  const series = params.get("series");
  const nextSeries = gameSeries.some(item => item.id === series) ? series : "";
  const linkedImage = assets.find(file => file.path === params.get("image"));
  const requestedKind = params.get("kind");
  const defaultKind = assets.some(file => file.kind === "wallpaper") ? "wallpaper" : assets.find(file => file.kind !== "actress")?.kind || "wallpaper";
  const restoredKind = history.state?.galleryKind === "actress" ? defaultKind : history.state?.galleryKind || defaultKind;
  const nextKind = params.has("actresses") || params.has("person") ? "actress" : params.has("series") || params.has("covers") ? "game-cover" : linkedImage?.kind || (Object.hasOwn(kindLabels,requestedKind) && requestedKind !== "actress" ? requestedKind : restoredKind);
  // Modal-only navigation must retain the list DOM, including focus, expanded
  // information and the horizontal position of game series.
  if (renderedViewKey === listRouteKey(params,nextKind)) {
    syncPreviewRoute();
    if (kind === "actress" && actressGallery) actressGallery.syncPerson(params.get("person"));
    return;
  }
  if (nextKind === "actress" && actressGallery && actressData) {
    kind = "actress"; activeSeries = "";
    const state = actressGallery.route(params);
    controls.search.value = state.query;
    refreshControls(); renderGallery();
    const person = actressData.redirects?.[params.get("person")] || params.get("person");
    if (initialRoute && actressData.people.some(item => item.id === person) && !history.state?.personPreview) {
      const personLink = location.href;
      history.replaceState({galleryKind:"actress",personPreview:false},"",actressGallery.viewUrl());
      history.pushState({galleryKind:"actress",personPreview:true},"",personLink);
    }
    syncPreviewRoute(); actressGallery.syncPerson(params.get("person"));
    return;
  }
  if (actressGallery) actressGallery.syncPerson(null);
  activeSeries = nextSeries; kind = nextKind;
  controls.search.value = params.get("q") || "";
  favoritesOnly = params.get("favorites") === "1";
  for (const name of ["device","category","bank","edition","orientation","resolution","sort"]) {
    const control = controls[name];
    const value = params.get(name) || (name === "sort" ? defaultSort() : "");
    // Native selects reject values absent from the previous view's options.
    // Seed the route value, then let refreshControls validate the new scope.
    if (value && !Array.from(control.children).some(option => option.value === value)) control.add(new Option(value,value));
    control.value = value;
  }
  refreshControls(); renderGallery();
  syncPreviewRoute();
}

function navigatePersonView(url, scroll = true, replace = false) {
  const personPreview = new URLSearchParams(new URL(url).hash.slice(1)).has("person");
  history[replace ? "replaceState" : "pushState"]({galleryKind:"actress",assetPreview:false,personPreview},"",url);
  syncRoute();
  if (scroll) window.scrollTo(0,0);
}

function closePerson() {
  if (history.state?.personPreview) history.back();
  else navigatePersonView(actressGallery.viewUrl(),false,true);
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

function updateAvatarShape() {
  const available = activePreview?.kind === "avatar";
  if (!available) avatarRoundEnabled = false;
  const button = document.getElementById("preview-avatar-round");
  button.hidden = !available;
  button.setAttribute("aria-pressed",String(avatarRoundEnabled));
  document.getElementById("image-stage").classList.toggle("round-avatar",avatarRoundEnabled);
  document.getElementById("avatar-round-hint").hidden = !avatarRoundEnabled;
}

function loadPreviewImage(force = false) {
  if (!activePreview) return;
  previewUsingThumbnail = false;
  previewImage.hidden = true;
  const placeholder=document.getElementById("preview-placeholder");
  placeholder.hidden=!activePreview.thumbnail;
  if(activePreview.thumbnail)placeholder.src=imageUrl(activePreview.thumbnail);
  const status = document.getElementById("preview-status");
  status.textContent = "正在加载原图…"; status.hidden = false;
  const retry = document.getElementById("preview-retry");
  if (document.activeElement === retry) document.getElementById("preview-download").focus();
  retry.hidden = true;
  document.getElementById("preview-size").textContent = resolutionLabel(activePreview);
  document.querySelector(".full-image").classList.toggle("icon-preview",activePreview.kind === "icon");
  document.getElementById("image-stage").style.setProperty("--image-ratio",activePreview.width && activePreview.height ? activePreview.width / activePreview.height : 1);
  const url = new URL(assetPreviewUrl(activePreview));
  if (force === true) url.searchParams.set("retry",Date.now());
  previewImage.src = url.href;
  updateLockscreen();
  updateAvatarShape();
}

function samePreviewGroup(item,file) {
  return item.kind === file.kind && item.category === file.category && (file.kind !== "wallpaper" || (item.device || "unknown") === (file.device || "unknown")) && (file.kind !== "bank-card" || (item.bank === file.bank && item.edition === file.edition));
}

function openPreview(file,historyMode = "push",sequence = visibleAssets) {
  if (!previewDialog.open || !activePreview || !samePreviewGroup(activePreview,file)) {
    lockscreenEnabled = false;
    avatarRoundEnabled = false;
  }
  previewSequence = sequence.filter(item => item.kind === file.kind).map(item => item.path);
  if (!previewSequence.includes(file.path)) previewSequence = assets.filter(item => samePreviewGroup(item,file)).sort(compareAssets).map(item => item.path);
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
  refreshPreviewNavigation(); loadPreviewImage(); renderPreviewDetails(file); updatePreviewFavorite();
  const index = previewSequence.indexOf(file.path);
  [index - 1,index + 1].forEach(i => { const neighbor = assets.find(item => item.path === previewSequence[i]); if (neighbor?.thumbnail) { const image = document.createElement("img"); image.src = imageUrl(neighbor.thumbnail); } });
}

function dismissPreview() {
  // Restore immediately; a delayed close event must not steal a new keyboard focus.
  const trigger=previewTrigger;
  previewDialog.close();
  if(trigger?.isConnected)trigger.focus({preventScroll:true});
}

function closePreview() {
  if (history.state?.assetPreview && previewPath()) history.back();
  else {
    history.replaceState({...history.state,assetPreview:false},"",withoutPreviewUrl());
    dismissPreview();
  }
}

function syncPreviewRoute() {
  const path = previewPath();
  if (!path) { if (previewDialog.open) dismissPreview(); return; }
  const file = assets.find(item => item.path === path);
  if (!file) return;
  if (initialRoute) {
    // A shared image gets a gallery entry beneath it, so Back stays in the app.
    if (!history.state?.assetPreview) {
      const imageLink = location.href;
      history.replaceState({...history.state,assetPreview:false},"",withoutPreviewUrl());
      history.pushState({...history.state,assetPreview:true},"",imageLink);
    }
    initialRoute = false;
  }
  if (kind !== file.kind || !visibleAssets.some(item => item.path === path)) {
    kind = file.kind;
    if (file.kind === "game-cover" && (file.extra || activeSeries)) activeSeries = file.category;
    clearFilters(false); renderGallery();
  }
  if (activePreview !== file || !previewDialog.open) openPreview(file,"none");
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

function publicSource(value) {
  try { const url = new URL(value); return ["https:","http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}

function makeCard(file,sequence = visibleAssets,titleTag = "h2") {
  const card = element("article","card"); card.dataset.kind = file.kind;
  const preview = element("button","preview " + orientation(file));
  preview.classList.toggle("icon",file.kind === "icon"); preview.classList.toggle("game-cover",file.kind === "game-cover");
  preview.type = "button"; preview.setAttribute("aria-label","预览" + file.title);
  if (file.kind !== "game-cover" && file.width && file.height) preview.style.aspectRatio = file.width + " / " + file.height;
  const img = element("img"); img.alt=file.title; img.loading="lazy";img.decoding="async";
  if (file.width && file.height) {img.width=file.width;img.height=file.height;}
  const backdrop=file.kind === "game-cover" ? element("span","cover-backdrop") : null;
  if (backdrop) {backdrop.setAttribute("aria-hidden","true");preview.append(backdrop);}
  let usingThumbnail=!!file.thumbnail, errored=false, retryVersion="";
  const src=()=>{
    const url=new URL(usingThumbnail ? imageUrl(file.thumbnail) : assetPreviewUrl(file));
    if(retryVersion)url.searchParams.set("retry",retryVersion);
    return url.href;
  };
  img.addEventListener("load",()=>{
    preview.classList.add("is-loaded"); preview.classList.remove("has-error");
    if(backdrop)backdrop.style.backgroundImage='url("'+(img.currentSrc||img.src)+'")';
  });
  img.addEventListener("error",()=>{
    if(usingThumbnail){usingThumbnail=false;img.src=src();return;}
    errored=true;img.hidden=true;preview.classList.add("has-error");
    if(!preview.querySelector(".image-error"))preview.append(element("span","image-error","图片暂时无法加载 · 点按重试"));
  });
  preview.addEventListener("click",()=>{
    if(errored){errored=false;usingThumbnail=!!file.thumbnail;retryVersion=String(Date.now());img.hidden=false;preview.classList.remove("has-error");preview.querySelector(".image-error")?.remove();img.src=src();return;}
    previewTrigger=preview;openPreview(file,"push",sequence);
  });
  img.src=src();preview.append(img);
  const favorite=element("button","favorite-toggle");favorite.type="button";updateFavoriteButton(favorite,file);
  favorite.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/></svg>';
  favorite.addEventListener("click",()=>toggleFavorite(file,favorite));
  const wrap=element("div","preview-wrap");wrap.append(preview,favorite);
  const meta=element("div","meta"); const work=gameInfo(file);
  const description=file.kind === "game-cover" ? work ? "首发 " + work.firstReleaseYear : "游戏封面" : file.kind === "icon" ? "" : file.kind === "bank-card" ? cardEditionLabels[file.edition]+(file.source?.wallet ? " · "+file.source.wallet : "") : resolutionLabel(file);
  meta.append(element(titleTag,"",file.title));if(description)meta.append(element("p","resolution",description));
  const synopsisSource=publicSource(work?.synopsis?.source);
  if(work?.synopsis?.text && synopsisSource){
    const details=element("details","asset-info game-synopsis");details.append(element("summary","","剧情简介"),element("p","synopsis",work.synopsis.text));
    const link=element("a","source-link","简介依据 ↗");link.href=synopsisSource;link.target="_blank";link.rel="noopener noreferrer";details.append(link);meta.append(details);
  }
  card.append(wrap,meta);return card;
}

function makeCategorySections(files,device = kind,titleTag = "h2") {
  return orderedCategories(files).map(category => {
    const groupFiles = files.filter(file => file.category === category);
    const section = element("section","category-section");
    const title = element(titleTag,"category-heading",categoryLabel(groupFiles[0]));
    title.append(element("span","device-count",groupFiles.length + (kind === "icon" ? " 个" : " 张")));
    const grid = element("div","grid"); grid.dataset.device = device;
    grid.append(...groupFiles.map(file => makeCard(file,groupFiles,titleTag === "h2" ? "h3" : "h4")));
    section.append(title,grid);
    return section;
  });
}

function makeDeviceSection(device,files) {
  const section = element("section","device-section");
  const title = element("h2","device-heading",deviceLabels[device] + "壁纸");
  title.id = "device-heading-" + device;
  title.append(element("span","device-count",files.length + " 张"));
  section.setAttribute("aria-labelledby",title.id);
  const grid = element("div","grid"); grid.dataset.device = device;
  grid.append(...files.map(file => makeCard(file,visibleAssets,"h3")));
  section.append(title,grid);
  return section;
}

function makeCardRegions(files) {
  return cardRegions().map(region => {
    const regionFiles = files.filter(file => file.category === region);
    if (!regionFiles.length) return null;
    const section = element("section","card-region");
    const title = element("h2","region-heading",cardRegionLabels[region]);
    title.append(element("span","device-count",regionFiles.length + " 张"));
    section.append(title);
    const banks = [...new Set(regionFiles.map(file => file.bank))].sort((a,b) => cardBanks.findIndex(bank => bank.region === region && bank.bank === a) - cardBanks.findIndex(bank => bank.region === region && bank.bank === b));
    banks.forEach(bank => {
      const bankFiles = regionFiles.filter(file => file.bank === bank);
      const bankInfo = cardBank(bankFiles[0]);
      const group = element("section","bank-section");
      group.append(element("h3","bank-heading",bankInfo?.name || bank));
      if (bankInfo?.englishName && bankInfo.englishName !== bankInfo.name) group.append(element("p","bank-english",bankInfo.englishName));
      const grid = element("div","grid"); grid.dataset.device = "bank-card";
      grid.append(...bankFiles.map(file => makeCard(file,bankFiles,"h4")));
      group.append(grid); section.append(group);
    });
    return section;
  }).filter(Boolean);
}

function makeGameSeries(files) {
  return orderedCategories(files).map(series => {
    const seriesFiles = files.filter(file => file.category === series);
    const section = element("section","category-section");
    const title = element("h2","category-heading");
    const name = categoryLabel(seriesFiles[0]);
    if (activeSeries) title.append(element("span","",name));
    else {
      const link = element("a","series-link",name + " →");
      link.href = coverViewUrl(series);
      link.addEventListener("click",event => navigateCoverView(event,series));
      title.append(link);
    }
    const ids = [...new Set(seriesFiles.map(file => file.game))];
    title.append(element("span","device-count",ids.length + " 款作品"));
    const grid = element("div",activeSeries ? "grid" : "grid series-strip"); grid.dataset.device = "game-cover";
    ids.forEach(id => {
      const covers = seriesFiles.filter(file => file.game === id);
      const selected = covers.find(file => !file.extra);
      if (!activeSeries) {
        if (selected) grid.append(makeCard(selected,seriesFiles,"h3"));
        return;
      }
      const work = element("div","game-work");
      if (selected) work.append(makeCard(selected,seriesFiles,"h3"));
      const extras = covers.filter(file => file.extra);
      if (extras.length) {
        const details = element("details","extra-covers");
        details.open = !selected;
        details.append(element("summary","",extras.length + " 张额外收藏"),...extras.map(file => makeCard(file,seriesFiles,"h4")));
        work.append(details);
      }
      grid.append(work);
    });
    section.append(title,grid);
    return section;
  });
}

function compareAssets(a,b) { return window.AssetCatalog.compareAssets(a,b,kind,controls.sort.value,gameInfo); }

function matchesQuery(file,query) { return window.AssetCatalog.matchesQuery(file,query,{categoryLabel,deviceLabels,cardBank,gameInfo}); }

function renderGallery() {
  renderedViewKey = listRouteKey();
  gallery.classList.remove("person-gallery");
  gallery.classList.remove("loading-gallery");
  gallery.setAttribute("aria-busy","false");
  document.getElementById("collection-title").textContent = kindLabels[kind] + (favoritesOnly ? " · 收藏" : "");
  if (kind === "actress" && actressGallery && actressData) {
    document.getElementById("cover-navigation").hidden = true;
    actressGallery.render(controls.search.value, gallery, results);
    reset.disabled = !controls.search.value;
    return;
  }
  const query = controls.search.value.trim().toLocaleLowerCase();
  const scope = viewFiles();
  const visible = scope
    .filter(file => !favoritesOnly || favorites.has(file.path))
    .filter(file => !controls.device.value || file.device === controls.device.value)
    .filter(file => !controls.category.value || file.category === controls.category.value)
    .filter(file => !controls.bank.value || collectionKey(file) === controls.bank.value)
    .filter(file => !controls.edition.value || file.edition === controls.edition.value)
    .filter(file => !controls.resolution.value || resolutionKey(file) === controls.resolution.value)
    .filter(file => !controls.orientation.value || orientation(file) === controls.orientation.value)
    .filter(file => !query || matchesQuery(file,query));
  visible.sort(compareAssets);
  visibleAssets = visible;
  const inSeries = kind === "game-cover" && Boolean(activeSeries);
  document.getElementById("cover-navigation").hidden = !inSeries;
  document.getElementById("cover-series-title").textContent = inSeries ? gameSeries.find(series => series.id === activeSeries)?.title || activeSeries : "";
  refreshFavoriteCount();
  const grouped = visible.length > 0;
  gallery.classList.toggle("grouped",grouped);
  gallery.classList.remove("multiple-device-groups");
  gallery.dataset.device = kind === "wallpaper" ? controls.device.value || "all" : kind;
  if (grouped && kind === "game-cover") gallery.replaceChildren(...makeGameSeries(visible));
  else if (grouped && kind === "bank-card") gallery.replaceChildren(...makeCardRegions(visible));
  else if (grouped && kind === "wallpaper") {
    const sections = ["desktop","phone","tablet","unknown"].map(device => {
      const files = visible.filter(file => (file.device || "unknown") === device);
      return files.length ? makeDeviceSection(device,files) : null;
    }).filter(Boolean);
    gallery.classList.toggle("multiple-device-groups",sections.length > 1);
    gallery.replaceChildren(...sections);
  } else if (grouped) gallery.replaceChildren(...makeCategorySections(visible));
  else {
    const empty = element("div","empty",favoritesOnly ? "当前" + kindLabels[kind] + "中没有符合条件的收藏。收藏保存在当前浏览器。" : "当前" + kindLabels[kind] + "中没有符合条件的图片。");
    if (query) {
      const clearSearch = element("button","secondary-button","清除搜索");
      clearSearch.type = "button";
      clearSearch.addEventListener("click",() => { controls.search.value = ""; saveGalleryView(); renderGallery(); controls.search.focus(); });
      empty.append(element("br"),clearSearch);
    }
    const clear = element("button","secondary-button",favoritesOnly ? "浏览全部图片" : "清除筛选");
    clear.type = "button";
    clear.addEventListener("click", () => { clearFilters(); renderGallery(); });
    empty.append(element("br"),clear); gallery.replaceChildren(empty);
  }
  results.textContent = kind === "game-cover" ? new Set(visible.map(collection => collection.category + "/" + collection.game)).size + " 款作品 · " + (inSeries ? visible.length + " 张封面" : new Set(visible.map(file => file.category)).size + " 个系列") : "显示 " + visible.length + " / " + scope.length + (kind === "icon" ? " 个" : " 张") + kindLabels[kind];
  const count = [controls.device.value,controls.category.value,controls.bank.value,controls.edition.value,controls.resolution.value,controls.orientation.value].filter(Boolean).length;
  const selected = ["device","category","bank","edition","orientation","resolution","sort"].flatMap(name => {
    const control = controls[name];
    return control.value && (name !== "sort" || control.value !== defaultSort()) ? [Array.from(control.children).find(option => option.value === control.value)?.textContent || control.value] : [];
  });
  if (favoritesOnly) selected.push("仅收藏");
  document.getElementById("filter-summary").textContent = selected.join(" · ") || "全部图片";
  reset.disabled = !query && !count && !favoritesOnly && controls.sort.value === defaultSort();
}

function clearFilters(persist = true) {
  controls.search.value = ""; controls.device.value = ""; controls.category.value = "";
  controls.resolution.value = ""; controls.orientation.value = "";
  controls.bank.value = ""; controls.edition.value = "";
  controls.sort.value = defaultSort();
  favoritesOnly = false; refreshControls();
  if (kind === "actress" && actressGallery && actressData) {
    const url = actressGallery.viewUrl({query:"",page:1});
    history.replaceState({galleryKind:"actress"},"",url);
    actressGallery.route(new URLSearchParams(new URL(url).hash.slice(1)));
  } else if (persist) saveGalleryView();
}

document.getElementById("filters-panel").open = false;
document.getElementById("home-link").addEventListener("click",event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  saveGalleryView();
  if (location.href !== base.href) history.pushState({galleryKind:"wallpaper"},"",base.href);
  syncRoute();
  window.scrollTo(0,0);
});
document.getElementById("actress-entry").addEventListener("click",event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !actressGallery || !actressData) return;
  event.preventDefault();
  document.getElementById("footer-more").open = false;
  saveGalleryView();
  navigatePersonView(event.currentTarget.href);
  document.querySelector('.tab[data-kind="actress"]').focus({preventScroll:true});
});
document.getElementById("actress-keep-entry").addEventListener("change",event => {
  actressEntryVisible = event.target.checked;
  let persistent = true;
  try {
    if (actressEntryVisible) localStorage.setItem(actressEntryKey,"1");
    else localStorage.removeItem(actressEntryKey);
  } catch { persistent = false; }
  refreshControls();
  showToast(persistent ? actressEntryVisible ? "已在此浏览器保留入口" : "离开人物图库后隐藏入口" : "入口设置仅当前页面有效");
});
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  const nextKind = tab.dataset.kind;
  if (nextKind === kind) return;
  saveGalleryView();
  if (nextKind === "actress" && actressGallery) {
    navigatePersonView(actressGallery.viewUrl({view:"annual",query:"",page:1})); return;
  }
  history.pushState({galleryKind:nextKind,assetPreview:false},"",galleryViewUrl(nextKind,"",false));
  syncRoute();
}));
document.querySelector("#cover-navigation a").addEventListener("click",event => navigateCoverView(event));
Object.entries(controls).forEach(([name,control]) => control.addEventListener(name === "search" ? "input" : "change", () => {
  if (kind === "actress" && actressGallery && name === "search") {
    const url = actressGallery.viewUrl({query:control.value,page:1});
    history.replaceState({galleryKind:"actress"},"",url);
    actressGallery.route(new URLSearchParams(new URL(url).hash.slice(1)));
  }
  if (name !== "search") refreshControls();
  saveGalleryView();
  renderGallery();
}));
reset.addEventListener("click", () => { clearFilters(); renderGallery(); });
document.getElementById("show-favorites").addEventListener("click",() => {
  favoritesOnly = !favoritesOnly; saveGalleryView(); refreshFavoriteCount(); renderGallery();
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
document.getElementById("preview-avatar-round").addEventListener("click",() => { avatarRoundEnabled = !avatarRoundEnabled; updateAvatarShape(); });
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
    if (dialog.id === "person-dialog") return; // Person routing owns its backdrop.
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
  swipeStart = event.touches.length === 1 && (window.visualViewport?.scale || 1) <= 1.01 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
},{passive:true});
document.getElementById("image-stage").addEventListener("touchend",event => {
  if (!swipeStart || (window.visualViewport?.scale || 1) > 1.01 || event.touches.length || event.changedTouches.length !== 1) { swipeStart = null; return; }
  const dx = event.changedTouches[0].clientX - swipeStart.x;
  const dy = event.changedTouches[0].clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) movePreview(dx < 0 ? 1 : -1);
},{passive:true});
document.getElementById("image-stage").addEventListener("touchcancel",() => { swipeStart = null; },{passive:true});
previewDialog.addEventListener("close", () => {
  previewTrigger = null;
  document.getElementById("preview-placeholder").hidden=true;
  previewImage.removeAttribute("src"); activePreview = null; lockscreenEnabled = false;
  updateAvatarShape();
});
document.getElementById("preview-placeholder").addEventListener("error",event=>{event.currentTarget.hidden=true;});
previewImage.addEventListener("load",() => {
  if (!activePreview) return;
  previewImage.hidden = false;
  document.getElementById("preview-placeholder").hidden=true;
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
window.addEventListener("popstate",syncRoute);
window.addEventListener("hashchange",syncRoute);


function updatePreviewFavorite() {
  if (!activePreview) return;
  const button = document.getElementById("preview-favorite");
  updateFavoriteButton(button,activePreview);
  button.textContent = favorites.has(activePreview.path) ? "♥ 已收藏" : "♡ 收藏";
}
function renderPreviewDetails(file) {
  const panel = document.getElementById("preview-details");
  const list = element("dl");
  for (const [label,value] of [["用途",kindLabels[file.kind]],["分类",categoryLabel(file)],["原图尺寸",resolutionLabel(file)],["格式",file.path.split(".").pop().toUpperCase()],["大小",file.size ? (file.size/1048576).toFixed(2)+" MB" : "未登记"]]) {
    list.append(element("dt","",label),element("dd","",value));
  }
  panel.replaceChildren(element("h3","","图片资料"),list);
  if (file.note && file.kind !== "game-cover") panel.append(element("p","note",file.note));
  const work = gameInfo(file);
  const cover = [file.cover?.version,file.cover?.platform,coverRegionLabels[file.cover?.region] || file.cover?.region].filter(Boolean).join(" · ");
  if(cover)panel.append(element("p","note",cover));
  const synopsisSource=publicSource(work?.synopsis?.source);
  if (work?.synopsis?.text && synopsisSource) {
    panel.append(element("h3","","剧情简介"),element("p","synopsis",work.synopsis.text));
    const link=element("a","source-link","简介依据 ↗");link.href=synopsisSource;link.target="_blank";link.rel="noopener noreferrer";panel.append(link);
  }
  panel.append(element("p","filename",file.path));
  const source = file.edition === "custom" && file.derivedFrom ? imageUrl(file.derivedFrom) : typeof file.source === "string" ? file.source : file.source?.url;
  if (source) { try { const url = new URL(source); if (["https:","http:"].includes(url.protocol)) { const link = element("a","source-link","查看图片来源 ↗"); link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";panel.append(link); } } catch {} }
  if (["wallpaper","avatar"].includes(file.kind)) { const link=element("a","source-link","来源与许可记录 ↗");link.href="https://github.com/zzpice/assets/blob/main/wallpapers/SOURCES.md";link.target="_blank";link.rel="noopener noreferrer";panel.append(link); }
}
document.getElementById("preview-favorite").addEventListener("click",() => { if(activePreview) toggleFavorite(activePreview,document.getElementById("preview-favorite")); });
document.getElementById("preview-info-toggle").addEventListener("click",event => {
  const panel = document.getElementById("preview-details"); panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute("aria-pressed",String(!panel.hidden));
  previewDialog.classList.toggle("show-info",!panel.hidden);
});
document.getElementById("density-toggle").addEventListener("click",event => {
  const compact = document.body.classList.toggle("compact-gallery");
  event.currentTarget.setAttribute("aria-pressed",String(compact));
  event.currentTarget.textContent = compact ? "舒展视图" : "紧凑视图";
});
window.addEventListener("pointerdown",event => { const panel=document.getElementById("filters-panel"); if(panel.open&&!panel.contains(event.target))panel.open=false; });
window.addEventListener("keydown",event => {
  const panel=document.getElementById("filters-panel");
  if(event.key === "Escape" && panel.open && !previewDialog.open){panel.open=false;panel.querySelector("summary").focus();event.preventDefault();return;}
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.target.closest("input,textarea,select,[contenteditable=true]")) return;
  if (event.key === "/" && !document.querySelector("dialog[open]")) {event.preventDefault();controls.search.focus();}
  if (event.key.toLowerCase() === "f" && previewDialog.open) {event.preventDefault();document.getElementById("preview-favorite").click();}
  if (event.key.toLowerCase() === "i" && previewDialog.open) {event.preventDefault();document.getElementById("preview-info-toggle").click();}
});

function requireConnection(event) {
  if (!navigator.onLine) { event.preventDefault(); showToast("请联网后下载原图"); }
}

function updateConnectionNotice() {
  const notice = document.getElementById("notice");
  notice.hidden = navigator.onLine && !directoryUnavailable;
  notice.textContent = navigator.onLine ? "暂时无法刷新图片目录，请稍后重试。" : "当前离线，可浏览已缓存的预览；下载原图需要联网。";
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),10000);
  try {
    const response = await fetch(url, { cache: "no-cache", signal: controller.signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.json();
  } finally { clearTimeout(timeout); }
}

function applyFiles(files,force = false) {
  const next = [...files].map(makeAsset).sort((a,b)=>a.path.localeCompare(b.path));
  if (!force && JSON.stringify(next) === JSON.stringify(assets)) return;
  assets = next;
  if (assets.length && !assets.some(file => file.kind === kind)) kind = assets.find(file => file.kind !== "actress")?.kind || "wallpaper";
  renderedViewKey = null;
  syncRoute();
}

async function load() {
  const generation = ++loadGeneration;
  try {
    const catalog = await fetchJson(new URL("catalog.json",base));
    if (generation !== loadGeneration) return;
    if (!catalog || catalog.version !== 1 || !Array.isArray(catalog.assets)) throw new Error("Invalid image catalog");
    const nextBanks = Array.isArray(catalog.cardBanks) ? catalog.cardBanks.filter(bank => bank && typeof bank.region === "string" && typeof bank.bank === "string" && typeof bank.name === "string" && typeof bank.englishName === "string") : [];
    const nextSeries = Array.isArray(catalog.gameSeries) ? catalog.gameSeries.filter(item => item && typeof item.id === "string" && typeof item.title === "string") : [];
    const nextGames = Array.isArray(catalog.games) ? catalog.games.filter(item => item && typeof item.id === "string" && typeof item.series === "string" && typeof item.title === "string" && Number.isInteger(item.firstReleaseYear)) : [];
    const gamesChanged = JSON.stringify([nextSeries,nextGames]) !== JSON.stringify([gameSeries,games]);
    gameSeries = nextSeries; games = nextGames;
    const banksChanged = JSON.stringify(nextBanks) !== JSON.stringify(cardBanks);
    cardBanks = nextBanks;
    const files = new Map(catalog.assets.filter(file => file && typeof file.path === "string" && /^[a-z0-9][a-z0-9/.-]*$/.test(file.path) && !file.path.split("/").includes("..") && imagePattern.test(file.path) && !/^(app|scripts)\//.test(file.path)).map(file => [file.path,file]));
    const peopleChanged = JSON.stringify(actressData) !== JSON.stringify(catalog.actresses);
    actressData = catalog.actresses;
    if (actressGallery) actressGallery.configure(actressData, [...files.values()], navigatePersonView, requireConnection);
    directoryUnavailable = false;
    updateConnectionNotice();
    applyFiles(files.values(),banksChanged || gamesChanged || peopleChanged);
    if (!files.size) gallery.replaceChildren(element("div","empty","仓库里还没有图片。"));
    if (previewPath() && !assets.some(file => file.path === previewPath())) {
      history.replaceState({...history.state,assetPreview:false},"",withoutPreviewUrl());
      if (previewDialog.open) dismissPreview();
      showToast("这张图片已移除，已返回图库");
    }
    initialRoute = false;
  } catch {
    if (generation !== loadGeneration) return;
    gallery.classList.remove("loading-gallery");
  gallery.setAttribute("aria-busy","false");
    directoryUnavailable = true;
    updateConnectionNotice();
    if (assets.length) return;
    refreshControls();
    const empty = element("div","empty","暂时无法读取图片目录。");
    const retry = element("button","secondary-button","重新加载"); retry.type = "button";
    retry.addEventListener("click",load); empty.append(element("br"),retry);
    gallery.replaceChildren(empty); results.textContent = "暂无可显示的图片";
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange",() => { if (assets.length) load(); });
  navigator.serviceWorker.register(new URL("sw.js",base), { scope: base.pathname, updateViaCache: "none" }).catch(() => {});
}
if (actressGallery) actressGallery.bind(closePerson);
load();
