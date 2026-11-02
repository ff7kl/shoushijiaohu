import {Vector3} from 'three';
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function curls(points){
 return [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]].map(ids=>{
  const p=ids.map(i=>new Vector3(points[i].x,points[i].y,points[i].z||0));
  const length=p[0].distanceTo(p[1])+p[1].distanceTo(p[2])+p[2].distanceTo(p[3]);
  return length>1e-8?clamp(1-p[0].distanceTo(p[3])/length):0;
 });
}
export function solveIK(root,target,a,b,bend=1){
 const delta=target.clone().sub(root);const d=clamp(delta.length(),Math.abs(a-b)+1e-5,a+b-1e-5);
 if(delta.lengthSq()<1e-12)delta.set(0,-1,0);delta.normalize();
 const end=root.clone().addScaledVector(delta,d), along=(a*a-b*b+d*d)/(2*d);
 const reference=typeof bend==='number'?new Vector3(0,0,bend):bend;
 const normal=reference.clone().addScaledVector(delta,-delta.dot(reference));
 if(normal.lengthSq()<1e-10)normal.copy(Math.abs(delta.x)<.8?new Vector3(1,0,0):new Vector3(0,1,0)).addScaledVector(delta,-normal.dot(delta));normal.normalize();
 return {joint:root.clone().addScaledVector(delta,along).addScaledVector(normal,Math.sqrt(Math.max(0,a*a-along*along))),end};
}
export function normalizeCurl(raw, range, sensitivity=1){
 const valid=range && Number.isFinite(range.open) && Number.isFinite(range.closed) && range.closed-range.open>=.04;
 const open=valid?range.open:0, span=valid?range.closed-range.open:.35;
 if(!Number.isFinite(raw))return 0;
 return clamp((raw-open)/span*(Number.isFinite(sensitivity)?sensitivity:1));
}

export function limbPose(side,leg,value,lift=0,footLift=0){
 const t=clamp(value,-1,1),root=new Vector3(side*(leg?.19:.43),(leg?.95:1.65)+lift,0);
 const angle=t*(leg?.8:1.05),reach=leg?.77:.85;
 const target=new Vector3(root.x+side*(leg?.05:.15),root.y-reach*Math.cos(angle)+(leg?clamp(footLift)*.30:0),reach*Math.sin(angle));

 return {root,...solveIK(root,target,leg?.44:.56,leg?.36:.34,new Vector3(side*(leg?.65:.85),leg?.25:-.65,leg?1:1.5))};
}


// Reach the stage edges inside the central camera area; larger palms amplify motion.
export function handPosition(points,role='puppet'){
 if(!Array.isArray(points)||points.length!==21||points.some(p=>!p||!['x','y','z'].every(k=>Number.isFinite(p[k]))))return null;
 const palm=[0,5,9,13,17].reduce((a,i)=>({x:a.x+points[i].x/5,y:a.y+points[i].y/5}),{x:0,y:0});
 const size=Math.hypot(points[9].x-points[0].x,points[9].y-points[0].y,points[9].z-points[0].z);
 if(size<1e-6)return null;
 const x=role==='lamp'?points[8].x:palm.x;
 const span=clamp(.3-size*.35,.15,.3),offset=clamp((.5-x)/span,-1,1);
 const mapped=Math.sign(offset)*Math.pow(Math.abs(offset),clamp(.18/size,.45,1.3));
 return new Vector3(mapped*(role==='lamp'?1.5:2.7),role==='lamp'?4.6:clamp((.65-palm.y)*2,0,.8),role==='lamp'?.3:.65);
}

export function pinchState(points, previous=false){
 if(!handPosition(points,'lamp'))return false;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const ratio=distance(points[4],points[8])/distance(points[0],points[9]);
 return ratio<(previous?.45:.30);
}
