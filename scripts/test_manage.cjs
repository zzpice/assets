const {test} = require('node:test');
const assert = require('node:assert/strict');
const {Publisher,plan,sourceRecord,utf8} = require('../app/github.js');
const a='a'.repeat(40), b='b'.repeat(40), c='c'.repeat(40), d='d'.repeat(40);
const original={path:'wallpapers/anime/1920x1080/example.jpg',kind:'wallpaper',category:'anime',width:1920,height:1080,sha:b,title:'测试图',note:'保留说明',device:'desktop',source:'维护者提供',license:'待核实',extraMetadata:{author:'已登记'}};
const snapshot=()=>({head:a,treeSha:c,tree:new Map([[original.path,{sha:b,mode:'100644',type:'blob'}]]),catalog:{version:1,assets:[structuredClone(original)],games:[{id:'preserve'}]}});
const decode=value=>JSON.parse(Buffer.from(value,'base64').toString('utf8'));
test('move keeps manual and special metadata in one plan; collisions and stale edits stop',()=>{
 const state=snapshot(), next={...original,path:'wallpapers/landscape/1920x1080/renamed.jpg',category:'landscape',title:'新名称'};
 const changes=plan(state,original,next);
 assert.deepEqual(changes.find(x=>x.path===next.path),{path:next.path,sha:b});
 assert.equal(changes.find(x=>x.path===original.path).sha,null);
 const catalog=decode(changes.find(x=>x.path==='catalog.json').content);
 assert.equal(catalog.assets[0].note,original.note);assert.deepEqual(catalog.assets[0].extraMetadata,original.extraMetadata);assert.deepEqual(catalog.games,state.catalog.games);
 state.tree.set(next.path,{sha:c});assert.throws(()=>plan(state,original,next),/已存在/);
 state.tree.set(original.path,{sha:c});assert.throws(()=>plan(state,original,next),/已在 GitHub 变化/);
 const changed=snapshot();changed.catalog.assets[0].title='另一个编辑';assert.throws(()=>plan(changed,original,next),/已在 GitHub 变化/);
});
test('delete removes only the selected ordinary image and its catalog record',()=>{
 const changes=plan(snapshot(),original,null);assert.equal(changes.length,2);
 assert.equal(changes[0].path,original.path);assert.equal(changes[0].sha,null);
 assert.deepEqual(decode(changes[1].content).assets,[]);
 assert.throws(()=>plan(snapshot(),{...original,kind:'game-cover'},null),/专门维护/);
});
test('replacement preserves existing metadata and uses one image addition',()=>{
 const changes=plan(snapshot(),original,{...original,title:'新名'},{size:3,bytes:new Uint8Array([1,2,3])});
 assert.equal(changes.filter(x=>x.path===original.path).length,1);
 const catalog=decode(changes.find(x=>x.path==='catalog.json').content);
 assert.equal(catalog.assets[0].source,original.source);assert.equal(catalog.assets[0].note,original.note);
 assert.throws(()=>plan(snapshot(),null,{...original,path:'../wrong.jpg'}),/归档规则/);
});
test('source records follow renamed links while retaining the existing source history',()=>{
 const text=sourceRecord('[原图](anime/1920x1080/example.jpg)\n作者说明', 'wallpapers/SOURCES.md',original,{...original,path:'wallpapers/landscape/1920x1080/new.jpg'},false);
 assert.ok(text.includes('[原图](landscape/1920x1080/new.jpg)'));assert.ok(text.includes('作者说明'));assert.ok(text.includes('待核实'));
});
function fake({advance=false,failBlob=false,loseResponse=false,rejectRef=false}={}){
 const calls=[];let head=advance?d:a;
 const fetcher=async(url,options)=>{
  const route=new URL(url).pathname;const body=options.body?JSON.parse(options.body):null;calls.push({route,...options,body});
  let status=200,data;
  if(route.endsWith('/git/ref/heads/main'))data={object:{sha:head,type:'commit'}};
  else if(route.endsWith('/git/blobs')){status=failBlob?403:201;data={sha:b};}
  else if(route.endsWith('/git/trees'))data={sha:c};
  else if(route.endsWith('/git/commits'))data={sha:d};
  else if(route.endsWith('/git/refs/heads/main')){
   assert.equal(body.force,false);assert.equal(body.sha,d);
   if(rejectRef){status=422;data={message:'untrusted server response github_pat_do_not_echo'};}
   else{head=d;if(loseResponse)throw Error('untrusted network text');data={object:{sha:d}};}
  }else throw Error('unexpected route');
  return new Response(JSON.stringify(data),{status});
 };return {calls,fetcher};
}
test('atomic commit uses the expected parent and one non-forced main update; Token is disposable',async()=>{
 const mock=fake(), publisher=new Publisher('github_pat_test',mock.fetcher);
 const commit=await publisher.publish(snapshot(),[{path:'catalog.json',content:utf8('{}')},{path:original.path,sha:null}]);
 assert.equal(commit,d);
 const tree=mock.calls.find(call=>call.route.endsWith('/git/trees')).body;
 assert.equal(tree.base_tree,c);assert.equal(tree.tree.length,2);
 assert.deepEqual(mock.calls.find(call=>call.route.endsWith('/git/commits')).body.parents,[a]);
 assert.equal(mock.calls.filter(call=>call.method==='PATCH').length,1);
 assert.ok(mock.calls.every(call=>call.credentials==='omit'&&call.redirect==='error'&&call.headers.Authorization==='Bearer github_pat_test'));
 assert.ok(mock.calls.every(call=>!JSON.stringify(call.body).includes('github_pat_test')));
 publisher.dispose();assert.equal(publisher.token,'');await assert.rejects(()=>publisher.head(),/授权只允许/);
});
test('concurrency and permissions failures cannot partially update main or expose raw API errors',async()=>{
 for(const options of [{advance:true},{failBlob:true},{rejectRef:true}]){
  const mock=fake(options), publisher=new Publisher('github_pat_test',mock.fetcher);
  await assert.rejects(()=>publisher.publish(snapshot(),[{path:'catalog.json',content:utf8('{}')}]),error=>!error.message.includes('do_not_echo'));
  if(!options.rejectRef)assert.equal(mock.calls.filter(call=>call.method==='PATCH').length,0);
 }
});
test('lost success response recognizes the commit; arbitrary repository paths are blocked',async()=>{
 const mock=fake({loseResponse:true}), publisher=new Publisher('github_pat_test',mock.fetcher);
 assert.equal(await publisher.publish(snapshot(),[{path:'catalog.json',content:utf8('{}')}]),d);
 assert.equal(mock.calls.filter(call=>call.method==='PATCH').length,1);
 await assert.rejects(()=>publisher.request('/repos/other/repo'),/授权只允许/);
 await assert.rejects(()=>publisher.publish(snapshot(),[{path:'.github/workflows/check.yml',content:utf8('bad')}]),/提交路径无效/);
});
test('obsolete previews are removed in the same commit, shared previews are retained, and preview writes stay blocked',async()=>{
 const state=snapshot(), thumbnail='app/previews/example-0123456789.webp',background='app/previews/example-background-0123456789.webp';
 state.catalog.assets[0].thumbnail=thumbnail;state.catalog.assets[0].background=background;
 for(const name of [thumbnail,background])state.tree.set(name,{type:'blob',mode:'100644',sha:b});
 let changes=plan(state,original,null);assert.ok(changes.some(change=>change.path===thumbnail&&change.sha===null));assert.ok(changes.some(change=>change.path===background&&change.sha===null));
 state.catalog.assets.push({path:'avatars/anime/1920x1080/shared.jpg',thumbnail});
 changes=plan(state,original,null);assert.ok(!changes.some(change=>change.path===thumbnail));
 const mock=fake(),publisher=new Publisher('github_pat_test',mock.fetcher);
 await assert.rejects(()=>publisher.publish(state,[{path:background,content:utf8('unsafe')}]),/提交路径无效/);
 assert.equal(await publisher.publish(state,[{path:background,sha:null}]),d);
 assert.throws(()=>plan(snapshot(),original,{...original,note:'github_pat_should_not_be_public'}),/疑似 Token/);
});
