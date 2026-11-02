// Move the existing controls so event handlers, video stream and IDs stay intact.
const mobile=matchMedia('(max-width: 900px)');
const workspace=document.querySelector('.workspace'),aside=document.querySelector('aside');
const camera=document.querySelector('.camera-panel'),stage=document.querySelector('#stage'),footer=document.querySelector('footer');
function arrange(){
 if(mobile.matches){workspace.insertBefore(camera,stage);workspace.insertBefore(footer,aside);}
 else{aside.prepend(camera);document.body.append(footer);}
}
mobile.addEventListener('change',arrange);
arrange();

const entry=document.createElement('button');entry.id='puppet-entry';entry.textContent='选择人偶 · 四种角色';
entry.onclick=()=>{const select=document.querySelector('#puppet-choice');select.scrollIntoView({block:'center'});select.focus({preventScroll:true});};stage.before(entry);
const version=document.createElement('small');version.id='build-version';version.textContent='构建 '+__BUILD_SHA__;document.querySelector('header').append(version);
