"use strict";

const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname,"../app/site.js"),"utf8").replace(/\nload\(\);\s*$/, "\n");
const base = "https://example.test/assets/";

function gallery(fetchResponse = async()=>new Response('{"version":1,"assets":[]}'), withTabs = false, storage = new Map()) {
  const nodes = new Map();
  const node = (tagName="") => ({tagName,value:"",children:[],dataset:{},listeners:{},style:{setProperty(){}},classList:{toggle(){},remove(){},add(){}},addEventListener(name,handler){(this.listeners[name] ||= []).push(handler);},setAttribute(){},removeAttribute(){},querySelector(){return this.label ||= node();},closest(){return this.field ||= {};},add(child){this.children.push(child);},replaceChildren(...children){this.children=children;if(this.tagName==="select")this.value=children[0]?.value || "";},append(...children){this.children.push(...children);},showModal(){this.open=true;},close(){this.open=false;},focus(){}});
  const tabs = withTabs ? ["wallpaper","avatar","icon","bank-card","game-cover","actress"].map(kind=>{const tab=node("button");tab.dataset.kind=kind;nodes.set("tab-"+kind,tab);return tab;}) : [];
  const document = {baseURI:base,body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},querySelectorAll:selector=>selector===".tab" ? tabs : [],querySelector:()=>node(),createElement:node,createElementNS:node};
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
    localStorage:{getItem:key=>storage.get(key) ?? null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},navigator:{onLine:true},location,history,
    window:{matchMedia:()=>({matches:false}),addEventListener(){}}
  });
  if (withTabs) vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"../app/actresses.js"),"utf8"),context);
  vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"../app/catalog.js"),"utf8"),context);
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

test("leaving the person gallery adds one history entry and Back restores its view",()=>{
  const catalog=JSON.parse(fs.readFileSync(require("node:path").join(__dirname,"../catalog.json"),"utf8"));
  for (const nextKind of ["wallpaper","avatar","icon","bank-card","game-cover"]) {
    const {context,read,nodes}=gallery(undefined,true);
    context.testCatalog=catalog;
    read('actressData=testCatalog.actresses; actressGallery.configure(actressData,testCatalog.assets,navigatePersonView); gameSeries=testCatalog.gameSeries; games=testCatalog.games; assets=testCatalog.assets.map(makeAsset)');
    context.history.replaceState({galleryKind:"actress"},"",base+"#actresses=all&page=2");
    context.syncRoute();
    assert.equal(nodes.get("tab-actress").hidden,false);
    nodes.get("tab-"+nextKind).listeners.click[0]();
    assert.equal(context.history.entries.length,2,nextKind);
    assert.equal(read("kind"),nextKind);
    assert.equal(nodes.get("tab-actress").hidden,true,nextKind);
    assert.equal(nodes.get("actress-navigation").hidden,true,nextKind);
    assert.ok(!nodes.get("summary").textContent.includes("女优"));
    context.history.back(); context.syncRoute();
    assert.equal(read("kind"),"actress");
    assert.equal(nodes.get("tab-actress").hidden,false);
    assert.equal(read("actressGallery.state.view"),"all");
    assert.equal(read("actressGallery.state.page"),2);
  }
});

test("ordinary routes never fall back to the unlisted collection or reveal its tab",()=>{
  const {context,read,nodes}=gallery(undefined,true);
  context.testFiles=[
    context.makeAsset({path:"actresses/portraits/p0001.jpg",person:"p0001"}),
    context.makeAsset({path:"icons/ai/claude.png"})
  ];
  // Clearing the hash must not reopen the collection through stale history state.
  context.history.replaceState({galleryKind:"actress"},"",base);
  context.applyFiles(context.testFiles);
  assert.equal(read("kind"),"icon");
  assert.equal(nodes.get("tab-actress").hidden,true);
  assert.equal(nodes.get("actress-navigation").hidden,true);
  assert.ok(!nodes.get("summary").textContent.includes("女优"));
  assert.ok(Array.from(read("viewFiles()")).every(file=>file.kind!=="actress"));
  // A future catalog with only personal content still has no implicit entry.
  context.applyFiles(context.testFiles.slice(0,1));
  assert.equal(read("kind"),"wallpaper");
  assert.equal(read("viewFiles().length"),0);
  assert.equal(nodes.get("tab-actress").hidden,true);
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

test("preview follows the supplied visible sequence across categories",()=>{
  const {context,read,nodes}=gallery();
  const files=[{path:"icons/ai/claude.png",title:"Claude",kind:"icon",category:"ai",width:512,height:512},{path:"icons/finance/icbc.png",title:"工商银行",kind:"icon",category:"finance",width:512,height:512},{path:"icons/finance/ccb.png",title:"建设银行",kind:"icon",category:"finance",width:512,height:512}];
  context.testFiles=files;
  read('assets=testFiles; visibleAssets=testFiles; kind="icon"');
  context.openPreview(files[0],"none",files);
  assert.equal(nodes.get("preview-position").textContent,"1 / 3");
  context.openPreview(files[1],"none",files);
  assert.equal(nodes.get("preview-position").textContent,"2 / 3");
  assert.deepEqual(Array.from(read("previewSequence")),files.map(file=>file.path));
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

test("game-cover cards keep identity while source and edition details live in the viewer",()=>{
  const {context,nodes}=coverGallery();
  const file=context.makeAsset({path:"game-covers/zero-escape/999.jpg",title:"善人死亡",game:"vlr",edition:"alternate",cover:{platform:"Nintendo DS",region:"North America"},source:"https://example.com/999.jpg",note:"旧处理细节",width:1400,height:1252});
  assert.equal(file.title,"999：9小时9人9扇门");
  assert.equal(file.game,"999");
  assert.equal(file.extra,false);
  assert.equal(file.edition,"");
  const contents=descend(context.makeCard(file,[file]));
  assert.equal(contents.filter(node=>node.className==="source-link").length,0);
  context.openPreview(file,"none",[file]);
  const info=descend(nodes.get("preview-details"));
  const links=info.filter(node=>node.className==="source-link");
  assert.equal(links.length,1);
  assert.equal(links[0].href,file.source);
  assert.equal(contents.filter(node=>node.textContent==="首发 2009").length,1);
  assert.ok(info.some(node=>node.textContent==="Nintendo DS · 北美"));
  assert.equal(contents.some(node=>node.className==="note"),false);
  const preview=contents.find(node=>node.tagName==="button" && node.className.startsWith("preview "));
  assert.equal(preview.style.aspectRatio,undefined);
  assert.ok(contents.some(node=>node.className==="cover-backdrop"));
  assert.equal(nodes.get("preview-download").href,base+file.path);
  const optional=context.makeAsset({path:"game-covers/zero-escape/vlr.jpg",source:"https://example.com/vlr.jpg"});
  assert.equal(descend(context.makeCard(optional)).some(node=>node.textContent?.includes("undefined")),false);
  const unsafe=context.makeAsset({...file,source:"javascript:alert(1)"});
  context.openPreview(unsafe,"none",[unsafe]);
  assert.equal(descend(nodes.get("preview-details")).filter(node=>node.className==="source-link").length,0);
});

test("cover synopses are collapsed, cited, shared across editions and rendered as text",()=>{
  const {context,read}=coverGallery();
  read('games[0].synopsis={text:"九人被困 <script>不会执行</script>",source:"https://example.com/story"}');
  for (const file of context.testFiles.filter(file=>file.game==="999")) {
    const contents=descend(context.makeCard(file));
    const story=contents.find(node=>node.className==="asset-info game-synopsis");
    assert.ok(story); assert.ok(!story.open);
    assert.equal(descend(story).find(node=>node.className==="synopsis").textContent,"九人被困 <script>不会执行</script>");
    const link=descend(story).find(node=>node.className==="source-link");
    assert.equal(link.href,"https://example.com/story");
    assert.equal(link.rel,"noopener noreferrer");
  }
  read('games[0].synopsis.source="javascript:alert(1)"');
  assert.equal(descend(context.makeCard(context.testFiles.find(file=>file.game==="999"))).some(node=>node.className==="synopsis"),false);
  assert.equal(descend(context.makeCard(context.testFiles.find(file=>file.game==="vlr"))).some(node=>node.className==="synopsis"),false);
});

test("cover backgrounds wait for lazy images and follow the successfully loaded fallback",()=>{
  const {context}=coverGallery();
  const file=context.makeAsset({path:"game-covers/zero-escape/999.jpg",thumbnail:"app/previews/999-abc.webp",width:1400,height:1252});
  const contents=descend(context.makeCard(file));
  const image=contents.find(node=>node.tagName==="img");
  const backdrop=contents.find(node=>node.className==="cover-backdrop");
  assert.equal(image.loading,"lazy");
  assert.equal(backdrop.style.backgroundImage,undefined);
  image.listeners.load[0]();
  assert.equal(backdrop.style.backgroundImage,'url("'+base+file.thumbnail+'")');
  image.listeners.error[0]();
  image.naturalWidth=file.width; image.naturalHeight=file.height;
  image.listeners.load[0]();
  assert.equal(backdrop.style.backgroundImage,'url("'+base+file.path+'")');
});

test("licensed person photos display author, license and the full source download",()=>{
  const {context,read,nodes}=gallery(undefined,true);
  context.testCatalog=JSON.parse(fs.readFileSync(require("node:path").join(__dirname,"../catalog.json"),"utf8"));
  read('actressGallery.configure(testCatalog.actresses,testCatalog.assets,()=>{}); actressGallery.syncPerson("p0029")');
  const contents=descend(nodes.get("person-content"));
  assert.ok(contents.some(node=>node.textContent?.includes("署名：三立娛樂星聞")));
  const license=contents.find(node=>node.textContent==="图片许可：CC BY 3.0 ↗");
  assert.equal(license.href,"https://creativecommons.org/licenses/by/3.0/");
  assert.equal(contents.find(node=>node.textContent==="下载头像").href,base+"actresses/portraits/p0029.png");
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
  assert.equal(nodes.get("filters-panel").hidden,true); // No icons in this fixture, so no useful filters.
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

test("cover navigation starts at the top while Back and modified links retain browser behavior",()=>{
  const {context,read}=coverGallery();
  const scrolls=[];
  context.window.scrollTo=(x,y)=>scrolls.push([x,y,read("activeSeries")]);
  context.history.replaceState(null,"",base+"#covers"); context.syncRoute();
  let prevented=false;
  const click={button:0,preventDefault(){prevented=true;}};
  context.navigateCoverView(click,"zero-escape");
  assert.equal(prevented,true);
  assert.equal(context.location.hash,"#series=zero-escape");
  assert.equal(read("visibleAssets.length"),4);
  assert.deepEqual(scrolls,[[0,0,"zero-escape"]]);
  context.history.back(); context.syncRoute();
  assert.equal(read("activeSeries"),"");
  assert.equal(scrolls.length,1); // Back must not force a new scroll position.
  const entries=context.history.entries.length;
  for(const modifier of [{button:1},{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true}]) {
    prevented=false;
    context.navigateCoverView({...click,...modifier},"ace-attorney");
    assert.equal(prevented,false);
    assert.equal(context.history.entries.length,entries);
    assert.equal(context.location.hash,"#covers");
    assert.equal(scrolls.length,1);
  }
  context.navigateCoverView(click,"ace-attorney");
  assert.equal(read("visibleAssets.length"),1);
  context.navigateCoverView(click);
  assert.equal(context.location.hash,"#covers");
  assert.equal(read("visibleAssets.length"),4);
  assert.deepEqual(scrolls.at(-1),[0,0,""]);
});

function populatedGallery(storage) {
  const state=gallery(undefined,true,storage);
  state.context.testCatalog=JSON.parse(fs.readFileSync(require("node:path").join(__dirname,"../catalog.json"),"utf8"));
  state.read('cardBanks=testCatalog.cardBanks; gameSeries=testCatalog.gameSeries; games=testCatalog.games; actressData=testCatalog.actresses; actressGallery.configure(actressData,testCatalog.assets,navigatePersonView); assets=testCatalog.assets.map(makeAsset)');
  state.context.refreshControls();
  return state;
}

test("the owner can retain the navigation shortcut across visits and remove it without losing direct access",()=>{
  const storage=new Map();
  const first=populatedGallery(storage);
  first.read("showToast=()=>{}");
  first.context.history.replaceState(null,"",base+"#actresses=hall"); first.context.syncRoute();
  assert.equal(first.nodes.get("actress-entry-preference").hidden,false);
  first.nodes.get("actress-keep-entry").listeners.change[0]({target:{checked:true}});
  first.nodes.get("tab-icon").listeners.click[0]();
  assert.equal(first.nodes.get("tab-actress").hidden,false);
  assert.equal(first.nodes.get("actress-entry-preference").hidden,true);

  const next=populatedGallery(storage);
  next.read("showToast=()=>{}"); next.context.window.scrollTo=()=>{};
  next.context.syncRoute();
  assert.equal(next.read("kind"),"wallpaper"); // A shortcut does not auto-open content.
  assert.equal(next.nodes.get("tab-actress").hidden,false);
  next.nodes.get("tab-actress").listeners.click[0]();
  assert.equal(next.read("kind"),"actress");
  assert.equal(next.nodes.get("actress-keep-entry").checked,true);
  next.nodes.get("actress-keep-entry").listeners.change[0]({target:{checked:false}});
  assert.equal(next.nodes.get("tab-actress").hidden,false); // Remains usable until leaving.
  next.nodes.get("tab-icon").listeners.click[0]();
  assert.equal(next.nodes.get("tab-actress").hidden,true);
  assert.equal(populatedGallery(storage).nodes.get("tab-actress").hidden,true);
  next.context.history.replaceState(null,"",base+"#actresses=all&person=p0032"); next.context.syncRoute();
  assert.equal(next.nodes.get("person-dialog").open,true);
  assert.equal(next.nodes.get("tab-actress").hidden,false);
  assert.equal(populatedGallery().nodes.get("tab-actress").hidden,true); // Separate browser.
});

test("blocked local storage keeps the shortcut usable for the current page",()=>{
  const blocked={get(){throw new Error("blocked");},set(){throw new Error("blocked");},delete(){throw new Error("blocked");}};
  const {context,nodes,read}=populatedGallery(blocked);
  read("showToast=message=>{globalThis.storageMessage=message;}");
  nodes.get("actress-keep-entry").listeners.change[0]({target:{checked:true}});
  assert.equal(nodes.get("tab-actress").hidden,false);
  assert.equal(context.storageMessage,"入口设置仅当前页面有效");
});

test("wallpaper device overrides remain independent of aspect ratio and content category",()=>{
  const {context,read}=populatedGallery();
  const file=context.makeAsset({path:"wallpapers/anime/7500x5000/shinchan.jpg",device:"desktop"});
  assert.equal(file.device,"desktop");
  assert.equal(file.category,"anime");
  assert.equal(read("inferDevice(1080,1920)"),"unknown");
  assert.equal(context.makeAsset({path:"avatars/anime/1254x1254/girl.png"}).device,"");
});

test("changing wallpaper device clears incompatible direction and size without an empty result",()=>{
  const {context,nodes,read}=populatedGallery();
  nodes.get("orientation").value="landscape";
  context.refreshControls();
  nodes.get("resolution").value="7500x5000";
  nodes.get("device").value="phone";
  nodes.get("device").listeners.change[0]();
  assert.equal(nodes.get("orientation").value,"");
  assert.equal(nodes.get("resolution").value,"");
  assert.equal(read("visibleAssets.length"),2);
  assert.deepEqual(nodes.get("orientation").children.map(option=>option.value),["","portrait"]);
  assert.equal(nodes.get("orientation").closest().hidden,true);
  assert.equal(nodes.get("resolution").closest().hidden,true);
  assert.equal(nodes.get("filters-panel").hidden,true);
  assert.equal(nodes.get("device").closest().hidden,false);
});

test("single-value filters and ineffective sorting disappear while meaningful categories remain",()=>{
  const {context,nodes,read}=populatedGallery();
  for (const resource of ["avatar","icon","bank-card"]) {
    read('kind="'+resource+'"'); context.clearFilters();
    assert.equal(nodes.get("device").closest().hidden,true);
    if (resource==="avatar") assert.equal(nodes.get("filters-panel").hidden,true);
    if (resource==="icon") {
      assert.equal(nodes.get("category").closest().hidden,false);
      assert.equal(nodes.get("resolution").closest().hidden,true);
      assert.equal(nodes.get("sort").closest().hidden,true);
    }
    if (resource==="bank-card") assert.equal(nodes.get("edition").closest().hidden,true);
  }
});

test("changing card region removes the previous bank and its incompatible size",()=>{
  const {context,nodes,read}=populatedGallery();
  read('kind="bank-card"'); context.clearFilters();
  nodes.get("category").value="hong-kong";
  nodes.get("bank").value="hong-kong/hsbc";
  context.refreshControls();
  nodes.get("category").value="singapore";
  nodes.get("category").listeners.change[0]();
  assert.equal(nodes.get("bank").value,"");
  assert.equal(read("visibleAssets.length"),2);
  assert.ok(nodes.get("bank").children.slice(1).every(option=>option.value.startsWith("singapore/")));
});

test("sorting disappears when current card filters leave no within-bank size differences",()=>{
  const {context,nodes,read}=populatedGallery();
  read('kind="bank-card"'); context.clearFilters();
  assert.equal(nodes.get("sort").closest().hidden,false);
  nodes.get("sort").value="resolution-desc";
  nodes.get("category").value="singapore";
  nodes.get("category").listeners.change[0]();
  assert.equal(nodes.get("sort").closest().hidden,true);
  assert.equal(nodes.get("sort").value,"collection");
  assert.ok(!context.location.hash.includes("sort="));
  assert.equal(read("visibleAssets.length"),2);
  nodes.get("category").value="hong-kong";
  nodes.get("category").listeners.change[0]();
  assert.equal(nodes.get("sort").closest().hidden,false);
});

test("search combines words across existing fields and tolerates full-width text and filename separators",()=>{
  const {context,read,nodes}=populatedGallery();
  for (const [resource,query,count] of [["wallpaper","手机 动漫",2],["wallpaper","mount fuji",1],["icon","ＡＩ Claude",1],["bank-card","DBS Singapore",1],["game-cover","逆转 裁判",11]]) {
    read('kind="'+resource+'"'); context.clearFilters();
    nodes.get("search").value=query; context.renderGallery();
    assert.equal(read("visibleAssets.length"),count,query);
  }
});

test("links restore scope, search, device, category, size and favorites from another view",()=>{
  const {context,nodes,read}=populatedGallery();
  read('kind="icon"'); context.clearFilters();
  context.history.replaceState(null,"",base+"#q=少女&device=phone&category=anime&resolution=1440x3120&favorites=1");
  read('favorites=new Set([assets.find(file=>file.kind==="wallpaper").path])');
  context.syncRoute();
  assert.equal(read("kind"),"wallpaper");
  assert.equal(nodes.get("search").value,"少女");
  assert.equal(nodes.get("device").value,"phone");
  assert.equal(nodes.get("category").value,"anime");
  assert.equal(nodes.get("resolution").value,"1440x3120");
  assert.equal(read("favoritesOnly"),true);
  assert.equal(read("visibleAssets.length"),1);
  assert.ok(nodes.get("filter-summary").textContent.includes("手机 · 动漫"));
});

test("tab Back and closing a preview preserve the filtered list; clicking the active tab is harmless",()=>{
  const {context,nodes,read}=populatedGallery();
  nodes.get("device").value="phone"; nodes.get("device").listeners.change[0]();
  nodes.get("search").value="雨夜"; nodes.get("search").listeners.input[0]();
  const filtered=context.location.href;
  nodes.get("tab-wallpaper").listeners.click[0]();
  assert.equal(context.location.href,filtered);
  context.openPreview(read("visibleAssets[0]"));
  assert.ok(context.location.hash.includes("q="));
  context.closePreview(); context.syncRoute();
  assert.equal(context.location.href,filtered);
  assert.equal(read("visibleAssets.length"),1);
  nodes.get("tab-icon").listeners.click[0]();
  assert.equal(read("kind"),"icon");
  context.history.back(); context.syncRoute();
  assert.equal(context.location.href,filtered);
  assert.equal(nodes.get("device").value,"phone");
  assert.equal(nodes.get("search").value,"雨夜");
  assert.equal(read("visibleAssets.length"),1);
});

test("series navigation retains search and Back returns to the same overview query",()=>{
  const {context,nodes,read}=coverGallery();
  context.window.scrollTo=()=>{};
  context.history.replaceState(null,"",base+"#covers"); context.syncRoute();
  nodes.get("search").value="999"; nodes.get("search").listeners.input[0]();
  const overview=context.location.href;
  context.navigateCoverView({button:0,preventDefault(){}},"zero-escape");
  assert.equal(nodes.get("search").value,"999");
  assert.equal(read("visibleAssets.length"),2);
  context.history.back(); context.syncRoute();
  assert.equal(context.location.href,overview);
  assert.equal(nodes.get("search").value,"999");
  assert.equal(read("visibleAssets.length"),1);
});

test("empty search can be cleared without losing device or favorites",()=>{
  const {context,nodes,read}=populatedGallery();
  read('favoritesOnly=true; favorites=new Set([assets.find(file=>file.kind==="wallpaper").path])');
  nodes.get("device").value="phone"; nodes.get("device").listeners.change[0]();
  nodes.get("search").value="no-such-picture"; nodes.get("search").listeners.input[0]();
  const button=descend(nodes.get("gallery")).find(node=>node.textContent==="清除搜索");
  button.listeners.click[0]();
  assert.equal(nodes.get("device").value,"phone");
  assert.equal(read("favoritesOnly"),true);
  assert.equal(read("visibleAssets.length"),1);
});

test("an absent annual result offers the full person index with the same search",()=>{
  const {context,nodes}=populatedGallery();
  context.history.replaceState(null,"",base+"#actresses=annual&year=2025&q=三上悠亚");
  context.syncRoute();
  const link=descend(nodes.get("gallery")).find(node=>node.textContent==="在全部女优中查找");
  assert.ok(link);
  const params=new URLSearchParams(new URL(link.href).hash.slice(1));
  assert.equal(params.get("actresses"),"all");
  assert.equal(params.get("q"),"三上悠亚");
  assert.equal(params.get("page"),null);
});

test("an unscoped link still opens available resources when no wallpapers remain",()=>{
  const {context,read}=populatedGallery();
  read('assets=assets.filter(file=>file.kind==="icon")');
  context.syncRoute();
  assert.equal(read("kind"),"icon");
  assert.equal(read("visibleAssets.length"),61);
});

test("image preview history retains the existing list nodes and expanded card information",()=>{
  const {context,nodes,read}=populatedGallery();
  context.history.replaceState(null,"",base+"#covers"); context.syncRoute();
  const sections=nodes.get("gallery").children;
  const story=descend(nodes.get("gallery")).find(node=>node.className?.includes("game-synopsis"));
  story.open=true;
  context.openPreview(read("visibleAssets[0]"));
  context.syncRoute();
  assert.equal(nodes.get("gallery").children,sections);
  context.closePreview(); context.syncRoute();
  assert.equal(nodes.get("gallery").children,sections);
  assert.equal(story.open,true);
  assert.equal(nodes.get("preview-dialog").open,false);
});

test("closing person details returns to the list entry without adding a duplicate Back step",()=>{
  const {context,nodes,read}=populatedGallery();
  context.window.scrollTo=()=>{};
  context.history.replaceState(null,"",base+"#actresses=all&page=2"); context.syncRoute();
  read("initialRoute=false");
  const cards=nodes.get("gallery").children;
  const listUrl=context.location.href;
  const person=read("actressGallery.select().items[0].person.id");
  context.navigatePersonView(read(`actressGallery.viewUrl({},"${person}")`),false);
  assert.equal(nodes.get("gallery").children,cards);
  assert.equal(context.history.index,1);
  assert.equal(nodes.get("person-dialog").open,true);
  context.closePerson(); context.syncRoute();
  assert.equal(context.location.href,listUrl);
  assert.equal(context.history.index,0);
  assert.equal(nodes.get("gallery").children,cards);
  assert.equal(nodes.get("person-dialog").open,false);
});

test("a shared person detail has its own list beneath it and keeps page and query when closed",()=>{
  const {context,nodes}=populatedGallery();
  context.history.replaceState(null,"",base+"#actresses=all&q=Mikami&person=p0032");
  context.syncRoute();
  assert.equal(context.history.entries.length,2);
  assert.equal(context.history.state.personPreview,true);
  assert.equal(nodes.get("person-dialog").open,true);
  context.closePerson(); context.syncRoute();
  assert.equal(context.history.index,0);
  assert.equal(new URLSearchParams(context.location.hash.slice(1)).get("person"),null);
  assert.equal(nodes.get("search").value,"Mikami");
});

test("person avatar downloads use the same offline guard as other originals",()=>{
  const {context,nodes,read}=populatedGallery();
  read('actressGallery.configure(actressData,testCatalog.assets,navigatePersonView,requireConnection); showToast=message=>{globalThis.offlineMessage=message;}');
  context.history.replaceState(null,"",base+"#actresses=all&person=p0032"); context.syncRoute();
  const download=descend(nodes.get("person-content")).find(node=>node.textContent==="下载头像");
  let prevented=false;
  context.navigator.onLine=false;
  download.listeners.click[0]({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(read("offlineMessage"),"请联网后下载原图");
  context.navigator.onLine=true; prevented=false;
  download.listeners.click[0]({preventDefault(){prevented=true;}});
  assert.equal(prevented,false);
});

test("refreshing an unchanged cached directory retains an open preview and its list nodes",async()=>{
  const catalog=JSON.parse(fs.readFileSync(require("node:path").join(__dirname,"../catalog.json"),"utf8"));
  const {context,nodes,read}=gallery(async()=>new Response(JSON.stringify(catalog)),true);
  context.history.replaceState(null,"",base+"#covers");
  await context.load();
  const sections=nodes.get("gallery").children;
  context.openPreview(read("visibleAssets[0]"));
  await context.load();
  assert.equal(nodes.get("gallery").children,sections);
  assert.equal(nodes.get("preview-dialog").open,true);
});
