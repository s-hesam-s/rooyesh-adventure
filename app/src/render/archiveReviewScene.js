import {buildArchiveHallView} from './archiveHallView.js';
import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {dressArchiveShelf} from './archiveBooks.js';
import {buildArchiveDoors} from './archiveDoors.js';
import {buildArchiveBarriers} from './archiveWayfinding.js';

export function buildArchiveReviewScene(parent,node,layout,h){
 const variant=node.scene.archiveVariant,m=h.archiveMaterials||{},wood=m.wood||h.mat('#826548'),dark=m.darkWood||h.mat('#54483e'),stone=m.stone||h.mat('#c5bca5'),plaster=m.plaster||h.mat('#ddd4bf'),brass=m.brass||h.mat('#ab905d'),paper=m.paper||h.mat('#e4dcc5');
 const unit=h.geo('archive-review-unit',()=>new RoundedBoxGeometry(1,1,1,2,.035)),plane=h.geo('archive-review-sign',()=>new T.PlaneGeometry(1,1));
 function box(group,x,y,z,w,ht,d,mat=wood){const mesh=new T.Mesh(unit,mat);mesh.position.set(x,y,z);mesh.scale.set(w,ht,d);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;}
 const b=(...args)=>box(parent,...args);
 function sign(text,x,y,z,w=12,ht=1.2,yaw=0){if(!h.archiveText){h.label(text,x,y,z,w);return;}const mesh=new T.Mesh(plane,h.archiveText(text));mesh.position.set(x,y,z);mesh.scale.set(w,ht,1);mesh.rotation.y=yaw;parent.add(mesh);}
 b(0,-.48,8,66,.9,66,stone).name='archive-side-room-floor';
 // The same cornice, paneling, stone floor and door family identify one library building.
 for(const x of [-32,32]){b(x,10,8,1,20,64,plaster);b(x,2.2,8,1.2,4.4,64,dark);for(const y of [.25,4.5,18.9,20])b(x-Math.sign(x)*.65,y,8,.5,.22,64,wood);}
 b(0,10,-24,64,20,1,plaster);b(0,2.2,-23.4,64,4.4,.2,dark);
 for(let x=-28;x<32;x+=8){b(x,2.1,-23.18,7,3.6,.16,wood);b(x,2.1,-23.05,6.3,3,.1,dark);}
 b(0,20.4,8,64,.6,64,plaster);
 for(let x=-24;x<=24;x+=12)for(let z=-19;z<39;z+=14){b(x,20,z,11.6,.2,13.6,stone);b(x,19.75,z,11,.12,10,plaster);b(x,19.6,z-6.5,12,.3,.3,wood);}
 for(const side of [-1,1])for(const z of (variant===0?[-14,10,28]:[-8,24])){
  b(side*31.4,12,z,.2,10,9,m.window||plaster);
  for(const dz of [-4.7,0,4.7])b(side*31.15,12,z+dz,.3,10.5,.22,wood);
  for(const y of [7,12,17])b(side*31, y,z,.4,.22,9.5,wood);
  b(side*30.9,6.8,z,1,.35,10.5,stone);
 }
 layout.furniture.shelves.forEach((s,i)=>{
  const group=new T.Group();group.position.set(s.x,0,s.z);group.rotation.y=s.rotation||0;parent.add(group);
  box(group,0,6,0,11.6,12,1.1,dark);
  for(const x of [-5.8,5.8])box(group,x,6,1,.35,12.2,3,wood);
  for(let row=0;row<4;row++){box(group,0,.55+row*2.7,1,11.8,.24,3.1,wood);box(group,0,.7+row*2.7,2.5,11.8,.1,.1,brass);}
  box(group,0,12.3,.8,12.4,.5,3.3,wood);dressArchiveShelf(group,100+variant*37+i,h,m);
 });
 for(const [i,t]of layout.furniture.tables.entries()){
  b(t.x,2.6,t.z,t.w,.3,t.d,wood);b(t.x,2.78,t.z,t.w-.4,.06,t.d-.4,variant===0?(m.leather||dark):paper);
  for(const dx of [-t.w*.4,t.w*.4])for(const dz of [-t.d*.35,t.d*.35])b(t.x+dx,1.3,t.z+dz,.4,2.6,.4,wood);
  if(variant===0){
   // Open reference folios, a counting frame and loose comparison cards.
   for(const side of [-1,1]){const leaf=b(t.x+side*1.1,2.92,t.z,2.1,.12,2.7,paper);leaf.rotation.z=side*.09;for(let j=0;j<6;j++)b(t.x+side*1.1,3.05,t.z-.9+j*.32,1.6,.012,.025,dark);}
   for(let j=0;j<4;j++){b(t.x+3,3.2,t.z-1+j*.45,1.2,.035,.035,brass);for(let k=0;k<3;k++)b(t.x+2.6+k*.28,3.22,t.z-1+j*.45,.15,.15,.15,wood);}
  }else{
   // Distinct labeled portfolios and document conservation trays.
   for(let j=0;j<3+i;j++){const x=t.x-t.w*.32+j*1.5;const folder=b(x,2.98,t.z,.95,.25,2.3,h.mat(['#6e4d60','#4f6558','#9a7851','#465c72'][j%4]));folder.rotation.y=(j-1)*.11;b(x,3.12,t.z+.3,.55,.015,.65,paper);}
   b(t.x+t.w*.33,3,t.z-.9,1.3,.24,.8,brass);
  }
 }
 for(const [i,c]of layout.furniture.cabinets.entries()){
  b(c.x,4,c.z,c.w,8,c.d,dark);for(let row=0;row<5;row++){b(c.x,1+row*1.4,c.z+c.d/2+.1,c.w-.3,1.2,.14,wood);b(c.x,1.2+row*1.4,c.z+c.d/2+.2,1,.16,.08,brass);}sign(i?'فهرست شرکت‌ها':'پرونده‌های مهتاب',c.x,8.7,c.z+c.d/2+.2,4,.7);
 }
 buildArchiveBarriers(parent,layout.floorPlan,h,m);
 buildArchiveDoors(parent,layout,h,{south:true,frontZ:-40,halfWidth:32,wallHeight:20,section:'سالن اصلی'});
 // Each independent side room has exactly one entrance, which is also its return door.
 sign('↓ بازگشت به سالن اصلی بایگانی ↓',0,13.7,38.9,25,1.8,Math.PI);
 sign('همان درِ ورود · بازگشت با گزارش اصلاح',0,11.6,38.85,20,1.1,Math.PI);
 sign(variant===0?'اتاق تطبیق قیمت واحد':'اتاق پرونده‌های مهتاب',0,16.7,-23.35,25,1.8);
 sign(variant===0?'مقایسه نسخه‌های پرونده':'فهرست مستقل نام طرح و شرکت مجری',0,14.6,-23.3,20,1.05);
 b(0,-.48,40.3,64,.9,.7,stone);b(0,20,40.3,64,.4,.7,plaster);
 buildArchiveHallView(parent,variant,h);
 for(const x of (variant===0?[-19,19]:[-23,7,25])){b(x,19,6,.05,2,.05,brass);b(x,17.9,6,3,.2,2,brass);b(x,17.65,6,2.7,.3,1.7,m.glow||paper);}
 const light=new T.PointLight(variant===0?'#ffe3b5':'#e0e9ed',48,80,2);light.position.set(0,13,12);parent.add(light);
 const deskLight=new T.PointLight('#fff0dc',35,30,2);deskLight.position.set(variant===0?-18:18,8,0);parent.add(deskLight);
 const guide=layout.objects.find(o=>o.object.kind==='guide'),faceFill=new T.PointLight('#fff0dd',48,25,2);faceFill.position.set((guide.x-640)*.1,7.2,(guide.y-450)*.1+2.5);parent.add(faceFill);
 return {variant};
}

export function buildArchiveReviewFurniture(root,guide,h,m={},variant=0){
 const wood=m.wood||h.mat('#826548'),dark=m.darkWood||wood,brass=m.brass||h.mat('#ab905d'),paper=m.paper||h.mat('#e4dcc5');
 const unit=h.geo('archive-review-desk-unit',()=>new RoundedBoxGeometry(1,1,1,2,.035));
 function box(x,y,z,w,ht,d,material=wood){const mesh=new T.Mesh(unit,material);mesh.position.set(x,y,z);mesh.scale.set(w,ht,d);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
 box(0,2.12,0,6.7,.26,3.7,wood);box(0,2.27,.15,3.2,.025,2.3,m.leather||dark);
 if(variant===0){
  for(const x of [-2.6,2.6]){box(x,1,0,1.15,2,3,wood);for(let row=0;row<3;row++){box(x,.45+row*.53,1.56,.92,.43,.08,dark);box(x,.48+row*.53,1.62,.32,.07,.06,brass);}}
  box(0,2.6,-1.35,5.8,.13,.8,dark).rotation.x=.2;
  for(let i=0;i<3;i++){box(-1.8+i*.7,2.76,-1.2,.55,.035,.65,paper);box(-1.8+i*.7,2.79,-1.05,.35,.008,.025,brass);}
  box(2.55,2.34,-.65,.5,.14,.55,brass);box(2.55,3,-.65,.05,1.3,.05,brass);box(2.25,3.65,-.6,1.4,.12,.6,brass);box(2.25,3.56,-.6,1.2,.05,.5,m.glow||paper);
 }else{
  box(-2.6,1,0,1.2,2,3.2,dark);for(const y of [.5,1.15,1.8]){box(-2.6,y,1.65,1,.48,.08,wood);box(-2.6,y,1.72,.45,.1,.06,brass);}
  for(const z of [-1.4,1.4]){box(2.6,1,z,.3,2,.3,brass);box(2.6,.16,z,.55,.2,.55,dark);}
  box(0,.6,-1.25,5.4,.15,.2,brass);
  for(let i=0;i<4;i++){box(-2.35+i*.6,2.8,-1.25,.1,1.05,.85,dark);box(-2.1+i*.6,2.47,-1.25,.35,.35,.7,h.mat(['#6a5065','#465d5f','#9b7d50','#65594c'][i]));}
  box(2.2,2.4,-.8,.7,.22,.7,brass);box(2.2,2.95,-.8,.08,1,.08,brass);box(2.2,3.48,-.8,1.3,.35,.8,m.leather||dark);box(2.2,3.28,-.8,1.1,.04,.7,m.glow||paper);
 }
 if(guide)box(-.9,2.58,-1.2,1.3,.6,.16,dark);
 return root;
}
