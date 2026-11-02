importScripts('./vision_bundle.js');
let model;
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   const files=await Vision.FilesetResolver.forVisionTasks(new URL('./wasm',self.location.href).href);
   model=await Vision.HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('../models/hand_landmarker.task',self.location.href).href},runningMode:'VIDEO',numHands:2});
   self.postMessage({ready:true});
  }else{
   const started=performance.now();
   const result=model.detectForVideo(data.bitmap,data.timestamp);
   self.postMessage({result,inference:performance.now()-started});
  }
 }catch(error){self.postMessage({error:error.message||String(error)});}
 finally{data.bitmap?.close();}
};
