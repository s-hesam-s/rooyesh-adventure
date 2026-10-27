import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes,challenges} from '../app/src/content/campaign.js';
import {missionScenes} from '../app/src/content/missionScenes.js';
import {layoutFor,walkable} from '../app/src/game/world.js';
import {buildMissionScene} from '../app/src/render/missionScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {styleGuide} from '../app/src/render/actors.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {newJourney} from '../app/src/game/campaignState.js';
function harness(){
 const materials=new Map(),geometries=new Map(),boxGeo=new T.BoxGeometry(1,1,1);
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c}));return materials.get(c);};
 const geo=(key,fn)=>{if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key);};
 const mesh=(parent,x,y,z,w,ht,d,c)=>{const m=new T.Mesh(boxGeo,mat(c));m.position.set(x,y,z);m.scale.set(w,ht,d);parent.add(m);return m;};
 return {mat,geo,box:mesh,cylinder:(parent,x,y,z,r,ht,c)=>mesh(parent,x,y,z,r*2,ht,r*2,c),sphere:(parent,x,y,z,rx,ry,rz,c)=>mesh(parent,x,y,z,rx*2,ry*2,rz*2,c),beam:(parent,a,b,width,c)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),m=new T.Mesh(boxGeo,mat(c));m.position.copy(start).lerp(end,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize());m.scale.set(width,start.distanceTo(end),width);parent.add(m);return m;},label:()=>{},plant:parent=>{const g=new T.Group();parent.add(g);return g;},tree:()=>{},materials:{}};
}
test('all authored locations have distinct architecture, entry, route geometry, guide and station identity',()=>{
 const scenes=Object.values(missionScenes);assert.equal(scenes.length,20);
 for(const pick of [p=>p.environment,p=>JSON.stringify([p.entry,p.hub,p.targets]),p=>p.guide.id,p=>p.guide.name,p=>p.station,p=>p.evidenceName])assert.equal(new Set(scenes.map(pick)).size,20);
 const repairs=Object.values(nodes).filter(n=>n.repairFor);assert.equal(new Set(repairs.map(n=>n.scene.guide.name)).size,40);
 for(const n of repairs){assert.notDeepEqual(n.scene.entry,nodes[n.repairFor].scene.entry);assert.ok(n.objects.some(o=>o.kind==='guide'));}
});
for(const c of Object.values(nodes).filter(n=>n.scene))test(c.id+': architecture builds with finite geometry, bounded complexity and clear route centerlines',()=>{
 const node=nodes[c.id],layout=layoutFor(node),root=new T.Group(),h=harness();
 buildMissionScene(root,node,layout,h);root.updateMatrixWorld(true);
 let meshes=0;const solids=[];
 root.traverse(o=>{if(o.isMesh){meshes++;for(const n of o.matrixWorld.elements)assert.ok(Number.isFinite(n));const b=new T.Box3().setFromObject(o);if(!o.userData.dynamic&&b.min.y<5&&b.max.y>1&&b.max.y-b.min.y>.55)solids.push(b);}});
 assert.ok(meshes>25&&meshes<(node.scene.archiveRoom||node.scene.workshopRoom||node.scene.canalRoom||node.scene.postalRoom||node.scene.atriumRoom||node.scene.receptionRoom||node.scene.orchardRoom||node.scene.auditRoom||node.scene.bankRoom||node.scene.paymentRoom?6000:800),'scene primitive budget: '+meshes);
 for(const road of layout.roads)for(let i=1;i<road.length;i++){
  const a=road[i-1],b=road[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/15);
  for(let j=0;j<=steps;j++){
   const x=(a.x+(b.x-a.x)*j/steps)*.1-64,z=(a.y+(b.y-a.y)*j/steps)*.1-45;
   assert.ok(!solids.some(s=>x>s.min.x-.5&&x<s.max.x+.5&&z>s.min.z-.5&&z<s.max.z+.5),'blocked route at '+x+','+z);
  }
 }
 const before=meshes,result=batchArchitecture(root);assert.ok(result.batches>0);
 let after=0;root.traverse(o=>{if(o.isMesh)after++;});assert.ok(after<before);
 for(const gate of layout.gates){assert.ok(gate.bar.parent);assert.equal(gate.bar.isInstancedMesh,undefined);assert.equal(gate.bar.userData.dynamic,true);}
 const actor=new T.Group();styleGuide(actor,node.scene.guide,h);let details=0;actor.traverse(o=>{if(o.isMesh)details++;});assert.ok(details>7);
});
test('architecture batching preserves world transforms and keeps gate bars independently switchable',()=>{
 const root=new T.Group();root.position.set(3,2,4);
 const group=new T.Group();group.position.set(2,0,-1);root.add(group);
 const geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial();
 for(let i=0;i<5;i++){const mesh=new T.Mesh(geometry,material);mesh.position.x=i*2;group.add(mesh);}
 const bar=new T.Mesh(geometry,material);bar.userData.dynamic=true;group.add(bar);root.updateMatrixWorld(true);
 const original=group.children.slice(0,5).map(m=>m.matrixWorld.clone());
 const result=batchArchitecture(root);assert.equal(result.batches,1);const inst=root.children.find(o=>o.isInstancedMesh);root.updateMatrixWorld(true);
 for(let i=0;i<5;i++){const matrix=new T.Matrix4();inst.getMatrixAt(i,matrix);matrix.premultiply(inst.matrixWorld);for(let j=0;j<16;j++)assert.ok(Math.abs(matrix.elements[j]-original[i].elements[j])<1e-5);}
 bar.visible=false;assert.equal(bar.parent,group);assert.equal(inst.visible,true);
});
test('old saved progress survives new maps but old coordinates are discarded',()=>{
 const state=newJourney(),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 map.set(KEY,JSON.stringify({state,position:{x:640,y:790}}));assert.deepEqual(readSave(storage).state,state);assert.equal(readSave(storage).position,null);
 const entry=layoutFor(nodes.project).spawn;assert.ok(walkable(entry,layoutFor(nodes.project),10));
 assert.equal(writeSave(storage,state,entry),true);assert.deepEqual(readSave(storage).position,entry);
});