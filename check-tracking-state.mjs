import assert from 'node:assert/strict';
import {frameReady} from './tracking-state.js';
const valid={model:true,live:true,hidden:false,width:640,height:480,readyState:2,time:1,lastTime:0,busy:false,now:1000,lastAttempt:800,inferenceMs:20};
assert.equal(frameReady(valid),true);
for(const patch of [{model:false},{live:false},{hidden:true},{width:0},{height:0},{readyState:1},{lastTime:1},{busy:true},{lastAttempt:980},{inferenceMs:250}])assert.equal(frameReady({...valid,...patch}),false);
console.log('有效帧、轨道、后台、重复帧与测量限频检查通过');

assert.equal(frameReady({...valid,now:840}),true);
assert.equal(frameReady({...valid,now:900,inferenceMs:80}),true);
