import * as T from 'three';
import {propMaterial} from './prop-materials.js';
export function createStudent(puppet,limbs){
 const skin=propMaterial('skin','#c5a179',107),cloth=propMaterial('cloth','#536675',109);
 const hair=new T.MeshStandardMaterial({color:'#302b28',roughness:1}),edge=new T.MeshStandardMaterial({color:'#9b927c',roughness:1}),ink=new T.MeshStandardMaterial({color:'#493c36',roughness:1});
 const white=new T.MeshStandardMaterial({color:'#c8bd9d',roughness:.8}),iris=new T.MeshStandardMaterial({color:'#617267',roughness:.8});
 function ell(parent,m,x,y,z,a,b,c){const o=new T.Mesh(new T.SphereGeometry(1,16,12),m);o.position.set(x,y,z);o.scale.set(a,b,c);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function block(parent,m,x,y,z,a,b,c,angle=0){const o=new T.Mesh(new T.BoxGeometry(a,b,c),m);o.position.set(x,y,z);o.rotation.z=angle;o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 const body=new T.Group(),head=new T.Group();body.name='student-body';head.name='student-head';puppet.add(body,head);
 block(body,cloth,0,1.35,0,.65,.85,.35);block(body,edge,0,.96,.015,.66,.045,.37);
 for(const side of [-1,1]){block(body,edge,side*.13,1.69,.2,.23,.14,.045,side*.48);ell(body,skin,side*.43,1.65,0,.11,.11,.11);ell(body,skin,side*.19,.95,0,.105,.105,.105);}
 block(body,ink,0,1.53,.205,.055,.22,.035);block(body,edge,.23,1.3,.19,.13,.025,.025);
 for(const y of [1.37,1.19,1.04])ell(body,ink,0,y,.195,.025,.025,.018);
 ell(body,skin,0,1.78,0,.09,.15,.09);
 ell(head,skin,0,2.15,0,.40,.42,.345);ell(head,skin,0,1.97,.015,.27,.21,.25);
 for(const s of [-1,1]){
 ell(head,skin,s*.395,2.14,0,.075,.12,.065);ell(head,edge,s*.425,2.14,.025,.025,.067,.03);
 ell(head,ink,s*.155,2.17,.303,.125,.073,.035);ell(head,white,s*.155,2.17,.316,.108,.045,.020);
 ell(head,iris,s*.148,2.165,.334,.039,.038,.008);ell(head,ink,s*.148,2.165,.342,.019,.026,.005);ell(head,white,s*.148-.01,2.18,.348,.007,.009,.003);
 ell(head,skin,s*.155,2.218,.325,.12,.033,.027);block(head,ink,s*.16,2.29,.308,.17,.025,.025,s*.13);
 }
 ell(head,skin,0,2.105,.355,.055,.085,.065);ell(head,ink,0,1.995,.32,.075,.013,.012);ell(head,skin,0,1.976,.317,.065,.016,.014);
 // Overlapping carved locks establish an uneven silhouette rather than a spherical cap.
 for(let i=0;i<13;i++){const angle=i/13*Math.PI*2;const x=Math.cos(angle)*.29,z=Math.sin(angle)*.24;const lock=ell(head,hair,x,2.43+(i%3)*.013,z,.15,.18,.13);lock.rotation.z=-.35+x;}
 for(let i=0;i<6;i++){const lock=ell(head,hair,-.30+i*.105,2.40-i*.018,.25,.09,.20,.055);lock.rotation.z=-.5;}
 for(const l of limbs){
 l.upper.material=cloth;l.lower.material=skin;l.joint.material=skin;
 const tip=new T.Group();tip.name=l.leg?'student-shoe':'student-hand';puppet.add(tip);puppet.remove(l.tip);l.tip=tip;
 if(l.leg){ell(tip,ink,0,-.015,.055,.115,.075,.21);block(tip,edge,0,-.069,.055,.23,.025,.40);block(tip,cloth,0,.055,-.035,.17,.08,.17);block(tip,edge,0,.04,.10,.19,.025,.05);}
 else{ell(tip,skin,0,-.025,0,.085,.12,.045);ell(tip,skin,l.side*.082,0,.012,.04,.075,.035);for(let i=0;i<3;i++)ell(tip,skin,-.05+i*.05,-.12,.005,.022,.055,.027);}
 // Detail is parented to its driven segment, so IK orientation and scaling remain authoritative.
 block(l.upper,edge,0,-l.upper.geometry.parameters.height*.38,0,.205,.04,.205);
 }
 return {body,head};
}
