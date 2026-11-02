import {cp,mkdir,readdir} from 'node:fs/promises';
const source=new URL('../node_modules/@mediapipe/tasks-vision/wasm/',import.meta.url);
const destination=new URL('../public/mediapipe/wasm/',import.meta.url);
await mkdir(destination,{recursive:true});
for(const file of await readdir(source))if(/\.(js|wasm)$/.test(file))await cp(new URL(file,source),new URL(file,destination));
await cp(new URL('../node_modules/three/LICENSE',import.meta.url),new URL('../public/licenses/three-MIT.txt',import.meta.url));
console.log('MediaPipe WASM 与 Three.js 许可已同步到 public');

await cp(new URL('../node_modules/@mediapipe/tasks-vision/vision_bundle.js',import.meta.url),new URL('../public/mediapipe/vision_bundle.js',import.meta.url));
