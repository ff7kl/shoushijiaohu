import {chromium} from 'file:///C:/Users/natural/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
const url=process.env.PREVIEW_URL||'http://127.0.0.1:4173/static-check/';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[],bad=[],consoleErrors=[];
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()]);});
 await page.addInitScript(()=>{window.cameraRequests=0;navigator.mediaDevices.getUserMedia=async()=>{window.cameraRequests++;throw new DOMException('Synthetic permission denial','NotAllowedError');};});
 await page.goto(url);await page.waitForFunction(()=>window.theatre);
 // A failed local model download must leave the start button available for retry.
 await page.route('**/models/hand_landmarker.task',r=>r.abort());await page.locator('#camera-start').click();await page.waitForFunction(()=>!document.querySelector('#camera-start').disabled);assert.match(await page.locator('#tracking-status').textContent(),/重试/);
 const expectedFailureConsole=consoleErrors.splice(0);
 await page.unroute('**/models/hand_landmarker.task');await page.locator('#camera-start').click();
 await page.waitForFunction(()=>window.cameraRequests===1,{},{timeout:60000});await page.waitForFunction(()=>!document.querySelector('#camera-start').disabled);
 // Reaching getUserMedia proves WASM/model initialization succeeded without capturing video.
 for(const name of await readdir('dist/mediapipe/wasm')){const response=await page.request.get(new URL('mediapipe/wasm/'+name,url).href);assert.equal(response.status(),200);assert((await response.body()).length>100000);}
 await page.locator('#light').click();assert.equal(await page.evaluate(()=>window.theatre.light.visible),false);await page.locator('#light').click();
 await page.locator('details').last().locator('summary').click();await page.locator('#simulate').check();await page.locator('#sim-0').fill('1');await page.waitForTimeout(500);
 assert((await page.evaluate(()=>window.theatre.driver.values[0]))>.9);
 await page.screenshot({path:'screenshots/production-subpath.png'});
 assert.deepEqual(consoleErrors,[]);assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);assert(requests.every(r=>r.url.startsWith(url)||r.url.startsWith('data:')||r.url.startsWith('blob:')));assert(requests.every(r=>r.method==='GET'));assert(!requests.some(r=>r.url.includes('/node_modules/')));
 console.log(JSON.stringify({url,pageErrors:errors,consoleErrors,expectedFailureConsole,httpErrors:bad,requests,modelInitialized:true,camera:'not captured; permission denial simulated'},null,2));
}finally{await browser.close();}
