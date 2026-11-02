import assert from 'node:assert/strict';
import {Box3,Vector3 as V,Group,Mesh,BoxGeometry,MeshBasicMaterial,Bone,SkinnedMesh,Skeleton} from 'three';
import {collisionBoxes,nearestLamp,safeLamp} from './lamp-collision.js';
const puppet=new Group(),head=new Mesh(new BoxGeometry(.8,.8,.8),new MeshBasicMaterial());puppet.add(head);head.position.y=2.2;puppet.position.z=.65;
let boxes=collisionBoxes(puppet);
for(const p of [new V(0,2.8,.3),new V(.6,2.2,.3),new V(0,2.2,.3)]){const resolved=nearestLamp(p,boxes);assert(resolved);assert(safeLamp(resolved,boxes));assert(resolved.distanceTo(p)<1.2);assert.deepEqual(nearestLamp(resolved,boxes),resolved);}
for(let i=0;i<=100;i++){puppet.position.x=-1+i*.02;puppet.position.y=i*.008;head.position.y=2.2+i*.005;boxes=collisionBoxes(puppet);const result=nearestLamp(new V(0,2.5,.3),boxes);assert(result&&safeLamp(result,boxes));}
assert.equal(nearestLamp(new V(0,2,.3),[new Box3(new V(-10,-10,-10),new V(10,10,10))]),null);
assert.equal(nearestLamp(new V(NaN,2,.3),[]),null);
console.log('灯具下降、横移、木偶横移升高、动态肢体包围盒、重叠恢复、静止稳定及无解检查通过');

// Separate skeletal segments must not turn the empty gap into solid torso.
const rig=new Group(),skin=new SkinnedMesh(new BoxGeometry(4,4,4),new MeshBasicMaterial());
const a=new Bone(),b=new Bone(),c=new Bone(),d=new Bone();
a.position.set(-1,2,0);b.position.set(0,1,0);c.position.set(1,2,0);d.position.set(0,1,0);a.add(b);c.add(d);skin.add(a,c);skin.bind(new Skeleton([a,b,c,d]));rig.add(skin);
const segmented=collisionBoxes(rig);assert.equal(segmented.length,2);assert(safeLamp(new V(0,2.5,0),segmented));assert(!safeLamp(new V(1,2.5,0),segmented));
console.log('骨骼分段碰撞：肢体仍阻挡，肢体之间的空隙不误阻挡');
