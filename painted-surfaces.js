import {CanvasTexture,SRGBColorSpace,MeshStandardMaterial} from 'three';
// Original local Canvas artwork; each surface gets an independent, metre-scaled canvas.
export function paintedSurface(kind,width,height,seed=17){
 const canvas=document.createElement('canvas');canvas.width=Math.round(width*180);canvas.height=Math.round(height*180);
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const stroke=(x,y,length,size,color)=>{
  c.fillStyle=color;c.beginPath();c.moveTo(x,y-size*.45);c.lineTo(x+length*.28,y-size*.52);c.lineTo(x+length,y-size*.32);c.lineTo(x+length*.93,y+size*.35);c.lineTo(x+length*.4,y+size*.48);c.lineTo(x+3,y+size*.28);c.closePath();c.fill();
  c.globalAlpha*=.35;for(let j=0;j<4;j++){c.fillRect(x+length*.1,y-size*.4+j*size*.2,length*(.5+random()*.35),1+random()*2);}c.globalAlpha/=.35;
 };
 c.fillStyle=kind==='board'?'#183e32':kind==='floor'?'#626e6b':'#babbb0';c.fillRect(0,0,w,h);
 const palette=kind==='floor'?['#75817a','#566862','#889087','#646f68']:kind==='board'?['#254b3a','#214333','#345241','#1d3c30']:['#cccbbf','#b9bdb2','#c5c6b8','#adb5ab'];
 for(let i=0;i<width*height*3;i++)stroke(random()*w,random()*h,65+random()*200,18+random()*65,palette[i%palette.length]);
 if(kind==='wall'){
  const line=h-1.35*180;
  c.fillStyle='#647f86';c.fillRect(0,line,w,h-line);
  for(let i=0;i<width*10;i++)stroke(random()*w,line+random()*(h-line),45+random()*130,12+random()*40,['#7b9295','#526f76','#8b9b9a','#5e777c'][i%4]);
  // Broad angular islands of exposed plaster, clustered rather than uniform grain.
  for(let i=0;i<width*3;i++){
   const x=random()*w,y=random()*h,r=18+random()*65;
   c.fillStyle=y>line?'#a6b1ab':'#858f86';c.beginPath();
   for(let j=0;j<8;j++){const a=j*Math.PI/4,rr=r*(.5+random()*.5);c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.65);}c.closePath();c.fill();
   stroke(x-r*.4,y,r*.6,3,'#dedbcb');
  }
  c.fillStyle='#506b70';c.fillRect(0,line,w,4);
  for(let i=0;i<width*2;i++){const x=random()*w,y=line+random()*70;c.fillStyle='rgba(57,69,62,.17)';c.fillRect(x,y,6+random()*18,40+random()*90);}
 }
 if(kind==='floor'){
  for(let x=0;x<w;x+=180){stroke(x,0,0,1,'#394c47');c.fillStyle='#42534e';c.fillRect(x,0,2,h);for(let y=(x/180%2)*170;y<h;y+=350)c.fillRect(x,y,180,2);}
  for(let i=0;i<120;i++)stroke(random()*w,random()*h,20+random()*65,2+random()*5,'rgba(185,186,161,.22)');
 }
 if(kind==='board'){
  // Overlapping wide eraser passes and ghost writing, with no baked lighting.
  c.globalAlpha=.18;for(let i=0;i<24;i++)stroke(random()*w,random()*h,130+random()*220,14+random()*30,'#acb9a1');
  c.font='25px serif';c.fillStyle='#d0d1b1';c.fillText('昨日  练习    归途',w*.22,h*.36);c.globalAlpha=.8;
  c.font='26px serif';c.fillText('十一月一日     星期日',45,45);c.font='38px serif';c.fillText('请 回 到 你 的 座 位',w*.24,h*.43);
  c.strokeStyle='#c5cbb1';c.lineWidth=3;c.beginPath();c.moveTo(70,h-65);c.lineTo(70,h-135);c.lineTo(125,h-190);c.lineTo(185,h-135);c.lineTo(185,h-65);c.closePath();c.moveTo(60,h-135);c.lineTo(125,h-198);c.lineTo(195,h-135);c.moveTo(113,h-65);c.lineTo(113,h-110);c.lineTo(140,h-110);c.lineTo(140,h-65);c.stroke();
  for(let i=0;i<13;i++){const x=240+i*43,y=h-45-random()*28;c.strokeStyle=i%3?'#a8ba9b':'#c8bb8c';c.beginPath();c.moveTo(x,h-28);c.quadraticCurveTo(x-15,y+10,x,y-25);c.moveTo(x,y);c.lineTo(x-17,y-12);c.moveTo(x,y+8);c.lineTo(x+15,y-4);c.stroke();if(i%3===0){c.beginPath();c.arc(x,y-25,8,0,Math.PI*2);c.stroke();}}
  c.globalAlpha=.45;c.font='21px serif';c.fillText('值日生：____________',w-330,h-25);c.globalAlpha=1;
 }
 const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;map.anisotropy=4;
 return new MeshStandardMaterial({map,roughness:kind==='board'?.92:1});
}
