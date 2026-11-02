import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function addLayeredHair(scene,head,bounds){
 const height=bounds.max.y-bounds.min.y,center=bounds.getCenter(new T.Vector3()),geometries=[];
 const palette=['#030303','#030303','#030303','#030303'];
 scene.updateWorldMatrix(true,true);
 let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function local(p){return head.worldToLocal(scene.localToWorld(new T.Vector3(center.x+p.x*height,bounds.min.y+p.y*height,center.z+p.z*height)));}
 // Continuous dark scalp under the locks prevents see-through gaps from above.
 const capPositions=[],capIndices=[];
 for(let row=0;row<=16;row++)for(let col=0;col<=64;col++){
  const az=col/64*Math.PI*2,end=Math.sin(az)>.25?1.40:1.92,theta=.001+row/16*end;
  const p=local(new T.Vector3(.151*Math.sin(theta)*Math.cos(az),.845+.140*Math.cos(theta),.125*Math.sin(theta)*Math.sin(az)-.014));
  capPositions.push(p.x,p.y,p.z);
  if(row<16&&col<64){const a=row*65+col;capIndices.push(a,a+65,a+1,a+1,a+65,a+66);}
 }
 const capGeometry=new T.BufferGeometry();capGeometry.setAttribute('position',new T.Float32BufferAttribute(capPositions,3));capGeometry.setIndex(capIndices);capGeometry.computeVertexNormals();
 const cap=new T.Mesh(capGeometry,new T.MeshStandardMaterial({color:'#030303',roughness:.95,side:T.DoubleSide}));cap.name='continuous-hair-scalp';cap.castShadow=cap.receiveShadow=true;head.add(cap);
 function lock(az,start,end,width,index,fly=false){
  const points=[];
  for(let k=0;k<=8;k++){
   const t=k/8,theta=start+(end-start)*t,angle=az+.22*Math.sin(t*Math.PI)+.10*t;
   const lift=.003*Math.sin(Math.PI*t)+.002*t*t;
   points.push(local(new T.Vector3((.153+lift)*Math.sin(theta)*Math.cos(angle),.845+(.141+lift)*Math.cos(theta),(.127+lift)*Math.sin(theta)*Math.sin(angle)-.014)));
  }
  const curve=new T.CatmullRomCurve3(points),vertices=[],indices=[],colors=[],color=new T.Color(palette[index%palette.length]);
  for(let k=0;k<=16;k++){
   const t=k/16,p=curve.getPoint(t),tangent=curve.getTangent(t),normal=new T.Vector3(0,0,1).cross(tangent).normalize(),binormal=tangent.clone().cross(normal).normalize();
   const radius=width*2.6*(.35+.8*Math.sin(Math.PI*t))*(1-t)+.00008*height;
   // Head inherits the imported skeleton scale; convert width to its local units.
   const scale=head.getWorldScale(new T.Vector3()).x;
   for(let j=0;j<6;j++){
    const a=j/6*Math.PI*2,q=p.clone().addScaledVector(normal,Math.cos(a)*radius/scale).addScaledVector(binormal,Math.sin(a)*radius*.32/scale);
    vertices.push(q.x,q.y,q.z);const c=color.clone().multiplyScalar(.85+.22*Math.sin(a)**2);colors.push(c.r,c.g,c.b);
    if(k<16){const n=k*6+j,b=k*6+(j+1)%6;indices.push(n,b,n+6,b,b+6,n+6);}
   }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();geometries.push(g);
 }
 for(let layer=0;layer<3;layer++)for(let i=0;i<40;i++){
  const az=i/40*Math.PI*2+layer*.11+random()*.08,front=Math.sin(az)>.3;
  lock(az,.10+layer*.25,(front?1.22:1.60)+random()*.22,.008+random()*.006,i+layer);
 }
 
 const hair=new T.Mesh(mergeGeometries(geometries),new T.MeshStandardMaterial({vertexColors:true,roughness:.92,side:T.DoubleSide}));
 hair.name='layered-carved-hair';hair.castShadow=hair.receiveShadow=true;head.add(hair);
 geometries.forEach(g=>g.dispose());
}



