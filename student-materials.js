import {CanvasTexture,SRGBColorSpace,Color,DoubleSide,Float32BufferAttribute,MeshStandardMaterial} from 'three';

// Original painted palette, CC0-1.0; vertex colour needs no UVs or texture downloads.
export function createStudentPainter(){
 const canvas=document.createElement('canvas');canvas.width=16;canvas.height=512;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#e4a43e';ctx.fillRect(0,0,16,512);
 for(const y of [150,350]){ctx.fillStyle='#f1d574';ctx.fillRect(0,y,16,85);ctx.fillStyle='#a77b30';ctx.fillRect(0,y,16,3);ctx.fillRect(0,y+82,16,3);}
 const stripes=new CanvasTexture(canvas);stripes.colorSpace=SRGBColorSpace;
 const palette={
  wood:['#bd9270',.91],cloth:['#677c80',.96],trim:['#d0c6a6',.98],
  trousers:['#80a84c',.97],hair:['#44362e',.88],leather:['#71594a',.91],
  shoe:['#3e403a',.86],sole:['#292f2c',.98],red:['#995f50',.96],
  eye:['#c9c5ac',.72],ink:['#30372f',.90],brass:['#a39163',.78]
 };
 const materials=new Map();
 return mesh=>{
  const name=mesh.name.toLowerCase(),source=mesh.material.name;
  let kind=source==='hair-clay'?'hair':source==='uniform-clay'?'cloth':source==='recess'?'ink':source==='eye-clay'?'eye':'wood';
  if(/shorts|trouser/.test(name))kind='trousers';
  if(/blouse_hem/.test(name))kind='cloth';
  if(/collar|piping|sock|sleeve_cuff/.test(name))kind='trim';
  if(/backpack|bag_|shoulder_strap/.test(name))kind='leather';
  if(/shoe|toe_cap/.test(name))kind='shoe';
  if(/sole/.test(name))kind='sole';
  if(/buckle/.test(name))kind='brass';
  if(/neckerchief/.test(name))kind='red';
  if(/ear_concha/.test(name))kind='wood';
  if(!materials.has(kind))materials.set(kind,new MeshStandardMaterial({name:'student-painted-'+kind,color:0xffffff,roughness:palette[kind][1],metalness:kind==='brass'?.15:0,vertexColors:true}));
  mesh.material=materials.get(kind);
  if(kind==='cloth')mesh.material.map=stripes;
  // Exported garment shells have inward-facing panels; render both sides.
  if(/cloth|trousers|trim/.test(kind))mesh.material.side=DoubleSide;
  const base=new Color(kind==='cloth'?'#ffffff':palette[kind][0]),position=mesh.geometry.attributes.position,colors=new Float32Array(position.count*3),uv=new Float32Array(position.count*2);
  for(let i=0;i<position.count;i++){
   const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
   uv[i*2]=.5;uv[i*2+1]=(y-.9)/.9;
   const brush=Math.sin(x*31+y*19+Math.sin(z*23)*2)*Math.sin(y*47-z*13);
   const grain=Math.sin(y*92+Math.sin(x*18+z*24)*1.8);
   const shade=1+brush*.035+grain*(kind==='wood'?.018:.008);
   const c=base.clone().multiplyScalar(shade);
   if(kind==='wood'&&/face/.test(name)){
    const cheek=Math.exp(-(((Math.abs(x)-.22)/.085)**2)-((y-2.065)/.09)**2)*Math.max(0,Math.min(1,z/.23));
    c.lerp(new Color('#ba7f69'),cheek*.26);
   }
   c.toArray(colors,i*3);
  }
  mesh.geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  if(kind==='cloth')mesh.geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));
 };
}

