import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {buildCanalDoors} from './canalDoors.js';
function tools(parent,h,m){
 function box(name,x,y,z,w,ht,d,material=m.stone){const o=new T.Mesh(h.geo('canal-rounded-unit',()=>new RoundedBoxGeometry(1,1,1,3,.035)),material);o.name=name;o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function cylinder(name,x,y,z,r,height,material=m.brass){const o=new T.Mesh(h.geo('canal-cylinder-'+r+':'+height,()=>new T.CylinderGeometry(r,r,height,40)),material);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function label(text,x,y,z,w=10,ht=.85,yaw=0){if(!h.archiveText)return;const o=new T.Mesh(h.geo('canal-label',()=>new T.PlaneGeometry(1,1)),h.archiveText(text));o.name='canal-label';o.position.set(x,y,z);o.rotation.y=yaw;o.scale.set(w,ht,1);parent.add(o);return o;}
 function table(x,z,w=11,d=5){const top=box('canal-tabletop',x,2.1,z,w,.3,d,m.wood);for(const dx of [-w*.42,w*.42])for(const dz of [-d*.36,d*.36]){box('canal-table-leg',x+dx,1,z+dz,.28,2,.28,m.darkWood);box('canal-table-foot',x+dx,.06,z+dz,.6,.12,.6,m.darkWood);}box('canal-table-brace',x,.55,z-d*.3,w*.88,.15,.2,m.darkWood);return top;}
 function placard(text,x,y,z,w){box('canal-placard',x,y,z,w,1,.16,m.darkWood);for(const dx of [-w*.35,w*.35])box('canal-placard-leg',x+dx,(y-.5+2.25)/2,z,.12,y-.5-2.25+.08,.15,m.brass);label(text,x,y,z+.09,w-.2,.75);}
 function folders(x,y,z,count=3){for(let i=0;i<count;i++){box('canal-folder',x+i*.04,y+i*.07,z-i*.025,2,.065,1.4,i%2?m.paper:m.darkWood);box('canal-folder-label',x+.7,y+.035+i*.07,z-i*.025,.35,.01,.65,m.paper);}}
 return {box,cylinder,label,table,placard,folders};
}
export function buildCanalScene(parent,node,layout,h){
 const fallback={};for(const [key,c]of Object.entries({floor:'#bdb7a5',stone:'#d4cbb4',tile:'#315e69',wood:'#977345',darkWood:'#574a31',plaster:'#e4ddc9',paper:'#eee7d6',brass:'#aa9160',metal:'#574a31',panel:'#977345',glass:'#c0d0c8',iron:'#3d4b45',dark:'#31453d',soil:'#4d4e36',glow:'#f0dbac'}))fallback[key]=h.mat(c);
 const m=h.canalMaterials||fallback,{box,cylinder,label,table,placard,folders}=tools(parent,h,m),repair=Boolean(node.repairFor),variant=node.scene.canalVariant;
 if(m.water)parent.userData.canalTime=m.water.uniforms.time;
 if(!repair&&m.sky){const sky=new T.Mesh(h.geo('canal-garden-sky',()=>new T.SphereGeometry(250,40,24)),m.sky);sky.name='canal-garden-sky';sky.userData.dynamic=true;parent.add(sky);}
 const floors=new T.Group();floors.name='canal-floor';parent.add(floors);const floorTools=tools(floors,h,m);
 if(repair)floorTools.box('canal-floor-slab',0,-.45,8,66,.8,66,m.floor);
 else{
  for(const [x,z,w,d]of [[0,-33,128,26],[0,39,128,18],[-46,5,36,50],[0,5,44,50],[46,5,36,50]])floorTools.box('canal-floor-slab',x,-.45,z,w,.8,d,m.floor);
  for(const x of [-25,25]){
   box('canal-trough-bed',x,-.92,5,6.4,.18,50,m.tile);
   for(const dx of [-2.95,2.95]){box('canal-bank',x+dx,-.65,5,.5,.6,50,m.stone);for(const [z,d]of [[-7,26],[22,16]]){box('canal-bank-upper',x+dx,-.05,z,.5,.6,d,m.stone);box('canal-coping',x+dx,.29,z,.68,.22,d,m.stone);}}
   for(const z of [-20,30]){box('canal-end-wall',x,-.35,z,6.4,1.2,.5,m.stone);box('canal-end-cap',x,.29,z,6.7,.22,.65,m.stone);}
   if(m.water){const water=new T.Mesh(h.geo('canal-water-plane',()=>new T.PlaneGeometry(5.4,49.5)),m.water);water.rotation.x=-Math.PI/2;water.position.set(x,-.5,5);water.name='canal-water-surface';water.userData.dynamic=true;parent.add(water);}
   for(const dx of [-3.6,3.6])box('canal-bridge-bearing',x+dx,-.42,10,.6,.65,8,m.stone);
   for(let i=0;i<8;i++)box('canal-bridge-deck',x,-.19,6.5+i,8.2,.28,.96,m.wood);
   for(const z of [6,14]){for(const dx of [-4,-2,0,2,4]){box('canal-bridge-post',x+dx,1.15,z,.18,2.4,.18,m.darkWood);box('canal-bridge-post-foot',x+dx,.08,z,.38,.26,.38,m.brass);}for(const y of [.75,2.3])box('canal-bridge-rail',x,y,z,8.3,.16,.18,m.darkWood);}
  }
  for(const side of [-1,1]){box('canal-boundary-wall',side*63,2,1,1,4,94,m.plaster);box('canal-boundary-plinth',side*63,.4,1,1.3,.8,94,m.stone);box('canal-boundary-coping',side*63,4.08,1,1.4,.2,94,m.stone);}
  for(const x of [-36.5,36.5])box('canal-rear-wall',x,5,47,53,10,1,m.plaster);
  box('canal-rear-lintel',0,10,47,20.5,1,1.3,m.stone);for(const x of [-10,10])box('canal-rear-jamb',x,5,47,.8,10,1.2,m.stone);
  box('canal-rear-gate',0,4.7,47,19,.6+8.8,.25,m.wood);for(let x=-9;x<10;x+=1.5)box('canal-rear-board',x,4.7,46.84,.08,9,.06,m.darkWood);
  const back=new T.Group();back.position.set(0,10.9,46.3);back.rotation.y=Math.PI;parent.add(back);tools(back,h,m).label('باغ آبراه · بررسی تعهد شرکت',0,0,0,20,1);
 }
 if(repair){
  const roof=19;box('canal-room-north-wall',0,roof/2,-24,64,roof,1,m.plaster);
  for(const side of [-1,1]){const x=side*32;box('canal-room-wall-base',x,3.75,8,1,7.5,64,m.plaster);box('canal-room-wall-top',x,16.25,8,1,5.5,64,m.plaster);const edges=[-24,-16,-8,6,14,26,34,40];for(let i=0;i<edges.length;i+=2)box('canal-room-wall-pier',x,10.5,(edges[i]+edges[i+1])/2,1,6,edges[i+1]-edges[i],m.plaster);
   for(const z of [-12,10,30]){box('canal-room-window',x-side*.45,10.5,z,.1,5.96,7.96,m.glass);for(const dz of [-4,0,4])box('canal-room-window-jamb',x-side*.58,10.5,z+dz,.14,6.1,.13,m.darkWood);for(const y of [7.5,10.5,13.5])box('canal-room-window-rail',x-side*.58,y,z,.14,.14,8.2,m.darkWood);}
   for(const z of [-22,1,23,39])box('canal-room-post',side*31,9.5,z,.4,19,.4,m.darkWood);
  }
  box('canal-room-ceiling',0,19.2,8,65,.3,65,m.wood);for(const z of [-22,1,23,39])box('canal-room-beam',0,18.8,z,63,.5,.5,m.darkWood);
  for(const x of [-15,15]){for(const dx of [-2,2])box('canal-lamp-rod',x+dx,17.875,8,.055,2.55,.055,m.brass);box('canal-lamp-frame',x,16.6,8,5,.25,2,m.darkWood);box('canal-lamp-panel',x,16.43,8,4.6,.12,1.6,m.glow);}
  for(const x of [-12.5,12.5])for(const y of [6.5,11.5])box('canal-review-mount',x,y,-23.49,.35,.35,.3,m.brass);
  box('canal-review-board',0,9,-23.32,28,8.4,.18,m.darkWood);box('canal-review-paper',0,9,-23.2,27.5,7.9,.06,m.paper);
  label(variant===0?'هر دو بخش تعهد را محاسبه کن':'جمع بسته را با تعهد تطبیق بده',0,11.9,-23.165,25,1);
  const rows=variant===0?['۱۰٪ مبلغ کل طرح','به‌اضافه بخش ثابت تعهد','ثبت فیش با ارسال موفق فرق دارد']:['فیش‌ها متعلق به شرکت آفتاب‌اند','مبلغ هر فیش و جمع بسته را بخوان','بسته بیشتر از تعهد هم قابل ثبت نیست'];rows.forEach((s,i)=>label(s,0,10-i*1.6,-23.165,24,.85));
 }
 for(const f of layout.fixtures){const {x,z,w,d,kind}=f;
  if(kind==='pergola'){
   for(const dx of [-7.5,7.5])for(const dz of [-5.5,5.5]){box('canal-pergola-foot',x+dx,.18,z+dz,1.2,.36,1.2,m.stone);box('canal-pergola-post',x+dx,5.2,z+dz,.38,10.4,.38,m.darkWood);}
   for(const dz of [-5.5,5.5])box('canal-pergola-beam',x,10.35,z+dz,16.5,.4,.5,m.darkWood);for(let i=0;i<12;i++)box('canal-pergola-slat',x-7.4+i*1.35,10.63,z,.32,.25,12.5,m.wood);
   for(const dx of [-4.5,4.5])box('canal-bench-leg',x+dx,.7,z,.7,1.4,2.8,m.stone);for(let i=0;i<4;i++)box('canal-bench-seat',x,1.48,z-1+i*.65,11,.2,.58,m.wood);for(const dx of [-4.5,4.5])box('canal-bench-back-post',x+dx,2.25,z-1.25,.2,2.2,.2,m.darkWood);for(const y of [2.1,2.8])box('canal-bench-back',x,y,z-1.25,11,.5,.18,m.wood);
  }else if(kind==='bed'){
   box('canal-planter-bottom',x,.18,z,w,.36,d,m.stone);box('canal-planter-soil',x,.46,z,w-.7,.2,d-.7,m.soil);for(const dx of [-w/2,w/2])box('canal-planter-rim',x+dx,.47,z,.35,.6,d+.3,m.stone);for(const dz of [-d/2,d/2])box('canal-planter-rim',x,.47,z+dz,w,.6,.35,m.stone);
   for(let i=0;i<9;i++){const plant=h.plant?.(parent,x-w*.34+(i%3)*w*.33,z-d*.33+Math.floor(i/3)*d*.31,i+node.scene.index*13,(w<10?1.4:1.05)+(i%3)*.3);if(plant)plant.position.y=.56;}
  }else if(kind==='tree'){h.tree?.(parent,x,z,node.scene.index+Math.sign(x),11);}
  else if(kind==='seats'){
   for(const dz of [-3,3]){box('canal-chair-seat',x,1.4,z+dz,2.4,.3,2.4,m.wood);for(const dx of [-.9,.9])for(const ddz of [-.9,.9])box('canal-chair-leg',x+dx,.65,z+dz+ddz,.14,1.3,.14,m.darkWood);box('canal-chair-back',x-1,2.5,z+dz,.2,2.3,2.4,m.wood);}
  }else if(kind==='binders'){
   const shelf=new T.Group();shelf.position.set(x,0,z);shelf.rotation.y=-Math.PI/2;parent.add(shelf);const t=tools(shelf,h,m);
   for(const dx of [-d/2,d/2])t.box('canal-shelf-post',dx,4.5,0,.22,9,w,m.darkWood);for(const y of [.4,2.7,5,7.3]){t.box('canal-shelf',0,y,0,d,.2,w,m.wood);for(let i=0;i<Math.floor(d/1.2);i++){const xx=-d/2+.7+i*1.2;t.box('canal-binder',xx,y+.7,.2,.75,1.2,2.8,i%2?(m.folio||m.dark):(m.folio2||m.wood));t.box('canal-binder-label',xx,y+.8,1.62,.5,.5,.035,m.paper);}}
   t.box('canal-shelf-header',0,8.5,w/2,d,1,.16,m.darkWood);t.label('اسناد تعهد شرکت',0,8.5,w/2+.09,d-.3,.75);
  }else if(kind==='drawers'){
   box('canal-drawer-case',x,3,z,w,6,d,m.darkWood);for(let i=0;i<5;i++){box('canal-drawer-front',x+w/2, .65+i*1.1,z,.18,.95,d-.3,m.wood);box('canal-drawer-handle',x+w/2+.16,.65+i*1.1,z,.18,.1,2,m.brass);}folders(x,6.04,z);
  }else{
   table(x,z,w,d);folders(x-w*.35,2.29,z,3);
   if(kind==='abacus'){
    for(const dx of [-5.5,5.5])box('canal-abacus-jamb',x+dx,4.4,z,.25,4.3,.4,m.darkWood);for(const y of [2.4,6.4])box('canal-abacus-rail',x,y,z,11.3,.25,.4,m.darkWood);
    for(let row=0;row<5;row++){const rod=cylinder('canal-abacus-rod',x,3+row*.65,z,.035,11,m.brass);rod.rotation.z=Math.PI/2;for(let bead=0;bead<10;bead++){const o=new T.Mesh(h.geo('canal-abacus-bead',()=>new T.SphereGeometry(1,24,16)),row%2?m.darkWood:m.wood);o.name='canal-abacus-bead';o.scale.set(.15,.23,.23);o.position.set(x-4.8+bead*.45+(row%2?4:0),3+row*.65,z);parent.add(o);}}
    box('canal-abacus-label-plate',x,1.95,z+d/2+.05,w-1,.6,.15,m.darkWood);label('ده درصد + بخش ثابت تعهد',x,1.95,z+d/2+.13,w-1,.45);
   }else{for(const dx of [-4,4]){box('canal-document-tray-base',x+dx,2.29,z,5.8,.08,3.8,m.darkWood);for(const side of [-1,1])box('canal-document-tray-side',x+dx+side*2.85,2.43,z,.12,.3,3.8,m.darkWood);box('canal-document-sheet',x+dx,2.36,z,5.4,.045,3.4,m.paper);const heading=label(dx<0?'فیش اول · بررسی مبلغ':'فیش دوم · بررسی مبلغ',x+dx,2.39,z-.9,4.7,.8);if(heading)heading.rotation.x=-Math.PI/2;for(let row=0;row<4;row++)box('canal-document-line',x+dx-.1,2.39,z-.25+row*.34,3.7-row*.22,.01,.018,m.dark);}placard('مقایسه اصل فیش‌ها و جمع مبالغ',x,3.1,z-2.5,w-1);}
  }
 }
 buildCanalDoors(parent,node,layout,h,m);
 const fill=new T.PointLight('#fff0d6',repair?60:30,repair?75:85,2);fill.position.set(0,12,12);parent.add(fill);
 return {variant};
}
export function buildCanalFurniture(root,guide,h,m){const {box,table,folders,placard}=tools(root,h,m);table(0,0,6.8,3.8);box('canal-desk-mat',0,2.265,0,6.2,.025,3.2,m.darkWood);if(guide)folders(-2,2.31,-.7,3);else{box('canal-desk-inkstand',2.1,2.38,-.7,.7,.25,.6,m.brass);box('canal-desk-rule',-2.1,2.3,.4,1.3,.05,.16,m.wood);}return root;}
