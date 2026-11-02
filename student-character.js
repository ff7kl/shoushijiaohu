import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createStudentPainter} from './student-materials.js';
import {denimLeg} from './old-denim.js';
export function createStudent(puppet,limbs,model='student-v7.glb'){
 // Keep only empty control objects until the selected GLB is ready.
 puppet.clear();
 const body=new T.Group(),head=new T.Group();puppet.add(body,head);
 for(const limb of limbs)limb.tip=new T.Group();
 const student={body,head,loaded:false,modelAsset:model},parts=[];
 student.update=()=>{for(const p of parts){if(p.limb){const l=p.limb,a=p.lower?l.joint.position:l.root.clone().add(new T.Vector3(0,(student.body.position.y-student.body.userData.baseY)||0,0)),b=p.lower?l.end:l.joint.position;const d=b.clone().sub(a);p.group.position.copy(a).add(b).multiplyScalar(.5);p.group.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());p.group.scale.set(1,d.length()/p.length,1);}else if(p.tip)p.group.position.copy(p.tip.end);}};
 new GLTFLoader().load(import.meta.env.BASE_URL+'models/'+model,gltf=>{
  const old=[...puppet.children];for(const o of old)puppet.remove(o);
  student.body=new T.Group();student.head=new T.Group();student.body.userData.baseY=student.head.userData.baseY=0;puppet.add(student.body,student.head);
  const meshes=[];gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const buckets=new Map(),paint=createStudentPainter();
  for(const mesh of meshes){mesh.geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);mesh.geometry.computeBoundingBox();const c=mesh.geometry.boundingBox.getCenter(new T.Vector3());
   if(model==='student-v7.glb'&&/collar|piping|neckerchief|backpack|bag_|strap|buckle|button|pocket/.test(mesh.name))continue;
   if(model==='wooden-puppet.glb'){
    const pos=mesh.geometry.attributes.position,colors=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){
     const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);let color='#b89a75';
     if(mesh.name==='head'){
      const ear=((Math.abs(x)-.31)/.047)**2+((y-2.085)/.078)**2<1&&z>.035;
      const hair=!ear&&(y>2.27||(y>1.75&&(z<.055||(Math.abs(x)>.205&&z<.145)))||(y>2.18&&Math.abs(x)>.24));
      color=hair?'#171716':'#c4a982';
     }
     else if(mesh.name==='body'){
      const ax=Math.abs(x),front=z>.10;
      color=z<-.20?'#59402d':'#414c51';
      if(front&&ax<.085&&y>1.02&&y<1.68)color='#303231';
      if(front&&ax>.21&&ax<.29&&y>1.13&&y<1.83)color='#65452e';
      const strapEdge=front&&(Math.abs(ax-.215)<.008||Math.abs(ax-.285)<.008)&&y>1.13&&y<1.80;
      const placket=front&&Math.abs(ax-.095)<.012&&y>1.03&&y<1.62;
      const hem=y>1.06&&y<1.08&&front;
      if(strapEdge)color='#796044';
      const buckle=front&&ax>.21&&ax<.29&&y>1.40&&y<1.47;
      const button=front&&Math.abs(x-.095)<.020&&[1.17,1.36,1.55].some(h=>Math.abs(y-h)<.017);
      if(buckle)color='#8b7449';
     }
     else if(mesh.name.includes('upper'))color=mesh.name.startsWith('arm')?'#373c3d':'#3f484a';
     else if(mesh.name.includes('leg')&&mesh.name.includes('tip'))color='#3e3830';
     const c=new T.Color(color).multiplyScalar(1+.035*Math.sin(x*65+y*93+Math.sin(z*24)));
     const clothing=mesh.name==='body'||mesh.name.includes('upper');
     if(clothing){
      const weave=Math.sin(x*970+y*830)*Math.sin(y*1090-z*610);
      c.multiplyScalar(1+weave*.045);
      const wear=Math.sin(x*93+y*117+Math.sin(z*88)*2)*Math.sin(y*189-z*71);
      if(wear>.79)c.lerp(new T.Color('#9c947c'),.035);
     }
     c.toArray(colors,i*3);
    }
    mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    mesh.material=new T.MeshStandardMaterial({vertexColors:true,roughness:.94,side:T.DoubleSide});
   }else paint(mesh);
   let key='body',limb=null,lower=false,tip=false;
   const upperLeg=/^leg.*_(shorts|root|upper)$|^trouser_cuff/.test(mesh.name);
   if(c.y>1.8)key='head';else if(upperLeg||Math.abs(c.x)>.35||c.y<.70){const hand=/finger|knuckle|palm|thumb/.test(mesh.name);const leg=upperLeg||c.y<.70&&!hand;const side=c.x>0?1:-1;limb=limbs.find(l=>l.leg===leg&&l.side===side);tip=!upperLeg&&(hand|| (leg?c.y<.34:c.y<.80));lower=!upperLeg&&!tip&&(leg?c.y<.53:c.y<1.16);key=(leg?'leg':'arm')+side+(tip?'tip':lower?'lower':'upper');}
   if(model==='wooden-puppet.glb'){
    key=mesh.name;
    const match=key.match(/^(arm|leg)(-?1)(upper|lower|tip)$/);
    limb=match?limbs.find(l=>l.leg===(match[1]==='leg')&&l.side===Number(match[2])):null;
    tip=match?.[3]==='tip';lower=match?.[3]==='lower';
   }
   if(!buckets.has(key)){
    const group=key==='body'?student.body:key==='head'?student.head:new T.Group();if(key!=='body'&&key!=='head')puppet.add(group);
    const p={group,limb:tip?null:limb,tip:tip?limb:null,lower};
    if(limb){const s=limb.side,leg=limb.leg;const root=new T.Vector3(s*(leg?.19:.43),leg?.95:1.65,0),joint=new T.Vector3(s*(leg?.22:.52),leg?.52:1.14,.065),end=new T.Vector3(s*(leg?.24:.58),leg?.18:.80,.08);p.origin=tip?end:(lower?joint:root).clone().add(lower?end:joint).multiplyScalar(.5);p.length=(lower?joint:root).distanceTo(lower?end:joint);p.inverse=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),(lower?end.clone().sub(joint):joint.clone().sub(root)).normalize()).invert();}
    buckets.set(key,p);parts.push(p);
   }
   const p=buckets.get(key);if(p.origin){mesh.geometry.translate(-p.origin.x,-p.origin.y,-p.origin.z);if(!p.tip)mesh.geometry.applyQuaternion(p.inverse);}mesh.castShadow=mesh.receiveShadow=true;p.group.add(mesh);
  }
  if(model==='student-v7.glb'){
   const collar=new T.Mesh(new T.TorusGeometry(.103,.018,8,32),new T.MeshStandardMaterial({color:'#d8932d',roughness:.96}));collar.rotation.x=Math.PI/2;collar.position.y=1.735;collar.scale.z=.8;collar.castShadow=true;student.body.add(collar);
  }
  if(model==='wooden-puppet.glb')for(const p of parts){
   if(p.limb?.leg){
    p.group.clear();const trousers=denimLeg(p.length,p.lower,p.limb.side);trousers.castShadow=trousers.receiveShadow=true;p.group.add(trousers);
   }
  }
  for(const p of parts){const materials=new Map();for(const mesh of [...p.group.children]){if(!materials.has(mesh.material))materials.set(mesh.material,[]);materials.get(mesh.material).push(mesh);}for(const [material,meshes] of materials){if(meshes.length<2)continue;const geometry=mergeGeometries(meshes.map(m=>m.geometry));if(!geometry)continue;const merged=new T.Mesh(geometry,material);merged.castShadow=merged.receiveShadow=true;for(const mesh of meshes)p.group.remove(mesh);p.group.add(merged);}}
  if(model==='wooden-puppet.glb'){
   const waist=new T.Mesh(new T.CylinderGeometry(.335,.32,.20,40,1,true),new T.MeshStandardMaterial({color:'#394247',roughness:.98,side:T.DoubleSide}));
   waist.position.set(0,1.015,0);waist.scale.z=.65;waist.castShadow=waist.receiveShadow=true;student.body.add(waist);
   const wood=new T.MeshStandardMaterial({color:'#ad916e',roughness:.94});
   const joints=limbs.map(l=>{const joint=new T.Mesh(new T.SphereGeometry(.068,12,8),wood),wrist=new T.Mesh(new T.SphereGeometry(l.leg?.05:.055,12,8),wood);puppet.add(joint,wrist);joint.castShadow=wrist.castShadow=true;return {l,joint,wrist};});
   const update=student.update;student.update=()=>{update();for(const {l,joint,wrist} of joints){joint.position.copy(l.joint.position);wrist.position.copy(l.end);}};
  }
  student.footObjects=parts.filter(p=>p.tip?.leg).map(p=>p.group);
  student.loaded=true;student.update();
 },undefined,error=>{student.loadError=error.message || '模型请求失败：'+model;console.error(error);});
 return student;
}


