import {obligationsDates,obligationsDateAt,displayObligationsDate} from '../game/obligationsCalendar.js';
import * as T from '../../vendor/three.module.js';
import {ceremony,partyStage,discoDescent,obligationsBoundary,obligationsFixtures} from '../game/obligationsRoom.js';
import {obligationsDurations,obligationsState} from '../game/obligationsWorkflow.js';
import {documentCarryPose} from './documentCarry.js';

export function buildObligationsScene(root,node,layout,h){
 const {box,beam}=h;
 const oak='#886047',steel='#314952',cream='#d5d4c8',glass='#adc7cb',paper='#f3e9cf',black='#242f33';
 const block=(x,y,z,w,height,d,c)=>box(root,x,y,z,w,height,d,c);
 const shape=new T.Shape();
 obligationsBoundary.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));
 shape.closePath();
 const roofShape=new T.Shape();
 [...obligationsBoundary.slice(0,8),obligationsBoundary.at(-1)].forEach(([x,z],i)=>i?roofShape.lineTo(x,-z):roofShape.moveTo(x,-z));
 roofShape.closePath();
 const roofGeometry=new T.ShapeGeometry(roofShape);roofGeometry.userData.transient=true;
 const roof=new T.Mesh(roofGeometry,h.mat(cream));roof.rotation.x=Math.PI/2;roof.scale.y=-1;roof.material=new T.MeshStandardMaterial({color:cream,side:T.DoubleSide});roof.material.userData.transient=true;roof.position.y=8.49;root.add(roof);
 const paneMaterial=new T.MeshStandardMaterial({color:glass,transparent:true,opacity:.23,roughness:.2,depthWrite:false});
 paneMaterial.userData.transient=true;
 const geometry=new T.ShapeGeometry(shape);geometry.userData.transient=true;
 const floor=new T.Mesh(geometry,h.mat('#777b74'));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;root.add(floor);
 for(const [i,[x,z]] of obligationsBoundary.entries()){
  if(i>=8&&i<=10)continue;
  const [nx,nz]=obligationsBoundary[(i+1)%obligationsBoundary.length];
  const width=Math.hypot(nx-x,nz-z),angle=Math.atan2(nz-z,nx-x),group=new T.Group();
  group.position.set((x+nx)/2,0,(z+nz)/2);group.rotation.y=-angle;root.add(group);
  const segment=(u,y,w,ht,d,c)=>box(group,u,y,0,w,ht,d,c);
  segment(0,1,width,2,.52,oak);segment(0,7.6,width,1.8,.52,cream);segment(0,2.02,width,.12,.63,steel);
  if(i===2||i===4){
   const pane=segment(0,4.4,width,4.7,.09,glass);pane.material=paneMaterial;pane.castShadow=false;segment(0,4.7,width,.12,.57,steel);
   for(let u=-width/2;u<width/2;u+=3.4)segment(u,4.4,.15,4.8,.6,steel);
  }else{
   segment(0,4.4,width,4.8,.48,cream);
   for(let u=-width/2+.5;u<width/2;u+=1.1)segment(u,3.9,.13,3.8,.62,oak);
  }
 }
 for(const [x,z,w,d] of [[5,-30,48,20],[37,5,18,44]]){
  block(x,-.48,z,w,.76,d,'#8e947d');
  for(let i=0;i<5;i++){
   const tx=x-w*.36+i*w*.17,tz=z+(i%2?.27:-.14)*d;
   block(tx,.15,tz,3.7,.5,3,'#77786b');
   h.tree(root,tx,tz,i,5.8+i%3);
  }
 }
 for(const [x,z,w,d] of [[-11,-5,4.2,1.3],[-6,-13,2.3,1.6],[17,12,2,2.5]]){
  block(x,1.12,z,w,2.24,d,steel);
  block(x,2.28,z,w+.04,.14,d,oak);
  for(let i=0;i<3;i++){
   block(x,.48+i*.66,z+d/2,w-.2,.55,.08,cream);
   block(x,.55+i*.66,z+d/2+.065,w*.34,.08,.12,steel);
  }
 }
 for(const [x,z,len] of [[2,-11,18],[9,10,16],[-11,3,9]]){
  block(x,8.2,z,len,.28,.55,steel);
  block(x,8.04,z,len-.4,.055,.33,'#fff2cf');
  for(const side of [-1,1])beam(root,[x+side*(len/2-.4),8.2,z],[x+side*(len/2-.4),9,z],.06,steel);
 }
 const {x:entryX,doorZ,ribbonZ,width:entryWidth}=ceremony;
 const half=entryWidth/2;
 for(const [lo,hi] of [[-24,entryX-half],[entryX+half,-8]]){
  block((lo+hi)/2,4.24,doorZ,hi-lo,8.48,.52,cream);
  block((lo+hi)/2,.98,doorZ-.28,hi-lo,1.96,.06,oak);
 }
 block(entryX,7.29,doorZ,entryWidth,2.38,.54,cream);
 for(const side of [-1,1])block(entryX+side*half,3.06,doorZ,.16,6.12,.63,steel);
 block(entryX,6.08,doorZ,entryWidth,.16,.64,steel);
 const doorLeaves=[-1,1].map(side=>{
  const leaf=new T.Group();root.add(leaf);
  box(leaf,0,1,0,half-.04,2,.19,steel);
  const pane=box(leaf,0,3.98,0,half-.22,3.85,.1,glass);
  pane.material=paneMaterial;pane.castShadow=false;
  for(const edge of [-1,1])box(leaf,edge*(half/2-.07),3,0,.11,6,.22,steel);
  box(leaf,-side*(half/2-.25),2.67,-.14,.16,.53,.18,oak);
  return leaf;
 });
 block(entryX,.026,23.05,15.8,.06,13.85,'#aca491');
 for(const x of [-23.35,-8.65]){
  block(x,.38,23,.55,.76,13.8,oak);
  for(const z of [20,27.5]){block(x,.85,z,1.06,.31,1.42,'#77816c');h.tree(root,x,z,3,3.2);}
 }
 const greenhouseZ=34;
 for(const x of [entryX-6,entryX+6]){
  block(x,2.4,greenhouseZ,.2,4.8,7,steel);
  const panel=block(x,2.45,greenhouseZ,.12,4.45,6.9,glass);
  panel.material=paneMaterial;panel.castShadow=false;
 }
 for(const z of [30.55,34,37.45]){
  beam(root,[entryX-6,4.65,z],[entryX,7,z],.17,steel);
  beam(root,[entryX,7,z],[entryX+6,4.65,z],.17,steel);
  for(const x of [entryX-6,entryX+6])block(x,2.38,z,.2,4.75,.21,steel);
 }
 for(const x of [entryX-3.1,entryX+3.1])block(x,2.35,30.55,5.68,4.65,.1,glass).material=paneMaterial;
 const ribbonY=ceremony.ribbonY,halfRibbon=2.45;
 for(const x of [entryX-halfRibbon,entryX+halfRibbon]){
  block(x,.13,ribbonZ,.74,.26,.74,steel);
  block(x,ribbonY/2,ribbonZ,.16,ribbonY,.16,oak);
  block(x,ribbonY+.12,ribbonZ,.26,.26,.26,steel);
 }
 const ribbonMaterial=new T.MeshStandardMaterial({color:'#b92238',roughness:.65,side:T.DoubleSide});
 ribbonMaterial.userData.transient=true;
 const ribbonHalves=[-1,1].map(side=>{
  const geometry=new T.PlaneGeometry(1,1,24,1);
  geometry.userData.transient=true;
  const mesh=new T.Mesh(geometry,ribbonMaterial);mesh.frustumCulled=false;root.add(mesh);
  return {side,geometry};
 });
 const scissors=new T.Group();root.add(scissors);
 const blades=[-1,1].map(side=>{
  const blade=new T.Group();scissors.add(blade);
  const profile=new T.Shape();
  profile.moveTo(-.055,-.065);profile.lineTo(.065,-.065);profile.lineTo(.051,.43);profile.quadraticCurveTo(.043,.55,-.018,.63);profile.lineTo(-.044,.43);profile.closePath();
  const geometry=new T.ExtrudeGeometry(profile,{depth:.026,bevelEnabled:false});
  geometry.userData.transient=true;
  const edge=new T.Mesh(geometry,h.mat('#c1d1d3'));edge.rotation.x=Math.PI/2;edge.position.x=side*.018;blade.add(edge);
  beam(blade,[0,0,0],[0,0,-.32],.06,'#782535');
  const ring=new T.Mesh(new T.TorusGeometry(.125,.037,8,24),h.mat('#782535'));
  ring.geometry.userData.transient=true;ring.rotation.y=Math.PI/2;ring.position.set(0,side*.08,-.37);ring.scale.set(1,1,1.24);blade.add(ring);
  return blade;
 });
 const pivot=new T.Mesh(new T.CylinderGeometry(.059,.059,.16,16),h.mat(steel));
 pivot.geometry.userData.transient=true;pivot.rotation.z=Math.PI/2;scissors.add(pivot);
 const party=new T.Group();root.add(party);
 const ball=new T.Group();ball.name='courtyard-disco-ball';party.add(ball);
 const chrome=new T.MeshStandardMaterial({color:'#a2b1c9',metalness:.65,roughness:.28});
 chrome.userData.transient=true;
 const coreBall=new T.Mesh(new T.SphereGeometry(.72,28,18),chrome);
 coreBall.geometry.userData.transient=true;ball.add(coreBall);
 const tileGeometry=new T.PlaneGeometry(.122,.122);tileGeometry.userData.transient=true;
 const tileMaterial=new T.MeshStandardMaterial({color:'#ffffff',roughness:.23,metalness:.45,emissive:'#475169',emissiveIntensity:.4});
 tileMaterial.userData.transient=true;
 const tileCount=192,tiles=new T.InstancedMesh(tileGeometry,tileMaterial,tileCount);
 const tile=new T.Object3D(),normal=new T.Vector3(),forward=new T.Vector3(0,0,1);
 const colors=['#ddeafc','#a6cbff','#ffe3aa','#bbaaff','#f6b7e7'];
 for(let i=0;i<tileCount;i++){
  const y=1-2*(i+.5)/tileCount,angle=i*2.39996323,r=Math.sqrt(1-y*y);
  normal.set(Math.cos(angle)*r,y,Math.sin(angle)*r);tile.position.copy(normal).multiplyScalar(.731);
  tile.quaternion.setFromUnitVectors(forward,normal);tile.updateMatrix();tiles.setMatrixAt(i,tile.matrix);
  tiles.setColorAt(i,new T.Color(colors[i%colors.length]));
 }
 ball.add(tiles);
 const partyZ=partyStage.z;
 for(const side of [-1,1]){
  const postX=entryX+side*4.95;
  block(postX,.15,partyZ,.76,.3,.7,steel);
  block(postX,4.5,partyZ,.14,9,.14,steel);
  beam(root,[postX,8.15,partyZ],[postX-side*.85,9,partyZ],.105,steel);
 }
 block(entryX,9,partyZ,10.1,.15,.14,steel);
 block(entryX,8.95,partyZ,.53,.26,.34,steel);
 const cord=beam(party,[entryX,5,partyZ],[entryX,8.82,partyZ],.03,steel);
 const partyLights=['#ff50a4','#6ba6ff','#8affb8','#ffd472'].map((color,i)=>{
  const light=new T.PointLight(color,0,14,2);light.position.set(entryX+(i%2?4:-4),3.2,23+Math.floor(i/2)*6);party.add(light);return light;
 });
 const dots=Array.from({length:32},(_,i)=>{
  const material=new T.MeshBasicMaterial({color:partyLights[i%4].color,transparent:true,opacity:.5,depthWrite:false});
  material.userData.transient=true;
  const geometry=new T.CircleGeometry(.16+(i%3)*.055,12);geometry.userData.transient=true;
  const dot=new T.Mesh(geometry,material);dot.rotation.x=-Math.PI/2;party.add(dot);return dot;
 });
 const thanksGroup=new T.Group();thanksGroup.name='courtyard-thanks-sign';thanksGroup.position.set(entryX,0,28.34);thanksGroup.rotation.y=Math.PI;party.add(thanksGroup);
 function partyText(text,x,y,width,height,size){
  const canvas=globalThis.document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const context=canvas.getContext('2d');
  context.direction=/^[A-Z]+$/.test(text)?'ltr':'rtl';context.textAlign='center';context.textBaseline='middle';
  context.font='900 '+size+'px Vazirmatn, sans-serif';context.lineJoin='round';
  context.lineWidth=38;context.strokeStyle='#3a86ff';context.strokeText(text,512,270,950);
  context.lineWidth=26;context.strokeStyle='#ffbe0b';context.strokeText(text,512,260,950);
  context.lineWidth=15;context.strokeStyle='#ff006e';context.strokeText(text,512,250,950);
  context.fillStyle='#ffffff';context.fillText(text,512,250,950);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map,transparent:true,alphaTest:.12,toneMapped:false});
  material.userData={transient:true,ownedMap:true};
  const geometry=new T.PlaneGeometry(width,height);geometry.userData.transient=true;
  const word=new T.Group();word.position.set(x,y,0);thanksGroup.add(word);
  for(let i=0;i<3;i++){const face=new T.Mesh(geometry,material);face.position.set(i*.025,-i*.035,-i*.042);word.add(face);}
  return word;
 }
 const countdown=['ONE','TWO','THREE','FOUR'].map((word,i)=>partyText(word,(i-1.5)*2.05,6.9,2.65,1.33,270));
 const thanksWords=[partyText('تشکر',0,5.05,6.8,3.4,305),partyText('تشکر',0,3.57,6.8,3.4,305)];
 const closingLine=partyText('استقلال سوراخه',0,2.25,5.6,2.8,150);
 const colorBackdropMaterial=new T.ShaderMaterial({
  transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{clock:{value:0}},
  vertexShader:'varying vec2 uvPos; void main(){uvPos=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec2 uvPos; uniform float clock;
   void main(){
    vec2 p=uvPos-.5;
    float a=atan(p.y,p.x)*.95-clock*1.4+sin(length(p)*13.0-clock)*.5;
    vec3 color=.57+.43*cos(a+vec3(0.,2.094,4.189));
    float edge=smoothstep(0.,.09,min(min(uvPos.x,1.-uvPos.x),min(uvPos.y,1.-uvPos.y)));
    gl_FragColor=vec4(color,.64*edge);
   }`
 });
 colorBackdropMaterial.userData.transient=true;
 const colorBackdropGeometry=new T.PlaneGeometry(15.5,8.6);colorBackdropGeometry.userData.transient=true;
 const colorBackdrop=new T.Mesh(colorBackdropGeometry,colorBackdropMaterial);
 colorBackdrop.position.set(entryX,4.35,29.8);colorBackdrop.renderOrder=-1;party.add(colorBackdrop);
 const confetti=Array.from({length:42},(_,i)=>box(party,0,0,0,.095,.03,.18,colors[i%colors.length]));
 const document=(x,y,z,w,d,lines)=>{
  const group=new T.Group();root.add(group);group.position.set(x,y,z);
  box(group,0,0,0,w,.045,d,paper);
  const canvas=globalThis.document.createElement('canvas');
  canvas.width=384;canvas.height=480;
  const context=canvas.getContext('2d');
  context.fillStyle=paper;context.fillRect(0,0,384,480);
  context.strokeStyle='#7d9086';context.strokeRect(15,15,354,450);
  context.direction='rtl';context.textAlign='center';context.font='bold '+(lines.length>4?37:28)+'px Vazirmatn, sans-serif';context.fillStyle=black;
  lines.forEach((line,i)=>context.fillText(line,192,(lines.length>4?76:104)+i*60,340));
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture});
  material.userData={ownedMap:true,transient:true};
  const plane=new T.PlaneGeometry(w*.96,d*.96);plane.userData.transient=true;
  const print=new T.Mesh(plane,material);print.rotation.x=-Math.PI/2;print.position.y=.024;group.add(print);
  return group;
 };
 let drawer,drawerFolder,contract,contractBase,contractCover,bank,incoming,loaded,printout,scanLight,scanLid,docked,mailLamp,printerLamp,printerSlotLight;
 const fixture=id=>obligationsFixtures.find(f=>f.id===id);
 const calendarTabs=[],paymentTabs=[];
 let updateClock;
 for(const f of obligationsFixtures){
  const {id,x,z,w,d}=f;
  if(id==='guide')continue;
  if(id==='archive'){
   block(x,1.24,z,w,2.48,d,steel);
   block(x,4.5,z,w,1.4,d,steel);
   block(x,3.14,z+d/2-.09,w,1.32,.18,steel);
   for(const side of [-1,1])block(x+side*(w/2-.09),3.14,z,.18,1.32,d,steel);
   for(const i of [0,1,3]){
    block(x,.75+i*1.17,z-d/2,w-.22,1.03,.15,i%2?steel:'#4f666b');
    block(x,.78+i*1.17,z-d/2-.15,1.05,.13,.25,cream);
   }
   drawer=new T.Group();drawer.position.set(x,3.09,z-d/2);root.add(drawer);
   box(drawer,0,0,0,w-.22,1.03,.15,steel);
   box(drawer,0,.03,-.16,1.05,.13,.25,cream);
   box(drawer,0,-.43,.8,w-.36,.12,1.56,oak);
   box(drawer,0,-.24,1.56,w-.36,.42,.1,steel);
   for(const side of [-1,1])box(drawer,side*(w/2-.22),-.24,.8,.1,.42,1.56,steel);
   const stand=new T.Group();stand.position.set(0,.105,.76);stand.rotation.x=-.58;drawer.add(stand);
   box(stand,0,-.04,0,2.58,.09,1.48,steel);
   box(stand,0,.025,-.71,2.52,.1,.075,oak);
   for(const side of [-1,1])box(drawer,side*.9,-.22,.91,.14,.4,.44,steel);
   drawerFolder=document(0,.19,.74,2.28,1.3,['پرونده طرح آفتاب','قرارداد و برنامه سود']);
   drawerFolder.rotation.x=-.58;
   drawer.add(drawerFolder);
   box(drawerFolder,0,-.045,0,2.43,.055,1.43,'#bf8841');
   box(drawerFolder,.82,-.016,-.65,.62,.055,.24,'#d9a354');
   continue;
  }
  const stationStart=root.children.length;
  if(id!=='printer'){
   const shared=id==='schedule',benchWidth=shared?w+fixture('printer').w:w,benchX=shared?x+fixture('printer').w/2:x;
   block(benchX,2.42,z,benchWidth,.22,d,oak);
   for(const side of [-1,1]){
    block(benchX+side*(benchWidth/2-.28),1.16,z,.32,2.32,d-.23,steel);
    block(benchX+side*(benchWidth/2-.28),.12,z,.45,.16,d,black);
   }
   block(benchX,1.8,z-d*.42,benchWidth-.3,.15,.18,steel);
  }
  if(['schedule','payment','desk'].includes(id)){
   block(x+w/2-.78,1.48,z+.04,.82,1.64,1.42,id==='desk'?oak:steel);
   for(let i=0;i<3;i++)block(x+w/2-.78,.96+i*.46,z+.78,.39,.062,.09,cream);
  }
  if(id==='desk'){
   contract=document(x-1.4,2.56,z,1.8,2.2,['قرارداد طرح آفتاب','۱٬۰۰۰ میلیون تومان','۲۴٪ · ۱۲ ماه','پرداخت هر ۳ ماه']);
   contractBase=block(x-1.4,2.55,z,1.94,.035,2.31,oak);
   contractCover=new T.Group();contractCover.position.set(x-2.34,2.617,z);root.add(contractCover);
   const title=document(.94,0,0,1.88,2.28,['قرارداد طرح آفتاب']);
   contractCover.add(title);
   box(title,0,-.023,0,1.94,.044,2.31,oak);
   box(title,.68,.039,-1,.34,.025,.23,oak);
   block(x+1.5,2.65,z,1.5,.21,1.8,black);
   block(x+1.5,2.78,z-.61,1.23,.06,.43,glass);
   for(let row=0;row<4;row++)for(let col=0;col<4;col++)block(x+1.05+col*.28,2.79,z-.24+row*.26,.19,.08,.18,col===3?oak:cream);
  }
  if(id==='clock'){
   block(x-1.05,2.56,z+1,1.4,.06,.91,black);
   docked=document(x-1.05,2.61,z+1,1.26,.8,['برنامه سررسید']);
   block(x,3.7,z-.38,3.72,2.38,1.36,steel);
   block(x,4.06,z+.34,3.34,1.37,.16,black);
   block(x,2.65,z+.8,3.5,.29,1.04,steel);
   const key=block(x,2.86,z+1.03,.7,.16,.54,'#b88952');
   const lamps=Array.from({length:8},(_,i)=>block(x-1.4+i*.4,3.16,z+.36,.27,.16,.08,'#254540'));
   const canvas=globalThis.document.createElement('canvas');
   canvas.width=768;canvas.height=304;
   const ctx=canvas.getContext('2d');
   const map=new T.CanvasTexture(canvas);
   map.colorSpace=T.SRGBColorSpace;
   const material=new T.MeshBasicMaterial({map});
   material.userData={ownedMap:true,transient:true};
   const geometry=new T.PlaneGeometry(3.14,1.24);
   geometry.userData.transient=true;
   const display=new T.Mesh(geometry,material);
   display.position.set(x,4.06,z+.43);
   root.add(display);
   let journey,dates,lastFrame;
   updateClock=(state,o,progress,reduced)=>{
    if(journey!==state.startedAt){
     journey=state.startedAt;
     dates=obligationsDates(journey);
    }
    const moving=o.job==='calendar'&&!reduced;
    const fraction=o.month?1:moving?progress:0;
    const date=obligationsDateAt(dates,fraction);
    const caption=o.month?'اولین سررسید':moving?'در حال تغییر زمان':o.printed?'آماده · E برای رفتن به سه ماه بعد':'تاریخ شروع سفر';
    const frame=caption+date;
    const angle=moving?Math.PI*2*Math.min(1,progress*5):0;
    key.position.y=2.86-.09*Math.sin(angle/2);
    if(lastFrame===frame)return;
    lastFrame=frame;
    ctx.fillStyle='#101f24';ctx.fillRect(0,0,768,304);
    ctx.strokeStyle='#466f71';ctx.strokeRect(13,13,742,278);
    ctx.textAlign='center';ctx.direction='rtl';
    ctx.font='600 40px sans-serif';ctx.fillStyle='#91c6bc';ctx.fillText('دستگاه تغییر زمان',384,75);
    ctx.font='bold 58px sans-serif';ctx.fillStyle='#e8ffdf';ctx.fillText(displayObligationsDate.format(date),384,170,716);
    ctx.font='600 30px sans-serif';ctx.fillStyle='#dbc594';ctx.fillText(caption,384,247,706);
    map.needsUpdate=true;
    lamps.forEach((lamp,i)=>{lamp.material=h.mat(fraction*lamps.length>=i+1?'#80dab0':'#254540');});
   };
  }
  if(['schedule','payment'].includes(id)){
   block(x,2.6,z-.45,1.15,.13,.83,black);block(x,3.08,z-.64,.25,.9,.28,steel);
   block(x,4.05,z-.66,2.85,1.68,.23,black);
   block(x,4.05,z-.525,2.62,1.46,.04,'#52757c');
   for(let i=0;i<4;i++){const tab=block(x-.92+i*.61,3.79,-.485+z,.35,.12,.025,'#899c9d');if(id==='payment')paymentTabs.push(tab);}
   block(x,2.57,z+.63,1.85,.1,.54,black);
   for(let i=0;i<12;i++)block(x-.81+i*.145,2.63,z+.63,.09,.024,.27,cream);
   beam(root,[x,2.67,z-.9],[x,2.38,z-1.3],.055,black);
  }
  if(id==='schedule'){
   block(x+1.91,2.78,z-.53,1.25,.44,.85,steel);
   const board=document(x+1.91,3.03,z-.53,1.18,.76,['سررسیدها']);
   for(let i=0;i<4;i++)calendarTabs.push(box(board,-.39+i*.26,.034,.18,.14,.018,.14,'#b18a50'));
  }
  if(id==='printer'){
   block(x,3.03,z,2.65,.98,1.85,cream);block(x,3.43,z,2.45,.28,1.72,steel);
   block(x,3.06,z+.934,2,.18,.04,black);block(x,2.91,z+1.66,2.15,.08,1.44,steel);
   printerLamp=block(x+.94,3.47,z+.88,.24,.1,.06,steel);
   printerSlotLight=block(x,3.15,z+.959,1.9,.025,.015,steel);
   const glow=new T.MeshBasicMaterial({color:'#70ffd0',toneMapped:false});
   glow.userData.transient=true;
   printerLamp.material=printerSlotLight.material=glow;
   printout=document(x,2.976,z+.48,1.76,1.28,['برنامه سود آفتاب','مبلغ هر نوبت: ۶۰ میلیون','نوبت ۱ · ماه ۳','نوبت ۲ · ماه ۶','نوبت ۳ · ماه ۹','نوبت ۴ · ماه ۱۲']);
  }
  if(id==='inbox'){
   block(x,3.67,z-.48,2.48,1,.78,cream);
   block(x,3.24,z-.08,1.85,.095,.045,black);
   mailLamp=block(x+.85,3.74,z-.072,.22,.09,.035,steel);
   for(const y of [2.61,3.17]){
    block(x,y,z,2.45,.08,1.77,steel);
    for(const side of [-1,1])block(x+side*1.18,y+.16,z,.08,.31,1.77,steel);
    block(x,y+.16,z-.84,2.4,.31,.08,steel);
   }
   incoming=document(x,3.24,z,1.62,1.32,['سند بانکی','INTEREST-1']);
  }
  if(id==='scanner'){
   block(x,2.78,z,2.86,.46,2.16,cream);block(x,3.024,z,2.54,.028,1.82,glass);
   loaded=document(x,3.052,z,1.72,1.5,['سند بانکی','۶۰ میلیون تومان']);
   scanLight=block(x,3.094,z,2.48,.018,.085,'#a0ffda');
   scanLight.material=new T.MeshBasicMaterial({color:'#7dffd0',toneMapped:false});scanLight.material.userData.transient=true;
   const pivot=new T.Group();pivot.position.set(x,3.11,z-1.06);root.add(pivot);
   for(const side of [-1,1])box(pivot,side*1.31,0,1.06,.28,.14,2.14,steel);
   for(const depth of [.13,1.99])box(pivot,0,0,depth,2.34,.14,.26,steel);
   const window=box(pivot,0,.01,1.06,2.34,.03,1.6,glass);window.material=paneMaterial;window.castShadow=false;scanLid=pivot;
   for(const side of [-1,1])block(x+side*.95,3.12,z-1.08,.33,.13,.19,black);
  }
  if(f.front==='north'){
   const devices=root.children.slice(stationStart),station=new T.Group();
   station.position.set(x,0,z);station.rotation.y=Math.PI;root.add(station);
   for(const device of devices){device.position.x-=x;device.position.z-=z;station.add(device);}
  }
 }
 bank=document(0,0,0,1.7,2.2,['سند بانکی','نوبت ۱ · ۶۰ میلیون','پرداخت موفق']);
 const heldPlan=document(0,0,0,1.63,1.2,['برنامه سررسید','۴ نوبت · هر نوبت ۶۰ میلیون']);
 const heldContract=document(0,0,0,2.3,3,['قرارداد طرح آفتاب','۱٬۰۰۰ میلیون تومان','۲۴٪ · ۱۲ ماه']);
 root.userData.obligationsUpdate=(state,camera,paused,{carry,jobElapsed,reduced,dt,time=0,thanksElapsed=null})=>{
  const o=obligationsState(state),progress=o.job?Math.min(1,jobElapsed/obligationsDurations[o.job]):0;
  updateClock(state,o,progress,reduced);
  const doorFraction=o.doorOpen?1:o.job==='door'?T.MathUtils.smoothstep(progress,0,1):0;
  doorLeaves.forEach((leaf,i)=>{const side=i===0?-1:1;leaf.position.set(entryX+side*(half/2+doorFraction*half),0,doorZ+.22);});
  const cutting=o.job==='ribbon',phase=cutting?Math.min(1,jobElapsed/3.5):o.ribbonCut?1:0;
  const thanks=thanksElapsed!==null,partyProgress=o.ribbonCut?1:cutting?discoDescent(jobElapsed-2.45):0;
  const descent=partyProgress;
  party.visible=partyProgress>0;
  if(party.visible){
   const t=reduced?0:time;
   ball.position.set(entryX,partyStage.top-partyStage.drop*descent,partyZ);
   ball.rotation.y=t*.86;ball.rotation.z=.12;
   const cableLength=8.82-ball.position.y-.68;
   cord.visible=cableLength>0;cord.position.y=8.82-cableLength/2;cord.scale.y=Math.max(.001,cableLength/3.82);
   partyLights.forEach((light,i)=>{
    if(thanks)light.color.setHSL((t*.17+i*.25)%1,.94,.62);
    else light.color.set(['#ff50a4','#6ba6ff','#8affb8','#ffd472'][i]);
    light.intensity=partyProgress*((thanks?57:41)+18*Math.sin(t*1.55+i*1.57));
   });
   dots.forEach((dot,i)=>{
    const angle=i*2.399+t*(i%2?.49:-.39),radius=1.2+(i%10)*.57;
    dot.position.set(entryX+Math.cos(angle)*radius,.082,23.6+Math.sin(angle)*radius);
    dot.material.color.copy(partyLights[i%4].color);
    dot.material.opacity=partyProgress*((thanks?.39:.3)+.19*Math.sin(t*2+i));
   });
   colorBackdrop.visible=thanks;colorBackdropMaterial.uniforms.clock.value=t;
   thanksGroup.visible=thanks;
   if(thanks){
    const reveal=(word,delay,low,high,tilt)=>{
     const age=thanksElapsed-delay;
     word.visible=reduced||age>=0;
     const pulse=reduced?.5:(1-Math.cos(Math.max(0,age)*Math.PI*2/.65))*.5;
     word.scale.setScalar(T.MathUtils.lerp(low,high,pulse));
     word.rotation.z=tilt*(pulse*2-1);
    };
    countdown.forEach((word,i)=>reveal(word,i*.42,.92,1.12,.035));
    thanksWords.forEach((word,i)=>reveal(word,1.68+i*.22,.68,1.22,.052));
    closingLine.visible=reduced||thanksElapsed>=2.55;
   }
   confetti.forEach((piece,i)=>{
    const cycle=(i*.371+t*(.22+i%4*.045))%1;
    piece.visible=!reduced;
    piece.position.set(entryX+(i*1.79%10)-5+Math.sin(t+i)*.45,7.8-cycle*7.7,21+i*2.13%8);
    piece.rotation.set(t+i,i*.29+t*.6,t*1.9+i);
   });
  }
  const close=T.MathUtils.smoothstep(phase,.43,.59);
  const release=T.MathUtils.smoothstep(phase,.59,.92);
  const recoil=Math.sin((phase-.59)*29)*Math.sin(Math.PI*release)*.14;
  for(const {side,geometry} of ribbonHalves){
   const vertices=geometry.attributes.position;
   let x=entryX+side*halfRibbon,y=ribbonY;
   for(let i=0;i<=24;i++){
    const t=i/24;
    const angle=.035*t+release*(1.32+.31*t)+recoil*t;
    const ripple=release*(1-release)*Math.sin(t*9-phase*22)*t*.22;
    const dx=side*Math.sin(angle)*.1,dy=Math.cos(angle)*.1;
    vertices.setXYZ(i,x+dx,y+dy,ribbonZ+ripple);
    vertices.setXYZ(i+25,x-dx,y-dy,ribbonZ+ripple);
    x-=side*Math.cos(angle)*halfRibbon/24;
    y-=Math.sin(angle)*halfRibbon/24;
   }
   vertices.needsUpdate=true;geometry.computeVertexNormals();
  }
  scissors.visible=cutting;
  if(cutting){
   const approach=T.MathUtils.smoothstep(phase,.06,.40),withdraw=T.MathUtils.smoothstep(phase,.70,.98);
   const spread=.34*(1-close);
   const contactY=ribbonY-.045;
   scissors.position.set(entryX+.29*(1-approach)+.32*withdraw,contactY-.46*(1-approach)-.49*withdraw,ribbonZ-.32-.43*(1-approach)-.46*withdraw);
   scissors.rotation.set(.18*(1-approach)+.22*withdraw,0,-.12*(1-approach));
   blades.forEach((blade,i)=>blade.rotation.x=(i===0?-1:1)*spread);
   if(!paused){
    const pose=documentCarryPose(camera,1,1,.05);
    const grip=blades[1].localToWorld(new T.Vector3(0,.08,-.37));
    const contact=camera.worldToLocal(grip);
    const orientation=camera.getWorldQuaternion(new T.Quaternion()).invert().multiply(scissors.getWorldQuaternion(new T.Quaternion())).multiply(new T.Quaternion().setFromEuler(new T.Euler(-.3,-.5,.24)));
    const angles=new T.Euler().setFromQuaternion(orientation,'YXZ');
    pose.hands.left.visible=false;
    pose.hands.right={visible:true,position:contact.toArray(),rotation:[angles.x,angles.y,angles.z],grasp:'paper',thickness:.035,grip:.52+.35*(1-spread/.34),shoulder:[.33,-.45,.12],articulated:true};
    return pose;
   }
  }
  const drawerBase=fixture('archive').z-fixture('archive').d/2;
  const open=o.cabinetOpen?1.28:0;
  drawer.position.z=reduced?drawerBase-open:T.MathUtils.lerp(drawer.position.z,drawerBase-open,Math.min(1,dt*8));
  drawerFolder.visible=!o.contract&&o.held!=='contract'&&o.job!=='pickup';
  calendarTabs.forEach((tab,i)=>{tab.visible=Boolean(state.ledger.schedule[i]);tab.material=h.mat(state.ledger.schedule[i]?.paid?'#5c926f':'#b18a50');});
  paymentTabs.forEach((tab,i)=>{tab.material=h.mat(state.ledger.schedule[i]?.paid?'#80dab0':'#c49d65');});
  contract.visible=contractBase.visible=contractCover.visible=o.contract;
  const coverAngle=o.contractOpen||o.version===1?Math.PI-.035:0;
  contractCover.rotation.z=reduced?coverAngle:T.MathUtils.lerp(contractCover.rotation.z,coverAngle,Math.min(1,dt*7));
  docked.visible=Boolean(o.planDocked);
  incoming.visible=o.month===3&&!o.loaded&&o.held!=='bank'&&(o.version!==2||!o.scanned&&(o.bankReady||o.job==='receive'));
  incoming.position.z=fixture('inbox').z+(o.job==='receive'&&!reduced?-.59+.91*progress:.32);
  mailLamp.material=h.mat(o.job==='receive'?'#a7ffd6':'#314952');
  loaded.visible=o.loaded;
  scanLid.rotation.x=reduced?0:T.MathUtils.lerp(scanLid.rotation.x,o.job==='scan'?0:o.loaded&&!o.scanned?-.12:-.95,Math.min(1,dt*9));
  scanLight.visible=o.job==='scan';scanLight.position.z=-.73+1.46*(reduced?.5:progress);
  const printing=o.job==='print',feed=o.printed?1:reduced?1:T.MathUtils.smoothstep(progress,.13,.86);
  printerLamp.visible=printing||o.printed&&!o.planDocked&&o.held!=='plan';
  printerSlotLight.visible=printing;
  printout.visible=(printing&&feed>0)||o.printed&&!o.planDocked&&o.held!=='plan';
  printout.position.z=fixture('printer').z+.26+1.4*feed;
  bank.visible=o.held==='bank'&&!paused;heldContract.visible=(o.held==='contract'||o.job==='pickup')&&!paused;heldPlan.visible=o.held==='plan'&&!paused;
  if(paused||!o.held&&o.job!=='pickup')return false;
  const model=bank.visible?bank:heldPlan.visible?heldPlan:heldContract;
  const pose=documentCarryPose(camera,bank.visible?1.7:heldPlan.visible?1.63:2.3,bank.visible?2.2:heldPlan.visible?1.2:3,.05,carry);
  model.position.copy(pose.position).applyQuaternion(camera.quaternion).add(camera.position);
  model.quaternion.copy(camera.quaternion).multiply(pose.rotation);
  model.scale.setScalar(pose.scale);
  if(o.job==='pickup'&&!reduced){
   const start=drawerFolder.getWorldPosition(new T.Vector3());
   const lift=T.MathUtils.smoothstep(progress,0,.4)*.91;
   const transfer=T.MathUtils.smoothstep(progress,.4,1);
   model.position.lerp(start,1-transfer);model.position.y+=lift*(1-transfer);
   model.quaternion.slerp(drawerFolder.getWorldQuaternion(new T.Quaternion()),1-transfer);
   model.scale.setScalar(T.MathUtils.lerp(.78,pose.scale,transfer));
   if(progress<.94)return false;
  }
  return pose;
 };
 const light=new T.PointLight('#fff1d4',145,55,2);light.position.set(0,7,0);root.add(light);
 return root;
}
