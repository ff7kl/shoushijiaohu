import assert from 'node:assert/strict';
import {palmAngles,signedFinger,headTarget,follow,angleDelta,stepHeight,guardPalm,updatePalm,calibrationResult} from './live-control.js';
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
for(let time=20;time<=2000;time+=20){assert.equal(updatePalm(state,{yaw:3,pitch:0},time),null);assert.deepEqual(state.lastValid,{yaw:0,pitch:0});assert.equal(state.validAt,0);}
assert(updatePalm(state,{yaw:.1,pitch:.1},2020));assert.equal(state.validAt,2020);
updatePalm(state,null,2100);assert.equal(state.current,null);assert.equal(state.validAt,2020);
assert(updatePalm(state,{yaw:3,pitch:0},4000));assert.equal(state.validAt,4000);
let output=0;output=follow(output,headTarget(state.current,{yaw:0,pitch:0})[0],.016,1.5);assert(Math.abs(output)<=.024);
const base={yaw:.3,pitch:.2},old=Array.from({length:5},()=>({...range}));
const single=calibrationResult(old,[1],[0,0,0,0,0],[.2,.2,.2,.2,.2],[.5,.5,.5,.5,.5],base,{yaw:2,pitch:1});assert.deepEqual(single.baseline,base);assert.deepEqual(single.ranges[0],old[0]);
const partial=calibrationResult(old,[0,1,2,3,4],[0,0,0,0,0],[.2,.01,.2,.2,.2],[.5,.5,.5,.5,.5],base,{yaw:1,pitch:0});assert.deepEqual(partial.failed,[1]);assert.deepEqual(partial.ranges[1],old[1]);assert.equal(partial.ranges[0].neutral,.2);
console.log('状态序列通过：连续异常不解锁、正常恢复、长失追平滑重入、单指校准隔离、部分失败保留');
