import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {testHand} from './test-hands.mjs';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage();await page.goto('https://ff7kl.github.io/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);
 const left=testHand('up',true,true),right=testHand();right[0]={x:.5,y:.7,z:0};right[9]={x:.5,y:.5,z:0};right[8]={x:.4,y:.4,z:0};right[4]={x:.6,y:.4,z:0};
 const send=()=>page.evaluate(({left,right})=>window.dispatchEvent(new CustomEvent('handtracking',{detail:{active:true,left:{visible:true,landmarks:left},right:{visible:true,landmarks:right}}})),{left,right});
 await send();await page.waitForTimeout(400);const before=await page.evaluate(()=>({target:window.theatre.driver.target.toArray(),seen:window.theatre.driver.seen,lamp:window.theatre.lampDriver.target.toArray()}));
 left.forEach(p=>p.x-=.1);right[8].x-=.05;await send();const after=await page.evaluate(()=>({target:window.theatre.driver.target.toArray(),seen:window.theatre.driver.seen,lamp:window.theatre.lampDriver.target.toArray()}));assert(after.target[0]>before.target[0]);assert(after.seen>=before.seen);assert(after.lamp[0]>before.lamp[0]);
 right[4].x=right[8].x+.03;await send();right[8].y-=.1;right[4].y=right[8].y;await send();assert(await page.evaluate(()=>window.theatre.lampDriver.pinching));
 console.log('线上新会话：双手同时控制木偶与灯具、捏合模式合成输入通过；非真人摄像头测试');
}finally{await browser.close();}
