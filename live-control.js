import {Vector3} from 'three';
import {clamp} from './puppet-control.js';
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function palmAngles(points){
 if(!Array.isArray(points)||points.length!==21||points.some(p=>!p||![p.x,p.y,p.z].every(Number.isFinite)))return null;
 const p=i=>new Vector3(points[i].x,-points[i].y,-points[i].z);
 const width=p(5).sub(p(17)),forward=p(9).add(p(13)).multiplyScalar(.5).sub(p(0));
 const area=width.clone().cross(forward);
 if(width.length()<1e-5||forward.length()<1e-5||area.length()/(width.length()*forward.length())<.2)return null;
 area.normalize();return {yaw:Math.atan2(area.x,area.z),pitch:Math.atan2(area.y,Math.hypot(area.x,area.z))};
}
export function signedFinger(raw,range,gain=1){
 range??={open:.03,neutral:.03,closed:.35};
 if(![raw,range.open,range.neutral,range.closed].every(Number.isFinite))return {value:0,limited:false};
 const delta=raw-range.neutral,span=delta<0?range.neutral-range.open:range.closed-range.neutral;
 if(span<.025)return {value:0,limited:false};
 const dead=span*.15,value=Math.sign(delta)*Math.max(0,(Math.abs(delta)-dead)/(span-dead))*gain;
 return {value:clamp(value,-1,1),limited:Math.abs(value)>1};
}
export function headTarget(angles,baseline,gain=1,range=1){
 if(!angles||!baseline)return [0,0];
 return [clamp(angleDelta(angles.yaw,baseline.yaw)/.7*gain,-1,1)*range,clamp(angleDelta(angles.pitch,baseline.pitch)/.45*gain,-1,1)*range];
}
export function follow(current,target,dt,rate=3,speed=12){
 const step=(target-current)*(1-Math.exp(-Math.max(0,dt)*speed));
 return current+clamp(step,-rate*dt,rate*dt);
}

// Positive control traverses an independent step arc; no clock or gait oscillator.
export function stepHeight(value){
 const t=clamp(value,-1,1);
 return .65*Math.max(0,t);
}
export function guardPalm(current,previous,elapsed){
 if(!current)return null;
 if(previous&&elapsed<.3&&(Math.abs(angleDelta(current.yaw,previous.yaw))>1.2||Math.abs(angleDelta(current.pitch,previous.pitch))>.9))return null;
 return current;
}

export function resetPalm(state,reason='lost'){
 state.current=null;state.pending=null;state.reason=reason;
 if(reason==='lost'||reason==='camera-off'){
  state.lastValid=null;state.validAt=-Infinity;state.candidateAt=-Infinity;
 }
}
export function updatePalm(state,candidate,now){
 state.current=null;
 if(!candidate||![candidate.yaw,candidate.pitch,now].every(Number.isFinite)){resetPalm(state,'degenerate');return null;}
 const gap=now-(state.candidateAt??-Infinity);
 if(gap>1000)resetPalm(state,'lost');
 state.candidateAt=now;
 let accepted=guardPalm(candidate,state.lastValid,0);
 if(!accepted){
  const pending=state.pending;
  // Compare against the start of the window: alternating noise cannot drift into acceptance.
  if(!pending||gap>150||Math.abs(angleDelta(candidate.yaw,pending.anchor.yaw))>.12||Math.abs(angleDelta(candidate.pitch,pending.anchor.pitch))>.12){
   state.pending={anchor:{...candidate},since:now,count:1};
  }else{
   pending.count++;
   if(now-pending.since>=350&&pending.count>=8)accepted=candidate;
  }
 }
 if(accepted){state.lastValid={...accepted};state.validAt=now;state.current=state.lastValid;state.pending=null;state.reason='valid';}
 else state.reason='jump-or-unstable';
 return state.current;
}
export function calibrationResult(ranges,indices,open,neutral,closed,baseline,newBaseline=null){
 const next=ranges.slice(),failed=[],reasons={};
 for(const i of indices){
  let reason='';
  if(![open[i],neutral[i],closed[i]].every(Number.isFinite))reason='采样无效，请保持手掌入镜';
  else if(open[i]-neutral[i]>.025)reason='伸展比自然中立更弯曲，请按顺序重试';
  else if(closed[i]-neutral[i]<.025)reason='弯曲与中立差异不足，请增大弯曲幅度';
  if(reason){failed.push(i);reasons[i]=reason;}
  else next[i]={open:Math.min(open[i],neutral[i]),neutral:neutral[i],closed:closed[i]};
 }
 return {ranges:next,failed,reasons,baseline:indices.length===5&&newBaseline?{...newBaseline}:baseline};
}

// Four fingers decide the gesture; the thumb can rest outside the fist.
export function updateHeadFlight(state, raw, now, visible=true){
 if(!visible||!Array.isArray(raw)||raw.length!==5||!raw.every(Number.isFinite)){
  state.raised=false;state.since=null;return false;
 }
 const fingers=raw.slice(1),closed=fingers.every(x=>x>.22),open=fingers.every(x=>x<.12);
 if(open){state.raised=false;state.since=null;}
 else if(closed){state.since??=now;if(now-state.since>=200)state.raised=true;}
 else state.since=null;
 return !!state.raised;
}

// Finger order: thumb, index, middle, ring, pinky. Pose slots retain rig compatibility.
export function fingerPose(fingers,limbRange=1,headGain=1,headRange=1){
 const [thumb,index,middle,ring,pinky]=fingers;
 return [middle*limbRange,index*limbRange,0,ring*limbRange,pinky*limbRange,stepHeight(ring)*limbRange,stepHeight(pinky)*limbRange,clamp(thumb*headGain,-1,1)*headRange,0];
}

export function stableFingerSample(samples,indices){
 if(samples.length<4)return {ok:false,reason:'有效帧不足4帧，请保持姿势重采'};
 const mean=Array(5).fill(0),noise=Array(5).fill(0);
 for(let i=0;i<5;i++){
  const values=samples.map(s=>s[i]).sort((a,b)=>a-b);
  if(values.some(v=>!Number.isFinite(v)))return {ok:false,reason:'手指关键点无效，请重新入镜'};
  mean[i]=values[Math.floor(values.length/2)];
  noise[i]=values[Math.floor((values.length-1)*.9)]-values[Math.floor((values.length-1)*.1)];
 }
 // Median sampling tolerates ordinary hand movement; calibration is optional.
 return {ok:true,mean,noise};
}
