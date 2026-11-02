export function frameReady({model,live,hidden,width,height,readyState,time,lastTime,busy,now,lastAttempt,inferenceMs}){
 return !!model && live && !hidden && width>0 && height>0 && readyState>=2 && time!==lastTime && now-lastAttempt>=Math.max(33,inferenceMs) && !busy;
}
