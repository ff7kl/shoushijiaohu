import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {curls,solveIK,normalizeCurl,limbPose} from './puppet-control.js';
const points=Array.from({length:21},(_,i)=>({x:i,y:0,z:0}));
assert(curls(points).every(x=>x===0));
points.forEach(p=>{p.x=0;});assert(curls(points).every(Number.isFinite));
for(const t of [new Vector3(),new Vector3(100,-100,30),new Vector3(0,0,5)])for(const sign of [-1,1]){
 const r=new Vector3(),{joint,end}=solveIK(r,t,.55,.38,sign);
 assert(Math.abs(joint.distanceTo(r)-.55)<1e-7);assert(Math.abs(joint.distanceTo(end)-.38)<1e-7);
 assert([...joint,...end].every(Number.isFinite));
}
console.log('弯曲量与不可达 IK 数值检查通过');

const range={open:.08,closed:.38};
assert.equal(normalizeCurl(.08,range),0);
assert.equal(normalizeCurl(.38,range),1);
assert.equal(normalizeCurl(-1,range),0);
assert.equal(normalizeCurl(2,range),1);
for(const range of [null,{open:.1,closed:.1},{open:.1,closed:.100000001},{open:NaN,closed:1}]){
 for(const raw of [NaN,Infinity,-1,0,.2,1]){
  const value=normalizeCurl(raw,range);assert(Number.isFinite(value));assert(value>=0 && value<=1);
 }
}
assert(Math.abs(normalizeCurl(.23,range)-.5)<1e-12);
console.log('归一化端点、跨度退化、非有限值检查通过');


for(const side of [-1,1])for(const leg of [false,true]){
 let previous;
 for(let n=0;n<=100;n++){
  const pose=limbPose(side,leg,n/100);
  assert([...pose.root,...pose.joint,...pose.end].every(Number.isFinite));
  assert(Math.abs(pose.root.distanceTo(pose.joint)-(leg?.44:.56))<1e-7);
  assert(Math.abs(pose.joint.distanceTo(pose.end)-(leg?.36:.34))<1e-7);
  if(leg)assert(pose.end.y-.07>=.06);
  if(previous)assert(previous.distanceTo(pose.joint)<.04);
  previous=pose.joint;
 }
 assert(limbPose(side,leg,0).end.distanceTo(limbPose(side,leg,1).end)>.5);
}
console.log('四肢全行程：长度、有限值、地面、关节连续性通过');

const {handPosition}=await import('./puppet-control.js');
const {testHand}=await import('./test-hands.mjs');
function positioned(size,x){const hand=testHand('up',false,true);const wrist=hand[0];return hand.map(p=>({x:x+(p.x-wrist.x)*size/.2,y:.5+(p.y-wrist.y)*size/.2,z:p.z*size/.2}));}
for(const role of ['puppet','lamp'])for(const size of [.07,.18,.35]){
 const left=handPosition(positioned(size,.95),role),right=handPosition(positioned(size,.05),role);
 assert.equal(left.x,role==='lamp'?-1.5:-2.7);assert.equal(right.x,role==='lamp'?1.5:2.7);
 assert.equal(left.z,role==='lamp'?.3:.65);

 const a=handPosition(positioned(size,.55),role),b=handPosition(positioned(size,.55),role);assert.deepEqual(a,b);
}
for(const role of ['puppet','lamp'])assert(Math.abs(handPosition(positioned(.35,.55),role).x)>Math.abs(handPosition(positioned(.07,.55),role).x));
assert.equal(handPosition([]),null);assert.equal(handPosition(Array.from({length:21},()=>({x:0,y:0,z:0}))),null);
const bad=testHand();bad[3].x=NaN;assert.equal(handPosition(bad),null);
console.log('手掌大小响应、大小手到达两侧边界、固定前后位置、退化输入检查通过');

const {pinchState}=await import('./puppet-control.js');
const h=testHand();h[0]={x:0,y:0,z:0};h[9]={x:0,y:1,z:0};h[8]={x:0,y:0,z:0};
for(const [d,prev,expected] of [[.29,false,true],[.35,true,true],[.35,false,false],[.46,true,false]]){h[4]={x:d,y:0,z:0};assert.equal(pinchState(h,prev),expected);}
assert.equal(pinchState([] ,true),false);h[9]=h[0];assert.equal(pinchState(h,true),false);
console.log('掌长归一化捏合滞回及退化输入通过');

for(const side of [-1,1])for(const leg of [false,true])for(const t of [-1,0,1])for(const height of [0,1]){
 const p=limbPose(side,leg,t,0,height);
 assert(Math.abs(p.root.distanceTo(p.joint)-(leg?.44:.56))<1e-7);
 assert(Math.abs(p.joint.distanceTo(p.end)-(leg?.36:.34))<1e-7);
 if(leg)assert(p.end.y>=.13);
 if(t)assert(Math.sign(p.end.z)===t);
}
console.log('有符号前后摆、独立抬脚与骨长断言通过');
