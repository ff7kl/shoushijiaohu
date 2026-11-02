import * as T from 'three';

// Open-ended cloth tubes follow the existing two-link wooden legs.
export function denimLeg(length,lower,side){
 const positions=[],colors=[],indices=[],rows=24,around=40;
 for(let row=0;row<=rows;row++)for(let col=0;col<=around;col++){
  const t=row/rows,a=col/around*Math.PI*2;
  const width=(lower?.15:.155)+.009*Math.sin(t*16+side)+.004*Math.sin(a*5+t*24);
  const edge=(row===0||row===rows)?.010*Math.sin(a*17+side):0;
  positions.push(Math.cos(a)*width,(t-.5)*length+edge+(lower?0:.16*t**4),Math.sin(a)*width*1.08);
  const weave=Math.sin(a*113+t*197)*Math.sin(t*271-a*73);
  const fade=.5+.5*Math.sin(a*3+t*11);
  const c=new T.Color('#394247').lerp(new T.Color('#68706a'),fade*.13+weave*.025);
  const seam=Math.abs(Math.cos(a))>.995;
  if(seam&&Math.sin(t*190)>0)c.lerp(new T.Color('#9b8765'),.50);
  if(row===0||row===rows)c.lerp(new T.Color('#9d9176'),.20);
  colors.push(c.r,c.g,c.b);
  if(row<rows&&col<around){
   const front=Math.sin(a)>.4;
   const knee=lower?t>.80:t<.19;
   if(front&&knee&&Math.sin(a*7+t*31)>.0)continue;
   const n=row*(around+1)+col,b=n+around+1;indices.push(n,b,n+1,n+1,b,b+1);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
 return new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.98,side:T.DoubleSide}));
}

