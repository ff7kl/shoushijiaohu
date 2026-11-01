import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5174/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);
 const metrics={};
 for(const [name,angle] of [['front',0],['side',Math.PI/2],['three-quarter',Math.PI/4]]){
 await page.evaluate(angle=>{const t=window.theatre;t.camera.position.set(t.puppet.position.x+Math.sin(angle)*6,2.4,t.puppet.position.z+Math.cos(angle)*6);t.camera.lookAt(t.puppet.position.x,1.5,t.puppet.position.z);},angle);
 await page.waitForTimeout(100);await page.screenshot({path:`screenshots/student-${name}.png`});
 }
 await page.locator('#close-view').click();await page.screenshot({path:'screenshots/student-default.png'});
 await page.locator('details').last().locator('summary').click();await page.locator('#simulate').check();
 for(const [name,values] of [['arms',[1,1,0,0,0]],['legs',[0,0,0,1,1]],['lift',[0,0,1,0,0]],['extreme',[1,1,1,1,1]]]){
 await page.evaluate(values=>values.forEach((v,i)=>{const e=document.querySelector(`#sim-${i}`);e.value=v;e.dispatchEvent(new Event('input'));}),values);await page.waitForTimeout(900);await page.screenshot({path:`screenshots/student-${name}.png`});
 }
 metrics.render=await page.evaluate(()=>{const t=window.theatre;let meshes=0,triangles=0;t.puppet.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});return {meshes,triangles,frame:t.renderer.info.render};});
 await page.locator('#simulate').uncheck();await page.waitForTimeout(1200);
 metrics.simulationExited=await page.locator('#input-mode').textContent();
 await writeFile('screenshots/student-metrics.json',JSON.stringify(metrics,null,2));console.log(metrics);
}finally{await browser.close();}
