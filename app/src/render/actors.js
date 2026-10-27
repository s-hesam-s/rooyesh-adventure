import {buildDistinctGuide} from './distinctGuides.js';
import {archiveGuideGeometry,archiveOutfitMaterial,styleArchiveGuide} from './archiveGuide.js';
export {styleArchiveGuide} from './archiveGuide.js';
import * as T from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {clone} from '../../vendor/addons/utils/SkeletonUtils.js';

export function lowerGuideArms(root){
 root.updateMatrixWorld(true);
 for(const side of ['Left','Right']){
  const arm=root.getObjectByName('mixamorig'+side+'Arm'),elbow=root.getObjectByName('mixamorig'+side+'ForeArm');
  if(!arm||!elbow)throw Error('Guide skeleton is missing arm joints');
  const origin=arm.getWorldPosition(new T.Vector3()),end=elbow.getWorldPosition(new T.Vector3()),direction=end.sub(origin).normalize();
  const world=arm.getWorldQuaternion(new T.Quaternion()),parent=arm.parent.getWorldQuaternion(new T.Quaternion());
  const desired=new T.Vector3(side==='Left'?.13:-.13,-1,.08).normalize();
  arm.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromUnitVectors(direction,desired).multiply(world)));root.updateMatrixWorld(true);
 }
}
export function guideOutfitMaterial(source,color,minY=0,height=1.66){
 const material=source.clone();material.userData.transient=true;
 material.onBeforeCompile=shader=>{shader.uniforms.missionOutfit={value:new T.Color(color)};shader.uniforms.guideExtent={value:new T.Vector2(minY,height)};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 guideExtent;varying float vGuideHeight;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGuideHeight=(position.y-guideExtent.x)/guideExtent.y;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 missionOutfit;varying float vGuideHeight;').replace('#include <map_fragment>','#include <map_fragment>\nfloat yellowGarment=smoothstep(.72,.9,diffuseColor.g/max(diffuseColor.r,.001))*(1.-smoothstep(.4,.55,diffuseColor.b/max(diffuseColor.g,.001)))*smoothstep(.14,.35,diffuseColor.r);diffuseColor.rgb=mix(diffuseColor.rgb,missionOutfit*(.35+.65*max(diffuseColor.r,diffuseColor.g)),max(yellowGarment,1.-smoothstep(.38,.49,vGuideHeight)));');};
 material.customProgramCacheKey=()=> 'mission-guide-outfit-v1';return material;
}
export function styleGuide(root,p,h){
 if(p.identity)return buildDistinctGuide(root,p.identity,h).body;
 if((p.id==='guide-project'||p.archive))return styleArchiveGuide(root,p,h);
 const {box,cylinder,sphere}=h,a=p.color,dark='#35434b',light='#ddd7c5';
 const jacket=new T.Group();jacket.name='guide-accessories';root.add(jacket);
 for(const x of [-.62,.62]){box(root,x,3,.58,.38,.5,.09,dark);box(root,x,3.3,.65,.25,.06,.03,light);}
 for(let y=2.4;y<3.8;y+=.32)sphere(root,.12,y,.57,.045,.045,.04,light);
 box(root,-.4,3.55,.6,.3,.4,.06,light);
 const type=p.accessory;
 if(type==='helmet'||type==='hat'||type==='cap'||type==='visor'){
  cylinder(root,0,5.12,0,type==='hat'?1.05:.85,.12,type==='helmet'?'#d6b357':a);
  if(type!=='visor')sphere(root,0,5.37,0,.73,.38,.72,type==='helmet'?'#d6b357':a);
  if(type==='cap')box(root,0,5.13,.7,1.2,.1,.7,a);
 }
 if(type==='glasses'||type==='magnifier'){for(const x of [-.3,.3]){box(root,x,4.62,.65,.48,.32,.06,dark);box(root,x,4.62,.69,.36,.2,.02,'#93a9ab');}box(root,0,4.64,.68,.2,.06,.06,dark);}
 if(type==='scarf'){cylinder(root,0,3.98,0,.72,.3,light);box(root,.45,3.4,.65,.35,1.1,.1,light);}
 if(type==='headset'){for(const x of [-.85,.85])sphere(root,x,4.6,0,.16,.35,.3,dark);box(root,-.8,4.3,.5,.1,.1,.8,dark);}
 if(type==='magnifier'){cylinder(root,1.05,2.5,.3,.1,1.1,dark);sphere(root,1.05,3.1,.3,.4,.4,.07,'#9baead');}
 if(p.role.includes('ارسال')||p.role.includes('اسناد')){box(root,1,2.1,0,.7,1.2,.8,dark);box(root,1,2.3,.45,.3,.4,.04,light);}
 return jacket;
}
export async function loadActors(){
 const asset=await new GLTFLoader().loadAsync(new URL('../../assets/characters/guide.gltf',import.meta.url).href);
 lowerGuideArms(asset.scene);
 asset.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;if(o.material){o.material.metalness=0;o.material.roughness=.86;o.material.envMapIntensity=.65;}}});
 const bounds=new T.Box3().setFromObject(asset.scene),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const height=5.5/size.y;
 function guide(parent,x,z,profile=null,h=null){
  if(profile?.identity&&h){const root=new T.Group();root.position.set(x,-.07,z);root.name=profile.id;parent.add(root);return buildDistinctGuide(root,profile.identity,h);}
  const root=new T.Group(),body=clone(asset.scene);body.scale.setScalar(height);body.position.set(-center.x*height,-bounds.min.y*height,-center.z*height);root.add(body);root.position.set(x,-.07,z);parent.add(root);
  if(profile&&h){body.traverse(o=>{if(o.isMesh&&o.material){const materials=Array.isArray(o.material)?o.material:[o.material];o.geometry.computeBoundingBox();const extent=o.geometry.boundingBox;const mapped=materials.map(material=>(profile.id==='guide-project'||profile.archive)?archiveOutfitMaterial(material,profile.color):guideOutfitMaterial(material,profile.color,extent.min.y,extent.max.y-extent.min.y));if((profile.id==='guide-project'||profile.archive))o.geometry=archiveGuideGeometry(o.geometry,materials[0].map);o.material=Array.isArray(o.material)?mapped:mapped[0];}});styleGuide(root,profile,h);root.scale.set(profile.width,profile.height/5.5,profile.width);root.name=profile.id;}
  const head=(profile?.id==='guide-project'||profile?.archive)?body.getObjectByName('mixamorigHead'):null;return {root,body,head,headRest:head?.rotation.clone()};
 }
 function update(actor,time,dt,eye,reduced=false){
  const distance=Math.hypot(eye.x-actor.root.position.x,eye.z-actor.root.position.z),target=distance<18?T.MathUtils.clamp(Math.atan2(eye.x-actor.root.position.x,eye.z-actor.root.position.z),-.65,.65):0;
  actor.root.rotation.y=T.MathUtils.damp(actor.root.rotation.y,target,3,dt);
  if(actor.head){actor.head.rotation.x=actor.headRest.x+(reduced?0:Math.sin(time*.9)*.018);actor.head.rotation.y=actor.headRest.y+(reduced?0:Math.sin(time*.55)*.035);}
  actor.body.scale.y=(actor.baseScale??height)*(1+(reduced?0:Math.sin(time*1.7)*.0025));
 }
 return {guide,update,handSource:asset.scene};
}
