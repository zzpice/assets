"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname,"../sw.js"),"utf8");
const base = "https://example.test/assets/";

function worker(fetchResponse, entries = [], timers = {setTimeout,clearTimeout}) {
  const stored = new Map(entries);
  const listeners = {};
  const deleted = [];
  const key = request => typeof request === "string" ? request : request.url;
  const cache = {
    async match(request,options = {}) {
      const url = key(request);
      if (stored.has(url)) return stored.get(url).clone();
      if (options.ignoreSearch) {
        const candidate = [...stored.keys()].find(item => item.split("?")[0] === url.split("?")[0]);
        if (candidate) return stored.get(candidate).clone();
      }
    },
    async put(request,response) { stored.set(key(request),response); },
    async keys() { return [...stored.keys()].map(url => new Request(url)); },
    async delete(request) { deleted.push(key(request)); return stored.delete(key(request)); }
  };
  const context = vm.createContext({URL,Request,Response,AbortController,...timers,fetch:fetchResponse,
    caches:{open:async()=>cache},
    self:{location:{href:base+"sw.js"},addEventListener:(name,handler)=>{listeners[name]=handler;}}
  });
  vm.runInContext(source,context);
  return {context,stored,listeners,deleted};
}

test("fresh successful shell responses replace cached content",async()=>{
  const request = new Request(base+"index.html");
  const state = worker(async()=>new Response("new page"),[[request.url,new Response("old page")]]);
  assert.equal(await (await state.context.networkFirst(request)).text(),"new page");
  assert.equal(await state.stored.get(request.url).text(),"new page");
});

test("HTTP failures use a cached page without overwriting it",async()=>{
  const request = new Request(base+"index.html");
  const state = worker(async()=>new Response("unavailable",{status:503}),[[request.url,new Response("saved page")]]);
  assert.equal(await (await state.context.networkFirst(request)).text(),"saved page");
  assert.equal(await state.stored.get(request.url).text(),"saved page");
});

test("offline versioned scripts use the current bundle's unversioned copy",async()=>{
  const state = worker(async()=>{throw new Error("offline");},[[base+"app/site.js",new Response("current script")]]);
  assert.equal(await (await state.context.networkFirst(new Request(base+"app/site.js?v=current"))).text(),"current script");
});

test("navigation falls back to the cached gallery when disconnected",async()=>{
  const state = worker(async()=>{throw new Error("offline");},[[base,new Response("saved gallery")]]);
  assert.equal(await (await state.context.networkFirst({url:base+"index.html",mode:"navigate"})).text(),"saved gallery");
});

test("a stalled network request is aborted and the cached page opens",async()=>{
  let aborted = false;
  const stalled = (request,{signal})=>new Promise((resolve,reject)=>{
    signal.addEventListener("abort",()=>{aborted=true;reject(new Error("timeout"));},{once:true});
  });
  const timers = {setTimeout:callback=>{queueMicrotask(callback);return 1;},clearTimeout:()=>{}};
  const request = new Request(base+"index.html");
  const state = worker(stalled,[[request.url,new Response("saved gallery")]],timers);
  assert.equal(await (await state.context.networkFirst(request)).text(),"saved gallery");
  assert.equal(aborted,true);
});

test("uncached failures stay visible instead of caching an error page",async()=>{
  const request = new Request(base+"catalog.json");
  const state = worker(async()=>new Response("unavailable",{status:503}));
  assert.equal((await state.context.networkFirst(request)).status,503);
  assert.equal(state.stored.size,0);
  const offline = worker(async()=>{throw new Error("offline");});
  await assert.rejects(()=>offline.context.networkFirst(request),/offline/);
});

test("cached thumbnails do not require the network",async()=>{
  const request = new Request(base+"app/previews/image.webp");
  const state = worker(async()=>{throw new Error("network must not be called");},[[request.url,new Response("preview")]]);
  assert.equal(await (await state.context.thumbnailResponse(request)).text(),"preview");
});

test("thumbnail storage is capped without evicting the offline shell",async()=>{
  const entries = [[base,new Response("shell")],...Array.from({length:32},(_,i)=>[base+"app/previews/"+i+".webp",new Response("preview")])];
  const state = worker(async()=>new Response("new preview"),entries);
  await state.context.thumbnailResponse(new Request(base+"app/previews/new.webp"));
  assert.equal([...state.stored.keys()].filter(url=>url.includes("app/previews/")).length,32);
  assert.deepEqual(state.deleted,[base+"app/previews/0.webp"]);
  assert.ok(state.stored.has(base));
});

test("full-size originals and unrelated requests are not intercepted",()=>{
  const state = worker(async()=>new Response("unused"));
  for (const url of [base+"wallpapers/anime/1440x3120/image.png",base+"avatars/anime/512x512/image.png",base+"icons/proxy/direct.png","https://api.github.com/repos/zzpice/assets/git/trees/main"]){
    let intercepted = false;
    state.listeners.fetch({request:new Request(url),respondWith:()=>{intercepted=true;}});
    assert.equal(intercepted,false,url);
  }
});
