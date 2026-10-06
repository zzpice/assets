"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname,"..");
const catalog = JSON.parse(fs.readFileSync(path.join(root,"catalog.json"),"utf8"));

function gallery() {
  const context = vm.createContext({window:{},document:{baseURI:"https://example.test/assets/"},URL,URLSearchParams});
  vm.runInContext(fs.readFileSync(path.join(root,"app/actresses.js"),"utf8"),context);
  const module = context.window.ActressGallery;
  module.configure(catalog.actresses,catalog.assets,()=>{});
  return module;
}

test("three complete official annual views reference one shared person database",()=>{
  const module = gallery();
  for(const year of [2023,2024,2025]) {
    module.route(new URLSearchParams({actresses:"annual",year}));
    const first = module.select();
    assert.equal(first.count,100); assert.equal(first.items.length,48);
    assert.deepEqual(Array.from(first.items,item=>item.rank),Array.from({length:48},(_,i)=>i+1));
    module.route(new URLSearchParams({actresses:"annual",year,page:3}));
    assert.equal(module.select().items[0].rank,97);
    assert.equal(module.select().items.length,4);
  }
  assert.equal(catalog.actresses.people.length,new Set(catalog.actresses.people.map(person=>person.id)).size);
  assert.equal(catalog.assets.filter(file=>file.kind==="actress").length,catalog.actresses.people.length);
});

test("renamed actress searches return the same identity and history from all views",()=>{
  const module = gallery();
  module.route(new URLSearchParams({actresses:"all"}));
  const old = module.select("河北彩花").items;
  const current = module.select("河北彩伽").items;
  assert.equal(old.length,1); assert.equal(current.length,1);
  assert.equal(old[0].person.id,current[0].person.id);
  const history = module.histories(old[0].person.id);
  assert.deepEqual(Array.from(history,item=>[item.year,item.rank]),[[2025,4],[2024,3],[2023,4]]);
  assert.equal(module.select("不存在的人物").count,0);
  module.route(new URLSearchParams({actresses:"annual",year:2024}));
  assert.equal(module.select("河北彩花").items[0].person.id,current[0].person.id);
  assert.equal(module.select("河北彩花").items[0].rank,3);
});

test("hall membership overlaps annual rankings and never invents a hall rank",()=>{
  const module = gallery();
  module.route(new URLSearchParams({actresses:"hall"}));
  const hall = module.select();
  assert.equal(hall.count,10);
  assert.ok(hall.items.every(item=>item.rank===undefined && item.person.hallOfFame));
  assert.ok(hall.items.some(item=>module.histories(item.person.id).length>0));
  const yuma = hall.items.find(item=>item.person.name==="麻美ゆま");
  assert.equal(module.histories(yuma.person.id).length,0);
});

test("search, pagination and optional roman index survive shareable routes",()=>{
  const module = gallery();
  module.route(new URLSearchParams({actresses:"all",q:"  sHiNoDa yUu ",page:99}));
  assert.equal(module.select().count,1);
  assert.equal(module.select().items[0].person.name,"篠田ゆう");
  assert.equal(module.state.page,1);
  const target = new URL(module.viewUrl({query:"河北彩花",page:1},"p0054"));
  assert.equal(new URLSearchParams(target.hash.slice(1)).get("person"),"p0054");
  module.route(new URLSearchParams(target.hash.slice(1)));
  assert.equal(module.select().items[0].person.id,"p0054");
  module.route(new URLSearchParams({actresses:"all",letter:"S"}));
  assert.ok(module.select().items.every(item=>module.initial(item.person)==="S"));
  module.route(new URLSearchParams({actresses:"annual",year:2026}));
  assert.equal(module.state.year,2025); // no unfinished annual ranking
});

test("retired person links resolve directly to the retained profile",()=>{
  const module=gallery();
  module.configure({...catalog.actresses,redirects:{p9999:"p0054"}},catalog.assets,()=>{});
  const target = new URL(module.viewUrl({view:"all"},"p9999"));
  assert.equal(new URLSearchParams(target.hash.slice(1)).get("person"),"p0054");
});
