import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createStudent as fallback} from './student-character-fallback.js';
export function createStudent(puppet,limbs){
 const student=fallback(puppet,limbs),parts=[];
 student.update=()=>{for(const p of parts){if(p.limb){const l=p.limb,a=p.lower?l.joint.position:l.root.clone().add(new T.Vector3(0,(student.body.position.y-student.body.userData.baseY)||0,0)),b=p.lower?l.end:l.joint.position;const d=b.clone().sub(a);p.group.position.copy(a).add(b).multiplyScalar(.5);p.group.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());p.group.scale.set(1,d.length()/p.length,1);}else if(p.tip)p.group.position.copy(p.tip.end);}};
 new GLTFLoader().load(import.meta.env.BASE_URL+'models/student-v7.glb',gltf=>{
  const old=[...puppet.children];for(const o of old)puppet.remove(o);
  student.body=new T.Group();student.head=new T.Group();student.body.userData.baseY=student.head.userData.baseY=0;puppet.add(student.body,student.head);
  const meshes=[];gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const buckets=new Map();
  for(const mesh of meshes){mesh.geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);mesh.geometry.computeBoundingBox();const c=mesh.geometry.boundingBox.getCenter(new T.Vector3());
   let key='body',limb=null,lower=false,tip=false;
   if(c.y>1.8)key='head';else if(Math.abs(c.x)>.35||c.y<.70){const hand=/finger|knuckle|palm|thumb/.test(mesh.name);const leg=c.y<.70&&!hand;const side=c.x>0?1:-1;limb=limbs.find(l=>l.leg===leg&&l.side===side);tip=hand|| (leg?c.y<.34:c.y<.80);lower=!tip&&(leg?c.y<.53:c.y<1.16);key=(leg?'leg':'arm')+side+(tip?'tip':lower?'lower':'upper');}
   if(!buckets.has(key)){
    const group=key==='body'?student.body:key==='head'?student.head:new T.Group();if(key!=='body'&&key!=='head')puppet.add(group);
    const p={group,limb:tip?null:limb,tip:tip?limb:null,lower};
    if(limb){const s=limb.side,leg=limb.leg;const root=new T.Vector3(s*(leg?.19:.43),leg?.95:1.65,0),joint=new T.Vector3(s*(leg?.22:.52),leg?.52:1.14,.065),end=new T.Vector3(s*(leg?.24:.58),leg?.18:.80,.08);p.origin=tip?end:(lower?joint:root).clone().add(lower?end:joint).multiplyScalar(.5);p.length=(lower?joint:root).distanceTo(lower?end:joint);p.inverse=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),(lower?end.clone().sub(joint):joint.clone().sub(root)).normalize()).invert();}
    buckets.set(key,p);parts.push(p);
   }
   const p=buckets.get(key);if(p.origin){mesh.geometry.translate(-p.origin.x,-p.origin.y,-p.origin.z);if(!p.tip)mesh.geometry.applyQuaternion(p.inverse);}mesh.castShadow=mesh.receiveShadow=true;p.group.add(mesh);
  }
  for(const p of parts){const materials=new Map();for(const mesh of [...p.group.children]){if(!materials.has(mesh.material))materials.set(mesh.material,[]);materials.get(mesh.material).push(mesh);}for(const [material,meshes] of materials){if(meshes.length<2)continue;const geometry=mergeGeometries(meshes.map(m=>m.geometry));if(!geometry)continue;const merged=new T.Mesh(geometry,material);merged.castShadow=merged.receiveShadow=true;for(const mesh of meshes)p.group.remove(mesh);p.group.add(merged);}}
  student.loaded=true;student.update();
 },undefined,error=>console.error('Student GLB load failed; using fallback',error));
 return student;
}
