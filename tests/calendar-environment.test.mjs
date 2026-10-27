import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,interact,travel} from '../app/src/game/campaignState.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildCalendarScene} from '../app/src/render/calendarScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {doorJourneyPosition} from '../app/src/game/doorJourney.js';
function helpers(){const materials=new Map(),geometry=new Map();return {mat:color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color}));return materials.get(color);},geo:(key,fn)=>{if(!geometry.has(key))geometry.set(key,fn());return geometry.get(key);},plant:parent=>{const group=new T.Group();parent.add(group);return group;}};}
function windowState(){return travel(interact(newJourney('manager','calendar-test'),'evidence'),'route-1');}
test('calendar courtyard has a free floor, visible boundaries and a reachable neutral directory',()=>{
 const layout=layoutFor(nodes.window);for(const p of [{x:640,y:800},{x:640,y:560},{x:500,y:700},{x:760,y:470},{x:640,y:240}])assert.ok(walkable(p,layout,10));
 for(const barrier of layout.floorPlan.barriers)assert.equal(walkable({x:(barrier.a.x+barrier.b.x)/2,y:(barrier.a.y+barrier.b.y)/2},layout,10),false);
 const directory=layout.objects.find(o=>o.object.kind==='wayfinding');assert.deepEqual(directory.object.routes.map(r=>r.id),[...layout.gates].sort((a,b)=>a.x-b.x).map(g=>g.exit.id));assert.ok(directory.y<layout.hub.y);
 for(const gate of layout.gates)assert.ok(findPath(layout.spawn,gate,layout).length);for(const o of layout.objects.filter(o=>o.object.kind!=='wayfinding'))assert.ok(findPath(layout.spawn,{x:o.x,y:o.y+40},layout).length);
});
test('each calendar correction room is separate, smaller and has exactly one entrance and return',()=>{
 const main=new T.Group();buildCalendarScene(main,nodes.window,layoutFor(nodes.window),helpers());main.updateMatrixWorld(true);const mainSize=new T.Box3().setFromObject(main.getObjectByName('calendar-courtyard-floor')).getSize(new T.Vector3());
 const arrangements=[];
 for(const choice of [1,2]){const n=nodes['repair-window-'+choice],layout=layoutFor(n),root=new T.Group();buildCalendarScene(root,n,layout,helpers());root.updateMatrixWorld(true);const size=new T.Box3().setFromObject(root.getObjectByName('calendar-side-room-floor')).getSize(new T.Vector3());assert.ok(size.x*size.z/(mainSize.x*mainSize.z)>.3&&size.x*size.z/(mainSize.x*mainSize.z)<.37);assert.equal(layout.gates.length,1);assert.equal(layout.gates[0].exit.id,'retry');assert.ok(walkable(layout.spawn,layout,10));assert.ok(findPath(layout.spawn,layout.gates[0],layout).length);for(const o of layout.objects)assert.ok(findPath(layout.spawn,{x:o.x,y:o.y+40},layout).length);arrangements.push(layout.furniture);}
 assert.notDeepEqual(...arrangements);
});
test('calendar doors preserve their hinges and route-specific destination mapping after batching',()=>{
 try{for(const seed of ['calendar-a','calendar-b','calendar-c']){
  setRouteSeed(seed);const main=layoutFor(nodes.window);
  for(const id of ['window','repair-window-1','repair-window-2']){
   const node=nodes[id],layout=layoutFor(node),root=new T.Group();buildCalendarScene(root,node,layout,helpers());batchArchitecture(root);root.updateMatrixWorld(true);
   for(const g of layout.gates){assert.ok(g.bar.parent);assert.equal(g.bar.userData.dynamic,true);g.door.apply({open:1,handle:1});for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}
    if(id==='window'&&g.exit.id==='route-0'){assert.equal(g.destinationView.userData.destinationId,'ownerIdentity');assert.equal(g.destinationLink.targetDoorId,'');continue;}
    assert.ok(g.destinationView.parent);assert.equal(g.destinationView.visible,false);assert.equal(g.destinationView.userData.destinationId,g.exit.next);
    if(node.repairFor){const target=main.gates.find(t=>t.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});assert.equal(g.destinationLink.targetDoorId,target.exit.id);const end=doorJourneyPosition(g.approach,g,2.54);assert.ok(end.y>g.y+40);}
    else assert.deepEqual(g.destinationLink.targetCenter,{x:0,z:40});
   }
  }
 }}finally{setRouteSeed(null);}
});
test('both calendar errors preserve the financial ledger and return to their own selected main door',()=>{
 const base=windowState();assert.throws(()=>travel(base,'route-1'));
 for(const choice of [1,2]){const start=interact(base,'evidence'),wrong=travel(start,'route-'+choice);assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,'retry'));const returned=travel(interact(wrong,'review'),'retry'),layout=layoutFor(nodes.window),arrival=archiveArrival(returned,layout),gate=layout.gates.find(g=>g.exit.id==='route-'+choice);assert.equal(returned.nodeId,'window');assert.equal(returned.completed.includes('window'),false);assert.deepEqual(returned.ledger,start.ledger);assert.deepEqual(arrival.position,{x:gate.x,y:gate.y+52});assert.equal(arrival.yaw,Math.PI);assert.ok(walkable(arrival.position,layout,10));}
 assert.equal(travel(interact(base,'evidence'),'route-0').nodeId,'ownerIdentity');
});
test('calendar map upgrades discard only old coordinates and preserve valid saved business progress',()=>{
 for(const state of [windowState(),travel(interact(windowState(),'evidence'),'route-1')]){const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};map.set(KEY,JSON.stringify({state,position:{x:640,y:790,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,state);const spawn=layoutFor(nodes[state.nodeId]).spawn;assert.ok(writeSave(storage,state,spawn));assert.deepEqual(readSave(storage).position,spawn);}
});

test('calendar arcade capitals have physical stone supports directly underneath',()=>{
 const root=new T.Group();buildCalendarScene(root,nodes.window,layoutFor(nodes.window),helpers());root.updateMatrixWorld(true);
 const capitals=[],supports=[];root.traverse(o=>{if(!o.isMesh)return;const bounds=new T.Box3().setFromObject(o);if(o.name==='calendar-supported-capital')capitals.push(bounds);else if(!o.userData.dynamic)supports.push(bounds);});
 assert.equal(capitals.length,20);
 for(const cap of capitals){const c=cap.getCenter(new T.Vector3());assert.ok(supports.some(b=>b.min.x<=c.x&&b.max.x>=c.x&&b.min.z<=c.z&&b.max.z>=c.z&&b.min.y<cap.min.y&&b.max.y>=cap.min.y-.025),'A capital must touch its supporting masonry');}
});

test('the three calendar guides have separate identities from each other and the archive',async()=>{
 const {guideIdentities}=await import('../app/src/content/guideIdentities.js'),{buildDistinctGuide}=await import('../app/src/render/distinctGuides.js');
 const ids=['project','repair-project-0','repair-project-2','window','repair-window-1','repair-window-2'].map(id=>nodes[id].scene.guide.identity);assert.equal(new Set(ids).size,6);
 const silhouettes=[];
 for(const id of ids.slice(3)){const profile=guideIdentities[id],root=new T.Group(),actor=buildDistinctGuide(root,id,helpers());assert.ok(actor.head);assert.equal(root.getObjectsByProperty('name','identity-head-fitted-glasses').length,profile.glasses?1:0);assert.ok(!root.getObjectByName('headset'));silhouettes.push([profile.height,profile.shoulder,profile.waist,profile.skin,profile.hairStyle,profile.shirtSleeves??false]);}
 assert.equal(new Set(silhouettes.map(v=>JSON.stringify(v))).size,3);
});
