import {FilesetResolver, HandLandmarker} from '@mediapipe/tasks-vision';

const video = document.querySelector('#camera-video');
const canvas = document.querySelector('#hand-overlay');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#tracking-status');
const startButton = document.querySelector('#camera-start');
const stopButton = document.querySelector('#camera-stop');
const emptyHand = () => ({visible:false, landmarks:[]});
export let tracking = {left:emptyHand(), right:emptyHand(), timestamp:0};
// Camera overlay and scene controls share this identity mapping.
const mirrored=true;
video.style.transform=canvas.style.transform='scaleX(-1)';
function assignSide(label){return label==='Left'?'left':'right';}
let previousUpdate=0;
const inferenceSamples=[];
let model, stream, generation=0, frame=0, lastVideoTime=-1, busy=false;
function publish(left=emptyHand(), right=emptyHand()) {
  tracking = {left, right, timestamp:performance.now(), active:!!stream};
  window.dispatchEvent(new CustomEvent('handtracking', {detail:tracking}));
}
function clear() { document.querySelector('#mapping-debug').textContent='原始标签：无 · 固定身份映射'; ctx.clearRect(0,0,canvas.width,canvas.height); publish(); }
function stop(message='未开启') {
  generation++;
  cancelAnimationFrame(frame);
  stream?.getTracks().forEach(track=>track.stop());
  stream=null; video.srcObject=null; lastVideoTime=-1;
  clear(); status.textContent=message;
  startButton.disabled=false; stopButton.disabled=true;
}
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (const [side, hand] of Object.entries({left:tracking.left,right:tracking.right})) {
    if (!hand.visible) continue;
    ctx.strokeStyle=ctx.fillStyle=side==='left'?'#e4bc72':'#80d4d2';
    ctx.lineWidth=2;
    const wrist=hand.landmarks[0]; ctx.save();ctx.translate(wrist.x*canvas.width,wrist.y*canvas.height);if(mirrored)ctx.scale(-1,1);ctx.font='16px sans-serif';ctx.fillText(side==='left'?'真实左手 / 木偶':'真实右手 / 悬灯',0,-14);ctx.restore();
    for (const {start,end} of HandLandmarker.HAND_CONNECTIONS) {
      const a=hand.landmarks[start], b=hand.landmarks[end];
      ctx.beginPath(); ctx.moveTo(a.x*canvas.width,a.y*canvas.height);
      ctx.lineTo(b.x*canvas.width,b.y*canvas.height); ctx.stroke();
    }
    hand.landmarks.forEach((p,i)=>{
      ctx.beginPath(); ctx.arc(p.x*canvas.width,p.y*canvas.height,[4,8,12,16,20].includes(i)?6:3,0,Math.PI*2); ctx.fill();
    });
  }
}
function loop(token) {
  if(token!==generation || !stream) return;
  if(video.readyState>=2 && video.currentTime!==lastVideoTime && !busy) {
    busy=true;
    try {
      lastVideoTime=video.currentTime;
      const started=performance.now();
      const result=model.detectForVideo(video,started);
      const inference=performance.now()-started;
      inferenceSamples.push(inference);if(inferenceSamples.length>120)inferenceSamples.shift();
      const sorted=inferenceSamples.slice().sort((a,b)=>a-b);
      window.handPerformance={inferenceMs:inference,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))],updateMs:previousUpdate?started-previousUpdate:null,samples:(window.handPerformance?.samples||0)+1};
      document.querySelector('#tracking-timing').textContent=`推理 ${inference.toFixed(1)} ms · P95 ${window.handPerformance.p95.toFixed(1)} ms · 更新间隔 ${previousUpdate?(started-previousUpdate).toFixed(1):'—'} ms`;
      previousUpdate=started;
      const hands={left:emptyHand(),right:emptyHand()};
      result.landmarks.forEach((points,i)=>{
        // Raw video is passed directly to the model; no mirrored input canvas is used.
        const label=result.handedness[i]?.[0]?.categoryName;
        if(label!=='Left' && label!=='Right') return;
        const side=assignSide(label);
        if(hands[side].visible) return;
        hands[side]={visible:true,landmarks:points,worldLandmarks:result.worldLandmarks?.[i]};
      });
      publish(hands.left,hands.right); draw();
      document.querySelector('#mapping-debug').textContent='原始标签 → 最终身份：'+(result.handedness.map(h=>{const label=h[0]?.categoryName;return label+' → '+(assignSide(label)==='left'?'真实左手（木偶）':'真实右手（悬灯）');}).join('；')||'无')+' · 固定身份映射';
      document.querySelector('#left-status').textContent='你的左手：'+(hands.left.visible?'已追踪':'未发现');
      document.querySelector('#right-status').textContent='你的右手：'+(hands.right.visible?'已追踪':'未发现');
      status.textContent=hands.left.visible||hands.right.visible?'已追踪':'正在寻找手';
    } catch(error) { stop('摄像头错误：追踪失败，请重新开启。'); console.error(error); }
    finally {busy=false;}
  }
  if(token===generation && stream) frame=requestAnimationFrame(()=>loop(token));
}
startButton.onclick=async()=>{
  const token=++generation;
  startButton.disabled=true; stopButton.disabled=false;
  status.textContent='模型加载中';
  try {
    if(!model) {
      const files=await FilesetResolver.forVisionTasks(`${import.meta.env.BASE_URL}mediapipe/wasm`);
      model=await HandLandmarker.createFromOptions(files,{
        baseOptions:{modelAssetPath:`${import.meta.env.BASE_URL}models/hand_landmarker.task`},
        runningMode:'VIDEO',numHands:2
      });
    }
    if(token!==generation) return;
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('请通过 localhost 或 HTTPS 使用支持摄像头的浏览器。');
    const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
    if(token!==generation) {acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired; video.srcObject=stream;
    stream.getVideoTracks()[0].onended=()=>{if(token===generation) stop('摄像头错误：设备已断开，请重新开启。');};
    await video.play();
    if(token!==generation) return;
    canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    clear(); status.textContent='正在寻找手'; loop(token);
  } catch(error) {
    if(token!==generation) return;
    const messages={NotAllowedError:'权限被拒绝，请在浏览器中允许摄像头后重试。',NotFoundError:'没有找到摄像头，请连接设备后重试。',NotReadableError:'摄像头无法读取，可能被其他应用占用，请关闭占用程序后重试。'};
    stop('摄像头或模型加载失败：'+(messages[error.name]||error.message)+' 点击“开启摄像头”重试。');
  }
};
stopButton.onclick=()=>stop();
window.addEventListener('pagehide',()=>stop());
window.addEventListener('handtracking',({detail})=>{
  if(!detail.left.visible) document.querySelector('#left-status').textContent='你的左手：未发现';
  if(!detail.right.visible) document.querySelector('#right-status').textContent='你的右手：未发现';
});

