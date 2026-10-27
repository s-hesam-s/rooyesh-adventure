import {buildWorkshopServices} from './workshopServices.js';
import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {buildWorkshopDoors} from './workshopDoors.js';
function workshopTools(parent,h,m){
 const unit=h.geo('workshop-rounded-unit',()=>new RoundedBoxGeometry(1,1,1,2,.035));
 function b(x,y,z,w,ht,d,mat=m.steel){const o=new T.Mesh(unit,mat);o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=mat!==m.glass;o.receiveShadow=true;parent.add(o);return o;}
 function cylinder(x,y,z,r,len,mat=m.silver){const o=new T.Mesh(h.geo('workshop-cylinder-'+r+':'+len,()=>new T.CylinderGeometry(r,r,len,40)),mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function beam(a,end,width,mat=m.steel){const av=new T.Vector3(...a),bv=new T.Vector3(...end),o=b(0,0,0,width,av.distanceTo(bv),width,mat);o.position.copy(av).lerp(bv,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
 function tag(text,x,y,z,w,ht=.8){if(!h.archiveText)return;const o=new T.Mesh(h.geo('workshop-label',()=>new T.PlaneGeometry(1,1)),h.archiveText(text));o.position.set(x,y,z);o.scale.set(w,ht,1);parent.add(o);return o;}
 function tube(points,r=.08,mat=m.silver){const o=new T.Mesh(h.geo('workshop-pipe-'+JSON.stringify(points)+r,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,12,false)),mat);o.castShadow=true;parent.add(o);return o;}
 function bench(x,z,w=12,d=5){b(x,2.25,z,w,.32,d,m.wood);for(const dx of [-w*.42,w*.42])for(const dz of [-d*.35,d*.35]){b(x+dx,1.1,z+dz,.3,2.2,.3);b(x+dx,.1,z+dz,.65,.2,.65,m.rubber);}b(x,.6,z-d*.3,w*.86,.18,.2);return b;}
 function wrench(x,y,z,size=1){b(x,y,z,.11,.07,size,m.silver);const head=new T.Mesh(h.geo('workshop-wrench-head',()=>new T.TorusGeometry(.19,.065,10,32,Math.PI*1.45)),m.silver);head.rotation.x=Math.PI/2;head.position.set(x,y,z-size/2);parent.add(head);b(x,y,z+size*.48,.22,.07,.25,m.silver);}
 function fileStack(x,y,z,count=4){for(let i=0;i<count;i++){b(x+i*.04,y+i*.09,z-i*.03,2.3,.075,1.55,i%2?m.paper:m.panel);b(x+.96,y+.047+i*.09,z-.4-i*.03,.16,.012,.7,m.paper);}}
 return {b,cylinder,beam,tag,tube,bench,wrench,fileStack};
}
export function buildWorkshopScene(parent,node,layout,h){
 const fallback={};for(const [key,c]of Object.entries({brick:'#9f7757',floor:'#b6b9ad',stone:'#b9b0a0',plaster:'#e2ddcb',paper:'#eee5cf',brass:'#aa8d52',wood:'#8d6946',steel:'#3b4b4c',panel:'#416c62',glass:'#bacbc4',dark:'#243435',silver:'#aeb7b4',rubber:'#242b2b',safety:'#c3943e',glow:'#f4dfb1'}))fallback[key]=h.mat(c);fallback.metal=fallback.steel;
 const m=h.workshopMaterials||fallback,{b,cylinder,beam,tag,tube,bench,wrench,fileStack}=workshopTools(parent,h,m),repair=Boolean(node.repairFor),variant=node.scene.workshopVariant,width=repair?66:128,depth=repair?66:94,center=repair?8:1,roof=repair?18:24;
 const floor=b(0,-.45,center,width,.8,depth,m.floor);floor.name='workshop-floor';
 for(const side of [-1,1]){const x=side*(repair?32:63);const wall=b(x,roof/2,center,1,roof,depth,m.brick);wall.name=side<0?'workshop-side-wall-left':'workshop-side-wall-right';b(x,.55,center,1.25,1.1,depth,m.steel);
  for(const z of (repair?[-12,9,30]:[-30,-9,12,33])){
   b(x-side*.65,roof/2,z,.55,roof,1,m.steel);b(x-side*.65,.22,z,1.4,.44,2,m.steel);
   for(const dz of [-.65,.65])for(const dx of [-.4,.4])cylinder(x-side*.65+dx,.48,z+dz,.065,.09,m.silver);
   const glazing=b(x-side*.58,11,z,.10,5.3,8,m.glass);glazing.name='workshop-window-'+(side<0?'left-':'right-')+z;for(const dz of [-4,0,4])b(x-side*.68,11,z+dz,.14,5.5,.12,m.steel);for(const y of [8.25,11,13.75])b(x-side*.68,y,z,.15,.12,8.2,m.steel);
  }
 }
 if(repair)b(0,9,-24,64,18,1,m.brick);else{
  for(const x of [-36.5,36.5])b(x,12,47,53,24,1,m.brick);b(0,19,47,20,10,1,m.brick);
  for(const x of [-10,10])b(x,7,46.4,.6,14,.8,m.steel);b(0,14,46.4,20.5,.7,1,m.steel);b(0,7,46.8,19.3,14,.25,m.panel);
  for(let y=.6;y<14;y+=.65)b(0,y,46.58,19.2,.07,.15,m.steel);
  const entry=new T.Group();entry.position.set(0,16.4,46.1);entry.rotation.y=Math.PI;parent.add(entry);workshopTools(entry,h,m).tag('ورودی کارگاه · شرکت آفتاب',0,0,0,21,1.1);
 }
 // Roof members meet the columns; no detached caps or unsupported decorative beams.
 const roofBands=repair?[-18,18]:[-45,-20,20,45],roofBandWidth=repair?3:6,roofEdges=[-width/2,...roofBands.flatMap(x=>[x-roofBandWidth/2,x+roofBandWidth/2]),width/2];
 for(let i=0;i<roofEdges.length;i+=2)b((roofEdges[i]+roofEdges[i+1])/2,roof+.35,center,roofEdges[i+1]-roofEdges[i],.35,depth+1,m.plaster);
 const span=repair?30:61;
 for(const z of (repair?[-12,9,30]:[-30,-9,12,33])){
  beam([-span,roof-.5,z],[span,roof-.5,z],.6);beam([-span,roof-3,z],[span,roof-3,z],.38);
  for(let x=-span;x<span;x+=span/4)beam([x,roof-3,z],[Math.min(span,x+span/4),roof-.5,z],.18);
  b(0,roof-.8,z,repair?14:28,.15,3.8,m.glow);for(const x of [-7,7])b(x,roof-.35,z,.055,.8,.055,m.steel);
 }
 for(const x of roofBands){b(x,roof+.35,center,roofBandWidth,.12,depth+1,m.glass);for(const dx of [-roofBandWidth/2,roofBandWidth/2])b(x+dx,roof+.43,center,.08,.14,depth+1,m.steel);}
 buildWorkshopServices(parent,h,m,{repair});
 if(!repair){
  tag('شرکت آفتاب · کارگاه تجهیزات گلخانه',0,19,-25.35,30,1.5);tag('مونتاژ، کنترل و مستندات شرکت',0,17.3,-25.34,26,1);
  for(const x of [-11,11]){b(x,11.7,-10.5,.4,23.4,.4);beam([x,23.1,-10.5],[0,23.1,-10.5],.3);}

 }else{
  b(0,9,-23.3,25,9,.2,m.panel);b(0,9,-23.12,24.4,8.4,.08,m.paper);
  tag(variant===0?'تفکیک نوع عملیات شرکت':'تطبیق هویت و اسناد شرکت',0,12.4,-23.02,22,1);
  const rows=variant===0?['سرمایه‌پذیر: مجری همین طرح','سرمایه‌گذار حقوقی: مشارکت‌کننده در طرح','نقش شرکت را از پرونده استخراج کن']:['پرونده طرح: شرکت آفتاب','بسته معرفی‌شده: شرکت مهتاب','نام صادرکننده و نام مجری را تطبیق بده'];
  rows.forEach((text,i)=>tag(text,0,10.3-i*1.7,-23,22,.85));
 }
 for(const f of layout.fixtures){
  const {x,z,w,d,kind}=f;
  if(kind==='seating'){
   for(const dz of [-5,0,5]){b(x,1.4,z+dz,2.4,.3,2.3,m.wood);b(x-1,2.7,z+dz,.22,2.5,2.3,m.wood);for(const dx of [-.85,.85])for(const ddz of [-.8,.8])b(x+dx,.65,z+dz+ddz,.15,1.3,.15,m.steel);}
   const notice=b(-31.38,6,z,.15,5,12,m.panel);notice.name='workshop-notice-board';for(const y of [4,8])for(const dz of [-5.3,5.3]){const mount=b(-31.47,y,z+dz,.12,.4,.4,m.steel);mount.name='workshop-notice-board-mount';}for(let i=0;i<3;i++)b(-31.29,6,z-4+i*4,.04,3,2.8,m.paper);
  }else if(kind==='drawers'){
   b(x,3,z,w,6,d,m.steel);for(let i=0;i<5;i++){b(x+w/2+.04,.65+i*1.1,z,.12,.95,d-.4,m.panel);for(const dz of [-2.5,2.5])b(x+w/2+.16,.65+i*1.1,z+dz,.14,.12,1.3,m.silver);}
   fileStack(x,6.04,z,3);
  }else if(kind==='assembly'){
   bench(x,z,w,d*.75);
   for(const dx of [-6,6]){
    for(const dz of [-2,4]){b(x+dx,2.46,z+dz,.4,.12,.4,m.silver);beam([x+dx,2.45,z+dz],[x+dx,6.2,z+dz],.22,m.silver);}
    beam([x+dx,6.2,z-2],[x+dx,9,z+1],.22,m.silver);beam([x+dx,9,z+1],[x+dx,6.2,z+4],.22,m.silver);
   }
   for(const [y,dz]of [[9,1],[6.2,-2],[6.2,4],[4.2,-2]]){const rail=beam([x-6,y,z+dz],[x+6,y,z+dz],.22,m.silver);rail.name='assembly-glazing-rail';}
   const slope=Math.atan2(2.8,3),length=Math.hypot(2.8,3);
   for(let i=0;i<6;i++){const panel=b(x-5+i*2,7.6,z-.5,1.8,.08,length,m.glass);panel.rotation.x=-slope;panel.name='assembly-roof-pane';}
   const plate=b(x,1.5,z+6.32,11,1,.18,m.steel);plate.name='assembly-nameplate';tag('نمونه سازه گلخانه',x,1.5,z+6.42,10.5,.75);
   for(const dx of [-8.1,8.1])b(x+dx,1.5,z, .15,3,d+1,m.safety);b(x,1.5,z+6.3,w,.18,.15,m.safety);
   for(const dx of [-7.7,7.7]){const post=b(x+dx,6.65,z-5.8,.25,13.3,.35,m.steel);post.name='assembly-board-post';const foot=b(x+dx,.12,z-5.8,1.3,.24,1.4,m.steel);foot.name='assembly-board-foot';}
   const board=b(x,9,z-5.8,17,8.2,.18,m.steel);board.name='assembly-board-backing';const drawing=b(x,9,z-5.68,16.4,7.7,.05,m.blueprint||m.panel);drawing.name='workshop-assembly-blueprint';
   for(let i=0;i<3;i++){cylinder(x-3+i*2,2.62,z+2.2,.16,.32,m.silver);wrench(x-4+i*2,2.48,z-1.8,1.5);}
  }else if(kind==='press'){
   const base=b(x,1,z,w*.8,2,d*.8,m.steel);base.name='press-base';
   for(const dx of [-3.2,3.2]){cylinder(x+dx,5,z,.45,7,m.silver);b(x+dx,8.7,z,2,.45,5,m.panel);}
   b(x,9,z,9,1,5,m.panel);cylinder(x,7,z,.7,3,m.steel);b(x,5.5,z,5,.4,4,m.silver);const bolster=b(x,2.18,z,6.2,.4,4.2,m.steel);bolster.name='press-bed-riser';const bed=b(x,2.5,z,7,.3,5,m.silver);bed.name='press-bed-plate';
   const foot=b(x+4,2.3,z+2,1.4,.6,1,m.steel);foot.name='press-console-foot';
   const pedestal=b(x+4.6,2.9,z+2,.4,1.3,.4,m.steel);pedestal.name='press-control-pedestal';
   const console=b(x+4.6,4,z+2,1.6,2,.6,m.panel);console.name='press-control-console';
   const face=b(x+4.6,4.1,z+2.32,1.2,1.35,.06,m.dark);face.name='press-control-face';
   for(const y of [3.5,4.2,4.8]){const button=cylinder(x+4.6,y,z+2.4,.12,.12,y===4.8?m.safety:m.silver);button.name='press-console-button';button.rotation.x=Math.PI/2;}
   for(const dx of [-.64,.64])for(const y of [3.18,4.82]){const bolt=cylinder(x+4.6+dx,y,z+2.34,.045,.1,m.silver);bolt.rotation.x=Math.PI/2;}
   tube([[x+4.6,3.4,z+1.7],[x+4.3,2.6,z+1.6],[x+3.9,1.9,z+1.6]],.045,m.rubber);
   const pump=b(x-3.4,2.65,z-2.7,2,1.4,2,m.panel);pump.name='press-power-pack';cylinder(x-3.4,3.8,z-2.7,.4,1,m.steel);
   for(let i=0;i<2;i++){
    const y=7.8-i*.55,px=x-3.8+i*.8;
    const ramFitting=cylinder(x-.84,y,z,.17,.3,m.brass);ramFitting.name='press-ram-fitting-'+i;ramFitting.rotation.z=Math.PI/2;
    const pumpFitting=cylinder(px,3.46,z-2.7,.14,.22,m.brass);pumpFitting.name='press-pump-fitting-'+i;
    const hose=tube([[x-.99,y,z],[x-2,y+.12,z-.8],[px,5,z-2.7],[px,3.55,z-2.7]],.11,m.rubber);hose.name='press-hydraulic-hose-'+i;
   }
   for(const dx of [-2.7,2.7]){const post=b(x+dx,10.2,z+2,.15,1.6,.18,m.steel);post.name='press-label-post';}
   b(x,11,z+2,8.5,1.2,.16,m.panel);tag('پرس خاموش · محدوده تجهیزات',x,11,z+2.09,8.1,.85);
  }else if(kind==='files'){
   const cabinet=new T.Group();cabinet.position.set(x,0,z);cabinet.rotation.y=-Math.PI/2;parent.add(cabinet);const local=workshopTools(cabinet,h,m),length=d;
   for(const dx of [-length/2,length/2])local.b(dx,4.75,0,.2,9.5,w,m.steel);
   for(const y of [.5,2.7,4.9,7.2]){local.b(0,y,0,length,.18,w,m.steel);for(let i=0;i<Math.floor(length/1.1);i++){const xx=-length/2+.6+i*1.08;local.b(xx,y+.7,.25,.72,1.2,2.8,i%3?m.panel:m.wood);local.b(xx,y+.8,1.68,.47,.48,.025,m.paper);local.b(xx,y+.43,1.7,.15,.15,.025,m.dark);}}
   local.b(0,8.8,w/2, length,1.2,.18,m.panel);local.tag('پرونده‌های سازمانی',0,8.8,w/2+.1,length-.3,.85);
  }else if(kind==='rack'){
   for(const dx of [-w/2,w/2])b(x+dx,4.8,z,.22,9.6,d,m.steel);for(const y of [.5,3,5.5,7.8]){b(x,y,z,w,.18,d,m.steel);for(let i=0;i<(kind==='rack'?4:3);i++){if(kind==='rack'){for(const dz of [-1.2,1.2]){b(x,y+.35+i*.19,z+dz,w*.85,.16,.26,m.silver);b(x,y+.47+i*.19,z+dz-.12,w*.85,.1,.055,m.silver);}}else{b(x-w*.35+i*w*.23,y+.55,z,.7,1,d*.6,i%2?m.paper:m.panel);b(x-w*.35+i*w*.23,y+.6,z+d*.31,.45,.25,.018,m.paper);}}}b(x,9,z+d/2,w,1.2,.18,m.panel);tag('اتصالات و پروفیل‌ها',x,9,z+d/2+.1,w-.3,.85);
  }else if(kind==='parts'){
   bench(x,z,w,d);for(let i=0;i<4;i++){cylinder(x-w*.3+i*w*.2,2.65,z,.38,.6,m.silver);b(x-w*.3+i*w*.2,2.54,z+1,.65,.12,.8,m.panel);}for(let i=0;i<3;i++){const roll=new T.Mesh(h.geo('workshop-hose-coil',()=>new T.TorusGeometry(.65,.09,12,48)),m.rubber);roll.rotation.x=Math.PI/2;roll.position.set(x-2+i*2,2.5,z-1);parent.add(roll);}
  }else if(kind==='toolbench'){
   bench(x,z,w,d);for(const dx of [-w*.4,w*.4])b(x+dx,2.5,z-2,.18,.5,.25,m.steel);b(x,5,z-2,w,5,.18,m.panel);for(let row=0;row<5;row++)for(let col=0;col<22;col++)b(x-5.7+col*.54,3.3+row*.8,z-1.89,.045,.045,.025,m.dark);
   for(let i=0;i<3;i++){const xx=x-5+i*1.45,len=1.1+i*.3;b(xx,5.25,z-1.7,.06,len,.08,m.silver);cylinder(xx,4.3-i*.1,z-1.7,.12,.6,i===1?m.rubber:m.safety);b(xx,5.25+len/2,z-1.7,i===2?.16:.08,.12,.045,m.silver);}
   const px=x-.6;for(const side of [-1,1]){beam([px,5.4,z-1.7],[px+side*.28,4.3,z-1.7],.11,m.rubber);beam([px,5.4,z-1.7],[px+side*.13,5.9,z-1.7],.12,m.silver);}b(px,5.4,z-1.65,.18,.18,.08,m.brass);
   b(x+1.1,5,z-1.7,.13,1.8,.15,m.wood);b(x+1.1,5.95,z-1.7,.9,.28,.32,m.steel);
   b(x+2.9,5,z-1.7,.13,1.7,.1,m.silver);const openHead=new T.Mesh(h.geo('workshop-hanging-wrench',()=>new T.TorusGeometry(.27,.085,12,40,Math.PI*1.55)),m.silver);openHead.position.set(x+2.9,5.95,z-1.7);openHead.rotation.z=.7;parent.add(openHead);
   for(const [dx,y]of [[-5,5.7],[-3.55,5.7],[-2.1,5.7],[-.6,5.4],[1.1,5.8],[2.9,6.19],[4.8,5.9]]){const peg=cylinder(x+dx,y,z-1.8,.055,.36,m.silver);peg.rotation.x=Math.PI/2;peg.name='workshop-tool-peg';const cap=cylinder(x+dx,y,z-1.61,.085,.04,m.steel);cap.rotation.x=Math.PI/2;}
   const sawShape=new T.Shape();sawShape.moveTo(0,0);sawShape.lineTo(.1,1.5);sawShape.lineTo(1.4,1.5);for(let i=9;i>=0;i--){sawShape.lineTo(i*.14,.18);sawShape.lineTo(i*.14+.06,.04);}sawShape.closePath();const blade=new T.Mesh(h.geo('workshop-hand-saw',()=>new T.ExtrudeGeometry(sawShape,{depth:.035,bevelEnabled:false})),m.silver);blade.position.set(x+4.1,4.1,z-1.72);parent.add(blade);b(x+4.8,5.9,z-1.7,.9,.22,.15,m.wood);for(let i=0;i<4;i++)wrench(x-4+i*2.2,2.47,z,1.3);for(const dx of [-4,4])b(x+dx,7.9,z-2,.12,1,.2,m.steel);b(x,8.1,z-1.9,9.4,1.2,.16,m.panel);tag('ابزار مونتاژ',x,8.1,z-1.8,9,.85);b(x+2,2.47,z+.8,1.9,.14,1.2,m.steel);b(x+2,3,z+.8,1.5,1,.8,m.steel);for(const dx of [-.8,.8])b(x+2+dx,3.5,z+.8,.25,.5,.8,m.silver);const screw=cylinder(x+2,2.9,z+1.5,.1,1.7,m.silver);screw.rotation.x=Math.PI/2;const handle=cylinder(x+2,2.9,z+2.3,.07,1.2,m.silver);handle.rotation.z=Math.PI/2;
  }else{
   bench(x,z,w,d);fileStack(x-w*.3,2.45,z,variant===0?5:3);
   if(kind==='lighttable'){b(x+2,2.47,z,8,.08,4,m.glow);b(x+2,2.53,z,7.6,.02,3.6,m.paper);for(let i=0;i<5;i++)b(x-.5+i,2.55,z, .06,.01,2,m.steel);b(x,3.2,z-2,w-1,1,.18,m.panel);for(const dx of [-w*.35,w*.35])b(x+dx,2.7,z-2,.12,.6,.25,m.steel);tag('میز تطبیق نام و مهر',x,3.2,z-1.9,w-1,.8);}
   if(kind==='sealpress'){b(x+1,3.4,z,2,.3,2,m.panel);b(x+1,2.9,z-1,.25,1.3,.25);cylinder(x+1,3,z,.32,1,m.steel);beam([x+1,3.8,z],[x+2.4,4.5,z],.12,m.silver);}
   if(kind==='comparison')for(const dx of [-4,4]){b(x+dx,2.58,z,.35,.4,.4,m.steel);b(x+dx,3.5,z,4,2,.2,m.panel);tag(dx<0?'نقش شرکت':'نوع عملیات',x+dx,3.6,z+.13,3.7,.7);}
  }
 }
 buildWorkshopDoors(parent,node,layout,h,m);
 const fill=new T.PointLight('#e5eee7',repair?55:95,repair?70:120,2);fill.position.set(0,13,12);parent.add(fill);
 return {variant};
}
export function buildWorkshopFurniture(root,guide,h,m){
 const {b,bench,wrench,fileStack,cylinder}=workshopTools(root,h,m);bench(0,0,6.8,3.8);b(0,2.44,0,6.1,.025,3.1,m.panel);
 if(guide){fileStack(-2,2.49,-.5,3);b(2,3.05,-.7,.8,1.2,.16,m.paper);}else{wrench(2.2,2.54,-.5,.9);cylinder(-2.2,2.65,-.7,.3,.3,m.silver);b(-2.1,2.54,.6,1.2,.08,.7,m.safety);}
 return root;
}
