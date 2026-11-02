import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4192'],{stdio:'pipe'});
await new Promise(resolve=>server.stdout.on('data',resolve));
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.Worker=class {constructor(){throw new Error('Synthetic unavailable Worker');}};});
 await page.goto('http://127.0.0.1:4192/shoushijiaohu/');
 await page.waitForFunction(()=>window.theatre);
 await page.locator('#camera-start').click();
 await page.waitForFunction(()=>window.handPerformance?.samples>2,null,{timeout:60000});
 console.log('worker inference',await page.evaluate(()=>window.handPerformance));
 await page.locator('#camera-stop').click();
 await page.locator('#camera-start').click();
 await page.waitForFunction(()=>Number(document.querySelector('#tracking-live').textContent.match(/推理 (\d+)/)?.[1])>2,null,{timeout:60000});
 assert.deepEqual(errors,[]);console.log('Worker model load, inference, stop/restart: PASS');
}finally{await browser.close();server.kill();}
