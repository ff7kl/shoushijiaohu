import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {testHand} from './test-hands.mjs';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
 const page=await browser.newPage();await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.theatre);
 assert.equal(await page.locator('#lamp-status').textContent(),'摄像头未开启');
 await page.locator('#lamp-height').fill('3.6');await page.waitForTimeout(2500);
 const read=()=>page.evaluate(()=>({p:window.theatre.lamp.position.toArray(),owner:window.theatre.lampDriver.owner}));
 let a=await read();assert.equal(a.owner,'simulation');assert(Math.abs(a.p[1]-3.6)<.05);assert.equal(a.p[0],1.3);assert.equal(a.p[2],.3);
 await page.waitForTimeout(800);assert(Math.abs((await read()).p[1]-3.6)<.05);
 await page.locator('#light').click();assert.equal(await page.evaluate(()=>window.theatre.light.visible),false);
 await page.locator('#light').click();assert.equal(await page.evaluate(()=>window.theatre.light.intensity),65);
 await page.locator('#lamp-resume').click();assert.equal((await read()).owner,'real');
 const hand=testHand();hand[0]={x:.5,y:.7,z:0};hand[9]={x:.5,y:.5,z:0};hand[8]={x:.4,y:.4,z:0};hand[4]={x:.6,y:.4,z:0};
 const send=async(h)=>page.evaluate(h=>window.dispatchEvent(new CustomEvent('handtracking',{detail:{active:true,left:{visible:false},right:{visible:!!h,landmarks:h||[]}}})),h);
 const target=()=>page.evaluate(()=>window.theatre.lampDriver.target.toArray());
 await send(hand);let before=await target();assert(Math.abs(before[0]-(await read()).p[0])<.05);
 hand[4].x=.44;await send(hand);assert.equal(await page.evaluate(()=>window.theatre.lampDriver.pinching),true);
 hand[4].x=.47;await send(hand);assert.equal(await page.evaluate(()=>window.theatre.lampDriver.pinching),true);
 before=await read();hand[4].x=.6;hand[8].x=.7;await send(hand);assert(Math.abs((await target())[0]-before.p[0])<.05);
 await send(null);before=await read();hand[8].x=.2;await send(hand);assert(Math.abs((await target())[0]-before.p[0])<.05);
 await page.locator('#lamp-height').fill('4');await page.locator('#lamp-resume').click();before=await read();hand[8].x=.8;await send(hand);assert(Math.abs((await target())[0]-before.p[0])<.05);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('handtracking',{detail:{active:false,left:{visible:false},right:{visible:false}}})));
 await page.waitForTimeout(2500);a=await read();assert(Math.abs(a.p[1]-4.6)<.03);assert.equal(await page.locator('#lamp-status').textContent(),'摄像头未开启');
 console.log('浏览器合成状态检查通过：模拟保持高度及 X/Z、退出模拟、灯开关、关闭摄像头归位。');
} finally {await browser.close();}

