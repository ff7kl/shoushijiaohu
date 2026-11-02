import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {testHand} from './test-hands.mjs';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const results=[];
try{
for(const scenario of ['success','denied','play-fail','model-fail','cancel','insecure','embedded-missing','policy']){
 const context=await browser.newContext({viewport:{width:390,height:744},userAgent:scenario==='embedded-missing'?'MicroMessenger test':'camera test'});
 const page=await context.newPage();const origin=scenario==='insecure'?'http://camera.test':'https://camera.test';
 await page.addInitScript(({scenario,points})=>{
 window.testState={calls:[],tracks:[],scenario};
 const state=window.testState;
 if(scenario==='embedded-missing')Object.defineProperty(navigator,'mediaDevices',{value:undefined});
 else if(scenario!=='insecure')Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async constraints=>{
  state.calls.push('permission');state.constraints=constraints;
  if(state.scenario==='denied')throw new DOMException('denied','NotAllowedError');
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const ctx=canvas.getContext('2d');ctx.fillRect(0,0,320,240);
  const stream=canvas.captureStream(15);state.tracks.push(...stream.getTracks());
  if(state.scenario==='cancel')await new Promise(resolve=>window.finishPermission=resolve);
  return stream;
 }}});
 if(scenario==='policy')Object.defineProperty(document,'permissionsPolicy',{value:{allowsFeature:()=>false}});
 const play=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){state.calls.push('play');if(state.scenario==='play-fail')return Promise.reject(new DOMException('blocked','NotAllowedError'));return play.call(this);};
 window.fakePoints=points;
 },{scenario,points:testHand('up',false,true)});
 await page.route(origin+'/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname==='/tracking.js'){
 const source=readFileSync('hand-tracking.js','utf8').replace("import {FilesetResolver, HandLandmarker} from '@mediapipe/tasks-vision';",`const FilesetResolver={forVisionTasks:async()=>{window.testState.calls.push('model');if(window.testState.scenario==='model-fail')throw new Error('fixture model failure');return {};}};const HandLandmarker={HAND_CONNECTIONS:[{start:0,end:9}],createFromOptions:async()=>({detectForVideo:()=>({landmarks:[window.fakePoints],handedness:[[{categoryName:'Left'}]]})})};`).replaceAll('import.meta.env.BASE_URL',"'/'");
 return route.fulfill({body:source,contentType:'text/javascript'});
 }
 if(url.pathname==='/mobile-layout.js')return route.fulfill({body:readFileSync('mobile-layout.js'),contentType:'text/javascript'});
 const html=readFileSync('index.html','utf8').replace(/<script type="module"[^>]*><\/script>/g,'').replace('</body>','<script type="module" src="/tracking.js"></script><script type="module" src="/mobile-layout.js"></script></body>');
 return route.fulfill({body:html,contentType:'text/html'});
 });
 await page.goto(origin+'/');await page.waitForSelector('#camera-diagnostics');
 assert.deepEqual(await page.evaluate(()=>window.testState.calls),[]);
 await page.locator('#camera-start').click();
 if(scenario==='cancel'){await page.waitForFunction(()=>window.finishPermission);await page.locator('#camera-stop').click();assert(await page.locator('#camera-start').isDisabled());await page.evaluate(()=>window.finishPermission());await page.waitForFunction(()=>!document.querySelector('#camera-start').disabled);}
 else if(scenario==='success'){
 await page.waitForFunction(()=>document.querySelector('#camera-diagnostic-info').textContent.includes('步骤：追踪运行'));
 const calls=await page.evaluate(()=>window.testState.calls);assert.deepEqual(calls.slice(0,3),['permission','play','model']);
 await page.locator('#camera-stop').click();await page.locator('#camera-start').click();await page.waitForFunction(()=>document.querySelector('#camera-diagnostic-info').textContent.includes('步骤：追踪运行'));await page.locator('#camera-stop').click();
 }else{await page.waitForFunction(()=>document.querySelector('#camera-diagnostic-info').textContent.includes('失败'));}
 const data=await page.evaluate(()=>({calls:window.testState.calls,info:document.querySelector('#camera-diagnostic-info').textContent,ended:window.testState.tracks.every(t=>t.readyState==='ended'),count:document.querySelectorAll('#camera-video').length,video:document.querySelector('#camera-video').parentElement.parentElement.parentElement.className,constraints:window.testState.constraints}));
 assert.equal(data.count,1);assert(data.ended);
 if(scenario==='insecure'){assert(data.info.includes('https://ff7kl.github.io/shoushijiaohu/'));assert.equal(data.calls.length,0);}
 if(scenario==='embedded-missing')assert(data.info.includes('系统浏览器'));
 if(scenario==='denied'){assert(data.info.includes('NotAllowedError'));assert(data.info.includes('不能强制'));}
 if(scenario==='play-fail')assert(data.info.includes('视频启动失败'));
 if(scenario==='model-fail')assert(data.info.includes('模型加载失败'));
 if(data.constraints)assert.equal(data.constraints.audio,false);
 if(['denied','play-fail','model-fail'].includes(scenario)){
 await page.evaluate(()=>window.testState.scenario='success');await page.locator('#camera-start').click();
 await page.waitForFunction(()=>document.querySelector('#camera-diagnostic-info').textContent.includes('步骤：追踪运行'));await page.locator('#camera-stop').click();
 assert(await page.evaluate(()=>window.testState.tracks.every(t=>t.readyState==='ended')));data.retry='passed';
 }
 results.push({scenario,...data});await context.close();
}
writeFileSync('screenshots/camera-startup-results.json',JSON.stringify({kind:'desktop Chrome, synthetic video stream and model; not real phone',results},null,2));console.log('8项浏览器摄像头启动/失败/取消/重开/安全上下文/内置浏览器/策略检查通过');
}finally{await browser.close();}
