import {frameReady} from './tracking-state.js';
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
const liveInfo=document.createElement('p');liveInfo.id='tracking-live';liveInfo.setAttribute('role','status');status.after(liveInfo);
const metrics={model:'未加载',count:0,last:0,hands:0,ms:0,drawn:false,error:'',videoChanged:performance.now()};
let observedTime=-1,lastAttempt=0;
function resizeOverlay(){if(video.videoWidth && video.videoHeight){if(canvas.width!==video.videoWidth)canvas.width=video.videoWidth;if(canvas.height!==video.videoHeight)canvas.height=video.videoHeight;video.parentElement.style.aspectRatio=video.videoWidth+'/'+video.videoHeight;}}
video.addEventListener('resize',resizeOverlay);
function updateDiagnostic(){
 const now=performance.now(),track=stream?.getVideoTracks()[0];
 if(video.currentTime!==observedTime){observedTime=video.currentTime;metrics.videoChanged=now;}
 const age=metrics.last?((now-metrics.last)/1000).toFixed(1)+'秒前':'无';
 liveInfo.textContent=video.videoWidth+'×'+video.videoHeight+' · ready '+video.readyState+' · 轨道 '+(track?.readyState||'无')+(track?.muted?' / muted':'')+' · 模型 '+metrics.model+' · 推理 '+metrics.count+' 次 / '+age+' · 手 '+metrics.hands+' · '+metrics.ms.toFixed(1)+'ms · 视频 '+video.currentTime.toFixed(2)+'s';
 if(!stream)return;
 status.textContent=metrics.error?'推理失败：'+metrics.error+'；请重启摄像头':metrics.model!=='就绪'?'A：模型'+metrics.model:document.hidden?'后台暂停，返回后恢复':now-metrics.videoChanged>3000?'B：视频帧停滞，请重新开启摄像头':!metrics.last||now-metrics.last>3000?'B：等待有效帧或推理停滞，请重启摄像头':!metrics.hands?'C：推理正常，未检测到手。确认前置摄像头、光线充足，完整手掌靠近镜头':!metrics.drawn?'D：已检测到手，骨架绘制异常':!window.theatre?.liveCalibration?.ranges?.every(Boolean)?'骨架正常，默认手指控制已启用，可选个人校准':!tracking.left.visible?'已校准；请将左手完整入镜控制木偶':'骨架正常，五指已校准';
}
setInterval(updateDiagnostic,500);
let modelPromise,permissionPending=false;
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
  stream=null; video.pause();video.srcObject=null; lastVideoTime=-1;previousUpdate=0;inferenceSamples.length=0;
  clear(); status.textContent=message;
  startButton.disabled=permissionPending; stopButton.disabled=true;
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
async function loop(token) {
  if(token!==generation || !stream) return;
  if(frameReady({model,live:stream.getVideoTracks().some(t=>t.readyState==='live'),hidden:document.hidden,width:video.videoWidth,height:video.videoHeight,readyState:video.readyState,time:video.currentTime,lastTime:lastVideoTime,busy,now:performance.now(),lastAttempt,inferenceMs:metrics.ms})) {
    busy=true;lastAttempt=performance.now();
    try {
      lastVideoTime=video.currentTime;
      const started=performance.now();
      const {result,inference}=await model.detect(video,started);
      if(token!==generation || !stream)return;
      metrics.count++;metrics.last=performance.now();metrics.ms=inference;metrics.hands=result.landmarks.length;metrics.drawn=false;
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
      publish(hands.left,hands.right); resizeOverlay();draw();metrics.drawn=hands.left.visible||hands.right.visible;
      document.querySelector('#mapping-debug').textContent='原始标签 → 最终身份：'+(result.handedness.map(h=>{const label=h[0]?.categoryName;return label+' → '+(assignSide(label)==='left'?'真实左手（木偶）':'真实右手（悬灯）');}).join('；')||'无')+' · 固定身份映射';
      document.querySelector('#left-status').textContent='你的左手：'+(hands.left.visible?'已追踪':'未发现');
      document.querySelector('#right-status').textContent='你的右手：'+(hands.right.visible?'已追踪':'未发现');
      status.textContent=hands.left.visible||hands.right.visible?'已追踪':'正在寻找手';
    } catch(error) { if(token===generation){metrics.error=error.message;failure('追踪运行',error);} }
    finally {busy=false;}
  }
  if(token===generation && stream) frame=requestAnimationFrame(()=>loop(token));
}
const officialURL='https://ff7kl.github.io/shoushijiaohu/';
const diagnostics=document.createElement('details');diagnostics.id='camera-diagnostics';
diagnostics.innerHTML='<summary>摄像头诊断</summary><pre id="camera-diagnostic-info" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>';
document.querySelector('.camera-controls').append(diagnostics);
const cameraInfo={step:'等待点击',errorName:'无',explanation:''};
function showStep(step,error=null,explanation=''){
 cameraInfo.step=step;cameraInfo.errorName=error?.name||'无';cameraInfo.explanation=explanation;
 const policy=document.permissionsPolicy||document.featurePolicy;
 let allowed='未知';try{if(policy?.allowsFeature)allowed=String(policy.allowsFeature('camera'));}catch{}
 document.querySelector('#camera-diagnostic-info').textContent=`地址：${location.origin}${location.pathname}（省略查询参数和片段）\n安全上下文：${isSecureContext}\nmediaDevices：${!!navigator.mediaDevices} · getUserMedia：${typeof navigator.mediaDevices?.getUserMedia==='function'}\n嵌入页面：${window.top!==window.self} · 策略允许camera：${allowed}\n步骤：${step}\nerror.name：${cameraInfo.errorName}\n${explanation}`;
}
function failure(step,error){
 const guidance={NotAllowedError:'可能已拒绝权限或被系统/页面策略限制。请在网址旁的站点设置允许摄像头，并检查系统中该浏览器的摄像头权限，再点击重试；网页不能强制重新弹出授权框。',SecurityError:'浏览器或页面策略禁止摄像头，请检查站点权限或直接打开正式HTTPS网址。',NotFoundError:'未找到可用摄像头。',NotReadableError:'摄像头无法读取，可能被其他应用占用，请关闭占用程序后重试。',OverconstrainedError:'摄像头无法满足请求条件，请换用系统浏览器重试。',AbortError:'启动已中断，可以重新点击开启。'};
 const embedded=/MicroMessenger|QQ\//i.test(navigator.userAgent)?' 请从右上角菜单选择“使用系统浏览器打开”。':'';
 if(step==='模型加载')metrics.model='失败：'+error.message;
 const explanation=(step==='模型加载'?'视频已获得权限，但手部模型加载失败；请检查网络后重试。':step==='视频启动'?'视频播放失败，请重新点击开启；也请检查浏览器的视频播放限制。':guidance[error.name]||'此浏览器未能启动摄像头，请检查权限后重试。')+embedded;
 stop(`${step}失败（${error.name||'Error'}）：${explanation}`);showStep(`${step}失败`,error,explanation);
}
function ensureModel(){
 if(model)return Promise.resolve(model);
 metrics.model='加载中';
 if(!modelPromise)modelPromise=(async()=>{
  const fallback=async()=>{
   metrics.model='兼容模式加载中';
   const files=await FilesetResolver.forVisionTasks(`${import.meta.env.BASE_URL}mediapipe/wasm`);
   const direct=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:`${import.meta.env.BASE_URL}models/hand_landmarker.task`},runningMode:'VIDEO',numHands:2});
   return {async detect(video,timestamp){const started=performance.now();const result=direct.detectForVideo(video,timestamp);return {result,inference:performance.now()-started};}};
  };
  let worker;
  try{
  if(typeof createImageBitmap!=='function')throw new Error('Video bitmap unavailable');
  worker=new Worker(new URL('mediapipe/hand-worker.js',new URL(import.meta.env.BASE_URL,location.href)));
  let pending;
  const request=(message,transfer=[])=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending=null;reject(new Error('识别线程响应超时'));},message.type==='init'?20000:8000);pending={resolve:data=>{clearTimeout(timer);resolve(data);},reject:error=>{clearTimeout(timer);reject(error);}};try{worker.postMessage(message,transfer);}catch(error){pending.reject(error);pending=null;}});
  worker.onmessage=({data})=>{const task=pending;pending=null;if(data.error)task?.reject(new Error(data.error));else task?.resolve(data);};
  worker.onerror=event=>{pending?.reject(new Error(event.message||'Worker failed'));pending=null;worker.terminate();model=null;};
  await request({type:'init'});
  model={async detect(video,timestamp){let bitmap;try{bitmap=await createImageBitmap(video);return await request({type:'frame',bitmap,timestamp},[bitmap]);}catch(error){worker.terminate();model=await fallback();return model.detect(video,timestamp);}finally{bitmap?.close();}}};
  }catch(error){worker?.terminate();model=await fallback();}
  metrics.model='就绪';return model;
 })().finally(()=>{modelPromise=null;});
 return modelPromise;
}
showStep('等待点击');
startButton.onclick=async()=>{
 if(startButton.disabled||permissionPending)return;
 Object.assign(metrics,{count:0,last:0,hands:0,ms:0,error:'',drawn:false,videoChanged:performance.now()});
 const token=++generation;startButton.disabled=true;stopButton.disabled=false;
 showStep('按钮点击');
 if(!isSecureContext){const error=new DOMException('需要HTTPS','SecurityError');stop(`当前地址不安全，请使用正式HTTPS网址：${officialURL}`);showStep('环境检查失败',error,`HTTP局域网IP不能申请手机摄像头。请使用 ${officialURL}`);return;}
 if(!navigator.mediaDevices?.getUserMedia){failure('申请权限',new DOMException('浏览器缺少摄像头接口','NotSupportedError'));return;}
 const policy=document.permissionsPolicy||document.featurePolicy;
 if(policy?.allowsFeature&&!policy.allowsFeature('camera')){failure('申请权限',new DOMException('当前嵌入策略禁止摄像头','SecurityError'));return;}
 let acquired;
 showStep('申请权限');status.textContent='正在申请摄像头权限，请查看浏览器提示';
 permissionPending=true;
 try{acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:640},height:{ideal:480}},audio:false});}
 catch(error){if(token===generation)failure('申请权限',error);return;}
 finally{permissionPending=false;if(token!==generation)startButton.disabled=false;}
 if(token!==generation){acquired.getTracks().forEach(track=>track.stop());return;}
 stream=acquired;video.srcObject=stream;
 stream.getVideoTracks().forEach(track=>track.onended=()=>{if(token===generation){stop('摄像头已断开，请重新开启');showStep('设备断开');}});
 showStep('视频启动');status.textContent='权限已获得，正在启动视频';
 try{await video.play();}catch(error){if(token===generation)failure('视频启动',error);return;}
 if(token!==generation)return;
 showStep('模型加载');status.textContent='视频已启动，正在加载手部模型；首次可能较慢，20秒后自动尝试兼容模式';
 try{await ensureModel();}catch(error){if(token===generation)failure('模型加载',error);return;}
 if(token!==generation)return;
 canvas.width=video.videoWidth;canvas.height=video.videoHeight;
 clear();showStep('追踪运行');status.textContent='正在寻找手';loop(token);
};
stopButton.onclick=()=>{stop(permissionPending?'已取消，等待浏览器结束权限请求':'未开启');showStep('用户关闭');};
window.addEventListener('pagehide',()=>stop());
window.addEventListener('handtracking',({detail})=>{
  if(!detail.left.visible) document.querySelector('#left-status').textContent='你的左手：未发现';
  if(!detail.right.visible) document.querySelector('#right-status').textContent='你的右手：未发现';
});


document.addEventListener('visibilitychange',()=>{if(!document.hidden && stream){metrics.videoChanged=performance.now();video.play().catch(error=>{metrics.error='返回前台播放失败：'+error.message;});updateDiagnostic();}});
