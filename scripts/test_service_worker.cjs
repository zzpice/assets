"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash, webcrypto } = require("node:crypto");
const root = path.join(__dirname,"..");
const source = fs.readFileSync(path.join(root,"sw.js"),"utf8");
const base = "https://example.test/assets/";
const shellName = source.match(/const CACHE_NAME = CACHE_PREFIX \+ "([^"]+)"/)[1];
const shellCache = "zzpice-assets-" + shellName;
const previewCache = "zzpice-assets-previews-v1";
const iconCache = "zzpice-assets-icons-v1";
const manifest = JSON.parse(source.split("const SHELL_HASHES = ")[1].split(";")[0]);
const catalog = JSON.parse(fs.readFileSync(path.join(root,"catalog.json"),"utf8"));
const blobSha = data => createHash("sha1").update("blob " + Buffer.byteLength(data) + "\0").update(data).digest("hex");

function worker(fetchResponse = async request => new Response(fs.readFileSync(path.join(root,new URL(request.url).pathname.slice("/assets/".length)))), entries = {}, timers = {setTimeout,clearTimeout}) {
  const stores = new Map(Object.entries(entries).map(([name,items])=>[name,new Map(items)]));
  const listeners = {};
  const deletedCaches = [];
  let claimed = false;
  const key = request => typeof request === "string" ? request : request.url;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name,new Map());
      const stored = stores.get(name);
      return {
        async match(request) { return stored.get(key(request))?.clone(); },
        async put(request,response) { stored.set(key(request),response.clone()); },
        async keys() { return [...stored.keys()].map(url=>new Request(url)); },
        async delete(request) { return stored.delete(key(request)); }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { deletedCaches.push(name); return stores.delete(name); }
  };
  const context = vm.createContext({URL,Request,Response,AbortController,TextEncoder,crypto:webcrypto,...timers,fetch:fetchResponse,caches,
    self:{location:{href:base+"sw.js"},clients:{claim:async()=>{claimed=true;}},addEventListener:(name,handler)=>{listeners[name]=handler;}}
  });
  vm.runInContext(source,context);
  const dispatch = name => { let promise; listeners[name]({waitUntil:value=>{promise=value;}}); return promise; };
  return {context,stores,listeners,deletedCaches,dispatch,get claimed(){return claimed;}};
}

test("generated shell hashes cover the exact deployed page, catalog and versioned scripts",()=>{
  for(const [name,expected] of Object.entries(manifest)) {
    const data=fs.readFileSync(path.join(root,name.split("?")[0]));
    assert.equal(createHash("sha256").update(data).digest("hex"),expected,name);
  }
  assert.ok(Object.keys(manifest).some(name=>/^app\/site\.js\?v=/.test(name)));
  assert.ok(Object.keys(manifest).some(name=>/^app\/site\.css\?v=/.test(name)));
});

test("an active worker keeps the cached page instead of introducing a newer incomplete bundle",async()=>{
  let fetched=false;
  const state=worker(async()=>{fetched=true;return new Response("new page");},{[shellCache]:[[base+"index.html",new Response("saved page")]]});
  assert.equal(await(await state.context.shellResponse(new Request(base))).text(),"saved page");
  assert.equal(await(await state.context.shellResponse(new Request(base+"index.html?source=share"))).text(),"saved page");
  assert.equal(fetched,false);
});

test("versioned scripts only use the same version, never an unversioned or different-version copy",async()=>{
  const current=Object.keys(manifest).find(name=>name.startsWith("app/site.js?"));
  const state=worker(async()=>{throw new Error("offline");},{[shellCache]:[[base+current,new Response("current script")],[base+"app/site.js",new Response("old script")]]});
  assert.equal(await(await state.context.shellResponse(new Request(base+current))).text(),"current script");
  await assert.rejects(()=>state.context.shellResponse(new Request(base+"app/site.js?v=0000000000")),/version unavailable/);
});

test("project theme resolve to the same pinned version online and offline",async()=>{
  const current=Object.keys(manifest).find(name=>name.startsWith("app/theme.css?"));
  assert.ok(current,"project CSS must be in the verified shell");
  const state=worker(async()=>{throw new Error("offline");},{[shellCache]:[[base+current,new Response("design tokens")]]});
  assert.equal(await(await state.context.shellResponse(new Request(base+current))).text(),"design tokens");
  assert.equal(await(await state.context.shellResponse(new Request(base+"app/theme.css"))).text(),"design tokens");
  await assert.rejects(()=>state.context.shellResponse(new Request(base+"app/theme.css?v=0000000000")),/version unavailable/);
});

test("installation caches all verified mandatory resources and prioritizes wallpaper previews",async()=>{
  const state=worker();
  await state.dispatch("install");
  const stored=state.stores.get(shellCache);
  for(const name of Object.keys(manifest)) assert.ok(stored.has(base+name),name);
  for(const file of catalog.assets.filter(file=>["wallpaper","avatar"].includes(file.kind))) {
    assert.ok(state.stores.get(previewCache).has(base+file.thumbnail),file.path);
  }
  assert.equal(state.stores.get(previewCache).size,24);
});

test("installation never prefetches personal portraits even when public previews are sparse",async()=>{
  const portrait=catalog.assets.find(file=>file.kind==="actress");
  const wallpaper=catalog.assets.find(file=>file.kind==="wallpaper");
  for (const files of [[portrait,wallpaper],[portrait]]) {
    const requested=[];
    const state=worker(async request=>{
      requested.push(request.url);
      return new Response(fs.readFileSync(path.join(root,new URL(request.url).pathname.slice("/assets/".length))));
    });
    state.context.cachedCatalog=async()=>new Response(JSON.stringify({assets:files}));
    await state.dispatch("install");
    assert.ok(!requested.includes(base+portrait.thumbnail));
    assert.ok(!requested.some(url=>url.includes("/actresses/portraits/")));
    assert.equal(requested.includes(base+wallpaper.thumbnail),files.includes(wallpaper));
  }
});

test("a missing mandatory script prevents installation and leaves the old bundle intact",async()=>{
  const state=worker(async request=>{
    if(request.url.includes("app/site.js")) return new Response("unavailable",{status:503});
    return new Response(fs.readFileSync(path.join(root,new URL(request.url).pathname.slice("/assets/".length))));
  },{"zzpice-assets-old":[[base+"index.html",new Response("old page")]]});
  await assert.rejects(()=>state.dispatch("install"),/HTTP 503/);
  assert.equal(state.stores.has(shellCache),false);
  assert.equal(await state.stores.get("zzpice-assets-old").get(base+"index.html").text(),"old page");
  assert.equal(state.claimed,false);
});

test("stalled optional previews are aborted so the verified shell can finish installation",async()=>{
  let aborted=0;
  const pending=[];
  const state=worker(async request=>{
    if(request.url.includes("/previews/")) return new Promise((resolve,reject)=>{
      pending.push(request);
      request.signal.addEventListener("abort",()=>{aborted++;reject(new Error("preview timeout"));},{once:true});
    });
    return new Response(fs.readFileSync(path.join(root,new URL(request.url).pathname.slice("/assets/".length))));
  },{}, {setTimeout:callback=>setTimeout(callback,20),clearTimeout});
  let watchdog;
  try {
    await Promise.race([state.dispatch("install"),new Promise((resolve,reject)=>{watchdog=setTimeout(()=>reject(new Error("Installation stalled on optional previews")),1000);})]);
  } finally { clearTimeout(watchdog); }
  assert.equal(aborted,24);
  assert.ok(pending.every(request=>request.signal.aborted));
  assert.equal(state.stores.get(shellCache).size,Object.keys(manifest).length);
  await state.dispatch("activate");
  assert.equal(state.claimed,true);
});

test("a 200 response from another release also prevents installation",async()=>{
  const state=worker(async request=>{
    if(request.url.includes("app/site.js")) return new Response("different script");
    return new Response(fs.readFileSync(path.join(root,new URL(request.url).pathname.slice("/assets/".length))));
  });
  await assert.rejects(()=>state.dispatch("install"),/version mismatch/);
  assert.equal(state.stores.has(shellCache),false);
});

test("an evicted shell entry is recovered only when the network bytes match its pinned version",async()=>{
  const good=worker();
  const request=new Request(base+"catalog.json");
  assert.equal((await(await good.context.shellResponse(request)).json()).assets.length,catalog.assets.length);
  assert.ok(good.stores.get(shellCache).has(request.url));
  const bad=worker(async()=>new Response("new catalog"));
  await assert.rejects(()=>bad.context.shellResponse(request),/version mismatch/);
  assert.equal(bad.stores.get(shellCache).size,0);
});

test("a stalled recovery request is aborted without storing an error response",async()=>{
  let aborted=false;
  const state=worker((request,{signal})=>new Promise((resolve,reject)=>{
    signal.addEventListener("abort",()=>{aborted=true;reject(new Error("timeout"));},{once:true});
  }),{}, {setTimeout:callback=>{queueMicrotask(callback);return 1;},clearTimeout:()=>{}});
  await assert.rejects(()=>state.context.shellResponse(new Request(base+"catalog.json")),/timeout/);
  assert.equal(aborted,true);
  assert.equal(state.stores.get(shellCache).size,0);
});

test("cached thumbnails remain available offline",async()=>{
  const request=new Request(base+"app/previews/image.webp");
  const state=worker(async()=>{throw new Error("offline");},{[previewCache]:[[request.url,new Response("preview")]]});
  assert.equal(await(await state.context.thumbnailResponse(request)).text(),"preview");
});

test("thumbnail capacity is independent of shell and icon caches",async()=>{
  const state=worker(async()=>new Response("new preview"),{
    [shellCache]:[[base+"index.html",new Response("shell")]],
    [iconCache]:[[base+"icons/ai/icon.png?v=old",new Response("icon")]],
    [previewCache]:Array.from({length:32},(_,i)=>[base+"app/previews/"+i+".webp",new Response("preview")])
  });
  await state.context.thumbnailResponse(new Request(base+"app/previews/new.webp"));
  assert.equal(state.stores.get(previewCache).size,32);
  assert.ok(!state.stores.get(previewCache).has(base+"app/previews/0.webp"));
  assert.equal(state.stores.get(shellCache).size,1);
  assert.equal(state.stores.get(iconCache).size,1);
});

test("viewed versioned icons are verified once and remain available offline",async()=>{
  const data="icon bytes";
  const sha=blobSha(data);
  let online=true;
  let calls=0;
  const state=worker(async()=>{calls++;if(!online)throw new Error("offline");return new Response(data);});
  const request=new Request(base+"icons/finance/example.png?v="+sha);
  assert.equal(await(await state.context.iconResponse(request)).text(),data);
  online=false;
  assert.equal(await(await state.context.iconResponse(request)).text(),data);
  assert.equal(calls,1);
});

test("slow icons can outlast shell recovery while stalled icons still abort without caching",async()=>{
  const data="slow icon bytes",sha=blobSha(data);
  for(const elapsed of [9000,31000]) {
    const scheduled=new Map();let nextId=0,finish,signal;
    const state=worker((request,options)=>new Promise((resolve,reject)=>{
      signal=options.signal;finish=()=>resolve(new Response(data));
      signal.addEventListener("abort",()=>reject(new Error("image timeout")),{once:true});
    }),{}, {
      setTimeout:(callback,delay)=>{const id=++nextId;scheduled.set(id,{callback,delay});return id;},
      clearTimeout:id=>scheduled.delete(id)
    });
    const outcome=state.context.iconResponse(new Request(base+"icons/ai/slow.png?v="+sha))
      .then(response=>({response}),error=>({error}));
    await new Promise(setImmediate);
    for(const timer of scheduled.values())if(timer.delay<=elapsed)timer.callback();
    if(elapsed===9000) {
      assert.equal(signal.aborted,false,"queued image must survive the shell's shorter deadline");
      finish();const result=await outcome;
      assert.equal(await result.response.text(),data);
      assert.equal(state.stores.get(iconCache).size,1);
    } else {
      assert.equal(signal.aborted,true);assert.match((await outcome).error.message,/timeout/);
      assert.equal(state.stores.get(iconCache).size,0);
    }
    assert.equal(scheduled.size,0);
  }
});

test("replacing an icon cannot reuse the prior content version or cache mismatched bytes",async()=>{
  const old="old icon",fresh="new icon",oldSha=blobSha(old),newSha=blobSha(fresh);
  const oldUrl=base+"icons/finance/example.png?v="+oldSha;
  const freshUrl=base+"icons/finance/example.png?v="+newSha;
  const state=worker(async()=>new Response(fresh),{[iconCache]:[[oldUrl,new Response(old)]]});
  assert.equal(await(await state.context.iconResponse(new Request(freshUrl))).text(),fresh);
  const invalid=worker(async()=>new Response(old));
  await assert.rejects(()=>invalid.context.iconResponse(new Request(freshUrl)),/version mismatch/);
  assert.equal(invalid.stores.get(iconCache).size,0);
});

test("icon storage is capped at 64 without removing the shell",async()=>{
  const data="new icon",sha=blobSha(data);
  const state=worker(async()=>new Response(data),{
    [shellCache]:[[base+"index.html",new Response("shell")]],
    [iconCache]:Array.from({length:64},(_,i)=>[base+"icons/ai/"+i+".png?v="+sha,new Response("icon")])
  });
  await state.context.iconResponse(new Request(base+"icons/ai/new.png?v="+sha));
  assert.equal(state.stores.get(iconCache).size,64);
  assert.equal(state.stores.get(shellCache).size,1);
});

test("activation preserves current previews and icons while removing obsolete versions",async()=>{
  const file=catalog.assets.find(file=>file.kind==="wallpaper");
  const icon=catalog.assets.find(file=>file.kind==="icon");
  const iconUrl=base+icon.path+"?v="+icon.sha;
  const staleIcon=base+icon.path+"?v="+"0".repeat(40);
  const state=worker(undefined,{
    [shellCache]:[[base+"catalog.json",new Response(JSON.stringify(catalog))]],
    "zzpice-assets-old":[[base+"index.html",new Response("old shell")],[base+file.thumbnail,new Response("visited preview")]],
    [previewCache]:[[base+"app/previews/deleted.webp",new Response("stale")]],
    [iconCache]:[[iconUrl,new Response("current icon")],[staleIcon,new Response("stale")]],
    unrelated:[[base+"elsewhere",new Response("other application")]]
  });
  await state.dispatch("activate");
  assert.ok(state.stores.get(previewCache).has(base+file.thumbnail));
  assert.ok(!state.stores.get(previewCache).has(base+"app/previews/deleted.webp"));
  assert.ok(state.stores.get(iconCache).has(iconUrl));
  assert.ok(!state.stores.get(iconCache).has(staleIcon));
  assert.ok(!state.stores.has("zzpice-assets-old"));
  assert.ok(state.stores.has("unrelated"));
  assert.equal(state.claimed,true);
});

test("canonical originals, share images, external origins and non-GET requests are not intercepted",()=>{
  const state=worker();
  const requests=[
    new Request(base+"wallpapers/anime/1440x3120/image.png"),
    new Request(base+"avatars/anime/512x512/image.png"),
    new Request(base+"icons/ai/claude.png"),
    new Request(base+"app/social-preview.png"),
    new Request("https://api.github.com/repos/zzpice/assets/git/trees/main"),
    new Request(base+"catalog.json",{method:"POST"})
  ];
  for(const request of requests) {
    let intercepted=false;
    state.listeners.fetch({request,respondWith:()=>{intercepted=true;}});
    assert.equal(intercepted,false,request.url);
  }
});
