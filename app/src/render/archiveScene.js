import {buildArchiveRoomViews} from './archiveRoomView.js';
import {dressArchiveShelf} from './archiveBooks.js';
import {buildArchiveDoors} from './archiveDoors.js';
import {buildArchiveBarriers} from './archiveWayfinding.js';
import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';

/* The opening archive is a hand-dressed interior. Business routes remain independent. */
export function buildArchiveScene(parent,node,layout,h,{hallView=false}={}){
 const m=h.archiveMaterials||{},fallback=h.mat;
 const wood=m.wood||fallback('#826548'),dark=m.darkWood||fallback('#54483e'),stone=m.stone||fallback('#c5bca5'),plaster=m.plaster||fallback('#ddd4bf'),brass=m.brass||fallback('#ab905d'),iron=m.iron||fallback('#354047'),paper=m.paper||fallback('#e4dcc5');
 const unit=h.geo('archive-rounded-unit',()=>new RoundedBoxGeometry(1,1,1,2,.035));
 const plane=h.geo('archive-plane',()=>new T.PlaneGeometry(1,1));
 function b(x,y,z,w,ht,d,material=wood){const mesh=new T.Mesh(unit,material);mesh.position.set(x,y,z);mesh.scale.set(w,ht,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function bar(a,c,width,material=wood){const start=new T.Vector3(...a),end=new T.Vector3(...c),mesh=b(0,0,0,width,start.distanceTo(end),width,material);mesh.position.copy(start).lerp(end,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return mesh;}
 function tag(text,x,y,z,w=4,ht=1,rotation=0){
  if(!h.archiveText){h.label(text,x,y,z,w);return;}
  const mesh=new T.Mesh(plane,h.archiveText(text));mesh.position.set(x,y,z);mesh.scale.set(w,ht,1);mesh.rotation.y=rotation;parent.add(mesh);
 }
 b(0,-.48,1,132,.9,94,stone).name='archive-main-floor';
 if(layout.floorPlan)buildArchiveBarriers(parent,layout.floorPlan,h,m);
 // Full enclosure, paneled lower walls, carved pilasters and cornices.
 for(const x of [-65,65]){
  b(x,12,1,1.5,24,94,plaster);b(x,2.3,1,1.75,4.6,94,dark);
  for(let z=-42;z<46;z+=5){b(x-Math.sign(x)*.95,2.25,z,.12,3.6,4.25,wood);b(x-Math.sign(x)*1.06,2.25,z,.08,2.9,3.6,dark);}
  for(const y of [.35,4.7,21.8,23.1])b(x-Math.sign(x)*.8,y,1,1.1,.36,94,wood);
  for(const z of [-40,-14,12,38]){b(x-Math.sign(x)*1.1,12,z,2.5,23,1.6,stone);b(x-Math.sign(x)*1.3,22.6,z,3.4,.65,2.4,stone);}
 }
 b(0,12,-45,132,24,1.5,plaster);b(0,2,-44,132,4,1,dark);
 for(const x of [-38,38]){b(x,12,47,55,24,1.5,plaster);b(x,2,46.1,55,4,1,dark);}
 b(0,22,47,22,4,1.5,dark);
 // Coffered ceiling: real surfaces instead of an open skeleton.
 for(let x=-60;x<65;x+=20)for(let z=-38;z<48;z+=18){
  const sky=Math.abs(x)<22&&z<20;
  b(x,24.1,z,19.6,.55,17.6,sky?(m.window||plaster):plaster);
  b(x,23.6,z-8.3,20,.7,.4,wood);b(x-9.2,23.6,z,.4,.7,18,wood);
  if(!sky){b(x,23.75,z,14,.16,12,stone);b(x,23.55,z,10,.12,8,plaster);}
 }
 for(const z of [-38,-20,-2,16,34]){bar([-64,23,z],[64,23,z],.65,wood);bar([-64,22.7,z],[64,22.7,z],.12,brass);}
 // Daylit side windows with deep reveals, mullions and a shaped sill.
 for(const side of [-1,1])for(const z of [-27,-1,25]){
  const x=side*63.9;
  b(x,13,z,.25,13,12,m.window||plaster);
  for(const dz of [-6.2,0,6.2])b(x-side*.22,13,z+dz,.38,13.5,.3,wood);
  for(const y of [6.5,13,19.5])b(x-side*.25,y,z,.42,.3,12.8,wood);
  b(x-side*.45,6.25,z,1.1,.48,14,stone);
  for(const dz of [-6.8,6.8])b(x-side*.55,13,z+dz,.7,14.5,.8,stone);
  b(x-side*.45,20.2,z,.75,1.1,15,stone);
 }
 // Bookcases are detailed at eye level, with varied spines, pages, labels and shelf lips.
 let book=0,shelfIndex=0;
 function shelf(cx,z,rotation=0){
  const group=new T.Group();group.position.set(cx,0,z);group.rotation.y=rotation;parent.add(group);
  const add=(x,y,zz,w,ht,d,material,geometry=unit)=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,zz);mesh.scale.set(w,ht,d);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;};
  add(0,6,0,11.6,12,2,dark);for(const x of [-5.8,5.8]){add(x,6,.8,.38,12.2,2.8,wood);add(x,12.2,.8,.65,.4,3.1,wood);}
  for(let row=0;row<4;row++){
   const y=.55+row*2.7;add(0,y,1,11.8,.24,3.1,wood);add(0,y+.15,2.5,11.8,.14,.13,brass);

  }
  book+=dressArchiveShelf(group,shelfIndex++,h,m);
  add(0,12.35,.8,12.4,.5,3.3,wood);return group;
 }
 for(const x of [-54,-40,40,54])shelf(x,-40);
 for(const x of [-34,34])shelf(x,30);
 for(const x of [-16,16])shelf(x,8);
 for(const side of [-1,1])for(const z of [-24,2,28])shelf(side*59,z,side>0?-Math.PI/2:Math.PI/2);
 // Central display, catalog furniture and lamps sit away from every decision corridor.
 for(const x of [-47,47]){
  b(x,2,-6,9,4,3.3,wood);b(x,4.1,-6,9.5,.25,3.8,dark);
  for(let j=0;j<5;j++)for(let k=0;k<3;k++){b(x-3.5+j*1.75,.8+k*1.1,-4.28,1.55,.9,.12,wood);b(x-3.5+j*1.75,1+k*1.1,-4.17,.7,.16,.04,brass);}
 }
 // Practical hanging lamps and a small number of non-shadow-casting fill lights.
 for(const z of [-29,1,31])for(const x of [-34,34]){
  bar([x,24,z],[x,19,z],.055,iron);b(x,18.7,z,3.6,.22,2.5,brass);b(x,18.35,z,3.2,.5,2.1,m.glow||paper);
  b(x,17.98,z,3.6,.12,2.5,brass);
 }
 const lamp=new T.PointLight('#ffdfaa',32,70,2);lamp.position.set(0,15,12);parent.add(lamp);
 const faceFill=new T.PointLight('#fff0dd',45,25,2);faceFill.position.set(22,7.2,20);parent.add(faceFill);
 const fill=new T.PointLight('#d8e5e5',22,80,2);fill.position.set(-36,13,-15);parent.add(fill);
 for(const [x,z] of [[-48,35],[48,35],[-50,-33],[50,-33]]){h.plant(parent,x,z,2,3.8).position.y=.15;}
 tag('بایگانی فرابورس · پرونده‌های تأمین مالی',0,18,-43.9,27,2.4);
 tag('دفتر طرح آفتاب',0,15,-43.8,12,1.2);
 if(!hallView){buildArchiveDoors(parent,layout,h);buildArchiveRoomViews(parent,layout,h);}
 // The entrance has a deep timber door surround behind the arriving player.
 for(const x of [-9,9]){b(x,8,44,1.2,16,2.5,wood);b(x,.5,44,2,1,3,stone);}b(0,16,44,20,1.5,2.5,wood);for(const x of [-4.2,4.2]){b(x,7.5,44,8.2,15,.5,wood);b(x,9,44.3,6.5,8,.12,dark);b(x*.22,6.8,44.4,.12,1.3,.12,brass);}
 return {books:book};
}

export function buildArchiveFurniture(root,guide,h,materials={}){
 const wood=materials.wood||h.mat?.('#826548'),dark=materials.darkWood||wood,brass=materials.brass||wood,paper=materials.paper||wood;
 const unit=h.geo?.('archive-furniture-unit',()=>new RoundedBoxGeometry(1,1,1,3,.055))||new T.BoxGeometry(1,1,1);
 function box(x,y,z,w,ht,d,mat){const m=new T.Mesh(unit,mat);m.position.set(x,y,z);m.scale.set(w,ht,d);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
 box(0,2.04,0,6.5,.35,3.4,wood);box(0,2.24,.05,5.8,.045,2.8,materials.leather||dark);
 for(const x of [-2.6,2.6]){
  box(x,1,0,.6,2,2.8,wood);box(x,.14,0,.85,.28,3,dark);
  box(x,1.55,1.46,.65,.75,.12,dark);box(x,1.7,1.55,.34,.08,.06,brass);
 }
 box(0,.65,-1.05,5.4,.18,.25,dark);
 for(const x of [-3.05,3.05])box(x,2.17,0,.05,.03,3,brass);
 // Pen rest, envelopes, page corners and a green shaded reading lamp.
 box(2.25,2.37,.9,.7,.08,.45,brass);box(2.25,2.44,.9,.08,.08,.6,dark);
 for(let i=0;i<3;i++)box(-2.2,2.32+i*.04,-.65,1,.03,.8,paper);
 box(2.35,2.32,-.9,.8,.18,.75,brass);box(2.35,2.95,-.9,.07,1.2,.07,brass);
 box(2.35,3.57,-.75,1.65,.45,.9,materials.leather||dark);box(2.35,3.32,-.75,1.45,.035,.75,materials.glow||paper);
 if(guide){box(-1.85,2.72,-.8,1.35,.8,.22,dark);}
 return root;
}