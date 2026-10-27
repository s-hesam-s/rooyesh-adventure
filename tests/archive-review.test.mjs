import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {newJourney,interact,travel,restoreJourney} from '../app/src/game/campaignState.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {doorJourneyPosition} from '../app/src/game/doorJourney.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildArchiveReviewScene} from '../app/src/render/archiveReviewScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
function helpers(){const mats=new Map(),geos=new Map();return {mat:c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c}));return mats.get(c);},geo:(k,f)=>{if(!geos.has(k))geos.set(k,f());return geos.get(k);},label:()=>{},plant:parent=>{const p=new T.Group();parent.add(p);return p;}};}
for(const choice of [0,2])test('archive side room '+choice+' has a reachable report and only its entrance as the return door',()=>{
 const node=nodes['repair-project-'+choice],layout=layoutFor(node);
 assert.equal(node.scene.archiveRoom,true);assert.equal(layout.gates.length,1);assert.equal(layout.gates[0].x,layout.spawn.x);assert.ok(walkable(layout.spawn,layout,10));
 for(const o of layout.objects){const target={x:o.x,y:o.y+40};assert.ok(walkable(target,layout,12));assert.ok(findPath(layout.spawn,target,layout).length);}
 for(const gate of layout.gates){assert.equal(walkable(gate,layout,10),false);assert.ok(walkable(gate.approach,layout,12));assert.ok(findPath(layout.spawn,gate,layout).length);assert.equal(gate.travelYaw,Math.PI);const end=doorJourneyPosition(gate.approach,gate,2.54);assert.ok(end.y>gate.y+40);assert.equal(end.facing,'down');}
 for(const b of layout.floorPlan.barriers)assert.equal(walkable({x:(b.a.x+b.b.x)/2,y:(b.a.y+b.b.y)/2},layout,10),false);
 const root=new T.Group();buildArchiveReviewScene(root,node,layout,helpers());batchArchitecture(root);
 for(const gate of layout.gates){assert.equal(gate.door.leaves.length,2);for(const leaf of gate.door.leaves)assert.ok(leaf.pivot.parent);gate.door.apply({open:1,handle:1});root.updateMatrixWorld(true);for(const leaf of gate.door.leaves)assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}
});
test('wrong archive rooms differ beyond color while keeping their library identity',()=>{
 const a=nodes['repair-project-0'].scene,b=nodes['repair-project-2'].scene;
 assert.equal(a.environment,'archive');assert.equal(b.environment,'archive');assert.notEqual(a.name,b.name);assert.notDeepEqual(a.stations,b.stations);assert.notDeepEqual(layoutFor(nodes['repair-project-0']).furniture,layoutFor(nodes['repair-project-2']).furniture);assert.notEqual(a.guide.name,b.guide.name);assert.notEqual(a.guide.archiveVariant,b.guide.archiveVariant);
});
test('both correction exits return beside the original wrong door without completing the business decision',()=>{
 for(const choice of [0,2])for(const exit of ['retry','briefing']){
  const start=interact(newJourney(),'evidence'),wrong=travel(start,'route-'+choice);
  assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,exit));
  const corrected=travel(interact(wrong,'review'),exit),arrival=archiveArrival(corrected,layoutFor(nodes.project));
  assert.equal(corrected.nodeId,'project');assert.equal(corrected.completed.includes('project'),false);assert.deepEqual(corrected.ledger,start.ledger);assert.deepEqual(restoreJourney(corrected),corrected);
  assert.equal(arrival.position.x,layoutFor(nodes.project).gates[choice].x);assert.equal(arrival.position.y,layoutFor(nodes.project).gates[choice].y+52);assert.equal(arrival.yaw,Math.PI);assert.ok(walkable(arrival.position,layoutFor(nodes.project),10));
 }
});
test('old side-room coordinates are invalidated while valid campaign events survive',()=>{
 const state=travel(interact(newJourney(),'evidence'),'route-0'),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 map.set(KEY,JSON.stringify({state,position:{x:640,y:820,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,state);
 const position=layoutFor(nodes[state.nodeId]).spawn;assert.ok(writeSave(storage,state,position));assert.deepEqual(readSave(storage).position,position);
});

test('return doors reveal enclosed hall geometry throughout the uncovered crossing',()=>{
 for(const choice of [0,2]){
  const node=nodes['repair-project-'+choice],layout=layoutFor(node),root=new T.Group();buildArchiveReviewScene(root,node,layout,helpers());root.updateMatrixWorld(true);
  const hall=root.getObjectByName('archive-return-hall-view');assert.ok(hall);let batched=0;hall.traverse(o=>{if(o.isInstancedMesh)batched++;});assert.ok(batched>0,'the destination is batched rather than duplicating thousands of draw objects');
  for(const gate of layout.gates)for(const elapsed of [1.6,1.75,2,2.45,2.54]){
   const player=doorJourneyPosition(gate.approach,gate,elapsed),eye=new T.Vector3(player.x*.1-64,4.8,player.y*.1-45);
   for(const offset of [[0,0],[.35,0],[-.35,0],[0,.2],[0,-.2]]){
    const ray=new T.Raycaster(eye,new T.Vector3(offset[0],offset[1],1).normalize(),.08,180);
    assert.ok(ray.intersectObject(hall,true).length,'uncovered background at '+choice+'/'+gate.exit.id+'/'+elapsed+'/'+offset);
   }
  }
 }
});
test('each independent archive side room has approximately one third of the main hall floor area',async()=>{
 const {buildArchiveScene}=await import('../app/src/render/archiveScene.js'),main=new T.Group();buildArchiveScene(main,nodes.project,layoutFor(nodes.project),helpers());main.updateMatrixWorld(true);
 const size=new T.Box3().setFromObject(main.getObjectByName('archive-main-floor')).getSize(new T.Vector3()),area=size.x*size.z;
 for(const choice of [0,2]){const n=nodes['repair-project-'+choice],root=new T.Group();buildArchiveReviewScene(root,n,layoutFor(n),helpers());root.updateMatrixWorld(true);const s=new T.Box3().setFromObject(root.getObjectByName('archive-side-room-floor')).getSize(new T.Vector3());assert.ok(s.x*s.z/area>.3&&s.x*s.z/area<.37);assert.equal(layoutFor(n).gates.length,1);}
});
test('correct-door placements vary across stages and journeys without mutating business choices',async()=>{
 const {routeSlots}=await import('../app/src/game/routePlacement.js'),main=Object.values(nodes).filter(n=>n.challenge),seen=new Set(),before=JSON.stringify(main.map(n=>n.exits));
 for(let journey=0;journey<40;journey++){let previous=-1;for(const n of main){const slots=routeSlots(n,'journey-'+journey),correct=n.exits.findIndex(e=>!e.next.startsWith('repair-'));assert.deepEqual([...slots].sort(),[0,1,2]);assert.notEqual(slots[correct],previous);seen.add(slots[correct]);previous=slots[correct];assert.deepEqual(routeSlots(n,'journey-'+journey),slots);}}
 assert.deepEqual([...seen].sort(),[0,1,2]);assert.equal(JSON.stringify(main.map(n=>n.exits)),before);
 assert.ok(new Set(Array.from({length:40},(_,i)=>routeSlots(nodes.project,'journey-'+i).join(','))).size>2);
});
test('randomized archive signs and returns agree with the same saved journey',async()=>{
 const {setRouteSeed}=await import('../app/src/game/routePlacement.js');
 try{for(let sample=0;sample<12;sample++){
  const state=newJourney('manager','route-save-'+sample);setRouteSeed(state.id);const initial=layoutFor(nodes.project),ordered=[...initial.gates].sort((a,b)=>a.x-b.x),sign=initial.objects.find(o=>o.object.kind==='wayfinding').object;
  assert.deepEqual(sign.routes.map(r=>r.id),ordered.map(g=>g.exit.id));for(const [i,g]of ordered.entries()){assert.match(sign.text,new RegExp(['سمت چپ','روبه‌رو','سمت راست'][i]+': '+g.exit.label));assert.ok(findPath(initial.spawn,g,initial).length);}
  const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};writeSave(storage,state,initial.spawn);const restored=readSave(storage).state;setRouteSeed(restored.id);assert.deepEqual(layoutFor(nodes.project).gates.map(g=>[g.exit.id,g.x,g.y]),initial.gates.map(g=>[g.exit.id,g.x,g.y]));
  for(const choice of [0,2]){const returned=travel(interact(travel(interact(state,'evidence'),'route-'+choice),'review'),'retry'),arrival=archiveArrival(returned,layoutFor(nodes.project)),door=initial.gates.find(g=>g.exit.id==='route-'+choice);assert.deepEqual(arrival.position,{x:door.x,y:door.y+52});}
 }}finally{setRouteSeed(null);}
});
test('the three archive guides have different geometry, physique, skin and gender presentation',async()=>{
 const {buildDistinctGuide}=await import('../app/src/render/distinctGuides.js'),{guideIdentities}=await import('../app/src/content/guideIdentities.js');
 const models=['nika','arzu','afshin'].map(id=>{const root=new T.Group(),actor=buildDistinctGuide(root,id,helpers());root.updateMatrixWorld(true);assert.ok(actor.head.isBone);assert.ok(root.getObjectByName('finger-0'));root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));return {id,root,actor,torso:new T.Box3().setFromObject(root.getObjectByName('torso-'+id)).getSize(new T.Vector3()),face:root.getObjectByName('face-'+id)};});
 assert.equal(new Set(models.map(m=>m.torso.x.toFixed(3))).size,3);assert.equal(new Set(models.map(m=>m.face.material.color.getHex())).size,3);assert.equal(new Set(Object.values(guideIdentities).map(p=>p.gender)).size,2);
 for(let i=1;i<models.length;i++)assert.notDeepEqual(models[0].face.geometry.attributes.position.array,models[i].face.geometry.attributes.position.array);
 assert.ok(models[2].root.getObjectByName('beard'));assert.equal(models[0].root.getObjectByName('beard'),undefined);assert.equal(models[1].root.getObjectByName('identity-head-fitted-glasses'),undefined);
 for(const model of [models[0],models[2]]){const glasses=model.root.getObjectByName('identity-head-fitted-glasses');assert.equal(glasses.parent,model.actor.head);const before=glasses.getWorldPosition(new T.Vector3());model.actor.head.rotation.y=.3;model.root.updateMatrixWorld(true);assert.ok(glasses.getWorldPosition(new T.Vector3()).distanceTo(before)>.01);}
});
