import {Box3, Vector3} from 'three';
// Shade plus bulb, with clearance. Z remains fixed by the existing controls.
const extent=new Vector3(.63,.30,.63);
export function collisionBoxes(puppet){
 puppet.updateWorldMatrix(true,true);
 const boxes=[];let skinned=false;
 puppet.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  skinned=true;
  // Whole-character bounds fill the empty space between the limbs and lamp.
  // Use padded bone segments so separate limbs do not block that empty space.
  for(const bone of o.skeleton.bones){
   if(!bone.parent?.isBone)continue;
   const radius=/head/i.test(bone.name)?.36:/spine|hips/i.test(bone.name)?.24:.18;
   const box=new Box3().setFromPoints([bone.getWorldPosition(new Vector3()),bone.parent.getWorldPosition(new Vector3())]);
   box.expandByScalar(radius).expandByVector(extent);boxes.push(box);
  }
 });
 if(!skinned)return puppet.children.map(o=>new Box3().setFromObject(o).expandByVector(extent));
 return boxes;
}
export function safeLamp(p,boxes){return [...p].every(Number.isFinite)&&p.x>=-1.5&&p.x<=1.5&&p.y>=1&&p.y<=5.4&&!boxes.some(b=>p.x>b.min.x&&p.x<b.max.x&&p.y>b.min.y&&p.y<b.max.y&&p.z>b.min.z&&p.z<b.max.z);}
// Exact nearest point outside a finite union of axis-aligned rectangles at fixed Z.
// At most (2N+3)^2 candidates; no iterative penetration solver.
export function nearestLamp(wanted,boxes){
 if(![...wanted].every(Number.isFinite))return null;
 const active=boxes.filter(b=>wanted.z>b.min.z&&wanted.z<b.max.z);
 const xs=[Math.max(-1.5,Math.min(1.5,wanted.x)),-1.5,1.5],ys=[Math.max(1,Math.min(5.4,wanted.y)),1,5.4];
 for(const b of active){xs.push(b.min.x-.0001,b.max.x+.0001);ys.push(b.min.y-.0001,b.max.y+.0001);}
 let best=null,distance=Infinity;
 for(const x of xs)for(const y of ys){const p=new Vector3(x,y,wanted.z);if(safeLamp(p,active)){const d=p.distanceToSquared(wanted);if(d<distance){best=p;distance=d;}}}
 return best;
}
