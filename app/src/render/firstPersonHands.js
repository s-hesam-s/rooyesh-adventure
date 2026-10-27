import {createPlayerWear} from './playerAppearance.js';
import * as T from '../../vendor/three.module.js';
import {workwearMaterial,sleeveGeometry} from './workwear.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';

export function createFirstPersonHands(camera){
 const root=new T.Group();root.name='first-person-work-gloves';camera.add(root);
 const glove=workwearMaterial('#887c60',{leather:true}),pad=workwearMaterial('#59604f',{leather:true}),seam=new T.MeshStandardMaterial({color:'#c6b98b',roughness:1}),sleeve=workwearMaterial('#ac8c61',{repeat:3}),bagMat=workwearMaterial('#68745a',{repeat:4}),metal=new T.MeshStandardMaterial({color:'#666b62',metalness:.85,roughness:.32});
 const round=new RoundedBoxGeometry(1,1,1,5,.2),capsule=new T.CapsuleGeometry(.033,.045,8,16),cuffGeo=new T.TorusGeometry(.117,.013,12,32),armGeometry=sleeveGeometry(),softPatch=new T.SphereGeometry(1,20,12);

 function stitchLine(parent,from,to,count=12){const geometry=new T.CapsuleGeometry(.0018,.009,3,5),inst=new T.InstancedMesh(geometry,seam,count),dummy=new T.Object3D(),start=new T.Vector3(...from),end=new T.Vector3(...to),direction=end.clone().sub(start).normalize();for(let i=0;i<count;i++){dummy.position.copy(start).lerp(end,(i+.5)/count);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);}parent.add(inst);return inst;}
 function mesh(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 function box(parent,material,x,y,z,w,h,d){return mesh(parent,round,material,x,y,z,w,h,d);}
 function hand(side){
  const group=new T.Group();root.add(group);const fingers=[];
  box(group,glove,0,0,0,.275,.125,.28);box(group,pad,0,.064,.018,.22,.025,.19);
  for(const x of [-.094,.094])stitchLine(group,[x,.079,-.06],[x,.079,.09],12);
  for(let i=0;i<4;i++){
   const base=new T.Group();base.position.set((i-1.5)*.069,0,-.125);group.add(base);let parent=base;
   for(let j=0;j<3;j++){const joint=new T.Group();parent.add(joint);const segment=mesh(joint,capsule,glove,0,0,-.054,1,1,1);segment.rotation.x=Math.PI/2;segment.scale.set(j===2?.82:1,j===2?.9:1,(i===3?.72:i===0?.9:1)*(j===2?.78:1));if(j===0){mesh(joint,softPatch,pad,0,.028,-.045,.023,.009,.031);stitchLine(joint,[-.018,.036,-.057],[.018,.036,-.057],4);}fingers.push({joint,base:j===0?.16:.28});parent=new T.Group();parent.position.z=-.09*(i===3?.75:1);joint.add(parent);}
   box(group,seam,(i-1.5)*.069,.066,-.045,.006,.005,.13);
  }
  const thumb=new T.Group();thumb.position.set(-side*.135,0,.015);thumb.rotation.y=side*.8;group.add(thumb);
  for(let j=0;j<2;j++){const joint=new T.Group();thumb.add(joint);const m=mesh(joint,capsule,glove,0,0,-.04,.95,.8,.95);m.rotation.x=Math.PI/2;joint.position.z=-j*.068;fingers.push({joint,base:.3});}
  mesh(group,cuffGeo,pad,0,0,.16);
  box(group,sleeve,0,-.025,.28,.25,.21,.24);box(group,pad,0,.025,.18,.28,.035,.09);
  stitchLine(group,[-.115,.047,.15],[.115,.047,.15],18);
  box(group,metal,-side*.095,.05,.18,.04,.018,.075);
  for(let i=0;i<3;i++)box(group,glove,0,.045,.225+i*.028,.24,.012,.01);
  const arm=mesh(root,armGeometry,sleeve,0,0,0);const wear=createPlayerWear(group,side);wear.root.position.z=.2;return {group,fingers,arm,side,wear};
 }
 const left=hand(-1),right=hand(1),bag=new T.Group();root.add(bag);
 box(bag,bagMat,0,0,0,1.4,.78,.47);box(bag,bagMat,0,-.08,.253,1.16,.43,.09);
 for(const x of [-.53,.53]){stitchLine(bag,[x,-.26,.305],[x,.10,.305],24);box(bag,pad,x,.16,.29,.09,.35,.028);box(bag,metal,x,.18,.312,.115,.07,.026);box(bag,pad,x,.18,.332,.065,.026,.012);}
 for(const y of [-.27,.11])stitchLine(bag,[-.53,y,.305],[.53,y,.305],60);
 for(const x of [-.64,.64]){stitchLine(bag,[x,-.29,.17],[x,.27,.17],30);box(bag,pad,x*.93,0,-.25,.12,.66,.03);}
 for(const x of [-.52,.52]){box(bag,seam,x,-.03,.309,.012,.34,.008);box(bag,pad,x,.04,.31,.1,.18,.04);}
 const lid=new T.Group();lid.position.set(0,.37,-.2);bag.add(lid);box(lid,bagMat,0,0,.2,1.42,.07,.48);
 const zipTrack=box(bag,pad,0,.4,.08,1.2,.025,.035),slider=box(bag,metal,.57,.42,.08,.09,.045,.06);const pull=mesh(slider,new T.TorusGeometry(.035,.008,8,16),metal,0,.02,.065);pull.rotation.x=Math.PI/2;pull.scale.z=1.5;
 const teeth=new T.InstancedMesh(round,metal,48),tooth=new T.Object3D();for(let i=0;i<48;i++){tooth.position.set(-.59+i*.025,.414,.08+(i%2?.012:-.012));tooth.scale.set(.012,.012,.023);tooth.updateMatrix();teeth.setMatrixAt(i,tooth.matrix);}bag.add(teeth);
 const handle=mesh(bag,new T.TorusGeometry(.16,.023,8,24),pad,0,.49,-.12);handle.scale.y=.62;
 const a=new T.Vector3(),b=new T.Vector3(),up=new T.Vector3(0,1,0);
 function update({pose=null,time=0,moving=false,visible=true,reduced=false,aspect=1,kind='book',shirt='#ac8c61',gloveColor='#887c60',bagColor='#68745a',role='manager'}){
  root.visible=visible;if(!visible)return;sleeve.color.set(shirt);glove.color.set(gloveColor);bagMat.color.set(bagColor);
  const reach=pose?.reach||0,insert=pose?.insert||0,bob=!reduced&&moving&&!pose?Math.sin(time*8)*.012:0,depth=Math.max(1.18,1.1/aspect);
  for(const h of [left,right]){
   const appearance=h.wear.update(role);h.group.scale.setScalar(appearance.handScale);
   const neutral=Math.min(.68,.48*aspect),gripX=h.side*(kind==='badge'?.43:.61);
   h.group.position.set(T.MathUtils.lerp(h.side*neutral,gripX,reach)+insert*.28,T.MathUtils.lerp(-.84+bob,-.35,reach)-insert*.46,T.MathUtils.lerp(-.85,-depth+.13,reach)+insert*(depth-1.49));
   h.group.rotation.set(.35+reach*.35,0,h.side*(1.1-reach*.3));
   if(h.side===1&&pose?.zipHand){const q=pose.zipHand;h.group.position.lerp(new T.Vector3(.28+T.MathUtils.lerp(.57,-.57,pose.zip),-.38,-1.3),q);}
   for(const {joint,base} of h.fingers)joint.rotation.x=base+.38*(1-reach)+(pose?.grip||0)*.7;
   a.set(h.side*Math.min(.82,.65*aspect),-1.15,.12);b.copy(h.group.position);b.z+=.3;const delta=b.clone().sub(a);h.arm.position.copy(a).lerp(b,.5);h.arm.quaternion.setFromUnitVectors(up,delta.clone().normalize());h.arm.scale.set(appearance.armWidth,delta.length(),1.04*appearance.armWidth);
  }
  bag.visible=Boolean(pose?.bag);bag.position.set(.28,-1.65+(pose?.bag||0)*.87,-1.5);lid.rotation.x=-(pose?.open||0)*1.7;slider.position.x=T.MathUtils.lerp(.57,-.57,pose?.zip||0);
 }
 return {update,root};
}
