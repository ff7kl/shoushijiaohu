// Move the existing controls so event handlers, video stream and IDs stay intact.
const mobile=matchMedia('(max-width: 900px)');
const workspace=document.querySelector('.workspace'),aside=document.querySelector('aside');
const camera=document.querySelector('.camera-panel'),stage=document.querySelector('#stage'),footer=document.querySelector('footer');
function arrange(){
 if(mobile.matches){workspace.insertBefore(camera,document.querySelector('#puppet-entry')||stage);workspace.insertBefore(footer,aside);}
 else{aside.prepend(camera);document.body.append(footer);}
}
mobile.addEventListener('change',arrange);
arrange();

const entry=document.createElement('button');entry.id='puppet-entry';entry.textContent='选择人偶 · 四种角色';
const picker=document.createElement('div');picker.id='mobile-puppet-picker';picker.hidden=true;
const select=document.querySelector('#puppet-choice');
for(const option of select.options){
 const button=document.createElement('button');button.type='button';button.textContent=option.textContent;
 button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));picker.hidden=true;entry.setAttribute('aria-expanded','false');entry.textContent='模型：'+option.textContent;};picker.append(button);
}
entry.textContent='模型：'+select.selectedOptions[0].textContent;
entry.setAttribute('aria-expanded','false');entry.setAttribute('aria-controls',picker.id);
entry.onclick=()=>{picker.hidden=!picker.hidden;entry.setAttribute('aria-expanded',String(!picker.hidden));};
stage.before(entry,picker);
mobile.addEventListener('change',()=>{picker.hidden=true;entry.setAttribute('aria-expanded','false');});
const version=document.createElement('small');version.id='build-version';version.textContent='构建 '+__BUILD_SHA__;document.querySelector('header').append(version);
