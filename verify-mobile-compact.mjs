import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('http://motion.test/**',async route=>{const url=new URL(route.request().url());let file=path.join(process.cwd(),'dist',decodeURIComponent(url.pathname.replace(/^\/shoushijiaohu\//,'')));if(url.pathname.endsWith('/'))file=path.join(file,'index.html');if(url.pathname.endsWith('/collision-test.js')){await route.fulfill({body:readFileSync('lamp-collision.js','utf8').replace("from 'three'","from './three-test.js'"),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three-test.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.module.js'),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three.core.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.core.js'),contentType:'text/javascript'});return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'};if(existsSync(file))await route.fulfill({body:readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});else await route.abort();});
await page.goto('http://motion.test/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);await page.selectOption('#puppet-choice','rigged');await page.waitForFunction(()=>window.theatre.activeCharacter.loaded);await page.waitForTimeout(500);


try{
 await page.setViewportSize({width:390,height:744});
 const before=await page.evaluate(()=>({y:scrollY,stage:document.querySelector('#stage').getBoundingClientRect().height}));
 assert(before.stage>440);
 await page.locator('#puppet-entry').click();await page.getByRole('button',{name:'经典木偶',exact:true}).click();
 assert.equal(await page.locator('#puppet-choice').inputValue(),'classic');
 assert.equal(await page.evaluate(()=>scrollY),before.y);
 assert.equal(await page.locator('#mobile-puppet-picker').isVisible(),false);
 assert.equal(await page.locator('#finger-debug').isVisible(),false);
 await page.screenshot({path:'screenshots/mobile-compact.png'});
 await page.setViewportSize({width:1440,height:1000});assert(await page.locator('#puppet-choice').isVisible());
 console.log('PASS: compact 390x744 layout, stage '+before.stage+'px, model switch without scroll, desktop controls preserved');
}finally{await browser.close();}
