import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {limbPose} from './puppet-control.js';
import {addLayeredHair} from './rigged-hair.js';

export function createRiggedPuppet(group){
 const loader=new T.TextureLoader(),map=loader.load(import.meta.env.BASE_URL+'textures/rigged-basecolor.png'),roughnessMap=loader.load(import.meta.env.BASE_URL+'textures/rigged-roughness.png');
 map.colorSpace=T.SRGBColorSpace;map.flipY=roughnessMap.flipY=false;map.anisotropy=4;
 const material=new T.MeshStandardMaterial({map,roughnessMap,roughness:1,metalness:0});
 const body=new T.Group(),head=new T.Group();group.add(body,head);
 const state={body,head,loaded:false,update(){}};
 new GLTFLoader().load(import.meta.env.BASE_URL+'models/wooden-doll-rigged.glb',({scene})=>{
  body.add(scene);scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(scene),size=bounds.getSize(new T.Vector3());
  scene.scale.multiplyScalar(2.6/size.y);scene.position.sub(bounds.getCenter(new T.Vector3()).multiplyScalar(2.6/size.y));scene.position.y+=1.365; // Asset sole is -0.004 at neutral; keep 0.06 stage clearance.
  const meshes=[],bones=new Map();
  scene.traverse(o=>{
   if(o.isBone)bones.set(o.name.replace(/^mixamorig[:_]?/,''),o);
   if(o.isSkinnedMesh){o.normalizeSkinWeights();o.castShadow=o.receiveShadow=true;o.material=material;meshes.push(o);}
  });
  addLayeredHair(scene,bones.get('Head'),bounds);
  const chains=[];
  for(const side of ['Left','Right'])for(const leg of [false,true]){
   const names=leg?['UpLeg','Leg','Foot']:['Arm','ForeArm','Hand'];
   const chain=names.map(n=>bones.get(side+n));
   if(chain.some(b=>!b))throw new Error('缺少骨骼：'+side+names.join('/'));
   const [upper,lower,tip]=chain;
   group.updateWorldMatrix(true,true);
   const sign=group.worldToLocal(upper.getWorldPosition(new T.Vector3())).x>0?1:-1;
   chains.push({upper,lower,tip,leg,sign,index:leg?(sign===1?3:4):(sign===1?0:1),restUpper:upper.quaternion.clone(),restLower:lower.quaternion.clone()});
  }
  function aim(bone,child,direction){
   const parentQ=bone.parent.getWorldQuaternion(new T.Quaternion());
   const worldDirection=direction.clone().transformDirection(group.matrixWorld).applyQuaternion(parentQ.invert()).normalize();
   const current=child.position.clone().normalize().applyQuaternion(bone.quaternion);
   bone.quaternion.premultiply(new T.Quaternion().setFromUnitVectors(current,worldDirection));
   bone.updateWorldMatrix(false,true);
  }
  const headBone=bones.get('Head')||bones.get('Neck'),headRest=headBone?.quaternion.clone();
  state.headBone=headBone;state.headRest=headRest;state.chains=chains;state.meshes=meshes;
  const headPosition=headBone?.position.clone();
  state.update=(values,flightHeight=0)=>{

   if(headBone){headBone.quaternion.copy(headRest);headBone.position.copy(headPosition);}
   group.updateWorldMatrix(true,true);
   for(const c of chains){
    c.upper.quaternion.copy(c.restUpper);c.lower.quaternion.copy(c.restLower);
    const pose=limbPose(c.sign,c.leg,values[c.index],0,values[c.sign===1?5:6]);
    aim(c.upper,c.lower,pose.joint.clone().sub(pose.root));
    aim(c.lower,c.tip,pose.end.clone().sub(pose.joint));
   }
   group.updateWorldMatrix(true,true);
   if(headBone)headBone.quaternion.copy(headRest).multiply(new T.Quaternion().setFromEuler(new T.Euler((values[8]||0)*.45,(values[7]||0)*.7,0,'YXZ')));
   group.updateWorldMatrix(true,true);
   if(headBone&&flightHeight){
    const origin=headBone.getWorldPosition(new T.Vector3());
    const offset=new T.Vector3(0,flightHeight,0).applyMatrix4(group.matrixWorld).sub(group.getWorldPosition(new T.Vector3()));
    headBone.position.copy(headBone.parent.worldToLocal(origin.add(offset)));
    group.updateWorldMatrix(true,true);
   }
   for(const mesh of meshes){mesh.skeleton.update();mesh.computeBoundingBox();mesh.computeBoundingSphere();}
  };
  state.loaded=true;group.userData.rigLoaded=true;state.update([0,0,0,0,0]);
 },undefined,error=>{group.userData.rigError=error.message;console.error('骨骼木偶加载失败',error);});
 return state;
}
