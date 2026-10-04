"use strict";

const CACHE_PREFIX = "zzpice-assets-";
const CACHE_NAME = CACHE_PREFIX + "v1";
const base = new URL("./", self.location.href);
const shell = ["./","index.html","app/site.css","app/site.js","app/manifest.webmanifest","app/icon.svg","app/icon-180.png","app/icon-192.png","app/icon-512.png","catalog.json"];

self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(shell.map(path => new Request(new URL(path,base).href,{cache:"no-cache"})));
  const page = await cache.match(new URL("index.html",base).href);
  const html = await page.text();
  const versioned = [...html.matchAll(/(?:src|href)="(app\/site\.(?:js|css)\?v=[a-f0-9]+)"/g)].map(match => match[1]);
  await Promise.allSettled(versioned.map(path => cache.add(new Request(new URL(path,base).href,{cache:"no-cache"}))));
  const response = await cache.match(new URL("catalog.json",base).href);
  const catalog = await response.json();
  const thumbnails = (catalog.assets || []).map(file => file.thumbnail).filter(path => path && path.startsWith("app/previews/")).slice(0,24);
  await Promise.allSettled(thumbnails.map(path => cache.add(new URL(path,base).href)));
})()));

self.addEventListener("activate", event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
  await self.clients.claim();
})()));

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request,{cache:"no-cache"});
    if (response.ok) await cache.put(request,response.clone()).catch(() => {});
    return response;
  } catch (error) {
    const cached = await cache.match(request) || await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") {
      const page = await cache.match(base.href);
      if (page) return page;
    }
    throw error;
  }
}

async function thumbnailResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request,response.clone()).catch(() => {});
    const keys = (await cache.keys()).filter(key => new URL(key.url).pathname.startsWith(base.pathname + "app/previews/"));
    await Promise.all(keys.slice(0,Math.max(0,keys.length - 32)).map(key => cache.delete(key)));
  }
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  const path = url.pathname.slice(base.pathname.length);
  // Full-size user assets keep the browser's normal download and caching behavior.
  if (path.startsWith("app/previews/")) event.respondWith(thumbnailResponse(request));
  else if (path === "" || path === "index.html" || path === "catalog.json" || path.startsWith("app/")) event.respondWith(networkFirst(request));
});
