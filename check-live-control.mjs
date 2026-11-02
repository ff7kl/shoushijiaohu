import assert from 'node:assert/strict';
import {palmAngles,signedFinger,headTarget,follow,angleDelta,stepHeight,guardPalm,updatePalm,resetPalm,calibrationResult} from './live-control.js';
import {testHand} from './test-hands.mjs';
const range={open:.02,neutral:.17,closed:.4};
assert.equal(signedFinger(.17,range).value,0);assert.equal(signedFinger(.18,range).value,0);
assert.equal(signedFinger(.02,range).value,-1);assert.equal(signedFinger(.4,range).value,1);
assert(signedFinger(1,range).limited);assert.equal(signedFinger(.3,null).value,0);
assert(Math.abs(angleDelta(-Math.PI+.01,Math.PI-.01)-.02)<1e-8);
const baseline=palmAngles(testHand('up',false,true));assert(baseline);assert.deepEqual(headTarget(baseline,baseline),[0,0]);
assert.equal(palmAngles(Array(21).fill({x:0,y:0,z:0})),null);
assert.equal(palmAngles(Array(21).fill({x:NaN,y:0,z:0})),null);
const points=testHand('up',false,true);const turned=points.map(p=>({x:p.x*Math.cos(.3)+p.z*Math.sin(.3),y:p.y,z:-p.x*Math.sin(.3)+p.z*Math.cos(.3)}));assert(Math.abs(headTarget(palmAngles(turned),baseline)[0])>.2);
let a=0,b=0;for(let i=0;i<60;i++)a=follow(a,1,1/60,100);for(let i=0;i<120;i++)b=follow(b,1,1/120,100);assert(Math.abs(a-b)<1e-10);
assert(follow(0,1,.016,1.5)<=.024);assert(follow(1,0,.016,1.5)>=.976);
console.log('真人映射：中立区、独立前后摆、限幅、掌面旋转/退化/跨界、dt平滑和重入速率限制通过');

assert.equal(stepHeight(0),0);assert(Math.abs(stepHeight(1))<1e-10);assert(stepHeight(.5)>.6);assert(stepHeight(-.5)<.15);
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
const partial=calibrationResult(old,[0,1,2,3,4],[0,0,0,0,0],[.2,.01,.2,.2,.2],[.5,.5,.5,.5,.5],base,{yaw:1,pitch:0});assert.deepEqual(partial.failed,[1]);assert.deepEqual(partial.ranges[1],old[1]);assert.equal(partial.ranges[0].neutral,.2);
console.log('状态序列通过：孤立跳变、稳定新姿势接入、交替抖动拒绝、退化/丢手/关机重置、跨π、最大速率与有限值、校准隔离');

const interrupted={};updatePalm(interrupted,{yaw:0,pitch:0},0);
for(let t=20;t<=300;t+=20)updatePalm(interrupted,{yaw:2,pitch:0},t);
updatePalm(interrupted,null,320);
assert.equal(updatePalm(interrupted,{yaw:2,pitch:0},340),null);assert.equal(interrupted.pending.count,1);
assert.equal(interrupted.validAt,0);
