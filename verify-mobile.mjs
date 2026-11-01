import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage();await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4180/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);
 for(const [width,height] of [[390,744],[375,667],[430,840],[844,390],[1440,1000],[390,744]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const r=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,width:r.width};};return {camera:rect('.camera-panel'),stage:rect('#stage'),preview:rect('.camera-preview'),button:rect('#camera-start'),overflow:document.documentElement.scrollWidth>innerWidth,count:document.querySelectorAll('#camera-video').length,parent:document.querySelector('.camera-panel').parentElement.tagName};});
  assert(!r.overflow);assert.equal(r.count,1);
  if(width<=900){assert(r.camera.bottom<=r.stage.top+1);assert(r.preview.height<r.stage.height);assert(r.button.bottom<height);if(height>600)assert(r.stage.bottom<=height+10);}
  else assert.equal(r.parent,'ASIDE');
  console.log(JSON.stringify({width,height,...r}));
  if(width===390)await page.screenshot({path:'screenshots/mobile-camera-top.png'});
 }
}finally{await browser.close();}
