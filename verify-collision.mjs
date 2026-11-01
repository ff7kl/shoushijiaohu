import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:5174/shoushijiaohu/'));await page.waitForFunction(()=>window.theatre);
await page.waitForFunction(()=>window.theatre);
await page.evaluate(async()=>{
 const {collisionBoxes,safeLamp}=await import('./lamp-collision.js');window.failures=[];window.samples=0;
 const render=window.theatre.renderer.render.bind(window.theatre.renderer);
 window.theatre.renderer.render=(s,c)=>{const t=window.theatre;window.samples++;if(!safeLamp(t.lamp.position,collisionBoxes(t.puppet)))window.failures.push(t.lamp.position.toArray());render(s,c);};
});
for(const [x,y,px,py,curl] of [[-.65,1,-.65,0,0],[1.3,1,1.3,0,0],[0,2,0,.8,1],[-1,1,-1,.8,1]]){
 await page.evaluate(({x,y,px,py,curl})=>{const t=window.theatre;t.lampDriver.owner='simulation';t.lampDriver.target.set(x,y,.3);t.driver.target.set(px,py,.65);t.driver.seen=performance.now()+100000;t.driver.raw.fill(curl*.35);},{x,y,px,py,curl});await page.waitForTimeout(1500);
}
await page.screenshot({path:'screenshots/collision-check.png'});
await page.evaluate(()=>{window.theatre.lamp.position.copy(window.theatre.puppet.position);window.theatre.lamp.position.y+=2;});await page.waitForTimeout(200);
await page.locator('#lamp-reset').click();await page.waitForTimeout(1000);
const result=await page.evaluate(()=>({samples:window.samples,failures:window.failures}));assert.equal(result.failures.length,0);assert.equal(errors.length,0);console.log(JSON.stringify(result));
}finally{await browser.close();}
