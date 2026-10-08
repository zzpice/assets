const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
module.exports=async function checkManager(browser,url,root){
 const original={path:'wallpapers/anime/1920x1080/example.png',kind:'wallpaper',category:'anime',title:'受控壁纸',width:1920,height:1080,sha:'b'.repeat(40),device:'desktop',note:'保留说明',source:'维护者提供',license:'待核实'};
 const catalog={version:1,assets:[original]}, source='# 来源记录\n\n[图片](anime/1920x1080/example.png)\n';
 const fixtureIcon=fs.readFileSync(path.join(root,'icons/ai/claude.png'));
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage(),writes=[],errors=[];let head='a'.repeat(40);
  page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await context.route('**/catalog.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(catalog)}));
  await context.route('**/'+original.path,route=>route.fulfill({contentType:'image/png',body:fixtureIcon}));
  await context.route('https://api.github.com/**',async route=>{
   const request=route.request(),p=new URL(request.url()).pathname,body=request.postDataJSON();let data;
   assert.equal(request.headers().authorization,'Bearer github_pat_browser_test');
   if(request.method()!=='GET'){writes.push({p,body});assert.ok(!JSON.stringify(body).includes('github_pat_browser_test'));}
   if(p==='/repos/zzpice/assets')data={permissions:{push:true}};
   else if(p.endsWith('/git/ref/heads/main'))data={object:{type:'commit',sha:head}};
   else if(request.method()==='GET'&&p.includes('/git/commits/'))data={tree:{sha:'c'.repeat(40)}};
   else if(request.method()==='GET'&&p.includes('/git/trees/'))data={tree:[{path:original.path,type:'blob',mode:'100644',sha:original.sha},{path:'catalog.json',type:'blob',mode:'100644',sha:'d'.repeat(40)},{path:'wallpapers/SOURCES.md',type:'blob',mode:'100644',sha:'e'.repeat(40)},{path:'icons/SOURCES.md',type:'blob',mode:'100644',sha:'9'.repeat(40)}]};
   else if(request.method()==='GET'&&p.includes('/git/blobs/'))data={encoding:'base64',content:Buffer.from(p.endsWith('d'.repeat(40))?JSON.stringify(catalog):source).toString('base64')};
   else if(p.endsWith('/git/blobs'))data={sha:'f'.repeat(40)};
   else if(p.endsWith('/git/trees'))data={sha:'1'.repeat(40)};
   else if(p.endsWith('/git/commits'))data={sha:'2'.repeat(40)};
   else if(p.endsWith('/git/refs/heads/main')){assert.equal(body.force,false);head='2'.repeat(40);data={object:{sha:head}};}
   else throw Error('Unexpected request '+p);
   await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto(url);await page.locator('.card').waitFor();
  await page.locator('#upload-image').click();
  await page.locator('#manage-dialog [name=kind]').selectOption('icon');
  await page.locator('#manage-dialog [name=image]').setInputFiles(path.join(root,'app/icon-192.png'));
  await page.waitForFunction(()=>document.querySelector('#manage-tech').textContent.includes('192 × 192'));
  for(const [name,value] of Object.entries({filename:'browser-icon',title:'浏览器测试图标',source:'维护者提供',license:'待核实',token:'github_pat_browser_test'}))await page.locator(`#manage-dialog [name=${name}]`).fill(value);
  await page.locator('#manage-prepare').click();await page.waitForFunction(()=>document.querySelector('#manage-error').textContent.includes('512'));
  assert.equal(writes.length,0);
  if(width===1440)await page.locator('#manage-dialog [name=image]').setInputFiles({name:'browser-icon.png',mimeType:'image/png',buffer:fixtureIcon});
  else await page.locator('#manage-drop').evaluate((node,base64)=>{
   const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),transfer=new DataTransfer();transfer.items.add(new File([bytes],'browser-icon.png',{type:'image/png'}));node.dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,bubbles:true,cancelable:true}));
  },fixtureIcon.toString('base64'));
  await page.waitForFunction(()=>document.querySelector('#manage-tech').textContent.includes('512 × 512'));
  await page.locator('#manage-dialog [name=token]').fill('github_pat_browser_test');
  await page.locator('#manage-prepare').click();await page.locator('#manage-confirm:visible').waitFor();
  assert.equal(await page.locator('#manage-dialog [name=token]').inputValue(),'');
  assert.ok((await page.locator('#manage-summary').innerText()).includes('icons/ai/browser-icon.png'));
  assert.equal(await page.locator('#manage-dialog').evaluate(node=>node.scrollWidth>node.clientWidth),false);
  await page.locator('#manage-save').click();await page.waitForFunction(()=>document.querySelector('#manage-status').textContent.includes('已提交到 GitHub'));
  assert.equal(writes.filter(item=>item.p.endsWith('/git/refs/heads/main')).length,1);
  const tree=writes.find(item=>item.p.endsWith('/git/trees')).body.tree;
  assert.deepEqual(tree.map(item=>item.path).sort(),['catalog.json','icons/SOURCES.md','icons/ai/browser-icon.png'].sort());
  assert.ok(await page.evaluate(()=>!JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]).includes('github_pat_browser_test')));
  await page.locator('#manage-close').click();await page.locator('.preview').click();await page.locator('#edit-image').click();
  assert.equal(await page.locator('#manage-dialog [name=note]').inputValue(),original.note);
  await page.locator('#manage-dialog [name=category]').selectOption('landscape');await page.locator('#manage-dialog [name=filename]').fill('renamed');
  assert.match(await page.locator('#manage-warning').innerText(),/外链/);
  await page.locator('#manage-dialog [name=token]').fill('github_pat_browser_test');await page.locator('#manage-prepare').click();await page.locator('#manage-confirm:visible').waitFor();
  assert.match(await page.locator('#manage-summary').innerText(),/wallpapers\/landscape\/1920x1080\/renamed.png/);
  await page.locator('#manage-back').click();await page.locator('#manage-dialog [name=remove]').check();
  await page.locator('#manage-dialog [name=token]').fill('github_pat_browser_test');await page.locator('#manage-prepare').click();await page.locator('#manage-confirm:visible').waitFor();
  assert.ok((await page.locator('#manage-summary').innerText()).includes('删除 '+original.path));
  await page.locator('#manage-close').click();assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Chromium: resource upload/drop, icon validation, edit/move/delete previews, atomic save and Token cleanup passed');
};
