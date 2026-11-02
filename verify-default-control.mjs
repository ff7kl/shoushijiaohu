import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('http://motion.test/**',async route=>{const url=new URL(route.request().url());let file=path.join(process.cwd(),'dist',decodeURIComponent(url.pathname.replace(/^\/shoushijiaohu\//,'')));if(url.pathname.endsWith('/'))file=path.join(file,'index.html');if(url.pathname.endsWith('/collision-test.js')){await route.fulfill({body:readFileSync('lamp-collision.js','utf8').replace("from 'three'","from './three-test.js'"),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three-test.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.module.js'),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three.core.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.core.js'),contentType:'text/javascript'});return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'};if(existsSync(file))await route.fulfill({body:readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});else await route.abort();});
await page.goto('http://motion.test/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);await page.selectOption('#puppet-choice','rigged');await page.waitForFunction(()=>window.theatre.activeCharacter.loaded);await page.waitForTimeout(500);

await page.evaluate(()=>{window.fakeHand=(angles)=>{const points=Array.from({length:21},()=>({x:.5,y:.5,z:0}));for(const [n,base] of [1,5,9,13,17].entries()){points[base]={x:.35+n*.07,y:.32,z:0};for(let j=1;j<4;j++){const prev=points[base+j-1],angle=angles[n]*j;points[base+j]={x:prev.x+Math.sin(angle)*.07,y:prev.y-Math.cos(angle)*.07,z:0};}}return points;};window.sendFake=(angles,right=false)=>window.dispatchEvent(new CustomEvent('handtracking',{detail:{active:true,left:{visible:!!angles,landmarks:angles?window.fakeHand(angles):[],worldLandmarks:angles?window.fakeHand(angles).map(p=>{const yaw=window.testYaw||0,pitch=window.testPitch||0;const x=p.x*Math.cos(yaw)+p.z*Math.sin(yaw),z=-p.x*Math.sin(yaw)+p.z*Math.cos(yaw);return {x,y:p.y*Math.cos(pitch)-z*Math.sin(pitch),z:p.y*Math.sin(pitch)+z*Math.cos(pitch)};}):[]},right:{visible:right,landmarks:right?window.fakeHand(Array(5).fill(.8)):[]}}}));});

try{
 assert((await page.evaluate(()=>window.theatre.liveCalibration.ranges)).every(r=>r===null));
 await page.evaluate(()=>{window.fakeTimer=setInterval(()=>window.sendFake([.05,.05,1.5,.05,.05]),40);});
 await page.waitForTimeout(1500);
 const state=await page.evaluate(()=>({target:window.theatre.liveDiagnostics.target,actual:window.theatre.driver.values}));
 console.log(JSON.stringify(state));assert(state.target[0]>.5);assert(state.actual[0]>.4);assert(Math.abs(state.target[1])<.01);
 console.log('PASS: without calibration, middle finger drives left arm; index remains neutral');
}finally{await browser.close();}
