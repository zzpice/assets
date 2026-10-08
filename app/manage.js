/* Small editor for ordinary images. The gallery and catalog remain the source of truth. */
(function () {
  "use strict";
  const api = window.AssetGitHub;
  let dialog, current, upload, publisher, prepared, busy = false, dirty = false, previewURL;
  const labels = {wallpaper: "壁纸", avatar: "头像", icon: "图标"};
  const $ = selector => dialog.querySelector(selector);
  const element = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  function dispose() { publisher?.dispose(); publisher = null; prepared = null; if (dialog) $("[name=token]").value = ""; }
  function resetPreview() {
    dispose(); $("#manage-confirm").hidden = true; $("#manage-fields").disabled = false; $("#manage-prepare").hidden = false;
  }
  function setup() {
    if (dialog) return;
    dialog = document.createElement("dialog"); dialog.id = "manage-dialog"; dialog.className = "manage-dialog";
    dialog.setAttribute("aria-labelledby", "manage-title");
    dialog.innerHTML = `<form id="manage-form"><div class="dialog-header"><h2 id="manage-title">上传图片</h2><button type="button" class="close-button" id="manage-close" aria-label="关闭编辑">×</button></div>
      <p class="manage-hint">支持壁纸、普通头像与常规图标。游戏、卡面和人物资料沿用各自维护流程。</p>
      <fieldset id="manage-fields"><label id="manage-drop" class="manage-drop">选择图片或拖放到这里<input type="file" name="image" accept=".png,.jpg,.jpeg,.gif,.webp,.avif"><small>保留原图，单张最多 20 MB；编辑时可选新文件替换。</small></label>
      <div class="manage-picture"><img id="manage-image" alt="保存前图片预览"><p id="manage-tech"></p></div>
      <div class="manage-row"><label>资源类型<select name="kind"><option value="wallpaper">壁纸</option><option value="avatar">普通头像</option><option value="icon">常规图标</option></select></label><label>内容分类<select name="category"></select></label></div>
      <label id="manage-new-category" hidden>新分类目录名<input name="newCategory" maxlength="50" placeholder="小写英文、数字和短横线"></label>
      <label>文件名<input name="filename" required maxlength="100" pattern="[a-z0-9][a-z0-9-]*" placeholder="例如 mountain-lake"><small>不含后缀；改名或移动会改变外链。</small></label>
      <label>显示名称<input name="title" required maxlength="160" placeholder="请填写易辨认的名称"></label>
      <label>说明／备注<textarea name="note" maxlength="2000" rows="3"></textarea></label>
      <label id="manage-device">适用设备<select name="device"><option value="desktop">电脑</option><option value="phone">手机</option><option value="tablet">平板</option><option value="unknown">待分类</option></select><small>按尺寸初步判断，可人工修正。</small></label>
      <label>来源<input name="source" maxlength="2000" placeholder="来源网址、创作说明或待核实"><small>原有来源记录会保留；新增和替换请确认来源与许可。</small></label>
      <label>许可<input name="license" maxlength="1000" placeholder="已确认的许可或待核实"></label>
      <label class="manage-check" id="manage-delete-row" hidden><input name="remove" type="checkbox">删除这张图片</label>
      <p id="manage-path" class="filename"></p><p id="manage-warning" class="manage-warning" hidden></p>
      <label>GitHub Token<input name="token" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="仅本次操作使用"><small>fine-grained PAT：仅 assets，Contents 读写。Token 只留在本次操作内存，关闭或保存后清空。</small></label>
      </fieldset><p id="manage-status" role="status"></p><p id="manage-error" role="alert"></p>
      <section id="manage-confirm" hidden><h3>确认实际修改</h3><div id="manage-summary"></div><p>直接提交 main。提交后 Actions 自动生成目录、清理旧预览并部署。</p><div class="manage-buttons"><button id="manage-back" type="button" class="secondary-button">返回修改</button><button id="manage-save" type="button" class="primary-button">确认保存到 GitHub</button></div></section>
      <div class="manage-buttons"><button id="manage-prepare" type="submit" class="primary-button">检查并预览修改</button></div></form>`;
    document.body.append(dialog);
    $("#manage-close").onclick = close;
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.addEventListener("close", () => { dispose(); if (previewURL) URL.revokeObjectURL(previewURL); previewURL = null; upload = current = null; dirty = false; });
    dialog.addEventListener("input", event => {
      if (event.target.name === "token") return;
      dirty = true; $("#manage-error").textContent = ""; updatePath();
    });
    $("[name=kind]").onchange = () => { categories(); updatePath(); };
    $("[name=category]").onchange = updatePath;
    $("[name=image]").onchange = event => inspect(event.target.files[0]);
    const drop = $("#manage-drop");
    for (const type of ["dragenter", "dragover", "dragleave", "drop"]) drop.addEventListener(type, event => {
      event.preventDefault(); drop.classList.toggle("drag-over", type === "dragenter" || type === "dragover");
      if (type === "drop" && !busy && !$("#manage-fields").disabled) {
        if (event.dataTransfer.files.length !== 1) $("#manage-error").textContent = "每次请选择一张图片。";
        else inspect(event.dataTransfer.files[0]);
      }
    });
    $("#manage-form").onsubmit = prepare;
    $("#manage-back").onclick = () => { resetPreview(); $("#manage-status").textContent = ""; };
    $("#manage-save").onclick = save;
    window.addEventListener("beforeunload", event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
  }
  function close() { if (!busy && (!dirty || confirm("尚未提交的图片修改会丢失，确认关闭？"))) dialog.close(); }
  function categories() {
    const kind = $("[name=kind]").value, select = $("[name=category]");
    const values = current.context.assets.filter(item => item.kind === kind).map(item => item.category);
    const known = kind === "icon" ? current.context.iconLabels : current.context.styleLabels;
    select.replaceChildren();
    for (const id of [...new Set([...Object.keys(known), ...values])]) select.add(new Option(known[id] || id, id));
    select.add(new Option("新建分类…", "new"));
    if (current.original?.kind === kind) select.value = current.original.category;
    $("#manage-device").hidden = kind !== "wallpaper";
  }
  function target() {
    const form = $("#manage-form").elements, original = current.original;
    const category = form.category.value === "new" ? form.newCategory.value.trim() : form.category.value;
    const technical = upload || original;
    if (!technical) return null;
    const extension = upload?.extension || original.path.split(".").pop();
    const prefix = {wallpaper: "wallpapers", avatar: "avatars", icon: "icons"}[form.kind.value];
    const path = prefix + "/" + category + "/" + (form.kind.value === "icon" ? "" : technical.width + "x" + technical.height + "/") + form.filename.value.trim() + "." + extension;
    const next = {path, kind: form.kind.value, category, width: technical.width, height: technical.height, title: form.title.value.trim(), note: form.note.value.trim()};
    if (form.kind.value === "wallpaper") next.device = form.device.value;
    next.source = form.source.value.trim();
    next.license = form.license.value.trim();
    return next;
  }
  function updatePath() {
    if (!current) return;
    const form = $("#manage-form").elements, remove = form.remove.checked;
    form.source.required = form.license.required = !remove && (!!upload || !current.original);
    form.title.required = form.filename.required = !remove;
    $("#manage-new-category").hidden = $("[name=category]").value !== "new";
    $("#manage-device").hidden = $("[name=kind]").value !== "wallpaper";
    $("#manage-path").textContent = target()?.path || "选择图片后生成归档路径";
    const pathChanged = current.original && target()?.path !== current.original.path;
    $("#manage-warning").hidden = !pathChanged && !$("[name=remove]").checked && !upload;
    $("#manage-warning").textContent = $("[name=remove]").checked ? "删除后原图外链失效。来源历史保留。" : pathChanged ? "改名或移动后，原有外链将失效；请同时更新使用它的页面。" : current.original && upload ? "替换后外链仍指向此路径，但显示内容会变化；请核对并更新来源及说明。" : "请确认内容分类、名称、来源与许可。";
  }
  async function inspect(file) {
    if (!file || busy) return;
    busy = true; $("#manage-prepare").disabled = true;
    try {
      if (file.size > 20 * 1048576 || !file.size) throw Error("请选择非空图片，单张最多 20 MB。");
      const extension = file.name.split(".").pop().toLowerCase();
      if (!/^(png|jpe?g|gif|webp|avif)$/.test(extension)) throw Error("支持 PNG、JPEG、GIF、WebP 和 AVIF；图标仅支持 PNG。");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const signature = String.fromCharCode(...bytes.slice(0, 12));
      if ((extension === "png" && !signature.startsWith("\x89PNG\r\n\x1a\n")) || (/^jpe?g$/.test(extension) && (bytes[0] !== 255 || bytes[1] !== 216)) || (extension === "gif" && !signature.startsWith("GIF8")) || (extension === "webp" && (!signature.startsWith("RIFF") || !signature.endsWith("WEBP"))) || (extension === "avif" && !signature.slice(4).startsWith("ftypavif"))) throw Error("文件后缀与实际图片格式不一致。");
      const url = URL.createObjectURL(file), image = new Image();
      try { image.src = url; await image.decode(); } catch { URL.revokeObjectURL(url); throw Error("无法读取图片，请检查文件和浏览器格式支持。"); }
      if (image.naturalWidth * image.naturalHeight > 80_000_000) { URL.revokeObjectURL(url); throw Error("图片像素过大，请使用不超过 8000 万像素的图片。"); }
      if (previewURL) URL.revokeObjectURL(previewURL); previewURL = url;
      upload = {bytes, size: file.size, extension, width: image.naturalWidth, height: image.naturalHeight, image};
      $("#manage-image").src = url; $("#manage-image").hidden = false;
      $("#manage-tech").textContent = `${upload.width} × ${upload.height} · ${extension.toUpperCase()} · ${(file.size / 1048576).toFixed(2)} MB`;
      const form = $("#manage-form").elements;
      if (!form.filename.value) form.filename.value = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      form.device.value = window.AssetCatalog.inferDevice(upload.width, upload.height);
      form.source.required = form.license.required = true;
      dirty = true; $("#manage-error").textContent = ""; updatePath();
    } catch (error) { $("#manage-error").textContent = error.message; $("[name=image]").value = ""; }
    finally { busy = false; $("#manage-prepare").disabled = false; }
  }
  function validateIcon() {
    if (!upload || $("[name=kind]").value !== "icon") return;
    if (upload.extension !== "png" || upload.width !== 512 || upload.height !== 512 || upload.bytes[25] !== 6) throw Error("图标必须为 512×512 PNG、RGBA；请先按图标规则处理。");
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d", {willReadFrequently: true}); context.drawImage(upload.image, 0, 0);
    const pixels = context.getImageData(0, 0, 512, 512).data;
    // Exact per-row r=115 boundary from the existing Pillow rounded_rectangle recipe.
    const boundary = [105, 97, 92, 87, 84, 80, 77, 75, 72, 70, 67, 65, 63, 61, 60, 58, 56, 55, 53, 51, 50, 49, 47, 46, 45, 43, 42, 41, 40, 39, 37, 36, 35, 34, 33, 32, 31, 30, 30, 29, 28, 27, 26, 25, 25, 24, 23, 22, 22, 21, 20, 19, 19, 18, 18, 17, 16, 16, 15, 15, 14, 13, 13, 12, 12, 11, 11, 10, 10, 10, 9, 9, 8, 8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let y = 0; y < boundary.length; y++) for (let x = 0; x < boundary[y]; x++) {
      for (const [px, py] of [[x,y], [511-x,y], [x,511-y], [511-x,511-y]]) if (pixels[(py * 512 + px) * 4 + 3] !== 0) throw Error("图标 r=115 圆角外侧必须完全透明；请先按图标规则处理。");
    }
  }
  async function prepare(event) {
    event.preventDefault(); if (busy) return;
    $("#manage-error").textContent = "";
    const token = $("[name=token]").value; dispose();
    try {
      if (!navigator.onLine) throw Error("上传与编辑保存需要联网。");
      const remove = $("[name=remove]").checked, next = remove ? null : target();
      if (!remove && !next) throw Error("请先选择图片。");
      if (!remove) validateIcon();
      if (current.original && next && next.kind !== current.original.kind && !upload && next.kind === "icon") throw Error("转为图标时请重新选择符合规范的 PNG 文件。");
      publisher = new api.Publisher(token); busy = true; $("#manage-fields").disabled = true; $("#manage-prepare").disabled = true;
      $("#manage-status").textContent = "正在检查权限、文件版本与目标路径…";
      const snapshot = await publisher.snapshot();
      const changes = api.plan(snapshot, current.original, next, remove ? null : upload);
      if (upload && !remove && !current.original) {
        const prefix = new TextEncoder().encode("blob " + upload.bytes.length + "\0"), raw = new Uint8Array(prefix.length + upload.bytes.length); raw.set(prefix); raw.set(upload.bytes, prefix.length);
        const sha = [...new Uint8Array(await crypto.subtle.digest("SHA-1", raw))].map(byte => byte.toString(16).padStart(2, "0")).join("");
        const duplicate = [...snapshot.tree.values()].find(item => item.sha === sha && api.imagePath.test(item.path));
        if (duplicate) throw Error("仓库中已有相同图片：" + duplicate.path);
      }
      const sourceFile = (next || current.original).kind === "icon" ? "icons/SOURCES.md" : "wallpapers/SOURCES.md";
      const sources = await publisher.text(snapshot.tree, sourceFile);
      changes.push({path: sourceFile, content: api.utf8(api.sourceRecord(sources, sourceFile, current.original, next, !!upload))});
      if (current.original?.kind === "icon" && next && current.original.path !== next.path && snapshot.tree.has("icons/navigation-sources.json")) {
        const records = JSON.parse(await publisher.text(snapshot.tree, "icons/navigation-sources.json"));
        let changed = false;
        for (const item of records.icons || []) if (item.path === current.original.path) { item.path = next.path; changed = true; }
        if (changed) changes.push({path: "icons/navigation-sources.json", content: api.utf8(api.json(records))});
      }
      prepared = {snapshot, changes};
      const summary = $("#manage-summary"); summary.replaceChildren();
      for (const [label, before, after] of [["路径", current.original?.path, next?.path], ["名称", current.original?.title, next?.title], ["说明", current.original?.note, next?.note], ["设备", current.original?.device, next?.device], ["来源", current.original?.source, next?.source], ["许可", current.original?.license, next?.license]]) {
        if (before !== after) { const row = element("p"); row.append(element("strong", label + "："), element("span", (before || "（无）") + " → " + (after || "（删除／清空）"))); summary.append(row); }
      }
      if (upload && !remove) summary.append(element("p", current.original ? "原图：替换为当前预览图片" : "原图：上传当前预览图片"));
      const list = element("ul");
      for (const change of changes) list.append(element("li", (change.sha === null ? "删除 " : "写入 ") + change.path));
      summary.append(list); $("#manage-confirm").hidden = false; $("#manage-prepare").hidden = true;
      $("#manage-status").textContent = "仓库访问与版本预检通过。确认后 GitHub 验证 Contents 写入权限并再次保护 main。";
      $("#manage-save").focus();
    } catch (error) { dispose(); $("#manage-fields").disabled = false; $("#manage-error").textContent = error.message; $("#manage-status").textContent = ""; }
    finally { busy = false; $("#manage-prepare").disabled = false; }
  }
  async function save() {
    if (!prepared || busy) return;
    busy = true; $("#manage-save").disabled = $("#manage-back").disabled = true;
    $("#manage-status").textContent = "正在提交图片与资料…";
    try {
      const commit = await publisher.publish(prepared.snapshot, prepared.changes);
      dirty = false; $("#manage-confirm").hidden = true;
      const status = $("#manage-status"); status.replaceChildren(element("strong", "已提交到 GitHub，尚未确认部署上线。"), element("p", "Actions 将自动生成目录和预览。部署完成后关闭所有图库页面并重新打开即可使用新版本。"));
      for (const [title, url] of [["查看此次提交 ↗", "https://github.com/zzpice/assets/commit/" + commit], ["查看 Actions 部署 ↗", "https://github.com/zzpice/assets/actions"]]) { const link = element("a", title); link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; status.append(link, element("br")); }
    } catch (error) { $("#manage-error").textContent = error.message; $("#manage-status").textContent = "保存未确认，请检查 GitHub 后重新授权预览。"; $("#manage-fields").disabled = false; $("#manage-prepare").hidden = false; $("#manage-confirm").hidden = true; }
    finally { dispose(); busy = false; $("#manage-save").disabled = $("#manage-back").disabled = false; }
  }
  window.AssetManager = {
    open(original, context) {
      if (original && !api.editable(original)) return;
      setup(); dispose(); current = {original: original ? structuredClone(original) : null, context}; upload = null; dirty = false;
      $("#manage-form").reset(); $("#manage-fields").disabled = false; $("#manage-save").disabled = false;
      $("#manage-title").textContent = original ? "编辑图片" : "上传图片";
      $("[name=kind]").value = original?.kind || (["wallpaper", "avatar", "icon"].includes(context.kind) ? context.kind : "wallpaper");
      // Moving between purposes is outside this small editor; categories remain editable.
      $("[name=kind]").disabled = !!original;
      categories();
      const form = $("#manage-form").elements;
      for (const name of ["title", "note", "device", "source", "license"]) if (original?.[name]) form[name].value = original[name];
      form.filename.value = original ? original.path.split("/").pop().replace(/\.[^.]+$/, "") : "";
      form.source.required = form.license.required = !original;
      $("#manage-image").hidden = !original;
      if (original) $("#manage-image").src = new URL(original.thumbnail || original.path, document.baseURI);
      $("#manage-tech").textContent = original ? `${original.width} × ${original.height} · ${(original.size / 1048576).toFixed(2)} MB` : "";
      $("#manage-delete-row").hidden = !original; $("#manage-confirm").hidden = true; $("#manage-prepare").hidden = false;
      $("#manage-error").textContent = $("#manage-status").textContent = ""; updatePath(); dialog.showModal();
    }
  };
})();
