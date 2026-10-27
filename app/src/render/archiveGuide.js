import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {workwearMaterial} from './workwear.js';
// Filter complete disconnected accessory components; never cut skin by its color.
export function archiveGuideGeometry(geometry,map=null){
 const p=geometry.attributes.position,index=geometry.index;if(!p||!index)return geometry;
 const parents=Array.from({length:p.count},(_,i)=>i),find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));
 for(let i=0;i<index.count;i+=3){parents[find(index.getX(i+1))]=find(index.getX(i));parents[find(index.getX(i+2))]=find(index.getX(i));}
 const bounds=new Map();for(let i=0;i<index.count;i++){const v=index.getX(i),key=find(v);if(!bounds.has(key))bounds.set(key,new T.Box3());bounds.get(key).expandByPoint(new T.Vector3(p.getX(v),p.getY(v),p.getZ(v)));}
 let pixels=null,width=0,height=0;if(map?.image?.width){const c=document.createElement('canvas');width=c.width=map.image.width;height=c.height=map.image.height;const q=c.getContext('2d',{willReadFrequently:true});q.drawImage(map.image,0,0);pixels=q.getImageData(0,0,width,height).data;}const uv=geometry.attributes.uv;const red=v=>{if(!pixels||p.getY(v)<1.32)return false;const x=Math.max(0,Math.min(width-1,Math.floor(uv.getX(v)*width))),y=Math.max(0,Math.min(height-1,Math.floor(uv.getY(v)*height))),i=(y*width+x)*4;return pixels[i]>150&&pixels[i+1]<90&&pixels[i+2]<90;};
 const redParts=new Map();for(let v=0;v<p.count;v++){const k=find(v);if(!bounds.has(k))continue;if(!redParts.has(k))redParts.set(k,{all:0,red:0});const n=redParts.get(k);n.all++;if(red(v))n.red++;}
 const removed=new Set();for(const [key,b]of bounds){const cx=(b.min.x+b.max.x)/2;const sideHair=b.min.y>1.39&&b.max.y>1.5&&Math.abs(cx)>.1&&Math.max(Math.abs(b.min.x),Math.abs(b.max.x))>.13;const frontGlasses=b.min.y>1.4&&b.max.y<1.50&&b.min.z>.078;const temple=b.min.y>1.42&&b.max.y<1.49&&b.max.z>.075&&Math.abs(cx)>.08;if(sideHair||frontGlasses||temple||(redParts.get(key)?.red/redParts.get(key)?.all)>.35)removed.add(key);}
 const indices=[];for(let i=0;i<index.count;i+=3)if(!removed.has(find(index.getX(i))))indices.push(index.getX(i),index.getX(i+1),index.getX(i+2));
 const result=geometry.clone();result.setIndex(indices);const garment=new Float32Array(p.count);for(let v=0;v<p.count;v++)garment[v]=p.getY(v)<1&&Math.abs(p.getX(v))<.2?1:0;result.setAttribute('archiveGarment',new T.BufferAttribute(garment,1));result.userData.transient=true;result.computeBoundingSphere();return result;
}
export function archiveOutfitMaterial(source,color){
 const material=source.clone();material.userData.transient=true;material.roughness=.78;material.envMapIntensity=.6;material.specularIntensity=.25;material.specularColorMap=null;material.roughnessMap=null;material.normalScale?.set(.65,.65);
 if(material.map){material.map=material.map.clone();material.map.anisotropy=8;material.userData.ownedMap=true;}
 material.onBeforeCompile=shader=>{shader.uniforms.archiveCloth={value:new T.Color(color)};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float archiveHeight;attribute float archiveGarment;varying float garmentMask;').replace('#include <begin_vertex>','#include <begin_vertex>\narchiveHeight=position.y;garmentMask=archiveGarment;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 archiveCloth;varying float archiveHeight;varying float garmentMask;').replace('#include <map_fragment>','#include <map_fragment>\nfloat goldCloth=smoothstep(.45,.65,diffuseColor.g/max(diffuseColor.r,.001))*(1.-smoothstep(.25,.5,diffuseColor.b/max(diffuseColor.g,.001)))*smoothstep(.14,.35,diffuseColor.r);float blueCloth=smoothstep(1.05,1.22,diffuseColor.b/max(diffuseColor.r,.001))*(1.-smoothstep(.95,1.12,archiveHeight));diffuseColor.rgb=mix(diffuseColor.rgb,archiveCloth*(.5+.5*max(diffuseColor.r,diffuseColor.g)),goldCloth*smoothstep(.95,1.12,archiveHeight));blueCloth=max(garmentMask,max(blueCloth,goldCloth*(1.-smoothstep(.95,1.12,archiveHeight))));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.055,.065,.07)*(.6+.4*diffuseColor.b),blueCloth);float headTrim=smoothstep(1.38,1.42,archiveHeight)*smoothstep(1.2,1.6,min(diffuseColor.g,diffuseColor.b)/max(diffuseColor.r,.001));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.018,.02,.019),headTrim);');};material.customProgramCacheKey=()=> 'archive-professional-outfit-v2';return material;
}
export function styleArchiveGuide(root,p,h){
 const group=new T.Group();group.name='archive-guide-tailored-details';root.add(group);
 const cloth=p.archive?workwearMaterial(p.color,{repeat:5}):h.archiveMaterials?.uniform||workwearMaterial('#3e5359',{repeat:5}),cream=h.archiveMaterials?.shirt||workwearMaterial('#d4cfbc',{repeat:4}),brass=p.archiveVariant===2?h.mat('#63757a'):h.archiveMaterials?.brass||h.mat('#a48e61'),hair=h.mat('#24231f');if(p.archive||!h.archiveMaterials?.uniform)cloth.userData.transient=true;if(!h.archiveMaterials?.shirt)cream.userData.transient=true;
 const unit=h.geo('archive-tailored-unit',()=>new RoundedBoxGeometry(1,1,1,3,.035));
 const box=(parent,x,y,z,w,ht,d,mat)=>{const mesh=new T.Mesh(unit,mat);mesh.position.set(x,y,z);mesh.scale.set(w,ht,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const coat=new T.Mesh(h.geo('archive-fitted-coat-v2',()=>new T.LatheGeometry([[.43,3.02],[.44,3.1],[.4,3.3],[.34,3.52],[.33,3.76],[.39,4.03],[.405,4.12],[.29,4.23],[.16,4.26]].map(v=>new T.Vector2(...v)),48)),cloth);coat.scale.z=1.08;coat.castShadow=coat.receiveShadow=true;group.add(coat);
 box(group,0,4.06,.46,.18,.43,.045,cream);
 for(const side of [-1,1]){
  const panelShape=new T.Shape();panelShape.moveTo(side*.04,3.5);panelShape.lineTo(side*.4,3.5);panelShape.quadraticCurveTo(side*.4,3.95,side*.43,4.08);panelShape.lineTo(side*.3,4.23);panelShape.lineTo(side*.12,4.25);panelShape.lineTo(side*.035,3.92);panelShape.closePath();const panelGeometry=new T.ExtrudeGeometry(panelShape,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:3});panelGeometry.userData.transient=true;const panel=new T.Mesh(panelGeometry,cloth);panel.position.z=.44;panel.castShadow=true;group.add(panel);
  const shape=new T.Shape();shape.moveTo(side*.08,4.27);shape.lineTo(side*.32,4.13);shape.lineTo(side*.16,3.87);shape.lineTo(side*.035,4.05);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,steps:1});geo.userData.transient=true;const lapel=new T.Mesh(geo,cloth);lapel.position.z=.49;group.add(lapel);
  box(group,side*.25,3.42,.35,.24,.035,.05,cloth);for(const y of [3.17,3.53,3.87]){const button=new T.Mesh(h.geo('archive-tailored-button',()=>new T.SphereGeometry(.025,16,12)),brass);button.position.set(side*.06,y,.37);button.scale.z=.4;group.add(button);}
 }
 root.updateMatrixWorld(true);
 for(const side of ['Left','Right']){const points=['Arm','ForeArm','Hand'].map(n=>{const bone=root.getObjectByName('mixamorig'+side+n);return bone?root.worldToLocal(bone.getWorldPosition(new T.Vector3())):null;});if(points.every(Boolean)){const cap=new T.Mesh(h.geo('archive-shoulder-cap',()=>new T.SphereGeometry(.18,24,20)),cloth);cap.position.copy(points[0]);cap.scale.set(.9,.32,1.05);group.add(cap);}if(points.every(Boolean))for(let i=0;i<2;i++){const a=points[i],b=points[i+1].clone();if(i===1)b.lerp(a,.13);const radius=i===0?.17:.14,length=a.distanceTo(b)+.13,mesh=new T.Mesh(h.geo('archive-tailored-sleeve-'+i,()=>new T.CapsuleGeometry(radius,Math.max(.02,length-radius*2),10,24)),cloth);mesh.position.copy(a).lerp(b,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());mesh.castShadow=true;group.add(mesh);}}
 box(group,-.23,3.74,.5,.13,.2,.025,cream);box(group,-.23,3.78,.519,.09,.045,.008,brass);
 // Fit to the source eye landmarks, then attach to the head bone so breathing and head turns stay aligned.
 const head=root.getObjectByName('mixamorigHead'),body=root.children.find(c=>c.getObjectByName?.('mixamorigHead')),height=body?.scale.x||3.31,origin=body?.position||new T.Vector3(0,.009,0),spectacles=new T.Group();spectacles.name='archive-head-fitted-spectacles';group.add(spectacles);
 spectacles.position.set(origin.x,origin.y+1.452*height,origin.z+.105*height);
 const rimGeo=p.archiveVariant===2?h.geo('archive-square-spectacles',()=>{
  const frame=new T.Shape();frame.moveTo(-.108,-.075);frame.lineTo(.108,-.075);frame.lineTo(.108,.075);frame.lineTo(-.108,.075);frame.closePath();
  const hole=new T.Path();hole.moveTo(-.097,-.064);hole.lineTo(-.097,.064);hole.lineTo(.097,.064);hole.lineTo(.097,-.064);hole.closePath();frame.holes.push(hole);
  return new T.ExtrudeGeometry(frame,{depth:.009,bevelEnabled:false});
 }):h.geo('archive-fitted-spectacles',()=>new T.TorusGeometry(.106,.008,10,48));
 const lensMat=new T.MeshPhysicalMaterial({color:'#e1e7e1',transparent:true,opacity:.1,roughness:.08,metalness:0,depthWrite:false});lensMat.userData.transient=true;
 for(const side of [-1,1]){const rim=new T.Mesh(rimGeo,brass);rim.position.x=side*.043*height;rim.scale.y=.83;spectacles.add(rim);const lens=new T.Mesh(h.geo('archive-fitted-lens',()=>new T.CircleGeometry(.097,48)),lensMat);lens.position.set(rim.position.x,0,.003);lens.scale.y=.83;spectacles.add(lens);box(spectacles,side*.26,0,-.16,.014,.014,.34,brass);}
 box(spectacles,0,.014,.005,.075,.015,.015,brass);
 const bun=new T.Mesh(h.geo('archive-low-bun',()=>new T.SphereGeometry(.21,32,24)),hair);bun.name='archive-low-bun';bun.position.set(0,origin.y+1.49*height,origin.z-.13*height);bun.scale.set(1,.85,.75);if(p.archiveVariant!==2)group.add(bun);
 if(head){root.updateMatrixWorld(true);head.attach(spectacles);if(p.archiveVariant!==2)head.attach(bun);}
 return group;
}
