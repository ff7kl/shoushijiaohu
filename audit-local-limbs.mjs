import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('http://motion.test/**',async route=>{const url=new URL(route.request().url());let file=path.join(process.cwd(),'dist',decodeURIComponent(url.pathname.replace(/^\/shoushijiaohu\//,'')));if(url.pathname.endsWith('/'))file=path.join(file,'index.html');if(url.pathname.endsWith('/collision-test.js')){await route.fulfill({body:readFileSync('lamp-collision.js','utf8').replace("from 'three'","from './three-test.js'"),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three-test.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.module.js'),contentType:'text/javascript'});return;}if(url.pathname.endsWith('/three.core.js')){await route.fulfill({body:readFileSync('node_modules/three/build/three.core.js'),contentType:'text/javascript'});return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'};if(existsSync(file))await route.fulfill({body:readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});else await route.abort();});
await page.goto('http://motion.test/shoushijiaohu/');await page.waitForFunction(()=>window.theatre);await page.selectOption('#puppet-choice','rigged');await page.waitForFunction(()=>window.theatre.activeCharacter.loaded);await page.waitForTimeout(500);

const report=await page.evaluate(()=>{
 const t=window.theatre,c=t.activeCharacter;
 const snapshot=()=>c.chains.map(k=>({name:k.upper.name,index:k.index,sign:k.sign,auto:k.upper.matrixAutoUpdate,lowerAuto:k.lower.matrixAutoUpdate,q:k.upper.quaternion.toArray(),tip:t.activePuppet.worldToLocal(k.tip.getWorldPosition(k.tip.position.clone())).toArray()}));
 const rows=[];
 for(const index of [-1,0,1,3,4]){const values=Array(9).fill(0);if(index>=0)values[index]=1;c.update(values);rows.push({index,bones:snapshot()});}
 return rows;
});
try{
 const baseline=report[0].bones;
 assert.deepEqual(baseline.map(b=>b.index),[0,3,1,4]);
 assert.deepEqual(baseline.map(b=>b.sign),[1,1,-1,-1]);
 for(const row of report.slice(1)){
  for(let i=0;i<row.bones.length;i++){
   const distance=Math.hypot(...row.bones[i].tip.map((v,j)=>v-baseline[i].tip[j]));
   if(row.bones[i].index===row.index)assert(distance>.05,`Input ${row.index}: ${row.bones[i].name} did not move (${distance})`);
   else assert(distance<1e-6,`Input ${row.index}: unrelated ${row.bones[i].name} moved (${distance})`);
  }
 }
 console.log('PASS: thumb/left arm, index/right arm, ring/left leg, pinky/right leg; independent motion in puppet coordinates');
 console.log(JSON.stringify(report));
}finally{await browser.close();}
