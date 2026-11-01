// Synthetic landmarks for direction tests; they do not test camera recognition.
export function testHand(direction='up',fist=false,front=false){
 const p=Array.from({length:21},()=>({x:0,y:0,z:0}));
 for(const [n,i] of [5,9,13,17].entries()){
  const x=(n-1.5)*.06,y=-.2+Math.abs(n-1.5)*.01;
  p[i]={x,y,z:0};
  for(let j=1;j<=3;j++)p[i+j]={x,y:y+(fist?[-.06,-.02,.03][j-1]:-j*.075),z:0};
 }
 p[1]={x:-.1,y:-.03,z:0};p[2]={x:-.14,y:-.06,z:0};p[3]={x:-.17,y:-.08,z:0};p[4]={x:-.19,y:-.1,z:0};
 const angle={up:0,down:Math.PI,left:Math.PI/2,right:-Math.PI/2}[direction];
 const tilt=front?0:Math.PI/3;
 return p.map(q=>{const x=q.x*Math.cos(tilt),z=q.x*Math.sin(tilt);return {x:.5+x*Math.cos(angle)-q.y*Math.sin(angle),y:.5+x*Math.sin(angle)+q.y*Math.cos(angle),z};});
}
