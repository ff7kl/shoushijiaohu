import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-proxy-server']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('http://motion.test/**',async route=>{const url=new URL(route.request().url());let file=path.join(process.cwd(),'dist',decodeURIComponent(url.pathname.replace(/^\/shoushijiaohu\//,'')));if(url.pathname.endsWith('/'))file=path.join(file,'index.html');if(url.pathname.endsWith('/collision-test.js')){await route.fulfill({body:readFileSync('lamp-collision.js','utf8').replace("from 'three'","from './three-test.js'"),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three-test.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.module.js'),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three.core.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.core.js'),contentType:'text/javascript'});return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'};if(existsSync(file))await route.fulfill({body:readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});else await route.abort();});
await page.goto('http://motion.test/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);await page.waitForTimeout(2500);
await page.evaluate(()=>{window.originalVideo=document.querySelector('#camera-video');window.originalCanvas=document.querySelector('#hand-overlay');});
 for(const [width,height] of [[390,744],[375,667],[430,840],[844,390],[1440,1000],[390,744]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const r=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,width:r.width};};return {camera:rect('.camera-panel'),stage:rect('#stage'),preview:rect('.camera-preview'),button:rect('#camera-start'),overflow:document.documentElement.scrollWidth>innerWidth,same:window.originalVideo===document.querySelector('#camera-video')&&window.originalCanvas===document.querySelector('#hand-overlay'),clickable:(()=>{const b=document.querySelector('#camera-start'),r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})(),count:document.querySelectorAll('#camera-video').length,parent:document.querySelector('.camera-panel').parentElement.tagName};});
  assert(!r.overflow);assert.equal(r.count,1);assert(r.same);assert(r.clickable);
  if(width<=900){assert(r.camera.bottom<=r.stage.top+1);assert(r.preview.height<r.stage.height);assert(r.button.bottom<height);if(height>600)assert(r.stage.bottom<=height+10);}
  else assert.equal(r.parent,'ASIDE');
  console.log(JSON.stringify({width,height,...r}));
  if(width===390)await page.screenshot({path:'screenshots/mobile-camera-top.png'});
 }

await browser.close();
