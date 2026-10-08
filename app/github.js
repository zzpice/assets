/* Fixed-repository Git Data save. No credentials or API responses are persisted. */
(function (root) {
  "use strict";
  const REPO = "zzpice/assets", API = "/repos/" + REPO;
  const shaPattern = /^[a-f0-9]{40}$/;
  const imagePath = /^(?:(?:wallpapers|avatars)\/[a-z0-9][a-z0-9-]*\/[1-9][0-9]*x[1-9][0-9]*|icons\/[a-z0-9][a-z0-9-]*)\/[a-z0-9][a-z0-9-]*\.(png|jpe?g|gif|webp|avif)$/;
  const previewPath = /^app\/previews\/[a-z0-9-]+-[a-f0-9]{10}\.webp$/;
  const editable = item => ["wallpaper", "avatar", "icon"].includes(item?.kind) && imagePath.test(item.path);
  const fields = ["title", "note", "device", "source", "license"];
  const manual = item => Object.fromEntries(fields.map(key => [key, item?.[key] || ""]));
  const encode = bytes => {
    let value = "";
    for (let offset = 0; offset < bytes.length; offset += 32768) value += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    return btoa(value);
  };
  const utf8 = value => encode(new TextEncoder().encode(value));
  const decode = value => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, "")), c => c.charCodeAt(0)));
  const json = value => JSON.stringify(value, null, 2) + "\n";
  const errorText = status => ({401: "Token 无效或已过期。", 403: "GitHub 拒绝写入，请检查 assets 的 Contents 读写权限及分支规则。", 404: "仓库或文件不可访问，请检查 Token 的授权范围。", 409: "main 已变化，请重新检查并预览。", 422: "GitHub 拒绝提交：main 已变化或分支规则不允许此次保存。", 429: "GitHub 请求过于频繁，请稍后重试。"}[status] || "GitHub 暂时不可用，请稍后重试。");
  class Publisher {
    constructor(token, fetcher = (...args) => fetch(...args)) {
      if (!/^[a-zA-Z0-9_]{1,255}$/.test(token.trim())) throw Error("请输入有效的 GitHub Token。");
      this.token = token.trim(); this.fetcher = fetcher;
    }
    dispose() { this.token = ""; }
    async request(route, {method = "GET", body} = {}) {
      if (!this.token || !(route === API || route.startsWith(API + "/")) || route.includes("..")) throw Error("授权只允许用于 assets 仓库。");
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await this.fetcher("https://api.github.com" + route, {
          method, headers: {Accept: "application/vnd.github+json", Authorization: "Bearer " + this.token, "X-GitHub-Api-Version": "2022-11-28", ...(body ? {"Content-Type": "application/json"} : {})},
          ...(body ? {body: JSON.stringify(body)} : {}), signal: controller.signal, cache: "no-store", credentials: "omit", redirect: "error"
        });
        if (!response.ok) { const error = Error(errorText(response.status)); error.status = response.status; throw error; }
        return await response.json();
      } catch (error) {
        if (error.status) throw error;
        throw Error("网络中断或 GitHub 无响应，请检查提交记录后重试。表单仍在当前页面。");
      } finally { clearTimeout(timeout); }
    }
    async head() {
      const ref = await this.request(API + "/git/ref/heads/main");
      if (ref.object?.type !== "commit" || !shaPattern.test(ref.object.sha)) throw Error("main 版本无效。");
      return ref.object.sha;
    }
    async text(tree, path) {
      const file = tree.get(path);
      if (!file || file.type !== "blob" || file.mode !== "100644" || !shaPattern.test(file.sha)) throw Error("缺少有效文件：" + path);
      const blob = await this.request(API + "/git/blobs/" + file.sha);
      if (blob.encoding !== "base64" || typeof blob.content !== "string" || blob.content.length > 8_000_000) throw Error("文件过大或格式无效：" + path);
      return decode(blob.content);
    }
    async snapshot() {
      const repo = await this.request(API);
      if (repo.permissions?.push !== true) throw Error(errorText(403));
      const head = await this.head();
      const commit = await this.request(API + "/git/commits/" + head);
      if (!shaPattern.test(commit.tree?.sha)) throw Error("GitHub 文件树无效。");
      const result = await this.request(API + "/git/trees/" + commit.tree.sha + "?recursive=1");
      if (result.truncated || !Array.isArray(result.tree)) throw Error("文件树过大或不完整，已停止保存。");
      const tree = new Map(result.tree.map(item => [item.path, item]));
      const catalog = JSON.parse(await this.text(tree, "catalog.json"));
      if (catalog.version !== 1 || !Array.isArray(catalog.assets) || new Set(catalog.assets.map(item => item.path)).size !== catalog.assets.length) throw Error("资源目录格式或路径无效。");
      return {head, treeSha: commit.tree.sha, tree, catalog};
    }
    async publish(snapshot, changes) {
      const allowed = change => imagePath.test(change.path) || ["catalog.json", "wallpapers/SOURCES.md", "icons/SOURCES.md", "icons/navigation-sources.json"].includes(change.path) || (change.sha === null && change.content === undefined && previewPath.test(change.path));
      if (!changes.length || changes.some(change => !allowed(change)) || new Set(changes.map(change => change.path)).size !== changes.length) throw Error("提交路径无效。");
      if (await this.head() !== snapshot.head) throw Error(errorText(409));
      // Blobs and the new tree are unreachable until the one non-forced main update.
      const entries = [];
      for (const change of changes) {
        let sha = change.sha;
        if (change.content !== undefined) {
          const blob = await this.request(API + "/git/blobs", {method: "POST", body: {content: change.content, encoding: "base64"}});
          if (!shaPattern.test(blob.sha)) throw Error("GitHub 图片保存结果无效。");
          sha = blob.sha;
        }
        if (sha !== null && !shaPattern.test(sha)) throw Error("GitHub 文件版本无效。");
        entries.push({path: change.path, mode: "100644", type: "blob", sha});
      }
      const tree = await this.request(API + "/git/trees", {method: "POST", body: {base_tree: snapshot.treeSha, tree: entries}});
      if (!shaPattern.test(tree.sha)) throw Error("GitHub 文件树保存结果无效。");
      const commit = await this.request(API + "/git/commits", {method: "POST", body: {message: "Manage gallery resources", tree: tree.sha, parents: [snapshot.head]}});
      if (!shaPattern.test(commit.sha)) throw Error("GitHub 提交结果无效。");
      try {
        const result = await this.request(API + "/git/refs/heads/main", {method: "PATCH", body: {sha: commit.sha, force: false}});
        if (result.object?.sha !== commit.sha) throw Error("保存结果未确认，请检查 GitHub 提交记录。");
      } catch (error) {
        // Recognize a lost success response without repeating the commit.
        try { if (await this.head() === commit.sha) return commit.sha; } catch {}
        throw error;
      }
      return commit.sha;
    }
  }
  function plan(snapshot, original, next, file) {
    const catalog = structuredClone(snapshot.catalog), changes = [];
    let previous;
    if (original) {
      if (!editable(original)) throw Error("此类资源继续使用专门维护流程。");
      const live = catalog.assets.find(item => item.path === original.path);
      if (!live || snapshot.tree.get(original.path)?.sha !== original.sha || JSON.stringify(manual(live)) !== JSON.stringify(manual(original))) throw Error("图片或资料已在 GitHub 变化，请等待部署并刷新后再编辑。");
      catalog.assets = catalog.assets.filter(item => item.path !== original.path);
      previous = live;
    }
    if (next) {
      if (!editable(next) || (next.kind === "icon" && !next.path.endsWith(".png"))) throw Error("资源路径或格式不符合归档规则。");
      if (fields.some(field => next[field] !== undefined && typeof next[field] !== "string") || !next.title?.trim() || /github_pat_[a-zA-Z0-9_]+|gh[pousr]_[a-zA-Z0-9_]{15,}/.test(fields.map(field => next[field] || "").join("\n"))) throw Error("图片资料无效或含疑似 Token，请检查填写内容。");
      if ((!original || original.path !== next.path) && (snapshot.tree.has(next.path) || catalog.assets.some(item => item.path === next.path))) throw Error("目标路径已存在，请修改文件名；替换图片请从原图进入编辑。");
      catalog.assets.push({...previous, ...next});
      if (file) {
        if (file.size > 20 * 1048576) throw Error("单张图片请控制在 20 MB 以内。");
        if (snapshot.tree.has(next.path) && !original) throw Error("目标图片已存在。");
        changes.push({path: next.path, content: encode(file.bytes)});
      } else if (original && original.path !== next.path) changes.push({path: next.path, sha: snapshot.tree.get(original.path).sha});
    }
    if (original && (!next || original.path !== next.path)) changes.push({path: original.path, sha: null});
    if (original && (!next || file)) {
      const shared = new Set(catalog.assets.filter(item => item.path !== next?.path).flatMap(item => [item.thumbnail, item.background]));
      for (const path of new Set([previous.thumbnail, previous.background])) {
        if (previewPath.test(path) && snapshot.tree.has(path) && !shared.has(path)) changes.push({path, sha: null});
      }
    }
    changes.push({path: "catalog.json", content: utf8(json(catalog))});
    return changes;
  }
  function sourceRecord(text, sourceFile, original, next, replacement) {
    const relative = path => sourceFile.startsWith("icons/") ? path.replace(/^icons\//, "") : path.replace(/^wallpapers\//, "").replace(/^avatars\//, "../avatars/");
    if (original && next && original.path !== next.path) {
      text = text.split("](" + relative(original.path) + ")").join("](" + relative(next.path) + ")");
      text = text.split("`" + original.path + "`").join("`" + next.path + "`");
    }
    const escape = value => String(value || "待核实").replace(/[\r\n]+/g, " ").replace(/\|/g, "\\|").replace(/[<>]/g, "");
    const item = next || original;
    const action = !next ? "删除（历史来源保留）" : !original ? "新增" : replacement ? "替换原图" : original.path !== next.path ? "移动／改名" : "编辑资料";
    return text.trimEnd() + "\n\n### 网页维护 · " + new Date().toISOString().slice(0, 10) + "\n\n" +
      "| 文件 | 操作 | 来源 | 许可 | 说明 |\n| --- | --- | --- | --- | --- |\n" +
      "| `" + item.path + "` | " + action + " | " + escape(item.source || "沿用原记录；未另行确认") + " | " + escape(item.license || "沿用原记录；未另行确认") + " | " + escape(item.note || "未补充") + " |\n";
  }
  const api = {Publisher, plan, sourceRecord, editable, imagePath, utf8, json};
  if (typeof module !== "undefined") module.exports = api;
  else root.AssetGitHub = api;
})(typeof window === "undefined" ? globalThis : window);
