import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-proxy-server']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('http://motion.test/**',async route=>{const url=new URL(route.request().url());let file=path.join(process.cwd(),'dist',decodeURIComponent(url.pathname.replace(/^\/shoushijiaohu\//,'')));if(url.pathname.endsWith('/'))file=path.join(file,'index.html');if(url.pathname.endsWith('/collision-test.js')){await route.fulfill({body:readFileSync('lamp-collision.js','utf8').replace("from 'three'","from './three-test.js'"),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three-test.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.module.js'),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three.core.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.core.js'),contentType:'text/javascript'});return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'};if(existsSync(file))await route.fulfill({body:readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});else await route.abort();});
await page.goto('http://motion.test/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);await page.waitForTimeout(2500);
await page.locator('details').last().locator('summary').click();await page.locator('#simulate').check();const results=[];
for(const role of (process.env.MOTION_ROLE?[process.env.MOTION_ROLE]:['classic','student','wooden','rigged'])){
 const baselines={};
 const options=await page.locator('#puppet-choice option').evaluateAll(es=>es.map(e=>e.value));
 const selected=role==='student'?options.find(x=>!['classic','wooden','rigged'].includes(x)):role;
 await page.selectOption('#puppet-choice',selected);await page.waitForTimeout(1500);
 for(const [name,values] of Object.entries({neutral:[0,0,0,0,0,0,0,0,0],forward:[1,1,0,1,1,0,0,0,0],back:[-1,-1,0,-1,-1,0,0,0,0],leftStep:[0,0,0,1,-1,1,0,0,0],rightStep:[0,0,0,-1,1,0,1,0,0],lookUp:[0,0,0,0,0,0,0,0,-1],lookDown:[0,0,0,0,0,0,0,0,1],lookLeft:[0,0,0,0,0,0,0,-1,0],lookRight:[0,0,0,0,0,0,0,1,0],liftLook:[0,0,1,0,0,0,0,1,-1]})){
 await page.evaluate(values=>values.forEach((v,i)=>{const e=document.querySelector('#sim-'+i);e.value=v;e.dispatchEvent(new Event('input'));}),values);await page.waitForTimeout(800);
 const state=await page.evaluate(()=>({values:window.theatre.driver.values,rigError:window.theatre.puppet.children[0].userData.rigError,rigLoaded:window.theatre.puppet.children[0].userData.rigLoaded}));
 assert(state.values.every(Number.isFinite));assert(state.values.every((v,i)=>Math.abs(v-values[i])<.02));if(role==='rigged')assert(state.rigLoaded&&!state.rigError);
 const metrics=await page.evaluate(async()=>{
 const THREE=await import('http://motion.test/shoushijiaohu/three-test.js');
 const t=window.theatre,c=t.activeCharacter,v=t.driver.values;
 const head=c.headBone?c.headRest.clone().invert().multiply(c.headBone.quaternion):c.head.userData.neckPivot.quaternion;
 const {collisionBoxes,safeLamp,nearestLamp}=await import('http://motion.test/shoushijiaohu/collision-test.js');
 const boxes=collisionBoxes(t.activePuppet);const lampSafe=safeLamp(t.lamp.position,boxes);
 const contacts=[new THREE.Vector3(0,2.2,.65),new THREE.Vector3(.5,1.5,.65)].map(p=>{const safe=nearestLamp(p,boxes);return !!safe&&safeLamp(safe,boxes);});
 const pivot=c.headBone||c.head.userData.neckPivot;
 const original=v.slice(),bodyBefore=c.body.matrixWorld.clone(),pivotBefore=pivot.getWorldPosition(new THREE.Vector3());
 const qBefore=pivot.quaternion.clone();
 if(c.headBone){for(let i=0;i<3;i++){c.update([0,0,0,0,0,0,0,1,-1]);c.update(original);} }
 const drift=qBefore.angleTo(pivot.quaternion);
 const lengths=c.chains?.map(chain=>{const a=chain.upper.getWorldPosition(new THREE.Vector3()),b=chain.lower.getWorldPosition(new THREE.Vector3()),d=chain.tip.getWorldPosition(new THREE.Vector3());return [a.distanceTo(b),b.distanceTo(d)];});
 let sole=Infinity;
 if(!c.meshes){for(const foot of c.footObjects||t.limbs.filter(l=>l.leg).map(l=>l.tip)){const b=new THREE.Box3().setFromObject(foot,true);sole=Math.min(sole,t.activePuppet.worldToLocal(b.min.clone()).y);}}
 for(const mesh of c.meshes||[]){for(let i=0;i<mesh.geometry.attributes.position.count;i++){const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);sole=Math.min(sole,t.activePuppet.worldToLocal(p).y);}}
 return {lampSafe,contacts,drift,lengths,sole:Number.isFinite(sole)?sole:null,pivot:pivotBefore.toArray(),bodyMatrix:bodyBefore.elements,head:head.toArray(),bodyY:c.body.position.y-(c.body.userData.baseY||0),errors:t.limbs.map(l=>{const root=l.root.clone();root.y+=v[2]*.55;return Math.max(Math.abs(root.distanceTo(l.joint.position)-l.a),Math.abs(l.joint.position.distanceTo(l.end)-l.b));}),footY:t.limbs.filter(l=>l.leg).map(l=>l.end.y)};
 });
 assert(metrics.sole>=.05999);assert(metrics.lampSafe);assert(metrics.contacts.every(Boolean));
 if(name==='neutral')baselines.neutral=metrics;
 if(name.startsWith('look')){assert(metrics.bodyMatrix.every((x,i)=>Math.abs(x-baselines.neutral.bodyMatrix[i])<1e-5));assert(metrics.pivot.every((x,i)=>Math.abs(x-baselines.neutral.pivot[i])<.002),JSON.stringify({role,name,pivot:metrics.pivot,baseline:baselines.neutral.pivot}));}
 if(role==='rigged'){assert(metrics.sole>=.05999);assert(metrics.lengths.flat().every((x,i)=>Math.abs(x-baselines.neutral.lengths.flat()[i])<1e-5));assert(metrics.drift<1e-6);assert(metrics.lengths.flat().every(x=>x>0&&Number.isFinite(x)));}
 assert(metrics.errors.every(e=>e<1e-6));assert(metrics.footY.every(y=>y>=.13));
 if(name.startsWith('look')||name==='liftLook')assert(Math.hypot(...metrics.head.slice(0,3))>.1);
 if(name==='neutral')assert(Math.hypot(...metrics.head.slice(0,3))<.001);
 if(name==='liftLook')assert(Math.abs(metrics.bodyY-.55)<.001);
 results.push({role,name,...state,metrics});await page.screenshot({path:`screenshots/motion-${role}-${name}.png`});
 }
}
writeFileSync('screenshots/motion-results.json',JSON.stringify(results,null,2));await browser.close();console.log(`${results.length} poses: geometry, head independence, drift, lamp assertions and screenshots passed`);



