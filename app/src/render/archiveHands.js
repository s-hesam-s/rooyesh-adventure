import {createPlayerWear} from './playerAppearance.js';
import * as T from '../../vendor/three.module.js';
import {clone} from '../../vendor/addons/utils/SkeletonUtils.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {workwearMaterial} from './workwear.js';

export function extractHandGeometry(geometry,skeleton,side){
 const joints=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight,index=geometry.index;
 const selected=new Set(skeleton.bones.map((b,i)=>b.name.startsWith('mixamorig'+side+'Hand')?i:-1).filter(i=>i>=0)),indices=[];
 const weight=v=>{let total=0;for(let k=0;k<4;k++){const j=joints.getComponent(v,k);if(selected.has(j))total+=weights.getComponent(v,k);}return total;};
 for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);if(Math.min(weight(a),weight(b),weight(c))>.45)indices.push(a,b,c);}
 if(indices.length<300)throw Error('The human hand rig is incomplete');
 const result=geometry.clone();result.setIndex(indices);result.clearGroups();return result;
}
export function createArchiveHands(camera,source){
 const root=new T.Group();root.name='archive-natural-hand-rig';camera.add(root);
 const sleeve=workwearMaterial('#365b73',{repeat:3}),leather=workwearMaterial('#5e483a',{leather:true,repeat:3}),lining=new T.MeshStandardMaterial({color:'#191d1c',roughness:1}),metal=new T.MeshStandardMaterial({color:'#a99160',metalness:.8,roughness:.3}),edge=new T.MeshStandardMaterial({color:'#b7a58a',roughness:.85}),skinColor={value:new T.Color('#dab18f')};
 const rounded=new RoundedBoxGeometry(1,1,1,3,.08),up=new T.Vector3(0,1,0);
 const sleeveGeo=new T.LatheGeometry(Array.from({length:25},(_,i)=>{const t=i/24;return new T.Vector2(.112-.049*t+Math.sin(t*32)*.003*Math.sin(t*Math.PI),t-.5);}),28);
 function mesh(parent,g,m,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=false;o.receiveShadow=false;parent.add(o);return o;}
 const box=(parent,m,x,y,z,w,h,d)=>mesh(parent,rounded,m,x,y,z,w,h,d);
 function hand(side){
  const name=side<0?'Left':'Right',group=new T.Group(),body=clone(source);group.name='archive-'+name.toLowerCase()+'-hand';root.add(group);const normalized=new T.Group();group.add(normalized);normalized.add(body);
  body.traverse(o=>{if(o.isMesh){o.geometry=extractHandGeometry(o.geometry,o.skeleton,name);o.frustumCulled=false;o.castShadow=o.receiveShadow=false;const material=o.material.clone();material.metalness=0;material.roughness=.67;material.normalScale?.set(.35,.35);material.onBeforeCompile=shader=>{shader.uniforms.archiveSkinTone=skinColor;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 archiveSkinTone;').replace('#include <map_fragment>','#include <map_fragment>\nfloat skinLuminance=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=archiveSkinTone*(.63+.55*skinLuminance);');};material.customProgramCacheKey=()=> 'archive-natural-hands-v1';o.material=material;}});
  body.updateMatrixWorld(true);
  const bone=n=>body.getObjectByName('mixamorig'+name+'Hand'+n),wrist=bone(''),middle=bone('Middle1'),index=bone('Index1'),pinky=bone('Pinky1'),tip=bone('Middle4');
  const origin=wrist.getWorldPosition(new T.Vector3()),forward=middle.getWorldPosition(new T.Vector3()).sub(origin).normalize(),width=index.getWorldPosition(new T.Vector3()).sub(pinky.getWorldPosition(new T.Vector3())).normalize().multiplyScalar(-side),z=forward.negate(),y=new T.Vector3().crossVectors(z,width).normalize(),x=new T.Vector3().crossVectors(y,z).normalize();
  const frame=new T.Matrix4().makeBasis(x,y,z).setPosition(origin),inverse=frame.clone().invert(),length=tip.getWorldPosition(new T.Vector3()).distanceTo(origin),scale=.41/length;
  body.applyMatrix4(inverse);normalized.scale.setScalar(scale);body.updateMatrixWorld(true);
  const fingers=[];
  for(const digit of ['Thumb','Index','Middle','Ring','Pinky'])for(let i=1;i<=3;i++){
   const joint=bone(digit+i);if(!joint)continue;
   const axis=new T.Vector3(1,0,0),parentRotation=joint.parent.getWorldQuaternion(new T.Quaternion()).invert();
   axis.applyQuaternion(parentRotation).normalize();fingers.push({joint,rest:joint.quaternion.clone(),axis,digit,segment:i});
  }
  const arm=mesh(root,sleeveGeo,sleeve,0,0,0),cuff=mesh(root,new T.CylinderGeometry(.071,.072,.045,28),edge,0,0,0);
  const anchor=new T.Group();anchor.name='fitted-'+name.toLowerCase()+'-wrist-anchor';root.add(anchor);const wear=createPlayerWear(anchor,side);cuff.visible=false;
  const wristMaterial=new T.MeshStandardMaterial({color:'#dab18f',roughness:.68});const wristSurface=mesh(anchor,new T.CylinderGeometry(.071,.074,.18,40),wristMaterial,0,0,.07,1,.70,1);wristSurface.rotation.x=Math.PI/2;wristSurface.scale.set(1,1,.70);
  return {group,body,fingers,side,arm,cuff,wear,anchor,wristMaterial};
 }
 const left=hand(-1),right=hand(1),bag=new T.Group();bag.name='archive-open-backpack';root.add(bag);
 // Separate walls leave an actual cavity: the document is occluded by the bag, not hidden early.
 box(bag,leather,0,-.02,.22,1.18,.62,.065);box(bag,leather,0,-.02,-.22,1.18,.62,.065);
 for(const x of [-.56,.56])box(bag,leather,x,-.02,0,.065,.62,.44);
 box(bag,leather,0,-.31,0,1.18,.065,.44);box(bag,lining,0,-.27,0,1.04,.02,.36);
 for(const x of [-.55,.55])box(bag,edge,x,.29,0,.018,.035,.42);
 for(const z of [-.21,.21])box(bag,edge,0,.29,z,1.12,.035,.018);
 box(bag,leather,0,-.11,.26,.95,.33,.035);
 for(const x of [-.44,.44]){box(bag,edge,x,-.05,.29,.012,.47,.008);box(bag,metal,x,.11,.29,.065,.08,.02);}
 const lid=new T.Group();lid.position.set(0,.31,-.22);bag.add(lid);box(lid,leather,0,0,.22,1.2,.045,.46);
 const slider=box(bag,metal,.52,.33,.23,.07,.035,.05),pull=mesh(slider,new T.TorusGeometry(.025,.005,8,16),metal,0,.015,.035);pull.rotation.x=Math.PI/2;
 const teeth=new T.InstancedMesh(rounded,metal,44),dummy=new T.Object3D();for(let i=0;i<44;i++){dummy.position.set(-.53+i*.0246,.31,.215+(i%2?.006:-.006));dummy.scale.set(.009,.012,.016);dummy.updateMatrix();teeth.setMatrixAt(i,dummy.matrix);}bag.add(teeth);
 const shoulder=new T.Vector3(),wristPoint=new T.Vector3(),direction=new T.Vector3();
 function update({pose=null,time=0,moving=false,visible=true,aspect=1,shirt='#365b73',skin='#dab18f',bagColor='#343f54',role='manager',reduced=false}={}){
  root.visible=visible;if(!visible)return;sleeve.color.set(shirt);skinColor.value.set(skin);leather.color.set(bagColor);
  const lean=!reduced&&moving&&!pose?Math.sin(time*7)*.008:0;
  for(const h of [left,right]){
   const appearance=h.wear.update(role);h.group.scale.setScalar(appearance.handScale);
   const p=pose?(h.side<0?pose.left:pose.right):{position:[h.side*Math.min(.29,.35*aspect),-.67+lean,-.66],rotation:[.15,h.side*.12,h.side*.17],grip:.22};
   h.group.position.fromArray(p.position);h.group.rotation.set(...p.rotation,'YXZ');
   for(const f of h.fingers){const amount=(f.digit==='Thumb'?.38:.85)*(p.grip||0)*(f.segment===1?.65:1);f.joint.quaternion.copy(f.rest).premultiply(new T.Quaternion().setFromAxisAngle(f.axis,-amount));}
   shoulder.set(h.side*Math.min(.52,.55*aspect),-1.02,.14);wristPoint.copy(h.group.position);direction.copy(wristPoint).sub(shoulder);
   const axis=direction.clone().normalize(),armEnd=wristPoint.clone().addScaledVector(axis,-.15);
   h.arm.position.copy(shoulder).lerp(armEnd,.5);h.arm.quaternion.setFromUnitVectors(up,axis);h.arm.scale.set(appearance.armWidth,shoulder.distanceTo(armEnd),appearance.armWidth);
   const z=axis.clone().negate(),y=new T.Vector3(0,1,0).applyQuaternion(h.group.quaternion);y.addScaledVector(z,-y.dot(z));if(y.lengthSq()<.0001)y.set(0,1,0).addScaledVector(z,-z.y);y.normalize();const x=new T.Vector3().crossVectors(y,z).normalize();y.crossVectors(z,x).normalize();
   h.anchor.position.copy(wristPoint);h.anchor.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));h.anchor.scale.setScalar(appearance.handScale);h.wristMaterial.color.set(skin).multiplyScalar(.88);
   h.cuff.position.copy(wristPoint).lerp(shoulder,.025);h.cuff.quaternion.copy(h.arm.quaternion);
  }
  const appearance=left.wear.update(role);bag.scale.fromArray(appearance.bagScale);bag.visible=Boolean(pose?.bag.visible);if(pose){bag.position.fromArray(pose.bag.position);lid.rotation.x=-pose.bag.open*1.85;slider.position.x=.52-pose.bag.zip*1.04;}
 }
 return {root,update};
}