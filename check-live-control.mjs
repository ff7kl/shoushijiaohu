import assert from 'node:assert/strict';
import {updateHeadFlight,stableFingerSample,fingerPose,palmAngles,signedFinger,headTarget,follow,angleDelta,stepHeight,guardPalm,updatePalm,resetPalm,calibrationResult} from './live-control.js';
import {testHand} from './test-hands.mjs';
const range={open:.02,neutral:.17,closed:.4};
assert.equal(signedFinger(.17,range).value,0);assert.equal(signedFinger(.18,range).value,0);
assert.equal(signedFinger(.02,range).value,-1);assert.equal(signedFinger(.4,range).value,1);
assert(signedFinger(1,range).limited);assert(signedFinger(.3,null).value>.7);assert.equal(signedFinger(.03,null).value,0);
assert(Math.abs(angleDelta(-Math.PI+.01,Math.PI-.01)-.02)<1e-8);
const baseline=palmAngles(testHand('up',false,true));assert(baseline);assert.deepEqual(headTarget(baseline,baseline),[0,0]);
assert.equal(palmAngles(Array(21).fill({x:0,y:0,z:0})),null);
assert.equal(palmAngles(Array(21).fill({x:NaN,y:0,z:0})),null);
const points=testHand('up',false,true);const turned=points.map(p=>({x:p.x*Math.cos(.3)+p.z*Math.sin(.3),y:p.y,z:-p.x*Math.sin(.3)+p.z*Math.cos(.3)}));assert(Math.abs(headTarget(palmAngles(turned),baseline)[0])>.2);
let a=0,b=0;for(let i=0;i<60;i++)a=follow(a,1,1/60,100);for(let i=0;i<120;i++)b=follow(b,1,1/120,100);assert(Math.abs(a-b)<1e-10);
assert(follow(0,1,.016,1.5)<=.024);assert(follow(1,0,.016,1.5)>=.976);
console.log('真人映射：中立区、独立前后摆、限幅、掌面旋转/退化/跨界、dt平滑和重入速率限制通过');

assert.equal(stepHeight(0),0);assert.equal(stepHeight(1),.65);assert.equal(stepHeight(.5),.325);assert(stepHeight(-.5)<.15);
for(let t=-1;t<1;t+=.01)assert(Math.abs(stepHeight(t+.01)-stepHeight(t))<.025);
assert.equal(guardPalm({yaw:3,pitch:0},{yaw:0,pitch:0},.02),null);
assert(guardPalm({yaw:-Math.PI+.01,pitch:0},{yaw:Math.PI-.01,pitch:0},.02));

const state={};updatePalm(state,{yaw:0,pitch:0},0);
assert.equal(updatePalm(state,{yaw:2,pitch:0},20),null);assert.equal(state.validAt,0);
assert(updatePalm(state,{yaw:.1,pitch:0},40));assert.equal(state.pending,null);
let output=0,maxSpeed=0;
for(let time=60;time<=600;time+=20){
 const value=updatePalm(state,{yaw:2,pitch:.2},time);
 if(time<420)assert.equal(value,null);
 const before=output;output=follow(output,headTarget(value,{yaw:0,pitch:0})[0],.02,1.5);
 assert(Number.isFinite(output));maxSpeed=Math.max(maxSpeed,Math.abs(output-before)/.02);
}
assert(state.current);assert(maxSpeed<=1.5+1e-10);
resetPalm(state,'camera-off');assert.equal(state.lastValid,null);assert.equal(state.pending,null);
updatePalm(state,{yaw:0,pitch:0},1000);
for(let time=1020;time<4020;time+=20){assert.equal(updatePalm(state,{yaw:time%40===0?2:-2,pitch:0},time),null);assert.equal(state.validAt,1000);}
updatePalm(state,null,4040);assert.equal(state.pending,null);assert.equal(state.reason,'degenerate');assert.equal(state.validAt,1000);
assert(updatePalm(state,{yaw:.1,pitch:0},4060));
updatePalm(state,{yaw:2,pitch:0},4080);resetPalm(state,'lost');assert.equal(state.pending,null);
assert(updatePalm(state,{yaw:-2,pitch:0},4100));
resetPalm(state,'camera-off');updatePalm(state,{yaw:Math.PI-.01,pitch:0},5000);
assert(updatePalm(state,{yaw:-Math.PI+.01,pitch:0},5020));assert.equal(state.pending,null);
assert.equal(updatePalm(state,{yaw:NaN,pitch:0},5040),null);assert.equal(state.pending,null);
resetPalm(state,'lost');assert(updatePalm(state,{yaw:0,pitch:0},7000));
const base={yaw:.3,pitch:.2},old=Array.from({length:5},()=>({...range}));
const single=calibrationResult(old,[1],[0,0,0,0,0],[.2,.2,.2,.2,.2],[.5,.5,.5,.5,.5],base,{yaw:2,pitch:1});assert.deepEqual(single.baseline,base);assert.deepEqual(single.ranges[0],old[0]);
const partial=calibrationResult(old,[0,1,2,3,4],[0,0,0,0,0],[.2,.49,.2,.2,.2],[.5,.5,.5,.5,.5],base,{yaw:1,pitch:0});assert.deepEqual(partial.failed,[1]);assert.deepEqual(partial.ranges[1],old[1]);assert.equal(partial.ranges[0].neutral,.2);
console.log('状态序列通过：孤立跳变、稳定新姿势接入、交替抖动拒绝、退化/丢手/关机重置、跨π、最大速率与有限值、校准隔离');

const interrupted={};updatePalm(interrupted,{yaw:0,pitch:0},0);
for(let t=20;t<=300;t+=20)updatePalm(interrupted,{yaw:2,pitch:0},t);
updatePalm(interrupted,null,320);
assert.equal(updatePalm(interrupted,{yaw:2,pitch:0},340),null);assert.equal(interrupted.pending.count,1);
assert.equal(interrupted.validAt,0);

const relaxed=calibrationResult(Array(5).fill(null),[0,1,2,3,4],Array(5).fill(.01),Array(5).fill(.02),Array(5).fill(.5),null);
assert.deepEqual(relaxed.failed,[]);
for(const r of relaxed.ranges){assert.equal(signedFinger(.5,r).value,1);assert.equal(signedFinger(.02,r).value,0);assert.equal(signedFinger(.01,r).value,0);}
const noise=calibrationResult([null],[0],[.025],[.02],[.5],null);assert.deepEqual(noise.failed,[]);assert.equal(noise.ranges[0].open,.02);
for(const [open,neutral,closed] of [[.3,.02,.5],[.01,.02,.03],[NaN,.02,.5]]){const bad=calibrationResult([null],[0],[open],[neutral],[closed],null);assert.deepEqual(bad.failed,[0]);assert.ok(bad.reasons[0]);}
console.log('自然中立接近伸直：弯曲全行程、放松回中、噪声容差与无效采样拒绝通过');

assert.deepEqual(fingerPose([1,0,0,0,0]),[0,0,0,0,0,0,0,1,0]);
assert.deepEqual(fingerPose([-1,0,0,0,0]),[0,0,0,0,0,0,0,-1,0]);
assert.deepEqual(fingerPose([0,0,1,0,0]),[1,0,0,0,0,0,0,0,0]);
assert.deepEqual(fingerPose([0,1,0,0,0]),[0,1,0,0,0,0,0,0,0]);
assert.deepEqual(fingerPose([0,0,0,1,0]),[0,0,0,1,0,.65,0,0,0]);
assert.deepEqual(fingerPose([0,0,0,0,1]),[0,0,0,0,1,0,.65,0,0]);
console.log('新五指映射、拇指双向转头、双脚独立单调抬高通过');

assert.equal(stableFingerSample(Array.from({length:20},()=>Array(5).fill(.1)),[0,1,2,3,4]).ok,true);
assert.equal(stableFingerSample(Array.from({length:20},(_,i)=>Array(5).fill(i%2?.1:.3)),[0]).ok,true);
assert.equal(stableFingerSample([Array(5).fill(.1)],[0]).ok,false);
const tiny=calibrationResult([null],[0],[.01],[.02],[.03],null);assert.deepEqual(tiny.failed,[0]);
console.log('采样稳定性、有效帧下限和过小跨度拒绝通过');

const flight={raised:false,since:null};
assert.equal(updateHeadFlight(flight,[0,.4,.4,.4,.4],0),false);
assert.equal(updateHeadFlight(flight,[0,.4,.4,.4,.4],250),true);
assert.equal(updateHeadFlight(flight,[0,.17,.17,.17,.17],300),true);
assert.equal(updateHeadFlight(flight,[0,.02,.02,.02,.02],350),false);
assert.equal(updateHeadFlight(flight,[0,.5,0,0,0],700),false);
updateHeadFlight(flight,[0,.4,.4,.4,.4],800);assert(updateHeadFlight(flight,[0,.4,.4,.4,.4],1050));
assert.equal(updateHeadFlight(flight,[0,.4,.4,.4,.4],1100,false),false);
console.log('握拳升头、张手回落、单指不误触与丢手复位通过');
