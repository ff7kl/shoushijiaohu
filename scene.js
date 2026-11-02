import {palmAngles,signedFinger,headTarget,follow,angleDelta,stepHeight,guardPalm} from './live-control.js';
import {createRiggedPuppet} from './rigged-puppet.js';
import {createStudent} from './student-character.js';
import './mobile-layout.js';
import {propMaterial} from './prop-materials.js';
import {paintedSurface} from './painted-surfaces.js';
import {collisionBoxes, safeLamp, nearestLamp} from './lamp-collision.js';
import {curls,solveIK,clamp,limbPose,handPosition,pinchState} from './puppet-control.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const stage=document.querySelector('#stage');
try {
const scene=new THREE.Scene();scene.background=new THREE.Color('#101514');scene.fog=new THREE.Fog('#101514',18,38);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;stage.appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,1,.1,70);const home=new THREE.Vector3(10,8.3,15);camera.position.copy(home);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,2,0);controls.enableDamping=true;controls.minDistance=4;controls.maxDistance=24;controls.minPolarAngle=.45;controls.maxPolarAngle=1.46;controls.minAzimuthAngle=-.7;controls.maxAzimuthAngle=.85;controls.enablePan=false;
const room=new THREE.Group(),props=new THREE.Group(),puppet=new THREE.Group(),lamp=new THREE.Group();scene.add(room,props,puppet,lamp);room.name='room';props.name='props';puppet.name='puppet';lamp.name='lamp';
let seed=43;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
// Keep the procedural layout sequence independent of the replacement artwork.
for(let i=0;i<240402;i++)rand();
const wood=propMaterial('wood','#756047'),woodVariants=['#786248','#6b5b45','#827058'].map((color,i)=>propMaterial('wood',color,31+i));
let woodIndex=0;
const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.8});
const iron=mat('#292e28'),paper=propMaterial('paper','#bcb59a'),skin=propMaterial('skin','#bd9c6e'),dark=propMaterial('cloth','#465453');
function box(w,h,d,m,x,y,z,parent=props){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m===wood?woodVariants[woodIndex++%woodVariants.length]:m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function ball(r,m,x,y,z,parent=puppet){const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
function rod(a,b,r,m,parent=props){const delta=new THREE.Vector3().subVectors(b,a);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),12),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;parent.add(o);return o;}
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
// BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
const edge=new THREE.MeshStandardMaterial({color:'#78827b',roughness:1});
const backPaint=paintedSurface('wall',10,5.5,71),leftPaint=paintedSurface('wall',7.6,5.5,83),rightPaint=paintedSurface('wall',7.6,2,97);
box(10,.38,7.6,wood,0,-.24,0,room);
box(9.7,.12,7.3,[edge,edge,paintedSurface('floor',9.7,7.3,33),edge,edge,edge],0,0,0,room);
box(10,5.5,.22,[edge,edge,edge,edge,backPaint,edge],0,2.7,-3.8,room);
box(.22,5.5,7.6,[leftPaint,edge,edge,edge,edge,edge],-5,2.7,0,room);
box(.22,2,7.6,[edge,rightPaint,edge,edge,edge,edge],5,.95,0,room);
for(let i=0;i<9;i++)box(.018,.006,7.2,iron,-4.4+i*1.1,.065,0,room);
box(9.8,.18,.18,wood,0,.35,-3.61,room);box(.18,.18,7.4,wood,-4.8,.35,0,room);
const boardPaint=paintedSurface('board',7.3,2.4,29);
// Preserve random draws formerly used by chalk marks before creating books.
for(let i=0;i<7350;i++)rand();
box(7.6,2.65,.16,wood,0,3.1,-3.58);box(7.3,2.4,.04,boardPaint,0,3.1,-3.47);box(7.7,.1,.35,wood,0,1.75,-3.35);
// A cold window, its frame and bars.
const glow=new THREE.MeshStandardMaterial({color:'#718f8e',emissive:'#4d717b',emissiveIntensity:.6});box(.03,2.7,2.5,glow,-4.86,3.5,-.6);for(let z=-1.85;z<=.66;z+=.83)box(.12,2.85,.06,wood,-4.77,3.5,z);box(.12,.07,2.65,wood,-4.76,3.5,-.6);
function desk(x,z,angle=0){const g=new THREE.Group();props.add(g);box(1.65,.13,1.05,wood,0,1.55,0,g);for(const a of [-.68,.68])for(const b of [-.4,.4])box(.09,1.5,.09,iron,a,.75,b,g);box(1.3,.16,.65,wood,0,.7,1,g);for(const a of [-.52,.52])box(.08,.7,.08,iron,a,.35,1,g);box(1.3,.6,.09,wood,0,1.15,1.3,g);g.position.set(x,0,z);g.rotation.y=angle;return g;}
desk(3,-1.2,-.12);desk(-3.2,-1.7,.15);
const covers=['#785a4b','#4e6960','#8b8055','#536a7b'];
const coverPaint=covers.map((color,i)=>propMaterial('cover',color,91+i));function book(x,y,z,w=1){const g=new THREE.Group();props.add(g);box(w,.13,.58,paper,0,0,0,g);for(const h of [-.085,.085])box(w+.05,.035,.62,coverPaint[Math.floor(rand()*4)],0,h,0,g);g.position.set(x,y,z);g.rotation.y=(rand()-.5)*.3;return g;}
for(let i=0;i<15;i++)book(3+Math.sin(i*.7)*.16,1.76+i*.19,-1.15,1+rand()*.25);for(let i=0;i<5;i++)book(4,.2+i*.19,1.2,.8);book(-2.9,1.75,-1.7);book(1.9,.18,1.8);
// A handmade jointed puppet, ready to be driven by hand tracking later.
puppet.position.set(-.65,0,.65);
const limbs=[];
for(const side of [1,-1])for(const leg of [false,true]){
 const root=v(side*(leg?.19:.43),leg?.95:1.65,0),end=v(side*(leg?.29:.75),leg?.17:.85,.12);
 const a=leg?.44:.56,b=leg?.36:.34;
 const upper=rod(root,end,.1,dark,puppet),lower=rod(root,end,.075,skin,puppet);
 const joint=ball(.10,skin,0,0,0),tip=leg?box(.23,.14,.43,wood,0,0,0,puppet):ball(.10,skin,0,0,0);
 limbs.push({root,end,rest:end.clone(),a,b,upper,lower,joint,tip,leg,side,index:leg?(side===1?3:4):(side===1?0:1)});
}
const classicGroup=new THREE.Group();
for(const child of [...puppet.children])classicGroup.add(child);
const classicBody=box(.65,.85,.35,dark,0,1.35,0,classicGroup),classicHead=new THREE.Group();classicGroup.add(classicHead);
ball(.42,skin,0,2.15,0,classicHead);ball(.43,dark,0,2.28,-.07,classicHead);box(.62,.2,.15,dark,0,2.4,.25,classicHead);
for(const x of [-.16,.16]){ball(.07,iron,x,2.16,.38,classicHead);ball(.018,mat('#d7c88a'),x,2.17,.44,classicHead);}
rod(v(0,1.7,0),v(0,1.85,0),.09,skin,classicHead);
const classicLimbs=limbs.slice(),studentGroup=new THREE.Group();
const studentLimbs=limbs.map(l=>{const copy={...l,end:l.end.clone()};for(const key of ['upper','lower','joint','tip']){copy[key]=l[key].clone();studentGroup.add(copy[key]);}return copy;});
const modernStudent=createStudent(studentGroup,studentLimbs);
const woodenGroup=new THREE.Group(),woodenLimbs=classicLimbs.map(l=>{const copy={...l,end:l.end.clone()};for(const key of ['upper','lower','joint','tip']){copy[key]=l[key].clone();woodenGroup.add(copy[key]);}return copy;});
const woodenStudent=createStudent(woodenGroup,woodenLimbs,'wooden-puppet.glb');
const riggedGroup=new THREE.Group(),riggedStudent=createRiggedPuppet(riggedGroup);
let student=modernStudent,activePuppet=studentGroup;puppet.add(activePuppet);
const puppetChoice=document.querySelector('#puppet-choice');
puppetChoice.addEventListener('change',()=>{
 const classic=puppetChoice.value==='classic',wooden=puppetChoice.value==='wooden',rigged=puppetChoice.value==='rigged';puppet.remove(activePuppet);activePuppet=rigged?riggedGroup:classic?classicGroup:wooden?woodenGroup:studentGroup;puppet.add(activePuppet);
 limbs.splice(0,limbs.length,...(classic?classicLimbs:wooden?woodenLimbs:studentLimbs));student=rigged?riggedStudent:classic?{body:classicBody,head:classicHead}:wooden?woodenStudent:modernStudent;
});
limbs.splice(0,limbs.length,...studentLimbs);
function segment(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b)/mesh.geometry.parameters.height;mesh.quaternion.setFromUnitVectors(v(0,1,0),b.clone().sub(a).normalize());}
// Pendant light: visible bulb and a real shadow-casting spotlight.
lamp.position.set(1.3,4.6,.3);const shade=new THREE.Mesh(new THREE.ConeGeometry(.6,.35,32,1,true),Object.assign(propMaterial('enamel','#61745a'),{side:THREE.DoubleSide}));lamp.add(shade);const bulb=ball(.12,new THREE.MeshStandardMaterial({color:'#fff0bb',emissive:'#ffd17a',emissiveIntensity:4}),0,-.15,0,lamp);const light=new THREE.SpotLight('#ffce86',65,15,.64,.65,1.5);light.position.set(0,-.23,0);lamp.add(light);light.target.position.set(1.1,0,.2);scene.add(light.target);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.bias=-.0005;
scene.add(new THREE.HemisphereLight('#89a2af','#2b251a',1.35));const moon=new THREE.DirectionalLight('#9bbdcf',2.2);moon.position.set(-6,7,1);scene.add(moon);const fill=new THREE.DirectionalLight('#c2b492',.6);fill.position.set(3,4,8);scene.add(fill);
const dustPositions=[];for(let i=0;i<180;i++)dustPositions.push((rand()-.5)*9,rand()*5,(rand()-.5)*6);const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));scene.add(new THREE.Points(dg,new THREE.PointsMaterial({color:'#c5bd98',size:.018,transparent:true,opacity:.35})));
let view='close';
function frameView(){
 const wide=view==='wide', target=wide?v(0,2.5,0):v(-.4,1.8,.5);
 const direction=wide?v(7,5.5,12).normalize():v(1.3,3.4,11).normalize();
 const distance=Math.max(wide?5.7:3.1,(wide?7.8:4.1)/camera.aspect)/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 camera.position.copy(target).addScaledVector(direction,distance);controls.target.copy(target);controls.maxDistance=Math.max(30,distance*1.5);controls.update();
 document.querySelector('#close-view').setAttribute('aria-pressed',String(!wide));document.querySelector('#wide-view').setAttribute('aria-pressed',String(wide));
}
document.querySelector('#close-view').onclick=()=>{view='close';frameView();};
document.querySelector('#wide-view').onclick=()=>{view='wide';frameView();};
const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();frameView();};new ResizeObserver(resize).observe(stage);resize();
document.querySelector('#reset').onclick=()=>{frameView();};document.querySelector('#light').onclick=e=>{light.visible=!light.visible;bulb.material.emissiveIntensity=light.visible?4:.08;e.currentTarget.textContent=light.visible?'熄灭悬灯':'点亮悬灯';e.currentTarget.setAttribute('aria-pressed',String(light.visible));};document.querySelector('#full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.querySelector('#full').textContent='浏览器不支持全屏';}};
const cable=rod(v(lamp.position.x,6.2,lamp.position.z),lamp.position.clone().add(v(0,.175,0)),.015,iron);
const lampHome=lamp.position.clone();
const lampPanel=document.createElement('section');
lampPanel.innerHTML='<p>右手食指：左右移动 · 捏合上下调灯高，松开保留高度</p><button id="lamp-reset">恢复灯位</button>';
document.querySelector('aside').append(lampPanel);
const lampDriver={target:lampHome.clone(),seen:-Infinity,owner:'real',active:false,pinching:false,baseline:null,horizontal:null};
const lampStatus=document.createElement('p');lampStatus.id='lamp-status';lampStatus.setAttribute('role','status');lampPanel.append(lampStatus);
const heightLabel=document.createElement('label');heightLabel.textContent='模拟灯高 ';
const height=document.createElement('input');height.id='lamp-height';height.type='range';height.min='1';height.max='5.4';height.step='.01';height.value='4.6';heightLabel.append(height);lampPanel.append(heightLabel);
const resume=document.createElement('button');resume.id='lamp-resume';resume.textContent='退出模拟控制';lampPanel.append(resume);
height.oninput=()=>{if(lampDriver.owner!=='simulation')lampDriver.target.copy(lamp.position);lampDriver.owner='simulation';lampDriver.target.y=Number(height.value);lampDriver.baseline=null;lampDriver.horizontal=null;lampDriver.pinching=false;};
resume.onclick=()=>{lampDriver.owner='real';lampDriver.target.copy(lamp.position);lampDriver.seen=performance.now();lampDriver.baseline=null;lampDriver.horizontal=null;lampDriver.pinching=false;};
document.querySelector('#lamp-reset').onclick=()=>{lampDriver.owner='real';lampDriver.target.copy(lampHome);lampDriver.seen=-Infinity;lampDriver.baseline=null;lampDriver.horizontal=null;lampDriver.pinching=false;};
window.addEventListener('handtracking',({detail})=>{
 lampDriver.active=!!detail.active;
 if(!detail.active){lampDriver.owner='real';lampDriver.seen=-Infinity;lampDriver.target.copy(lampHome);lampDriver.baseline=null;lampDriver.horizontal=null;lampDriver.pinching=false;lampDriver.pinching=false;return;}
 if(lampDriver.owner==='simulation')return;
 const target=detail.right?.visible?handPosition(detail.right.landmarks,'lamp'):null;
 if(!target){lampDriver.baseline=null;lampDriver.horizontal=null;lampDriver.pinching=false;lampDriver.pinching=false;return;}
 const pts=detail.right.landmarks;
 const pinching=pinchState(pts,lampDriver.pinching);
 if(pinching!==lampDriver.pinching){lampDriver.baseline=null;lampDriver.horizontal=null;}
 lampDriver.pinching=pinching;
 if(pinching){
  if(!lampDriver.baseline){lampDriver.baseline={y:pts[8].y,height:lamp.position.y};lampDriver.target.copy(lamp.position);}
  target.y=clamp(lampDriver.baseline.height+(lampDriver.baseline.y-pts[8].y)*5,1,5.4);
  target.x=lampDriver.target.x;target.z=lampDriver.target.z;
 }else{
  if(!lampDriver.horizontal){lampDriver.horizontal={hand:target.x,lamp:lamp.position.x};lampDriver.target.copy(lamp.position);}
  target.x=clamp(lampDriver.horizontal.lamp+target.x-lampDriver.horizontal.hand,-1.5,1.5);
  target.y=lampDriver.target.y;
 }
 lampDriver.target.copy(target);lampDriver.seen=performance.now();
});
const puppetHome=puppet.position.clone();
const driver={target:puppetHome.clone(),seen:-Infinity,raw:[0,0,0,0,0],values:[0,0,0,0,0,0,0,0,0],recoverUntil:0};
const names=['拇指','食指','中指','无名指','小指'];
const ranges=Array(5).fill(null);
let calibration=null,sensitivity=1,palmBaseline=null,palmRaw=null,headSeen=-Infinity;
const liveSettings={limbRange:1,headGain:1,headRange:1};
const liveDiagnostics={limited:false,target:[],renderMs:0,frameMs:0};
let simulation=false;

const simulated=[0,0,0,0,0,0,0,0,0];
const simulationPanel=document.createElement('details');
simulationPanel.innerHTML='<summary>模拟动作控制</summary><label><input id="simulate" type="checkbox">启用模拟模式（暂停左手操偶输入）</label><p id="input-mode">真实输入模式</p>'+names.map((name,i)=>`<label style="display:block">${name} → ${['左手','右手','身体提起','左脚','右脚'][i]} <input id="sim-${i}" aria-label="模拟${name}" type="range" min="0" max="1" step="0.01" value="0"><output id="sim-value-${i}">0.00</output></label>`).join('');
simulationPanel.innerHTML+=['左脚抬高','右脚抬高','头部左右','头部俯仰'].map((name,j)=>`<label style="display:block">${name}<input id="sim-${j+5}" aria-label="${name}" type="range" min="${j<2?0:-1}" max="1" step="0.01" value="0"></label>`).join('');
for(let i=0;i<9;i++){const el=simulationPanel.querySelector(`#sim-${i}`);if(i<5&&i!==2)el.min=-1;if(i>=5)el.oninput=e=>simulated[i]=Number(e.target.value);}
document.querySelector('aside').append(simulationPanel);
document.querySelector('#simulate').onchange=e=>{simulation=e.target.checked;driver.recoverUntil=performance.now()+300;document.querySelector('#input-mode').textContent=simulation?'模拟模式 · 左手不驱动木偶，右手仍可提灯':'真实输入模式';if(calibration)calibration.last=0;};
names.forEach((_,i)=>document.querySelector(`#sim-${i}`).oninput=e=>{simulated[i]=Number(e.target.value);document.querySelector(`#sim-value-${i}`).value=simulated[i].toFixed(2);});
function actionInput(idle){
 if(simulation)return simulated;
 liveDiagnostics.limited=false;
 const fingers=driver.raw.map((raw,i)=>{if(idle)return 0;const mapped=signedFinger(raw,ranges[i],sensitivity);liveDiagnostics.limited ||=mapped.limited;return (i===2?Math.max(0,mapped.value):mapped.value)*liveSettings.limbRange;});
 if(palmRaw&&palmBaseline)liveDiagnostics.limited ||=Math.abs(angleDelta(palmRaw.yaw,palmBaseline.yaw)*liveSettings.headGain)>.7||Math.abs(angleDelta(palmRaw.pitch,palmBaseline.pitch)*liveSettings.headGain)>.45;
 const head=headTarget(!idle&&performance.now()-headSeen<300?palmRaw:null,palmBaseline,liveSettings.headGain,liveSettings.headRange);
 return [...fingers,stepHeight(fingers[3]),stepHeight(fingers[4]),...head];
}

const status=document.querySelector('#calibration-status');
const debug=document.querySelector('#finger-debug');
const livePanel=document.createElement('div');
livePanel.innerHTML='<p>真人控制：先完成自然中立、舒适伸展、舒适弯曲三步校准。中立区为单侧行程的15%。</p>'+[['limbRange','四肢动作范围',.2,1],['headGain','头部灵敏度',.5,2],['headRange','头部动作范围',.2,1]].map(([key,label,min,max])=>`<label>${label}<input id="live-${key}" aria-label="${label}" type="range" min="${min}" max="${max}" step="0.05" value="1"><output>1.00</output></label>`).join('')+'<pre id="live-debug" aria-live="off"></pre><p id="render-timing"></p>';
document.querySelector('.calibration').append(livePanel);
for(const key of Object.keys(liveSettings))document.querySelector(`#live-${key}`).oninput=e=>{liveSettings[key]=Number(e.target.value);e.target.nextElementSibling.value=liveSettings[key].toFixed(2);};
debug.innerHTML=names.map((name,i)=>`<div>${name} <span id="raw-${i}"></span><progress id="bar-${i}" max="1" value="0"></progress><span id="value-${i}"></span><span id="range-${i}">默认范围</span><button id="retry-${i}">单独校准</button></div>`).join('');
function begin(indices){calibration={indices,phase:0,elapsed:0,last:0,samples:[],open:[],neutral:[],palms:[]};status.textContent='左手自然放松，掌心朝向舒适方向，点击开始采样';document.querySelector('#sample').disabled=false;}
document.querySelector('#calibrate').onclick=()=>begin([0,1,2,3,4]);
names.forEach((_,i)=>document.querySelector(`#retry-${i}`).onclick=()=>begin([i]));
document.querySelector('#sample').onclick=()=>{if(calibration){calibration.running=true;calibration.last=0;document.querySelector('#sample').disabled=true;}};
document.querySelector('#sensitivity').oninput=e=>{sensitivity=Number(e.target.value);document.querySelector('#sensitivity-value').textContent=sensitivity.toFixed(2);};
document.querySelector('#sensitivity-reset').onclick=()=>{sensitivity=1;document.querySelector('#sensitivity').value=1;document.querySelector('#sensitivity-value').textContent='1.00';};
window.addEventListener('handtracking',({detail})=>{
 if(!detail.active){simulation=false;document.querySelector('#simulate').checked=false;driver.seen=-Infinity;driver.target.copy(puppetHome);driver.raw.fill(0);if(calibration)calibration.last=0;}
 if(simulation)return;
 const target=detail.active && detail.left?.visible?handPosition(detail.left.landmarks):null;
 if(!target){if(calibration)calibration.last=0;return;}
 driver.target.copy(target);
 const pts=detail.left.landmarks,now=performance.now();if(now-driver.seen>250)driver.recoverUntil=now+300;driver.raw=curls(pts);driver.seen=now;
 const candidate=palmAngles(detail.left.worldLandmarks||pts);
 palmRaw=guardPalm(candidate,palmRaw,(now-headSeen)/1000);if(palmRaw)headSeen=now;
 if(calibration?.running){
  const c=calibration;
  if(driver.raw.every(Number.isFinite)){
   if(c.last && now-c.last<250)c.elapsed+=now-c.last;
   c.last=now;c.samples.push(driver.raw.slice());if(palmRaw)c.palms.push({...palmRaw});
   if(c.elapsed>=2000){
    const mean=driver.raw.map((_,i)=>c.samples.reduce((sum,x)=>sum+x[i],0)/c.samples.length);
    if(c.phase===0){
     if(c.palms.length<10){c.elapsed=0;c.samples=[];c.palms=[];status.textContent='掌面识别不足，请让腕部和掌指关节完整入镜后重试';return;}
     c.neutral=mean;const first=c.palms[0];palmBaseline={yaw:first.yaw+c.palms.reduce((sum,p)=>sum+angleDelta(p.yaw,first.yaw),0)/c.palms.length,pitch:c.palms.reduce((sum,p)=>sum+p.pitch,0)/c.palms.length};
     c.phase=1;status.textContent='舒适伸展五指，不必极限伸直；点击开始采样';
    }else if(c.phase===1){c.open=mean;c.phase=2;status.textContent='舒适弯曲五指，不必握紧；点击开始采样';}
    else{c.indices.forEach(i=>{const valid=c.neutral[i]-c.open[i]>=.025&&mean[i]-c.neutral[i]>=.025;if(valid)ranges[i]={open:c.open[i],neutral:c.neutral[i],closed:mean[i]};document.querySelector(`#range-${i}`).textContent=valid?'三点校准有效':'中立两侧跨度不足，请单独重试';});calibration=null;status.textContent='校准完成；自然中立保持不动，伸展后摆，弯曲前摆';}
    if(calibration){c.elapsed=0;c.last=0;c.samples=[];c.palms=[];c.running=false;document.querySelector('#sample').disabled=false;}
   }
  }else c.last=0;
 }

});
function applyPose(){
 const lift=driver.values[2]*.55;
 const headSupported=student!==riggedStudent||!!student.headBone;
 for(const i of [7,8]){const input=document.querySelector(`#sim-${i}`);input.disabled=!headSupported;input.title=headSupported?'围绕颈部旋转':(student.loaded?'缺少 Head/Neck 骨骼，不支持独立头部':'等待骨骼模型加载');}

 for(const limb of limbs){const pose=limbPose(limb.side,limb.leg,driver.values[limb.index],lift,driver.values[limb.side===1?5:6]);limb.end.copy(pose.end);segment(limb.upper,pose.root,pose.joint);segment(limb.lower,pose.joint,pose.end);limb.joint.position.copy(pose.joint);limb.tip.position.copy(pose.end);}

 student.update?.(driver.values);
 if(student!==riggedStudent){
 const h=student.head;
 if(!h.userData.neckPivot){const pivot=new THREE.Group();pivot.position.set(0,1.78,0);h.parent.add(pivot);pivot.attach(h);h.userData.neckPivot=pivot;}
 const pivot=h.userData.neckPivot;pivot.position.y=1.78+lift;pivot.rotation.set(driver.values[8]*.45,driver.values[7]*.7,0,'YXZ');
 }
 if(student!==riggedStudent){
 const feet=student.footObjects||limbs.filter(l=>l.leg).map(l=>l.tip);
 for(let iteration=0;iteration<2;iteration++){
 activePuppet.updateWorldMatrix(true,true);
 for(let i=0;i<feet.length;i++){
 const box=new THREE.Box3().setFromObject(feet[i],true),floor=activePuppet.localToWorld(v(0,.06+lift,0)).y;
 const delta=Math.max(0,floor-box.min.y);
 if(delta>1e-6){const limb=student.footObjects?limbs.find(l=>l.leg&&Math.sign(feet[i].position.x)===l.side):limbs.filter(l=>l.leg)[i];
 const pose=solveIK(limb.root.clone().add(v(0,lift,0)),limb.end.clone().add(v(0,delta,0)),limb.a,limb.b,v(limb.side*.65,.25,1));
 limb.end.copy(pose.end);segment(limb.upper,limb.root.clone().add(v(0,lift,0)),pose.joint);segment(limb.lower,pose.joint,pose.end);limb.joint.position.copy(pose.joint);limb.tip.position.copy(pose.end);
 }
 }
 student.update?.(driver.values);
 }
 }
 // Move the rigid torso and head together with the middle-finger lift.
 for(const child of [student.body,student.head]){child.userData.baseY??=child.position.y;child.position.y=child.userData.baseY+(child.userData.neckPivot?0:lift);}
}
const books=[new THREE.Box3(v(2.1-.63,-1,-1.65-.63),v(3.9+.63,4.9,-.65+.63))];
function currentBoxes(){return [...collisionBoxes(activePuppet),...books];}
function resolveCollision(next,dt,previousPosition,previousValues){
 const proposed=puppet.position.clone(),values=driver.values.slice(),origin=lamp.position.clone();
 // A pre-existing overlap is repaired once; ordinary frames obey the speed budget.
 puppet.position.copy(previousPosition);driver.values.splice(0,9,...previousValues);applyPose();
 const recovering=!safeLamp(origin,currentBoxes());
 const budget=Math.max(.001,dt*3);
 if(next.distanceTo(origin)>budget){const delta=next.clone().sub(origin).setLength(budget);next.copy(origin).add(delta);}
 let accepted=null;
 for(let step=0;step<=12;step++){
  const fraction=step===12?0:Math.pow(.5,step);
  puppet.position.copy(previousPosition).lerp(proposed,fraction);
  driver.values.splice(0,9,...values.map((value,i)=>previousValues[i]+(value-previousValues[i])*fraction));applyPose();
  const boxes=currentBoxes(),candidate=nearestLamp(next,boxes);
  if(candidate&&(recovering||candidate.distanceTo(origin)<=budget)) {accepted=candidate;break;}
 }
 if(!accepted){
  puppet.position.copy(previousPosition);driver.values.splice(0,9,...previousValues);applyPose();
  const boxes=currentBoxes();accepted=safeLamp(origin,boxes)?origin:nearestLamp(origin,boxes);
 }
 if(accepted)lamp.position.copy(accepted);
}
let lastFrame=performance.now(),lastFrameMeasured=lastFrame;
renderer.setAnimationLoop(()=>{
 const now=performance.now(),dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
 const lampLost=now-lampDriver.seen>600;
 const desired=lampDriver.owner==='simulation'?lampDriver.target:lampLost?lampHome:lampDriver.target;
 const next=lamp.position.clone().lerp(desired,1-Math.exp(-dt*(lampLost?1.8:10)));
 const idle=!simulation && now-driver.seen>300,alpha=1-Math.exp(-dt*(idle?1.6:(now<driver.recoverUntil?8:18)));
 const previousPosition=puppet.position.clone(),previousValues=driver.values.slice();
 puppet.position.lerp(simulation||idle?puppetHome:driver.target,alpha);
 const input=actionInput(idle);
 for(let i=0;i<9;i++){const value=input[i]||0;driver.values[i]=simulation?driver.values[i]+(value-driver.values[i])*alpha:follow(driver.values[i],value,dt,i>=7?1.5:3,now<driver.recoverUntil?5:12);}
 liveDiagnostics.target=input.slice();const proposedValues=driver.values.slice();
 applyPose();
 resolveCollision(next,dt,previousPosition,previousValues);
 lampStatus.textContent=lampDriver.owner==='simulation'?'模拟控制':!lampDriver.active?'摄像头未开启':lampLost?'等待右手':lampDriver.pinching?'吊线伸缩':'提灯移动';
 segment(cable,v(lamp.position.x,6.2,lamp.position.z),lamp.position.clone().add(v(0,.175,0)));
 light.target.position.set(lamp.position.x,.065,lamp.position.z);
 names.forEach((_,i)=>{const value=input[i];document.querySelector(`#raw-${i}`).textContent=simulation?'模拟输入':`原始 ${driver.raw[i].toFixed(3)}`;document.querySelector(`#bar-${i}`).value=idle?0:value;document.querySelector(`#value-${i}`).textContent=idle?'未追踪':value.toFixed(2);});
 if(calibration?.running)status.textContent=(['自然中立采样','舒适伸展采样','舒适弯曲采样'][calibration.phase])+`：剩余 ${Math.max(0,(2000-calibration.elapsed)/1000).toFixed(1)} 秒`+(now-driver.seen>250?' · 左手丢失，暂停':'');
 const blocked=driver.values.some((value,i)=>Math.abs(value-proposedValues[i])>.001);
 document.querySelector('#live-debug').textContent=`状态：${simulation?'模拟':idle?'识别不足 / 丢手回中':!ranges.every(Boolean)?'需完成五指校准':!palmRaw?'掌面退化 / 头部回中':blocked?'碰撞阻挡':liveDiagnostics.limited?'映射限幅':'正常'}\n识别：${idle?'丢失':palmRaw?'有效':'掌面退化'} · 映射限幅：${liveDiagnostics.limited} · 碰撞阻挡：${blocked}\n掌面原始 yaw/pitch：${palmRaw?`${palmRaw.yaw.toFixed(2)} / ${palmRaw.pitch.toFixed(2)}`:'无效'}\n目标：${input.map(x=>x.toFixed(2)).join(' ')}\n实际：${driver.values.map(x=>x.toFixed(2)).join(' ')}`;
 controls.update();const renderStart=performance.now();renderer.render(scene,camera);liveDiagnostics.renderMs=performance.now()-renderStart;liveDiagnostics.frameMs=now-lastFrameMeasured;lastFrameMeasured=now;
 document.querySelector('#render-timing').textContent=`渲染提交 ${liveDiagnostics.renderMs.toFixed(1)} ms · 帧间隔 ${liveDiagnostics.frameMs.toFixed(1)} ms（非 GPU 完成时间）`;

});
window.theatre={get activeCharacter(){return student;},get activePuppet(){return activePuppet;},liveDiagnostics,liveSettings,scene,camera,renderer,room,props,puppet,lamp,limbs,driver,light,lampDriver,cable};
} catch(error){const e=document.querySelector('#error');e.hidden=false;e.textContent='场景无法启动，请确认浏览器已开启硬件加速。'+error.message;console.error(error);}


