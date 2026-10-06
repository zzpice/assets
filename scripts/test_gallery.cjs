"use strict";

const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname,"../app/site.js"),"utf8").replace(/\nload\(\);\s*$/, "\n");
const base = "https://example.test/assets/";

function gallery(fetchResponse = async()=>new Response('{"version":1,"assets":[]}')) {
  const nodes = new Map();
  const node = (tagName="") => ({tagName,value:"",children:[],dataset:{},style:{setProperty(){}},classList:{toggle(){},remove(){}},addEventListener(){},setAttribute(){},removeAttribute(){},closest(){return this.field ||= {};},add(child){this.children.push(child);},replaceChildren(...children){this.children=children;if(this.tagName==="select")this.value=children[0]?.value || "";},append(...children){this.children.push(...children);},showModal(){this.open=true;},close(){this.open=false;},focus(){}});
  const document = {baseURI:base,body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},querySelectorAll:()=>[],querySelector:()=>node(),createElement:node,createElementNS:node};
  for(const id of ["device","category","bank","edition","resolution","orientation","sort"]) document.getElementById(id).tagName="select";
  const location={href:base,hash:""};
  const setLocation=url=>{location.href=new URL(url,base).href;location.hash=new URL(location.href).hash;};
  const history={state:null,entries:[{url:base,state:null}],index:0,
    pushState(state,unused,url){this.state=state;setLocation(url);this.entries.splice(++this.index);this.entries.push({url:location.href,state});},
    replaceState(state,unused,url){this.state=state;setLocation(url);this.entries[this.index]={url:location.href,state};},
    back(){if(this.index){const entry=this.entries[--this.index];this.state=entry.state;setLocation(entry.url);}}
  };
  const context = vm.createContext({URL,URLSearchParams,Response,AbortController,setTimeout,clearTimeout,document,fetch:fetchResponse,
    Option:function(label,value){return {textContent:label,value};},
    localStorage:{getItem:()=>null},navigator:{onLine:true},location,history,
    window:{matchMedia:()=>({matches:false}),addEventListener(){}}
  });
  vm.runInContext(source,context);
  return {context,nodes,read:expression=>vm.runInContext(expression,context)};
}

test("bad display metadata falls back to safe strings and path-derived classifications",()=>{
  const {context}=gallery();
  const asset=context.makeAsset({path:"wallpapers/anime/1440x3120/girl-rain.png",title:{bad:true},note:42,kind:"icon",category:"finance",width:{bad:true},height:null});
  assert.equal(asset.title,"girl rain");
  assert.equal(asset.note,"");
  assert.equal(asset.kind,"wallpaper");
  assert.equal(asset.category,"anime");
  assert.equal(asset.width,1440);
  assert.equal(asset.height,3120);
  assert.equal(asset.device,"phone");
});

test("icon previews carry a content version while canonical download URLs remain stable",()=>{
  const {context}=gallery();
  const sha="a".repeat(40);
  const asset=context.makeAsset({path:"icons/finance/icbc.png",sha,title:"工商银行",width:512,height:512});
  assert.equal(context.assetPreviewUrl(asset),base+asset.path+"?v="+sha);
  assert.equal(context.imageUrl(asset.path),base+asset.path);
});

test("mixed-language titles and filenames are searchable without extra metadata",()=>{
  const {context,read,nodes}=gallery();
  context.testFiles=[
    context.makeAsset({path:"icons/finance/dbs.png",title:"DBS"}),
    context.makeAsset({path:"icons/finance/icbc.png",title:"中国工商银行"})
  ];
  read('assets=testFiles; kind="icon"; makeCategorySections=()=>[]');
  for(const [query,path] of [["dBs","dbs"],["工商","icbc"],["ICBC","icbc"]]) {
    nodes.get("search").value=query;
    context.renderGallery();
    assert.equal(read("visibleAssets.length"),1);
    assert.equal(read("visibleAssets[0].path"),"icons/finance/"+path+".png");
  }
  assert.equal(context.testFiles[0].title,"DBS");
});

test("preview groups separate wallpaper devices and card banks, regions and editions",()=>{
  const {context}=gallery();
  const phone={kind:"wallpaper",category:"anime",device:"phone"};
  assert.equal(context.samePreviewGroup(phone,{...phone,device:"desktop"}),false);
  const card={kind:"bank-card",category:"hong-kong",bank:"dbs",edition:"originals"};
  for(const change of [{category:"singapore"},{bank:"hsbc"},{edition:"custom"}]) assert.equal(context.samePreviewGroup(card,{...card,...change}),false);
  assert.equal(context.samePreviewGroup(card,{...card}),true);
});

test("category order remains stable while name and resolution sorting operate within each group",()=>{
  const {context,read,nodes}=gallery();
  read('kind="icon"');
  assert.deepEqual(Array.from(context.orderedCategories([{category:"finance"},{category:"ai"},{category:"new-category"}])),["ai","finance","new-category"]);
  nodes.get("sort").value="name";
  const files=[{title:"Z",path:"z.png",width:200,height:100},{title:"A",path:"a.png",width:100,height:100}];
  assert.equal(files.slice().sort(context.compareAssets)[0].title,"A");
  nodes.get("sort").value="resolution-desc";
  assert.equal(files.slice().sort(context.compareAssets)[0].title,"Z");
});

test("switching an open preview to another category rebuilds its navigation sequence",()=>{
  const {context,read,nodes}=gallery();
  const files=[{path:"icons/ai/claude.png",title:"Claude",kind:"icon",category:"ai",width:512,height:512},{path:"icons/finance/icbc.png",title:"工商银行",kind:"icon",category:"finance",width:512,height:512},{path:"icons/finance/ccb.png",title:"建设银行",kind:"icon",category:"finance",width:512,height:512}];
  context.testFiles=files;
  read('assets=testFiles; visibleAssets=testFiles; kind="icon"');
  context.openPreview(files[0],"none",files);
  assert.equal(nodes.get("preview-position").textContent,"1 / 1");
  context.openPreview(files[1],"none",files);
  assert.equal(nodes.get("preview-position").textContent,"1 / 2");
  assert.deepEqual(Array.from(read("previewSequence")),files.slice(1).map(file=>file.path));
});

test("loading uses only the deployed catalog and never consults the live GitHub tree",async()=>{
  const requested=[];
  const state=gallery(async url=>{requested.push(String(url));return new Response(JSON.stringify({version:1,assets:[{path:"icons/ai/claude.png",title:{bad:true}}]}));});
  state.read("refreshControls=()=>{}; renderGallery=()=>{}; syncPreviewRoute=()=>{}");
  await state.context.load();
  assert.deepEqual(requested,[base+"catalog.json"]);
  assert.equal(state.read("assets.length"),1);
  assert.equal(state.read("assets[0].title"),"claude");
  assert.equal(state.read("directoryUnavailable"),false);
});

test("a failed refresh preserves the already loaded catalog",async()=>{
  const state=gallery(async()=>{throw new Error("offline");});
  state.read('assets=[{path:"icons/ai/claude.png",title:"Claude",kind:"icon"}]');
  await state.context.load();
  assert.equal(state.read("assets.length"),1);
  assert.equal(state.read("directoryUnavailable"),true);
});

test("a slower prior refresh cannot replace a newer catalog",async()=>{
  let firstResolve;
  let calls=0;
  const state=gallery(async()=>{
    calls++;
    if(calls===1)return new Promise(resolve=>{firstResolve=resolve;});
    return new Response('{"version":1,"assets":[{"path":"icons/ai/new.png"}]}');
  });
  state.read("refreshControls=()=>{}; renderGallery=()=>{}; syncPreviewRoute=()=>{}");
  const first=state.context.load();
  await state.context.load();
  firstResolve(new Response('{"version":1,"assets":[{"path":"icons/ai/old.png"}]}'));
  await first;
  assert.equal(state.read("assets[0].path"),"icons/ai/new.png");
});

function coverGallery() {
  const state=gallery();
  state.read(`gameSeries=[{id:"zero-escape",title:"极限脱出"},{id:"ace-attorney",title:"逆转裁判"}]; games=[
    {series:"zero-escape",id:"999",title:"999：9小时9人9扇门",firstReleaseYear:2009},
    {series:"zero-escape",id:"vlr",title:"极限脱出：善人死亡",firstReleaseYear:2012},
    {series:"zero-escape",id:"ztd",title:"极限脱出：刻之困境",firstReleaseYear:2016},
    {series:"ace-attorney",id:"first",title:"逆转裁判",firstReleaseYear:2001}
  ]; kind="game-cover"`);
  state.context.testFiles=[
    state.context.makeAsset({path:"game-covers/zero-escape/ztd.jpg",width:803,height:1024}),
    state.context.makeAsset({path:"game-covers/zero-escape/extras/999/ps4-jp.jpg",cover:{platform:"PlayStation 4",region:"Japan",version:"特别收藏"}}),
    state.context.makeAsset({path:"game-covers/zero-escape/vlr.jpg",width:1920,height:2496}),
    state.context.makeAsset({path:"game-covers/zero-escape/999.jpg",width:1400,height:1252,cover:{platform:"Nintendo DS",region:"North America"}}),
    state.context.makeAsset({path:"game-covers/ace-attorney/first.png"})
  ];
  state.read('assets=testFiles');
  state.context.refreshControls();
  return state;
}

const descend=node=>[node,...node.children.flatMap(descend)];

test("gallery overview shows one selected image per work, in year order, with series links",()=>{
  const {context,read,nodes}=coverGallery();
  context.renderGallery();
  assert.equal(read("visibleAssets.length"),4);
  assert.equal(read("visibleAssets.some(file=>file.extra)"),false);
  const sections=nodes.get("gallery").children;
  assert.equal(sections.length,2);
  const zero=descend(sections[0]);
  assert.equal(zero.find(node=>node.className==="series-link").href,base+"#series=zero-escape");
  assert.equal(zero.find(node=>node.className==="grid series-strip").children.length,3);
  assert.deepEqual(zero.filter(node=>node.tagName==="h3").map(node=>node.textContent),["999：9小时9人9扇门","极限脱出：善人死亡","极限脱出：刻之困境"]);
  assert.equal(zero.filter(node=>node.className==="extra-covers").length,0);
  assert.equal(nodes.get("filters-panel").hidden,true);
  assert.equal(nodes.get("results").textContent,"4 款作品 · 2 个系列");
});

test("series scope includes rare extras under the work, collapsed until needed by search",()=>{
  const {context,read,nodes}=coverGallery();
  context.history.pushState(null,"",base+"#series=zero-escape");
  context.syncRoute();
  assert.equal(read("activeSeries"),"zero-escape");
  assert.equal(read("visibleAssets.length"),4);
  assert.equal(read('visibleAssets.some(file=>file.category==="ace-attorney")'),false);
  assert.equal(nodes.get("cover-navigation").hidden,false);
  assert.equal(nodes.get("cover-series-title").textContent,"极限脱出");
  let extra=descend(nodes.get("gallery")).find(node=>node.className==="extra-covers");
  assert.equal(extra.open,false);
  assert.equal(nodes.get("results").textContent,"3 款作品 · 4 张封面");
  nodes.get("search").value="特别收藏";
  context.renderGallery();
  assert.equal(read("visibleAssets.length"),1);
  extra=descend(nodes.get("gallery")).find(node=>node.className==="extra-covers");
  assert.equal(extra.open,true);
  assert.equal(extra.children[1].tagName,"article");
});

test("game-cover cards show identity and one source, without processing or duplicated release history",()=>{
  const {context}=coverGallery();
  const file=context.makeAsset({path:"game-covers/zero-escape/999.jpg",title:"善人死亡",game:"vlr",edition:"alternate",cover:{platform:"Nintendo DS",region:"North America"},source:"https://example.com/999.jpg",note:"旧处理细节",width:1400,height:1252});
  assert.equal(file.title,"999：9小时9人9扇门");
  assert.equal(file.game,"999");
  assert.equal(file.extra,false);
  assert.equal(file.edition,"");
  const contents=descend(context.makeCard(file,[file]));
  const links=contents.filter(node=>node.className==="source-link");
  assert.equal(links.length,1);
  assert.equal(links[0].href,file.source);
  assert.equal(contents.filter(node=>node.textContent==="首发 2009").length,1);
  assert.ok(contents.some(node=>node.textContent==="Nintendo DS · 北美"));
  assert.equal(contents.some(node=>node.className==="note"),false);
  const preview=contents.find(node=>node.tagName==="button" && node.className.startsWith("preview "));
  assert.equal(preview.style.aspectRatio,undefined);
  assert.ok(contents.some(node=>node.className==="cover-backdrop"));
  assert.equal(contents.find(node=>node.textContent==="下载原始封面").href,base+file.path);
  const optional=context.makeAsset({path:"game-covers/zero-escape/vlr.jpg",source:"https://example.com/vlr.jpg"});
  assert.equal(descend(context.makeCard(optional)).some(node=>node.textContent?.includes("undefined")),false);
  const unsafe=context.makeAsset({...file,source:"javascript:alert(1)"});
  assert.equal(descend(context.makeCard(unsafe)).filter(node=>node.className==="source-link").length,0);
});

test("series links support refresh, Back, overview and unknown-series fallback",()=>{
  const {context,read,nodes}=coverGallery();
  context.history.replaceState(null,"",base+"#covers");
  context.syncRoute();
  context.history.pushState(null,"",context.coverViewUrl("zero-escape"));
  context.syncRoute();
  assert.equal(read("activeSeries"),"zero-escape");
  context.history.back(); context.syncRoute();
  assert.equal(read("activeSeries"),"");
  assert.equal(read("visibleAssets.length"),4);
  assert.equal(nodes.get("cover-navigation").hidden,true);
  // A fresh document must restore series scope without first clicking the tab.
  read('kind="wallpaper"; activeSeries=""');
  context.history.replaceState(null,"",base+"#series=zero-escape"); context.syncRoute();
  assert.equal(read("kind"),"game-cover");
  assert.equal(read("activeSeries"),"zero-escape");
  context.history.replaceState(null,"",base+"#series=unknown"); context.syncRoute();
  assert.equal(read("activeSeries"),"");
  assert.equal(read("visibleAssets.some(file=>file.extra)"),false);
  context.history.replaceState({galleryKind:"icon"},"",base); context.syncRoute();
  assert.equal(read("kind"),"icon");
  assert.equal(nodes.get("filters-panel").hidden,false);
});

test("shared cover previews preserve their gallery context and navigate across works in the same series",()=>{
  const {context,read,nodes}=coverGallery();
  context.history.replaceState(null,"",base+"#covers"); context.renderGallery();
  const selected=context.testFiles.find(file=>file.game==="999" && !file.extra);
  const extra=context.testFiles.find(file=>file.extra);
  assert.equal(new URL(context.previewUrl(selected)).hash.startsWith("#covers="),true);
  assert.equal(new URL(context.previewUrl(extra)).hash.startsWith("#series=zero-escape"),true);
  context.history.replaceState(null,"",context.previewUrl(extra));
  context.syncRoute();
  assert.equal(read("activeSeries"),"zero-escape");
  assert.equal(read("activePreview.extra"),true);
  assert.equal(read("previewSequence.length"),4);
  assert.equal(read('previewSequence.some(path=>path.includes("ace-attorney"))'),false);
  assert.equal(context.withoutPreviewUrl().hash,"#series=zero-escape");
  context.closePreview(); context.syncRoute();
  assert.equal(nodes.get("preview-dialog").open,false);
  assert.equal(context.location.hash,"#series=zero-escape");
  context.openPreview(selected,"push");
  context.movePreview(2);
  assert.equal(read("activePreview.game"),"vlr");
  assert.equal(new URL(context.location.href).searchParams.size,0);
  assert.equal(new URLSearchParams(context.location.hash.slice(1)).get("series"),"zero-escape");
});
