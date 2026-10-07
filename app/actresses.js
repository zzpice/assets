"use strict";

// A person is stored once. These views only select IDs and add view-specific labels.
window.ActressGallery = (() => {
  const PAGE_SIZE = 48;
  const labels = { annual: "年度榜单", hall: "名人堂", all: "全部女优" };
  let directory = { people: [], rankings: [], redirects: {} };
  let people = new Map();
  let photos = new Map();
  let state = { view: "annual", year: 0, query: "", page: 1 };
  let activePerson = "";
  let navigate;
  const base = new URL(".", document.baseURI);
  const node = (tag, className, text) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  };
  const normalize = value => value.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/[\s·・-]+/g, "");
  const url = path => new URL(path, base).href;
  const years = () => directory.rankings.map(item => item.year).sort((a, b) => b - a);
  const resolve = id => directory.redirects[id] || id;

  function profileRows(person) {
    const profile = person.profile;
    if (!profile) return [];
    const rows = [];
    if (profile.birthDate) {
      const [year, month, day] = profile.birthDate.split("-").map(Number);
      rows.push(["出生日期", `${year}年${month}月${day}日`]);
    } else if (profile.birthYear) rows.push(["出生年份", profile.birthYear + " 年"]);
    if (profile.heightCm) rows.push(["身高", profile.heightCm + " cm"]);
    if (profile.debutYear) rows.push(["AV 出道年份", profile.debutYear + " 年"]);
    return rows;
  }

  function configure(data, files, onNavigate) {
    directory = data || { people: [], rankings: [], redirects: {} };
    people = new Map(directory.people.map(person => [person.id, { ...person, search: normalize([person.name, person.japaneseName || "", person.romanization || "", ...person.aliases.map(alias => alias.name)].join(" ")) } ]));
    photos = new Map(files.filter(file => file.kind === "actress").map(file => [file.person, file]));
    navigate = onNavigate;
  }

  function profileEvidence(person) {
    const profile = person.profile;
    if (!profile) return [];
    const labels = { birthDate: "出生日期", birthYear: "出生年份", heightCm: "身高", debutYear: "AV 出道年份" };
    return Object.entries(labels).filter(([field]) => profile[field] !== undefined).map(([field, label]) => ({
      field, label, sources: profile.fieldSources?.[field] || [{ sourceName: profile.sourceName, source: profile.source, reviewed: profile.reviewed }]
    }));
  }

  function route(params) {
    const view = params.get("actresses");
    state.view = Object.hasOwn(labels, view) ? view : "annual";
    const available = years();
    const year = Number(params.get("year"));
    state.year = available.includes(year) ? year : available[0] || 0;
    state.query = params.get("q") || "";
    state.page = Math.max(1, Number(params.get("page")) || 1);
    state.page = Math.floor(state.page);
    return state;
  }

  function viewUrl(changes = {}, person = "") {
    const next = { ...state, ...changes };
    const params = new URLSearchParams({ actresses: next.view });
    if (next.view === "annual" && next.year) params.set("year", next.year);
    if (next.query) params.set("q", next.query);
    if (next.page > 1) params.set("page", next.page);
    if (person) params.set("person", resolve(person));
    const target = new URL(base); target.hash = params.toString();
    return target.href;
  }

  function select(query = state.query) {
    const ranking = directory.rankings.find(item => item.year === state.year);
    let items = state.view === "annual" ? (ranking?.entries || []).map(entry => ({ person: people.get(entry.person), rank: entry.rank })) : [...people.values()].filter(person => state.view !== "hall" || person.hallOfFame).map(person => ({ person }));
    items = items.filter(item => item.person);
    const scope = items.length;
    const terms = query.normalize("NFKC").trim().split(/\s+/).map(normalize).filter(Boolean);
    items = items.filter(({ person }) => terms.every(term => person.search.includes(term)));
    if (state.view !== "annual") items.sort((a, b) => (a.person.romanization || a.person.name).localeCompare(b.person.romanization || b.person.name, "zh-Hans-CN") || a.person.id.localeCompare(b.person.id));
    const count = items.length;
    const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    return { ranking, scope, count, pages, items: items.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE) };
  }

  function link(label, changes, className = "") {
    const anchor = node("a", className, label); anchor.href = viewUrl(changes);
    anchor.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); navigate(anchor.href);
    });
    return anchor;
  }

  function sourceLink(label, href) {
    const anchor = node("a", "source-link", label);
    try {
      const parsed = new URL(href);
      if (parsed.protocol !== "https:") return node("span", "", label);
      anchor.href = parsed.href; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
    } catch { return node("span", "", label); }
    return anchor;
  }

  function render(query, gallery, results) {
    state.query = query;
    const selected = select(query);
    const navigation = document.getElementById("actress-navigation");
    navigation.replaceChildren();
    const tabs = node("nav", "person-tabs"); tabs.setAttribute("aria-label", "人物图库栏目");
    for (const [view, label] of Object.entries(labels)) {
      const anchor = link(label, { view, page: 1, query: "" });
      if (state.view === view) anchor.setAttribute("aria-current", "page");
      tabs.append(anchor);
    }
    const heading = node("div", "person-heading");
    heading.append(node("h2", "", state.view === "annual" ? state.year + " 年度榜单" : state.view === "hall" ? "名人堂" : "人物索引"));
    if (state.view === "annual") {
      const label = node("label", "person-year", "年份 ");
      const select = node("select"); select.setAttribute("aria-label", "选择榜单年份");
      for (const year of years()) { const option = node("option", "", year); option.value = year; select.append(option); }
      select.value = state.year;
      select.addEventListener("change", () => navigate(viewUrl({ year: Number(select.value), page: 1 })));
      label.append(select); heading.append(label);
    }
    navigation.append(tabs, heading);
    if (state.view === "annual") {
      const about = node("details", "person-method");
      about.append(node("summary", "", directory.series.title + " · 官方年度 TOP 100"), node("p", "", directory.series.method));
      if (selected.ranking) about.append(sourceLink("官方榜单 ↗", selected.ranking.source), sourceLink("来源记录 ↗", url(selected.ranking.snapshot)));
      navigation.append(about);
    } else {
      navigation.append(node("p", "person-description", state.view === "hall" ? "本项目精选不同年代的代表人物，不设排名或固定名额；具体入选依据见人物资料。" : directory.people.length + " 位已收录人物 · 搜索展示名、日文艺名、别名和已记录的罗马字。"));
      if (state.view === "hall") navigation.append(sourceLink("入选标准与本次审查 ↗", "https://github.com/zzpice/assets/blob/main/actresses/HALL-OF-FAME.md"));
    }
    gallery.classList.remove("grouped", "multiple-device-groups");
    gallery.classList.add("person-gallery"); gallery.dataset.device = "actress";
    const grid = node("div", "person-grid");
    for (const { person, rank } of selected.items) {
      const photo = photos.get(person.id);
      const card = node("a", "person-card"); card.href = viewUrl({}, person.id);
      card.addEventListener("click", event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); navigate(card.href, false);
      });
      const frame = node("div", "person-photo");
      if (photo) {
        const image = node("img"); image.src = url(photo.thumbnail); image.alt = person.name + "头像";
        image.width = photo.previewCrop?.[2] || photo.width; image.height = photo.previewCrop?.[3] || photo.height; image.loading = "lazy"; image.decoding = "async";
        image.addEventListener("error", () => { image.hidden = true; frame.append(node("span", "person-image-error", "头像暂不可用")); }, { once: true });
        frame.append(image);
      }
      if (rank) frame.append(node("span", "person-rank", String(rank).padStart(2, "0")));
      const meta = node("div", "person-meta"); meta.append(node("h3", "", person.name));
      if (person.romanization) meta.append(node("p", "", person.romanization));
      card.append(frame, meta); grid.append(card);
    }
    if (!selected.count) {
      const empty = node("div", "empty", "当前" + (state.view === "annual" ? state.year + " 年度榜单" : labels[state.view]) + "中没有找到人物，试试其他姓名或别名。");
      if (query.trim() && state.view !== "all") empty.append(node("br"),link("在全部女优中查找", { view: "all", page: 1 }, "secondary-button"));
      grid.append(empty);
    }
    const pagination = node("nav", "person-pagination"); pagination.setAttribute("aria-label", "人物列表分页");
    if (state.page > 1) pagination.append(link("← 上一页", { page: state.page - 1 }, "secondary-button"));
    pagination.append(node("span", "", state.page + " / " + selected.pages));
    if (state.page < selected.pages) pagination.append(link("下一页 →", { page: state.page + 1 }, "secondary-button"));
    gallery.replaceChildren(grid, pagination);
    results.textContent = "找到 " + selected.count + " / " + selected.scope + " 位 · 本页 " + selected.items.length + " 位";
    return selected;
  }

  function histories(id) {
    return directory.rankings.flatMap(ranking => ranking.entries.filter(entry => entry.person === id).map(entry => ({ ...entry, year: ranking.year, source: ranking.source }))).sort((a, b) => b.year - a.year);
  }

  function syncPerson(id) {
    const dialog = document.getElementById("person-dialog");
    const pid = resolve(id);
    if (!id || !people.has(pid)) {
      if (dialog.open) dialog.close(); activePerson = "";
      if (id) navigate(viewUrl(), false, true);
      return;
    }
    if (activePerson === pid && dialog.open) return;
    activePerson = pid;
    const person = people.get(pid), photo = photos.get(pid);
    document.getElementById("person-title").textContent = person.name;
    document.getElementById("person-romanization").textContent = person.romanization || "";
    const content = document.getElementById("person-content");
    const frame = node("div", "person-detail-photo");
    if (photo) {
      const image = node("img"); image.src = photo.previewCrop ? url(photo.thumbnail) : url(photo.path) + "?v=" + photo.sha; image.alt = person.name + "头像";
      image.width = photo.previewCrop?.[2] || photo.width; image.height = photo.previewCrop?.[3] || photo.height;
      image.addEventListener("error", () => { image.src = url(photo.thumbnail); }, { once: true }); frame.append(image);
    }
    const facts = node("div", "person-facts");
    const rows = profileRows(person);
    if (rows.length) {
      facts.append(node("h3", "", "基本资料"));
      const list = node("dl", "person-profile");
      for (const [label, value] of rows) list.append(node("dt", "", label), node("dd", "", value));
      const provenance = node("details", "person-method");
      provenance.append(node("summary", "", "资料来源 · " + person.profile.reviewed), node("p", "", "保留已核对的长期资料，身高为来源公布值；出道年份仅指 AV 出道。缺失信息不推测。"));
      for (const { label, sources } of profileEvidence(person)) {
        sources.forEach((entry, index) => provenance.append(sourceLink(label + "出处" + (sources.length > 1 ? " " + (index + 1) : "") + " · " + entry.reviewed + " ↗", entry.source.url)));
      }
      facts.append(list, provenance);
    }
    if (person.japaneseName || person.aliases.length) {
      facts.append(node("h3", "", "姓名与别名"));
      if (person.japaneseName) facts.append(node("p", "", "日文主艺名：" + person.japaneseName));
      const otherNames = person.aliases.filter(alias => alias.name !== person.japaneseName && alias.name !== person.romanization);
      if (otherNames.length) facts.append(node("p", "", "其他已确认表记：" + otherNames.map(alias => alias.name).join(" · ")));
      const sources = [...new Set(person.aliases.map(alias => alias.source))];
      const aliases = node("details", "person-method"); aliases.append(node("summary", "", "姓名来源"), sourceLink("人物表记 ↗", person.nameSource));
      for (const [index, source] of sources.entries()) aliases.append(sourceLink("别名来源 " + (index + 1) + " ↗", source));
      facts.append(aliases);
    } else facts.append(sourceLink("人物表记来源 ↗", person.nameSource));
    const history = histories(pid);
    facts.append(node("h3", "", "年度记录"));
    if (history.length) {
      const best = Math.min(...history.map(item => item.rank));
      facts.append(node("p", "person-stat", "最佳第 " + best + " 名 · 上榜 " + history.length + " 次"));
      const list = node("ul", "person-history");
      for (const item of history) {
        const li = node("li"); li.append(link(item.year + " 年", { view: "annual", year: item.year, page: Math.floor((item.rank - 1) / PAGE_SIZE) + 1, query: "" }), node("span", "", "第 " + item.rank + " 名")); list.append(li);
      }
      facts.append(list);
    } else facts.append(node("p", "", "暂无已收录的年度排名。"));
    facts.append(node("p", "person-description", "仅统计已收录的 " + years().slice().reverse().join("、") + " 年同口径榜单，不代表生涯统计。"));
    if (person.hallOfFame) {
      facts.append(node("h3", "", "名人堂成员"), node("p", "", person.hallOfFame.reason));
      person.hallOfFame.sources.forEach((source, index) => facts.append(sourceLink("入选依据 " + (index + 1) + " ↗", source)));
    }
    const sources = node("details", "person-method");
    const treatment = person.portrait.display ? "列表与详情采用经审核的预览取景；下载保留完整源图。" : "保留源图尺寸和构图。";
    sources.append(node("summary", "", "头像来源与版权"), node("p", "", "来源：" + person.portrait.source.provider + " · 获取于 " + person.portrait.source.retrieved + "。" + treatment + "版权归摄影者、所属经纪公司及其他原权利人，本项目不另授许可。"), sourceLink("选定源文件 ↗", person.portrait.source.url));
    if (person.portrait.source.profile) sources.append(sourceLink("出处页面与声明 ↗", person.portrait.source.profile));
    if (person.portrait.source.license) {
      const license = person.portrait.source.license;
      sources.append(node("p", "", "署名：" + license.author + "。源文件保持原样，网页预览" + (person.portrait.display ? "取景并缩小。" : "仅缩小生成。")), sourceLink("图片许可：" + license.name + " ↗", license.url));
    }
    if (person.portrait.source.restoration) sources.append(node("p", "", "头像采用上游 AI 修复版本，已与历史原图比较；修复细节不作为人物事实依据。"), sourceLink("历史未修复原图 ↗", person.portrait.source.restoration.originalUrl));
    if (person.portrait.source.provider === "Gfriends") sources.append(sourceLink("Gfriends 来源声明 ↗", "https://github.com/gfriends/gfriends/blob/" + person.portrait.source.revision + "/README.md"));
    facts.append(sources);
    const actions = node("div", "person-detail-actions");
    if (photo) {
      const download = node("a", "primary-button", "下载头像"); download.href = url(photo.path); download.download = photo.path.split("/").pop(); actions.append(download);
    }
    const copy = node("button", "secondary-button", "复制人物链接"); copy.type = "button";
    copy.addEventListener("click", async () => {
      const canonical = viewUrl({ view: "all", page: 1, query: "" }, pid);
      try { await navigator.clipboard.writeText(canonical); copy.textContent = "已复制"; }
      catch { window.prompt("复制人物地址", canonical); }
    }); actions.append(copy); facts.append(actions);
    content.replaceChildren(frame, facts);
    if (!dialog.open) dialog.showModal(); dialog.scrollTop = 0;
    document.body.style.overflow = "hidden";
  }

  function bind() {
    const dialog = document.getElementById("person-dialog");
    const close = () => navigate(viewUrl(), false, true);
    document.getElementById("person-close").addEventListener("click", close);
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.addEventListener("close", () => { activePerson = ""; document.body.style.overflow = ""; document.getElementById("person-content").replaceChildren(); });
    dialog.addEventListener("click", event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
    });
  }

  return { configure, route, viewUrl, select, render, syncPerson, histories, bind, normalize, profileRows, profileEvidence, get state() { return state; } };
})();
