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
