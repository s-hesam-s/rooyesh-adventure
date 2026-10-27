import {batchArchitecture} from './missionBatches.js';
import * as T from '../../vendor/three.module.js';
import {buildArchiveScene,buildArchiveFurniture} from './archiveScene.js';
import {layoutFor} from '../game/world.js';
import {nodes} from '../content/campaign.js';

// The destination hall remains visible while the player crosses the return threshold.
export function buildArchiveHallView(parent,variant,h){
 const hall=new T.Group();hall.name='archive-return-hall-view';
 const layout=layoutFor(nodes.project),door=layout.gates.find(g=>g.exit.id==='route-'+variant);
 hall.position.set(-(door.x-640)*.1,0,40-(door.y-450)*.1);
 parent.add(hall);
 buildArchiveScene(hall,nodes.project,layout,h,{hallView:true});
 const lintel=new T.Mesh(h.geo('archive-return-hall-lintel',()=>new T.BoxGeometry(22,3.4,1.5)),h.archiveMaterials?.plaster||h.mat('#ddd4bf'));
 lintel.position.set(0,18.3,47);lintel.castShadow=lintel.receiveShadow=true;hall.add(lintel);
 for(const entry of layout.objects.filter(o=>o.object.kind!=='wayfinding')){
  const desk=new T.Group();desk.position.set((entry.x-640)*.1,0,(entry.y-450)*.1);hall.add(desk);
  buildArchiveFurniture(desk,entry.object.kind==='guide',h,h.archiveMaterials||{});
 }
 // Keep the destination on its side of the doorway without overlapping the side room.
 hall.updateMatrixWorld(true);
 const hidden=[];hall.traverse(object=>{
  if(!object.isMesh)return;
  const bounds=new T.Box3().setFromObject(object);
  if(bounds.max.z<=40.6){hidden.push(object);return;}
  if(bounds.min.z<40.6){
   const geometry=object.geometry.clone(),positions=geometry.attributes.position,inverse=object.matrixWorld.clone().invert(),point=new T.Vector3();
   for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);point.z=Math.max(40.6,point.z);point.applyMatrix4(inverse);positions.setXYZ(i,point.x,point.y,point.z);}
   geometry.userData={...geometry.userData,transient:true};geometry.computeBoundingBox();geometry.computeBoundingSphere();object.geometry=geometry;
  }
 });
 for(const object of hidden){if(object.material?.userData.transient){if(object.material.userData.ownedMap)object.material.map?.dispose();object.material.dispose();}object.removeFromParent();}
 const threshold=new T.Plane(new T.Vector3(0,0,1),-40.6),materials=new Map();
 hall.traverse(object=>{
  if(!object.isMesh)return;
  const clipped=source=>{
   if(materials.has(source))return materials.get(source);
   const material=source.userData.transient?source:source.clone();
   if(material!==source){material.userData.transient=true;material.userData.ownedMap=false;}
   material.clippingPlanes=[threshold];material.clipShadows=true;materials.set(source,material);return material;
  };
  object.material=Array.isArray(object.material)?object.material.map(clipped):clipped(object.material);
 });
 batchArchitecture(hall);hall.traverse(o=>{if(o.isMesh)o.userData.destinationView=true;});
 return hall;
}
