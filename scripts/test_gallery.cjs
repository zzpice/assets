"use strict";

const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname,"../app/site.js"),"utf8").replace(/\nload\(\);\s*$/, "\n");
const base = "https://example.test/assets/";

function gallery(fetchResponse = async()=>new Response('{"version":1,"assets":[]}')) {
  const nodes = new Map();
  const node = () => ({value:"",style:{setProperty(){}},classList:{toggle(){},remove(){}},addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(...children){this.children=children;},append(){},showModal(){this.open=true;},close(){this.open=false;},focus(){}});
  const document = {baseURI:base,body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},querySelectorAll:()=>[],querySelector:()=>node(),createElement:node};
  const context = vm.createContext({URL,URLSearchParams,Response,AbortController,setTimeout,clearTimeout,document,fetch:fetchResponse,
    localStorage:{getItem:()=>null},navigator:{onLine:true},location:{href:base,hash:""},history:{state:null},
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
