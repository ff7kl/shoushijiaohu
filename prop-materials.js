import {CanvasTexture,SRGBColorSpace,MeshStandardMaterial} from 'three';
// Original Canvas material studies, CC0-1.0. No baked illumination.
export function propMaterial(kind,base,seed=23){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 c.fillStyle=base;c.fillRect(0,0,512,512);
 function brush(x,y,w,h,color){c.fillStyle=color;c.beginPath();c.moveTo(x,y);c.lineTo(x+w*.85,y-2);c.lineTo(x+w,y+h*.65);c.lineTo(x+5,y+h);c.closePath();c.fill();}
 for(let i=0;i<48;i++)brush(random()*512,random()*512,45+random()*150,5+random()*24,i%3?'rgba(226,210,166,.10)':'rgba(24,36,30,.15)');
 if(kind==='wood'||kind==='skin'){
  for(let i=0;i<24;i++){const y=random()*512;c.strokeStyle=i%3?'rgba(52,41,25,.26)':'rgba(230,202,151,.23)';c.lineWidth=1+random()*3;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(170,y-12,340,y+17,512,y-3);c.stroke();}
  if(kind==='wood'){c.strokeStyle='rgba(36,35,24,.3)';c.lineWidth=3;c.beginPath();c.ellipse(180,245,42,11,.03,0,Math.PI*2);c.stroke();}
 }
 if(kind==='paper'){
  for(let y=8;y<512;y+=10+Math.floor(random()*7)){c.fillStyle='rgba(75,69,47,.32)';c.fillRect(0,y,512,1+random()*2);c.fillStyle='rgba(241,229,186,.35)';c.fillRect(random()*60,y+3,380+random()*130,2);}
 }
 if(kind==='cover'){
  c.fillStyle='rgba(17,32,30,.35)';c.fillRect(20,0,13,512);
  c.strokeStyle='rgba(218,203,162,.45)';c.lineWidth=3;c.strokeRect(52,40,404,432);
  c.fillStyle='#b9b29a';c.fillRect(130,125,235,114);c.fillStyle='#555e51';c.font='24px serif';c.fillText(['自然笔记','旧日习题','课堂手册','植物图鉴'][seed%4],155,173);c.fillRect(157,193,148,2);
 }
 // Broken rim wear reads as rubbed edges, not a uniform outline.
 if(kind!=='paper')for(let i=0;i<36;i++){
  const x=random()*512,size=8+random()*33;c.fillStyle=kind==='enamel'?'#8d9780':'rgba(218,192,144,.43)';
  if(i%2)c.fillRect(x,i%3?2:504,size,2+random()*5);else c.fillRect(i%3?2:504,x,2+random()*5,size);
 }
 if(kind==='enamel')for(let i=0;i<12;i++)brush(random()*512,random()*512,7+random()*16,3+random()*7,i%2?'#495548':'#88917a');
 const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;map.anisotropy=4;
 return new MeshStandardMaterial({map,roughness:kind==='enamel'?.76:.94,metalness:kind==='enamel'?.08:0});
}
