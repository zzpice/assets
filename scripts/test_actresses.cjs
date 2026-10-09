"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname,"..");
const catalog = require("./fixtures/catalog.cjs")();

function gallery() {
  const context = vm.createContext({window:{},document:{baseURI:"https://example.test/assets/"},URL,URLSearchParams});
  vm.runInContext(fs.readFileSync(path.join(root,"app/actresses.js"),"utf8"),context);
  const module = context.window.ActressGallery;
  module.configure(catalog.actresses,catalog.assets,()=>{});
  return module;
}

test("controlled annual views reference one shared person database",()=>{
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
  assert.equal(hall.count,catalog.actresses.people.filter(person=>person.hallOfFame).length);
  assert.ok(hall.items.every(item=>item.rank===undefined && item.person.hallOfFame));
  assert.ok(hall.items.some(item=>module.histories(item.person.id).length>0));
  const yuma = hall.items.find(item=>item.person.id==="p0004");
  assert.equal(module.histories(yuma.person.id).length,0);
});

test("search and pagination survive shareable routes; obsolete letter filters cannot hide people",()=>{
  const module = gallery();
  module.route(new URLSearchParams({actresses:"all",q:"  sHiNoDa yUu ",page:99}));
  assert.equal(module.select().count,1);
  assert.equal(module.select().items[0].person.name,"筱田优");
  assert.equal(module.state.page,1);
  const target = new URL(module.viewUrl({query:"河北彩花",page:1},"p0054"));
  assert.equal(new URLSearchParams(target.hash.slice(1)).get("person"),"p0054");
  module.route(new URLSearchParams(target.hash.slice(1)));
  assert.equal(module.select().items[0].person.id,"p0054");
  module.route(new URLSearchParams({actresses:"all",letter:"S"}));
  assert.equal(module.select().count,catalog.actresses.people.length);
  assert.ok(!new URLSearchParams(new URL(module.viewUrl()).hash.slice(1)).has("letter"));
  assert.equal(module.select("Mizuki Yayoi").items[0].person.id,"p0066");
  module.route(new URLSearchParams({actresses:"annual",year:2026}));
  assert.equal(module.state.year,2025); // no unfinished annual ranking
});

test("retired person links resolve directly to the retained profile",()=>{
  const module=gallery();
  module.configure({...catalog.actresses,redirects:{p9999:"p0054"}},catalog.assets,()=>{});
  const target = new URL(module.viewUrl({view:"all"},"p9999"));
  assert.equal(new URLSearchParams(target.hash.slice(1)).get("person"),"p0054");
});

test("Latin name searches accept either word order and existing compact spellings",()=>{
  const module=gallery(); module.route(new URLSearchParams({actresses:"all"}));
  for (const query of ["Mikami Yua","Yua Mikami","Ｍｉｋａｍｉ　Ｙｕａ","MikamiYua","三上 Yua"]) {
    const selected=module.select(query);
    assert.equal(selected.count,1,query);
    assert.equal(selected.items[0].person.id,"p0032");
  }
});

test("common Chinese and original Japanese names share a canonical identity",()=>{
  const module=gallery(); module.route(new URLSearchParams({actresses:"all"}));
  for (const [cn, jp, pid] of [["河北彩花","河北彩伽","p0054"],["樱空桃","桜空もも","p0041"],["枫花恋","楓カレン","p0058"],["美谷朱里","美谷朱音","p0043"],["葵伊吹","葵いぶき","p0083"],["未步奈奈","未歩なな","p0122"],["翼舞","つばさ舞","p0107"]]) {
    assert.equal(module.select(cn).items[0].person.id,pid);
    assert.equal(module.select(jp).items[0].person.id,pid);
    assert.equal(module.select(cn).items[0].person.name,cn);
  }
});

test("enduring profile display preserves missing birth precision and AV debut definition",()=>{
  const module=gallery();
  const byId=new Map(catalog.actresses.people.map(p=>[p.id,p]));
  assert.ok(module.profileRows(byId.get("p0054")).some(([label,value])=>label==="身高" && value==="169 cm"));
  assert.ok(module.profileRows(byId.get("p0100")).some(([label,value])=>label==="出生年份" && value==="2000 年"));
  assert.ok(!module.profileRows(byId.get("p0124")).some(([label])=>label.startsWith("出生")));
  assert.equal(module.profileRows({}).length,0);
  assert.ok(module.profileRows(byId.get("p0067")).some(([label,value])=>label==="AV 出道年份" && value==="2019 年"));
  assert.ok(!module.profileRows(byId.get("p0067")).some(([label])=>label.startsWith("出生")));
  for (const person of byId.values()) {
    assert.ok(!module.profileRows(person).some(([label])=>/事务所|三围|罩杯|状态/.test(label)));
  }
  assert.ok(!Object.hasOwn(catalog.actresses,"agencies"));
});

test("field evidence overrides only its own fact and retains legacy fallback",()=>{
  const module=gallery();
  const original={sourceName:"same person",source:{url:"https://example.test/birth"},reviewed:"2026-01-01"};
  const height={...original,source:{url:"https://example.test/height"}};
  const person={profile:{...original,birthYear:2000,heightCm:165,fieldSources:{heightCm:[height]}}};
  const evidence=module.profileEvidence(person);
  assert.deepEqual(Array.from(evidence,entry=>[entry.field,entry.sources[0].source.url]),[["birthYear","https://example.test/birth"],["heightCm","https://example.test/height"]]);
  assert.equal(evidence[0].label,"出生年份");
  assert.equal(module.profileEvidence({}).length,0);
  const shoda=catalog.actresses.people.find(person=>person.id==="p0005");
  assert.equal(module.profileEvidence(shoda).find(entry=>entry.field==="birthYear").sources.length,2);
});

test("supplemental Chinese names and sourced Latin spellings retain the same identities",()=>{
  const module=gallery(); module.route(new URLSearchParams({actresses:"all"}));
  for(const [cn,jp,latin,pid] of [["春菜花","春菜はな","Haruna Hana","p0015"],["美咲佳奈","美咲かんな","Misaki Kanna","p0031"],["水川堇","水川スミレ","Mizukawa Sumire","p0055"]]) {
    for(const query of [cn,jp,latin]) assert.equal(module.select(query).items[0].person.id,pid);
    assert.equal(module.select(cn).items[0].person.name,cn);
  }
  assert.equal(module.select("Kuroki Kaoru").items[0].person.id,"p0176");
});
