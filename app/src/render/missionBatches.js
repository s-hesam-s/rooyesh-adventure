import * as T from '../../vendor/three.module.js';
export function batchArchitecture(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
 root.traverse(m=>{
  if(!m.isMesh||m.isSkinnedMesh||m.isInstancedMesh||m.userData.dynamic||m.geometry.userData.transient)return;
  for(let p=m.parent;p&&p!==root;p=p.parent)if(p.isLOD||p.userData.staticPlant)return;
  const key=m.geometry.uuid+':'+(Array.isArray(m.material)?m.material.map(x=>x.uuid).join(','):m.material.uuid);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
 });
 let removed=0,batches=0;
 for(const meshes of groups.values()){
  if(meshes.length<3)continue;const first=meshes[0],batch=new T.InstancedMesh(first.geometry,first.material,meshes.length);
  meshes.forEach((m,i)=>batch.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld)));
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.computeBoundingSphere();batch.name='mission-architecture-batch';root.add(batch);
  meshes.forEach(m=>m.removeFromParent());removed+=meshes.length;batches++;
 }
 return {removed,batches};
}