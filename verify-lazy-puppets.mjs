import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('http://motion.test/**',async route=>{const url=new URL(route.request().url());let file=path.join(process.cwd(),'dist',decodeURIComponent(url.pathname.replace(/^\/shoushijiaohu\//,'')));if(url.pathname.endsWith('/'))file=path.join(file,'index.html');if(url.pathname.endsWith('/collision-test.js')){await route.fulfill({body:readFileSync('lamp-collision.js','utf8').replace("from 'three'","from './three-test.js'"),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three-test.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.module.js'),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three.core.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.core.js'),contentType:'text/javascript'});return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'};if(existsSync(file))await route.fulfill({body:readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});else await route.abort();});
const models=[];page.on('request',r=>{if(r.url().endsWith('.glb'))models.push(r.url());});await page.goto('http://motion.test/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);await page.selectOption('#puppet-choice','rigged');await page.waitForFunction(()=>window.theatre.activeCharacter.loaded);await page.waitForTimeout(500);


try{
 assert.equal(models.length,1);assert(models[0].endsWith('wooden-doll-rigged.glb'));
 for(const value of ['student','wooden','classic','rigged']){
  await page.selectOption('#puppet-choice',value);
  await page.waitForFunction(()=>!document.querySelector('#model-load-status').textContent.includes('正在加载'));
  assert(!(await page.locator('#model-load-status').textContent()).includes('失败'));
  assert(await page.evaluate(()=>window.theatre.activePuppet.visible));
 }
 assert.equal(models.length,3);console.log('PASS: only selected model downloads; all four puppets ready; switching back reuses model');
}finally{await browser.close();}
