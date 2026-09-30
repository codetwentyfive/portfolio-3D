/** Integration/visual acceptance. PREVIEW_URL points to a production or dev server. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.PREVIEW_URL || 'http://localhost:3100';
const out=process.env.CHECK_OUTPUT || '/tmp/denkpause-portfolio-check';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const findings=[];
try {
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const locale of ['en','de']) {
  const res=await page.request.get(`${base}/${locale}`);const html=await res.text();
  assert.equal(res.status(),200);assert.ok(html.includes(`href="/${locale}/projects/denkpause"`));assert.ok(html.includes('data-world="denkpause"'));assert.ok(html.includes(locale==='en'?'A web and iOS app for teachers':'Eine Web- und iOS-App für Lehrkräfte'));
  await page.goto(`${base}/${locale}`);await page.locator('.world-enhancement[data-ready="true"]').waitFor();
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.studio-caption h2').innerText(),'denk.pause');
  const models=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('.glb')).map(r=>r.name));assert.equal(models.length,1);assert.ok(models[0].includes('denkpause'));
  for(const [width,height] of [[1440,900],[1280,800],[390,844],[320,740],[844,390]]) {
   await page.setViewportSize({width,height});await page.goto(`${base}/${locale}`);await page.locator('.world-enhancement[data-ready="true"]').waitFor();await page.waitForTimeout(300);await page.screenshot({path:`${out}/${locale}-${width}.png`,fullPage:true});
   const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,title:document.querySelector('.studio-caption h2').getBoundingClientRect().bottom,cta:document.querySelector('.studio-caption .studio-open').getBoundingClientRect().bottom,scene:document.querySelector('.studio-stage').getBoundingClientRect().top}));
   assert.ok(layout.width<=layout.viewport,`${locale}/${width}: horizontal overflow`);
   if(height>=800) {assert.ok(layout.cta<height);assert.ok(layout.title<height);}
   if(width===390) assert.ok(layout.scene<height-100);
   findings.push({locale,width,height,...layout});
  }
  await page.goto(`${base}/${locale}/projects/denkpause`);assert.equal(await page.locator('h1').innerText(),'denk.pause');assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://chingis.dev/${locale}/projects/denkpause`);await page.screenshot({path:`${out}/${locale}-case.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});await page.goto(`${base}/en?world=shop`);assert.equal(await page.locator('.studio-caption h2').innerText(),'chingis.shop');
 await page.locator('.studio-project').nth(2).click();assert.ok(page.url().endsWith('world=payments'));await page.goBack();assert.equal(await page.locator('.studio-caption h2').innerText(),'chingis.shop');await page.goForward();assert.equal(await page.locator('.studio-caption h2').innerText(),'Commerce systems');
 await page.locator('.language-button').click();await page.waitForURL('**/de?world=payments');assert.equal(await page.locator('.studio-explorer').getAttribute('data-world'),'payments');
 for(const kind of ['denkpause','shop','payments','portfolio','seeds','potera','assistant']) {
  console.log('Checking world:',kind);await page.goto(`${base}/en?world=${kind}`);await page.locator('.world-enhancement[data-ready="true"]').waitFor({timeout:30000});
 }
 await page.goto(`${base}/en?world=invalid`);assert.equal(await page.locator('.studio-explorer').getAttribute('data-world'),'denkpause');
 // Fast changes, options focus and canvas-only keyboard navigation.
 await page.locator('.studio-project').nth(5).click();await page.locator('.studio-project').nth(0).click();await page.locator('.world-enhancement[data-ready="true"]').waitFor();
 await page.locator('.scene-options-trigger').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.scene-options-trigger').evaluate(el=>el===document.activeElement),true);
 assert.deepEqual(errors,[]);
 await context.close();
 for(const policy of ['reduced','saveData','noWebGL','failedAsset','noJS']) {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:policy==='reduced'?'reduce':'no-preference',javaScriptEnabled:policy!=='noJS'});
  if(policy==='saveData') await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}));
  if(policy==='noWebGL') await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};});
  if(policy==='failedAsset') await context.route('**/3d/**/*.glb',route=>route.abort());
  const page=await context.newPage();await page.goto(`${base}/en`);await page.locator('.world-poster').waitFor();
  if(['noWebGL','failedAsset'].includes(policy)) await page.locator('.world-enhance-button').waitFor({timeout:16000});
  if(['reduced','saveData','noJS'].includes(policy)) {assert.equal(await page.locator('canvas').count(),0);assert.equal((await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('.glb')))).length,0);}
  assert.equal(await page.locator('.studio-caption .studio-open').getAttribute('href'),'/en/projects/denkpause');
  assert.ok(await page.locator('.world-poster').evaluate(img=>img.complete && img.naturalWidth>0));
  await page.screenshot({path:`${out}/${policy}.png`,fullPage:true});
  if(policy!=='noJS') {await page.locator('.studio-mobile-pager-buttons button').last().click();assert.equal(await page.locator('.studio-explorer').getAttribute('data-world'),'shop');}
  await context.close();
 }
 // Enlarged text should scroll naturally and keep the primary action usable.
 const zoomContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const zoom=await zoomContext.newPage();await zoom.goto(`${base}/de`);await zoom.evaluate(()=>document.fonts.ready);
 await zoom.evaluate(()=>{const sizes=[...document.querySelectorAll('body *')].filter(el=>[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim())).map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const [el,size] of sizes) el.style.fontSize=`${size*2}px`;});
 await zoom.waitForTimeout(300);assert.ok(await zoom.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await zoom.locator('.studio-caption .studio-open').scrollIntoViewIfNeeded();assert.ok(await zoom.locator('.studio-caption .studio-open').isVisible());await zoom.screenshot({path:`${out}/text-200.png`,fullPage:true});await zoomContext.close();
 // Cold synthetic phone run: Slow 4G, 4x CPU, no cache. Report observed values, not claims about real devices.
 const cold=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const phone=await cold.newPage();const cdp=await cold.newCDPSession(phone);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await phone.goto(`${base}/en`,{waitUntil:'domcontentloaded',timeout:120000});await phone.locator('.world-poster').evaluate(img=>img.decode());
 const posterMs=await phone.evaluate(()=>performance.now());const semantic=await phone.locator('.studio-caption .studio-open').isVisible();
 await phone.screenshot({path:`${out}/cold-phone.png`,fullPage:true});
 await phone.waitForFunction(()=>Boolean(document.querySelector('.world-enhancement[data-ready="true"]') || document.querySelector('.world-enhance-button')), {timeout:30000});
 const enhancement=await phone.evaluate(()=>({atMs:performance.now(),ready:Boolean(document.querySelector('.world-enhancement[data-ready="true"]'))}));
 const metrics=await phone.evaluate(()=>({navigation:performance.getEntriesByType('navigation')[0].toJSON(),paints:performance.getEntriesByType('paint').map(p=>p.toJSON()),resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.transferSize,start:r.startTime,end:r.responseEnd}))}));
 await fs.writeFile(`${out}/metrics.json`,JSON.stringify({posterMs,semantic,enhancement,findings,...metrics},null,2));console.log(JSON.stringify({posterMs,semantic,enhancement,screenshots:out,layouts:findings.length},null,2));await cold.close();
} finally {await browser.close();}
