import {buildOfficeScene} from './officeScene.js';
import {buildAuditScene} from './auditScene.js';
import {buildBankScene} from './bankScene.js';
import {buildPaymentScene} from './paymentScene.js';
import {buildOrchardScene} from './orchardScene.js';
import {buildReceptionScene} from './receptionScene.js';
import {buildAtriumScene} from './atriumScene.js';
import {buildPostalScene} from './postalScene.js';
import {buildCanalScene} from './canalScene.js';
import {buildWorkshopScene} from './workshopScene.js';
import {buildCalendarScene} from './calendarScene.js';
import {buildArchiveReviewScene} from './archiveReviewScene.js';
import {buildArchiveScene} from './archiveScene.js';
import * as T from '../../vendor/three.module.js';

/* Scene architecture uses shared geometry/material caches; only the active location is built. */
export function buildMissionScene(parent,node,layout,h){
 if(node.scene.officeRoom)return buildOfficeScene(parent,node,layout,h);
 if(node.scene.auditRoom)return buildAuditScene(parent,node,layout,h);
 if(node.scene.bankRoom)return buildBankScene(parent,node,layout,h);
 if(node.scene.paymentRoom)return buildPaymentScene(parent,node,layout,h);
 if(node.scene.orchardRoom)return buildOrchardScene(parent,node,layout,h);
 if(node.scene.receptionRoom)return buildReceptionScene(parent,node,layout,h);
 if(node.scene.atriumRoom)return buildAtriumScene(parent,node,layout,h);
 if(node.scene.postalRoom)return buildPostalScene(parent,node,layout,h);
 if(node.scene.canalRoom)return buildCanalScene(parent,node,layout,h);
 if(node.scene.workshopRoom)return buildWorkshopScene(parent,node,layout,h);
 if(node.scene.calendarRoom)return buildCalendarScene(parent,node,layout,h);
 if(node.repairFor==='project')return buildArchiveReviewScene(parent,node,layout,h);
 if(node.id==='project')return buildArchiveScene(parent,node,layout,h);
 const p=node.scene,{box,cylinder,sphere,beam,label,plant,tree,materials}=h;
 const a=p.accent,f=p.floor,e=p.environment,metal='#5c6059',cream='#e5dfce';
 const block=(x,y,z,w,ht,d,c=a)=>box(parent,x,y,z,w,ht,d,c);
 const col=(x,z,ht=12,c=a)=>{block(x,ht/2,z,1.1,ht,1.1,c);block(x,.3,z,2.1,.6,2.1,c);block(x,ht,z,2,.6,2,c);};
 const shelf=(x,z,variant=0)=>{block(x,5,z,10,10,2.5,'#6f5948');for(let y=1;y<10;y+=2){block(x,y,z+1.4,9.6,.25,2,'#b99565');for(let j=0;j<7;j++)block(x-3.8+j*1.25,y+.8,z+1.4,.7,1.3,.9,[a,'#96775f','#82907c'][((j+variant)%3)]);}};
 const panel=(x,z,width=14)=>{block(x,6,z,width,10,.6,cream);block(x,6,z+.38,width-1,8,.12,a);};
 const planter=(x,z,index)=>{block(x,.8,z,5,1.6,5,'#958575');plant(parent,x,z,index,2.8).position.y=1.6;};
 const deskScreen=(x,z)=>{block(x,1,z,7,2,4,metal);block(x,3,z,7,.4,4,cream);block(x,5,z-1.2,5,3,.4,metal);block(x,5,z-.94,4.5,2.5,.06,'#508a95');};
 const ring=(x,y,z,r,c=a)=>{const g=h.geo('mission-ring-'+r,()=>new T.TorusGeometry(r,.24,8,40)),m=new T.Mesh(g,h.mat(c));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
 const crate=(x,z,w=5)=>{block(x,w/2,z,w,w,w,'#997346');for(const offset of [-w*.4,w*.4])block(x+offset,w/2,z+w/2+.04,.25,w,.16,'#c4a574');beam(parent,[x-w*.4,.3,z+w/2+.14],[x+w*.4,w-.3,z+w/2+.14],.2,'#c4a574');};
 const roof=(y=17)=>{for(let x=-55;x<=55;x+=11){col(x,-40,y);beam(parent,[x,y,-40],[x,y+3,20],.65,a);}beam(parent,[-55,y+3,20],[55,y+3,20],.75,a);};
 const floor=block(0,-.75,0,181,1.3,148,f);if(materials?.concrete){floor.material=materials.concrete.clone();floor.material.color.set(f);floor.material.userData.transient=true;}
 // Perimeter detail differs with the location; all playable routes remain clear.
 if(['archive','datacenter','bank','audit','warehouse','council','gallery'].includes(e)){
  block(0,8,-43,130,16,1.5,f);block(-64,7,-4,1.5,14,76,f);block(64,7,-4,1.5,14,76,f);
 }else for(const x of [-74,74])for(let j=0;j<3;j++)tree(parent,x,-25+j*28,p.index*7+j,11+(p.index%3)*2);
 switch(e){
 case 'archive':
  roof(16);for(const x of [-49,-24,24,49])shelf(x,-37,p.index);for(const x of [-58,58])shelf(x,7,2);
  panel(0,-40,17);label('بایگانی طرح‌ها',0,10,-39,13);break;
 case 'clock':{
  const x=-49,z=-16;block(x,10,z,8,20,7,'#a48b69');const dial=ring(x,19,z+3.7,5,'#b79552');sphere(parent,x,19,z+3.7,4.7,4.7,.2,cream);
  for(let i=0;i<12;i++){const t=i*Math.PI/6;block(x+Math.sin(t)*4,19+Math.cos(t)*4,z+4,.22,.65,.14,a);}
  beam(parent,[x,19,z+4.2],[x-2.2,21.2,z+4.2],.17,a);beam(parent,[x,19,z+4.2],[x+2.8,19,z+4.2],.12,a);
  for(let i=0;i<6;i++){panel(12+i*7,-39,5);label(String((i+1)*5),12+i*7,7,-38,3);}
  for(const x of [-52,52])planter(x,31,p.index);break;}
 case 'workshop':
  for(const x of [-53,53]){col(x,-27,15,'#896647');col(x,24,15,'#896647');beam(parent,[x,15,-27],[x,19,0],.8,'#8c6c43');beam(parent,[x,19,0],[x,15,24],.8,'#8c6c43');}
  beam(parent,[-53,19,0],[53,19,0],.85,'#8c6c43');for(let i=0;i<6;i++)crate(-48+i*8,-36,5);
  for(let i=0;i<4;i++){block(45,.8,-25+i*13,9,1.6,7,'#7e684e');for(let j=0;j<3;j++)plant(parent,43+j*2,-25+i*13,i,1.8).position.y=1.6;}break;
 case 'canal':
  for(const x of [-51,51]){block(x,-.2,0,13,.25,88,'#477d80');for(const dx of [-7,7])block(x+dx,.6,0,.7,1.2,88,'#a9b6ad');for(let z=-30;z<38;z+=12)planter(x,z,p.index+z);}
  for(let i=0;i<5;i++)beam(parent,[-58,1,42-i*2],[-44,1,42-i*2],.7,'#866b45');ring(0,12,-38,7,'#b3a06e');break;
 case 'courier':
  for(let i=0;i<6;i++){crate(-54+i*20,-37,7);block(-54+i*20,9,-37,8,4,8,['#8e5b43','#5f7a7c'][i%2]);}
  for(const x of [-70,70]){col(x,12,16,metal);beam(parent,[x,16,12],[x,16,-30],.8,metal);for(let z=-20;z<30;z+=9)crate(x,z,4);}
  label('اسناد ثبت‌شده → ارسال',0,11,-38,21);break;
 case 'atrium':
  roof(20);for(let i=0;i<8;i++)beam(parent,[-55+i*16,20,-40],[-55+i*16,22,28],.2,'#a8c2bd');
  for(const x of [-53,53])for(const z of [-25,18,40])planter(x,z,p.index);
  ring(0,10,-36,8,a);label('آفتاب برای مشارکت آماده است',0,10,-35,21);break;
 case 'reception':
  for(let i=0;i<8;i++){const t=i*Math.PI/7,x=Math.cos(t)*55,z=-25+Math.sin(t)*7;col(x,z,12,cream);}
  for(const x of [-52,52]){deskScreen(x,8);block(x,1.3,24,10,2.6,3,a);}
  panel(0,-40,21);label('پذیرش سرمایه‌گذار حقیقی',0,10,-39,20);break;
 case 'orchard':
  for(const x of [-54,54]){for(let z=-34;z<45;z+=16){col(x,z,9,'#a38964');planter(x+5,z,p.index+z);}}
  for(let z=-34;z<45;z+=16)beam(parent,[-54,9,z],[54,9,z],.3,'#ac9673');
  for(let i=0;i<9;i++)plant(parent,-45+i*11,-38,i,3);break;
 case 'datacenter':
  roof(15);for(const x of [-54,54])for(let z=-33;z<38;z+=12){
   block(x,6,z,6,12,6,'#344450');for(let y=1;y<12;y+=1.3){block(x, y,z+3.1,5,.8,.12,'#637684');block(x+1.8,y,z+3.2,.28,.2,.14,'#86cbb7');}}
  panel(0,-40,23);label('پرداخت امن / پیگیری تراکنش',0,10,-39,21);break;
 case 'bank':
  roof(18);for(const x of [-50,-30,30,50])col(x,-32,17,cream);
  block(0,8,-41,18,16,2,metal);const vault=ring(0,8,-39.7,6,'#a0aaa7');sphere(parent,0,8,-40,5.7,5.7,.3,'#7f8987');ring(0,8,-39.3,2.1,'#c8bd8c');
  for(const x of [-57,57])deskScreen(x,17);break;
 case 'audit':
  roof(16);for(const x of [-54,54])for(const z of [-23,7,32]){block(x,2.2,z,10,.7,7,cream);block(x,2.65,z,8,.15,5,'#cfddd1');beam(parent,[x,3,z-3],[x,8,z-3],.3,metal);block(x,8,z,9,.4,3,cream);}
  for(let i=0;i<5;i++)panel(-42+i*21,-41,16);label('بررسی اصل / تاریخ / رهگیری',0,12,-39,24);break;
 case 'dispatch':
  for(const x of [-53,53]){col(x,-30,26,metal);for(let y=3;y<26;y+=5)beam(parent,[x-3,y,-30],[x+3,y+4,-30],.25,metal);for(let i=0;i<3;i++){const dish=sphere(parent,x+4,12+i*5,-29,2.7,2.7,.5,'#c0cbcb');dish.rotation.y=.45;}}
  for(const x of [-50,50])deskScreen(x,25);ring(0,12,-37,5,a);break;
 case 'pavilion':
  for(const x of [-52,52])for(const z of [-31,0,31]){col(x,z,11,'#75886a');planter(x+4,z,p.index);}
  for(let z=-31;z<=31;z+=3)beam(parent,[-52,11,z],[52,11,z],.15,'#9caa85');panel(0,-40,20);label('شرکت بهار / پذیرش حقوقی',0,10,-39,21);break;
 case 'terrace':
  for(let i=0;i<15;i++){const x=-95+i*14,ht=15+(i*7)%32;block(x,ht/2,-70,10,ht,12,['#7e8c98','#a6a8ac','#6e7b8e'][i%3]);for(let y=3;y<ht;y+=4)block(x,y,-63.8,8,.8,.1,'#d2cbbb');}
  for(const x of [-60,60])beam(parent,[x,1,42],[x,1,-35],.35,metal);
  for(const x of [-52,52]){block(x,2,13,13,4,4,a);planter(x,32,p.index);}break;
 case 'warehouse':
  roof(22);for(const x of [-54,54])for(let z=-32;z<37;z+=16){crate(x,z,7);crate(x+3,z+2,4);}
  for(let x=-50;x<=50;x+=10)beam(parent,[x,21,-40],[x,21,35],.5,metal);
  block(0,10,-41,25,20,2,'#7c7f73');for(let y=1;y<20;y+=2)block(0,y,-39.8,24,.25,.2,'#b7b5a1');break;
 case 'reservoir':
  for(const x of [-53,53])for(let z=-27;z<34;z+=28){cylinder(parent,x,7,z,6,14,'#899c9d');ring(x,6,z+6,2,a);beam(parent,[x,1,z],[x,1,z+13],1,metal);}
  for(const x of [-61,61])beam(parent,[x,3,-40],[x,3,42],.7,metal);label('ظرفیت تکمیل شد',0,12,-38,19);break;
 case 'council':
  roof(21);for(let i=0;i<9;i++){const t=i*Math.PI/8;col(Math.cos(t)*55,-34+Math.sin(t)*9,18,cream);}
  for(const x of [-45,0,45]){block(x,5,-38,16,10,2,a);ring(x,9,-36.7,3.2,'#ba9b53');}label('عامل · نهاد مالی · فرابورس',0,15,-35,23);break;
 case 'gallery':
  roof(18);for(const x of [-55,55])for(const z of [-30,0,30]){block(x,6,z,9,12,.8,cream);block(x,7,z+.55,7,8,.2,'#ac8d57');block(x,7,z+.7,6,7,.12,'#efeadb');ring(x,6,z+.9,1.1,a);}
  label('گواهی مشارکت / هویت و مبلغ',0,12,-38,24);break;
 case 'observatory':{
  for(const x of [-52,52])col(x,-32,20,metal);
  const r=ring(0,22,-35,17,'#acb9c4');r.rotation.x=.65;const r2=ring(0,22,-35,12,'#b79f68');r2.rotation.y=.8;sphere(parent,0,22,-35,2,2,2,'#d2b36f');
  for(let i=0;i<4;i++){panel(-44+i*29,-40,17);label('ماه '+String((i+1)*3),-44+i*29,8,-39,10);}break;}
 case 'lakeside':
  block(0,-.1,-61,181,.3,37,'#5b9299');for(const x of [-55,55]){for(let z=-36;z<43;z+=10)block(x,1,z,12,.5,8,'#a78c62');for(let z=-35;z<43;z+=16)col(x,z,5,'#9c805b');}
  const wheel=ring(-57,8,-35,7,'#9c7448');for(let i=0;i<12;i++){const t=i*Math.PI/6;beam(parent,[-57,8,-35],[-57+Math.sin(t)*7,8+Math.cos(t)*7,-35],.4,'#a98b58');}
  for(let i=0;i<4;i++)planter(44+i*6,-37,p.index+i);break;
 }
 if(p.repair){panel(0,-38,20);label('بخش بازبینی / اصلاح تصمیم',0,11,-36,23);}
 // Individual entry architecture and sign are visible when arriving, without blocking the road.
 const ex=p.entry.x*.1-64,ez=p.entry.y*.1-45;
 for(const dx of [-7,7])block(ex+dx,5,ez+3,.8,10,.8,a);
 beam(parent,[ex-7,10,ez+3],[ex+7,10+(p.index%3),ez+3],.65,a);
 label(p.name,ex,10,ez+3,17);
 for(const gate of layout.gates)buildMissionPortal(parent,gate,p,h);
}
export function buildMissionPortal(parent,gate,p,h){
 const {box,cylinder,sphere,beam,label}=h,x=gate.x*.1-64,z=gate.y*.1-45,a=p.accent,index=p.index;
 const root=new T.Group();parent.add(root);
 const b=(dx,y,dz,w,ht,d,c=a)=>box(root,x+dx,y,z+dz,w,ht,d,c);
 const shape=index%5;
 if(shape===0){for(const dx of [-5,5]){b(dx,4,0,1,8,1);b(dx,.4,0,2,.8,2);}beam(root,[x-5,8,z],[x,10,z],.8,a);beam(root,[x,10,z],[x+5,8,z],.8,a);}
 if(shape===1){for(const dx of [-5.5,5.5])cylinder(root,x+dx,4,z,.65,8,a);sphere(root,x,8.7,z,5.8,1,.55,a);}
 if(shape===2){for(const dx of [-5,5])b(dx,4,0,.7,8,.7);b(0,8.5,0,12,.8,1.6);for(const dx of [-4,4])beam(root,[x+dx,5,z],[x+dx*.5,8,z],.4,'#c5b98f');}
 if(shape===3){for(const dx of [-5,5]){b(dx,4,0,1.5,8,1.5,'#c0c3bd');b(dx,7.5,0,2,.6,2);}b(0,8.5,0,12,1.1,2,a);}
 if(shape===4){for(const dx of [-5.5,5.5])b(dx,4,0,.8,8,2);b(0,9,0,13,.5,2);b(0,8.4,0,11,.25,.4,'#b5ccbe');}
  // The portal emblem identifies the task even when the text is viewed from a distance.
 const emblem=(dx,dy,w,ht,c=a)=>b(dx,10.6+dy,.1,w,ht,.45,c);
 const round=(dx,dy,r,c=a)=>{const g=h.geo('portal-emblem-'+r,()=>new T.TorusGeometry(r,.12,6,24)),m=new T.Mesh(g,h.mat(c));m.position.set(x+dx,10.6+dy,z+.1);root.add(m);return m;};
 switch(p.portal){
 case 'arch':emblem(-.6,0,1.1,1.5);emblem(.6,0,1.1,1.5,'#c8b992');break;
 case 'round':round(0,0,1.2);emblem(0,.4,.12,.8);emblem(.4,0,.8,.12);break;
 case 'timber':sphere(root,x,10.5,z,1.2,.7,.7,'#d4b15e');emblem(0,-.4,2.8,.2);break;
 case 'bridge':for(let i=0;i<3;i++)emblem((i-1)*.8,Math.sin(i)*.4,.6,.3,'#a8cbc8');break;
 case 'cargo':emblem(0,0,1.8,1.6,'#b5925c');emblem(0,0,.2,1.6,'#ded3b3');break;
 case 'glass':{const m=emblem(0,0,1.6,1.6,'#a6c8c4');m.rotation.z=Math.PI/4;break;}
 case 'turnstile':round(0,0,1);emblem(0,0,2.6,.18);emblem(0,0,.18,2.6);break;
 case 'trellis':for(let i=0;i<5;i++){const t=i*Math.PI*2/5;sphere(root,x+Math.sin(t),10.6+Math.cos(t),z,.45,.45,.2,'#bca4b6');}break;
 case 'signal':for(let i=0;i<3;i++)emblem((i-1)*.8,i*.3,.4,1+i*.5,'#9dc6c8');break;
 case 'vault':round(0,0,1.3,'#b9ad80');round(0,0,.65,'#b9ad80');break;
 case 'frame':round(-.3,.3,.9);const handle=emblem(.7,-.7,.25,1.4);handle.rotation.z=.65;break;
 case 'antenna':emblem(0,0,.2,2.6);round(0,.5,1.1);emblem(0,-1.3,2,.2);break;
 case 'lattice':for(const d of [-.8,0,.8]){emblem(d,0,.15,2);emblem(0,d,2,.15);}break;
 case 'steel':for(let i=0;i<3;i++)emblem((i-1)*.75,i===1?.3:0,.5,i===1?2.5:1.4);break;
 case 'loading':emblem(0,0,2,1.4,'#af8d56');emblem(0,-1,2.8,.3);for(const d of [-.8,.8])emblem(d,-.8,.2,.6);break;
 case 'pipe':round(0,0,1.1);for(let i=0;i<4;i++){const spoke=emblem(0,0,.15,2.4);spoke.rotation.z=i*Math.PI/4;}break;
 case 'marble':for(const d of [-1,0,1])emblem(d,0,.4,1.8,'#cfc5a9');emblem(0,1,3,.25);break;
 case 'ribbon':emblem(0,.3,1.8,1.6,'#e4d6b7');round(0,-.3,.45);for(const d of [-.3,.3])emblem(d,-1,.25,.8);break;
 case 'orbit':round(0,0,1.4);sphere(root,x,10.6,z,.4,.4,.4,'#d2b474');emblem(0,0,3,.12);break;
 case 'dock':round(0,0,1.2,'#b49262');for(let i=0;i<3;i++){const blade=emblem(0,0,.22,2.8,'#b49262');blade.rotation.z=i*Math.PI/3;}break;
 }
const bar=b(0,2.4,0,9,.3,.4,'#ba9a5a');bar.userData.dynamic=true;label(gate.exit.label,x,7,z,11);
 gate.bar=bar;
 return bar;
}