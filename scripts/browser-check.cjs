// Real browser checks complement the pure catalog and worker tests. No runtime dependencies.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(process.env.SITE_ROOT || path.join(__dirname,'..'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8')).assets;
const iconCount=catalog.filter(file=>file.path.startsWith('icons/')).length;
const claudeCount=catalog.filter(file=>file.path.startsWith('icons/') && (file.path+' '+file.title).toLowerCase().includes('claude')).length;
const phoneCount=catalog.filter(file=>file.path.startsWith('wallpapers/') && file.device==='phone').length;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/assets\//,'');
 const file=path.resolve(root,name||'index.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=process.env.SITE_URL||`http://127.0.0.1:${server.address().port}/assets/`;
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch();
  try {
   for(const [width,colorScheme] of [[1440,'light'],[390,'dark'],[768,'light'],[320,'dark']]){
    const context=await browser.newContext({viewport:{width,height:900},colorScheme,hasTouch:width<500});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>document.querySelectorAll('.card').length>0);
    await page.locator('.tab[data-kind="icon"]').click();await page.waitForFunction(count=>document.querySelectorAll('.card').length===count,iconCount);
    await page.locator('#search').fill('claude');await page.waitForFunction(count=>document.querySelectorAll('.card').length===count,claudeCount);
    await page.locator('.favorite-toggle').first().click();assert.equal(await page.locator('#favorite-count').innerText(),'1');
    await page.locator('.preview').first().click();assert.equal(await page.locator('#preview-dialog').isVisible(),true);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#preview-dialog').open);
    assert.equal(await page.locator('.preview').first().evaluate(el=>el===document.activeElement),true);
    await page.locator('#reset').click();await page.locator('.tab[data-kind="wallpaper"]').click();
    await page.locator('#device').selectOption('phone');await page.waitForFunction(count=>document.querySelectorAll('.card').length===count,phoneCount);
    const route=page.url();await page.reload();await page.waitForFunction(count=>document.querySelectorAll('.card').length===count,phoneCount);assert.equal(page.url(),route);
    assert.equal(await page.locator('#favorite-count').innerText(),'0'); // Count is scoped to the current kind.
    await page.locator('.tab[data-kind="icon"]').click();
    assert.equal(await page.locator('#favorite-count').innerText(),'1');
    await page.goBack();await page.waitForFunction(count=>document.querySelectorAll('.card').length===count,phoneCount);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);assert.equal(overflow,false,`${name} ${width}px overflow`);
    if(width===1440){
     await page.evaluate(()=>navigator.serviceWorker.ready);
     await context.setOffline(true);
     await page.waitForFunction(()=>navigator.onLine===false);
     await page.locator('#gallery .primary-button').first().click();
     await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('联网'));
     // Playwright Chromium resets navigator.onLine after a worker-served reload, despite
     // requests remaining offline. Check the download guard before testing cold reload.
     if(name==='Chromium') {await page.reload();await page.waitForFunction(count=>document.querySelectorAll('.card').length===count,phoneCount);}
     await context.setOffline(false);
    }
    assert.deepEqual(errors,[]);await context.close();
   }
   const images=await browser.newContext();const allIcons=await images.newPage();
   await allIcons.goto(url);await allIcons.evaluate(()=>navigator.serviceWorker.ready);await allIcons.reload();
   await allIcons.locator('.tab[data-kind="icon"]').click();
   await allIcons.waitForFunction(count=>{
    const cards=[...document.querySelectorAll('.card')];
    cards.forEach(card=>card.querySelectorAll('img').forEach(image=>image.loading='eager'));
    return cards.length===count&&cards.every(card=>card.querySelector('.image-error')||
     [...card.querySelectorAll('img')].every(image=>image.complete&&image.naturalWidth>0));
   },iconCount,{timeout:45000});
   assert.equal(await allIcons.locator('.card .image-error').count(),0,'All catalog icons must decode with the active worker');
   await images.close();
   const context=await browser.newContext({serviceWorkers:'block'});const page=await context.newPage();
   await page.route('**/catalog.json',route=>route.abort());await page.goto(url);await page.locator('.empty button').waitFor();
   assert.match(await page.locator('.empty').innerText(),/无法读取/);
   await page.unroute('**/catalog.json');await page.locator('.empty button').click();
   await page.waitForFunction(()=>document.querySelectorAll('.card').length>0);await context.close();
   console.log(`${name}: filters, favorites, preview focus, shareable routes, mobile/tablet, offline actions, all ${iconCount} icons and error recovery passed`);
  } finally {await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
