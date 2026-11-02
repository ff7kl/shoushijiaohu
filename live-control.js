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
 if(!range||![raw,range.open,range.neutral,range.closed].every(Number.isFinite))return {value:0,limited:false};
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
 return (t>=0?.65:.12)*Math.sin(Math.PI*Math.abs(t));
}
export function guardPalm(current,previous,elapsed){
 if(!current)return null;
 if(previous&&elapsed<.3&&(Math.abs(angleDelta(current.yaw,previous.yaw))>1.2||Math.abs(angleDelta(current.pitch,previous.pitch))>.9))return null;
 return current;
}
