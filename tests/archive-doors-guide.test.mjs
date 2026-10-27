import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {sourceRig} from './helpers/guideRig.mjs';
import {archiveGuideGeometry,styleArchiveGuide} from '../app/src/render/archiveGuide.js';
import {buildArchiveDoors} from '../app/src/render/archiveDoors.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {doorJourneyTiming,doorJourneyPose,doorJourneyPosition,doorJourneyCues} from '../app/src/game/doorJourney.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,travel} from '../app/src/game/campaignState.js';
function helpers(){const materials=new Map(),geometries=new Map();return {mat:c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c}));return materials.get(c);},geo:(k,f)=>{if(!geometries.has(k))geometries.set(k,f());return geometries.get(k);},label:()=>{}};}
test('each archive choice has two hinged leaves and handle geometry that survives batching',()=>{
 const root=new T.Group(),layout=layoutFor(nodes.project);buildArchiveDoors(root,layout,helpers());const closed=layout.gates.map(g=>g.door.leaves.map(l=>new T.Box3().setFromObject(l.pivot)));batchArchitecture(root);
 for(const [i,g]of layout.gates.entries()){assert.equal(g.door.leaves.length,2);assert.equal(g.door.handles.length,2);assert.ok(g.bar.parent);for(const l of g.door.leaves){assert.ok(l.pivot.parent);assert.ok(l.pivot.children.length>8);}
 g.door.apply(doorJourneyPose(1.65));root.updateMatrixWorld(true);for(const [j,l]of g.door.leaves.entries()){assert.ok(Math.abs(l.pivot.rotation.y)>1.5);const open=new T.Box3().setFromObject(l.pivot);assert.ok(open.min.z<closed[i][j].min.z-3);}
 g.door.apply(doorJourneyPose(0));for(const l of g.door.leaves)assert.equal(Math.abs(l.pivot.rotation.y),0);}
});
test('doors block free walking while their interaction zone remains accessible',()=>{
 const layout=layoutFor(nodes.project);for(const g of layout.gates){assert.equal(walkable(g,layout,10),false);assert.ok(walkable({x:g.x,y:g.y+22},layout,10));const path=findPath(layout.spawn,g,layout);assert.ok(path.length);assert.deepEqual(path.at(-1),g.approach);}
 assert.equal(walkable({x:480,y:190},layout,10),false,'the visible partition is solid');
 assert.throws(()=>travel(newJourney(),nodes.project.exits[0].id),'a missing document cannot start a door transition');
});
test('opening precedes crossing and the chapter swap is fully covered by the fade',()=>{
 const start={x:640,y:188},gate={x:640,y:160};assert.equal(doorJourneyPose(0).open,0);assert.equal(doorJourneyPose(1.75).open,1);assert.equal(doorJourneyPose(1.7).walk,0);assert.equal(doorJourneyPosition(start,gate,.48).y,175);assert.ok(doorJourneyPosition(start,gate,2.54).y<gate.y);for(const reduced of [false,true]){const t=doorJourneyTiming(reduced);assert.equal(doorJourneyPose(t.swap,reduced).fade,1);assert.equal(doorJourneyPose(t.end,reduced).fade,0);assert.ok(doorJourneyPose(t.end,reduced).complete);}
});
test('door cues are ordered once and reduced motion skips the reaching and forced walk',()=>{
 const cues=[];for(let t=0;t<3.4;t+=.17)cues.push(...doorJourneyCues(t,t+.17));assert.deepEqual(cues,['latch','swing','step','step']);const p=doorJourneyPose(.35,true);assert.equal(p.approach,0);assert.equal(p.walk,0);assert.deepEqual(doorJourneyCues(0,1,true),[]);for(let t=0;t<3.5;t+=.01){const p=doorJourneyPose(t);assert.ok([p.open,p.handle,p.approach,p.walk,p.fade].every(n=>Number.isFinite(n)&&n>=0&&n<=1));}
});
test('archive outfit has source-mesh garment masks without changing the shared human asset',()=>{
 const source=sourceRig();let mesh;source.traverse(o=>{if(o.isMesh)mesh=o;});const count=mesh.geometry.index.count,geometry=archiveGuideGeometry(mesh.geometry);assert.ok(geometry.index.count<count);assert.equal(mesh.geometry.index.count,count);assert.equal(mesh.geometry.attributes.archiveGarment,undefined);const p=geometry.attributes.position,m=geometry.attributes.archiveGarment;for(let i=0;i<p.count;i++){if(p.getY(i)<.9&&Math.abs(p.getX(i))<.15)assert.equal(m.getX(i),1);if(p.getY(i)>1.3)assert.equal(m.getX(i),0);}
});
test('spectacles are fitted to the eye landmarks and follow the actual animated head',()=>{
 const root=new T.Group(),body=sourceRig();body.scale.setScalar(3.31);body.position.y=.009;root.add(body);const h=helpers();styleArchiveGuide(root,nodes.project.scene.guide,h);root.updateMatrixWorld(true);const head=root.getObjectByName('mixamorigHead'),glasses=root.getObjectByName('archive-head-fitted-spectacles');assert.equal(glasses.parent,head);const before=glasses.getWorldPosition(new T.Vector3());assert.ok(Math.abs(before.y-(.009+1.452*3.31))<.001);const local=glasses.matrix.clone();head.rotation.y+=.35;head.rotation.x+=.12;body.scale.y*=1.0025;root.updateMatrixWorld(true);const after=glasses.getWorldPosition(new T.Vector3());assert.ok(after.distanceTo(before)>.01);assert.deepEqual(glasses.matrix.elements,local.elements);assert.equal(root.getObjectByName('archive-low-bun').parent,head);
});

test('old archive coordinates are invalidated without losing campaign progress',async()=>{const {readSave,KEY}=await import('../app/src/game/campaignStorage.js');const state=newJourney();const storage={getItem:k=>k===KEY?JSON.stringify({state,position:{x:640,y:145,layout:2}}):null};const restored=readSave(storage);assert.deepEqual(restored.state,state);assert.equal(restored.position,null);});
