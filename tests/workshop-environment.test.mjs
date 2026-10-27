import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,interact,travel} from '../app/src/game/campaignState.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildWorkshopScene} from '../app/src/render/workshopScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
function helpers(){const materials=new Map(),geometry=new Map();return {mat:c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c}));return materials.get(c);},geo:(k,f)=>{if(!geometry.has(k))geometry.set(k,f());return geometry.get(k);}};}
function ownerState(){let state=newJourney('manager','workshop-test');state=travel(interact(state,'evidence'),'route-1');return travel(interact(state,'evidence'),'route-0');}
test('workshop routes stay reachable around visible equipment and the neutral directory matches saved door placement',()=>{
 try{for(const seed of ['workshop-a','workshop-b','workshop-c']){setRouteSeed(seed);for(const id of ['ownerIdentity','repair-ownerIdentity-0','repair-ownerIdentity-1']){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,10));for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects.filter(o=>o.object.kind!=='wayfinding'))assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length);for(const f of l.fixtures)assert.equal(walkable({x:640+f.x*10,y:450+f.z*10},l,10),false);const directory=l.objects.find(o=>o.object.kind==='wayfinding');if(directory)assert.deepEqual(directory.object.routes.map(r=>r.id),[...l.gates].sort((a,b)=>a.x-b.x).map(g=>g.exit.id));}}}finally{setRouteSeed(null);}
});
test('workshop side rooms are independent, about one third of the main floor and use one shared entry-return door',()=>{
 const areas=[];for(const id of ['ownerIdentity','repair-ownerIdentity-0','repair-ownerIdentity-1']){const node=nodes[id],root=new T.Group(),l=layoutFor(node);buildWorkshopScene(root,node,l,helpers());root.updateMatrixWorld(true);const size=new T.Box3().setFromObject(root.getObjectByName('workshop-floor')).getSize(new T.Vector3());areas.push(size.x*size.z);if(node.repairFor){assert.equal(l.gates.length,1);assert.equal(l.gates[0].exit.id,'retry');}}
 for(const a of areas.slice(1))assert.ok(a/areas[0]>.3&&a/areas[0]<.38);assert.notDeepEqual(layoutFor(nodes['repair-ownerIdentity-0']).fixtures,layoutFor(nodes['repair-ownerIdentity-1']).fixtures);
});
test('workshop door hinges survive batching and both reverse destinations lead to the chosen physical main door',()=>{
 try{for(const seed of ['industrial-a','industrial-b']){setRouteSeed(seed);for(const id of ['ownerIdentity','repair-ownerIdentity-0','repair-ownerIdentity-1']){const n=nodes[id],l=layoutFor(n),root=new T.Group();buildWorkshopScene(root,n,l,helpers());batchArchitecture(root);for(const g of l.gates){g.door.apply({open:1,handle:1});assert.ok(g.bar.parent);for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(n.repairFor){const main=layoutFor(nodes.ownerIdentity).gates.find(q=>q.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(main.x-640)*.1,z:(main.y-450)*.1});assert.equal(g.destinationLink.targetDoorId,main.exit.id);}}}}}finally{setRouteSeed(null);}
});
test('wrong company and wrong legal route cannot mutate the ledger, and report return cannot complete the identity decision',()=>{
 const base=ownerState();assert.equal(base.role,'owner');const start=interact(base,'evidence');for(const choice of [0,1]){const wrong=travel(start,'route-'+choice);assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,'retry'));const returned=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.ownerIdentity),gate=l.gates.find(g=>g.exit.id==='route-'+choice);assert.equal(returned.nodeId,'ownerIdentity');assert.equal(returned.completed.includes('ownerIdentity'),false);assert.deepEqual(returned.ledger,start.ledger);assert.deepEqual(archiveArrival(returned,l),{position:{x:gate.x,y:gate.y+52},yaw:Math.PI});}
 const correct=travel(start,'route-2');assert.equal(correct.nodeId,'ownerAmount');assert.equal(correct.ledger.ownerIdentity,true);assert.deepEqual(correct.ledger.ownerReceipts,[]);assert.equal(correct.ledger.ownerSent,false);
});
test('three workshop guides have new fictional identities, builds, faces and job-appropriate outfits',()=>{
 const ids=['ownerIdentity','repair-ownerIdentity-0','repair-ownerIdentity-1'].map(id=>nodes[id].scene.guide.identity);assert.equal(new Set(ids).size,3);for(const id of ids)assert.ok(!['nika','arzu','afshin','rana','elnaz','ehsan'].includes(id));assert.equal(new Set(ids.map(id=>guideIdentities[id].skin)).size,3);assert.equal(new Set(ids.map(id=>guideIdentities[id].shoulder)).size,3);assert.equal(new Set(ids.map(id=>guideIdentities[id].gender)).size,2);
});
test('workshop map version invalidates obsolete coordinates without discarding valid saved progression',()=>{
 const state=ownerState(),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};map.set(KEY,JSON.stringify({state,position:{x:460,y:800,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,state);const spawn=layoutFor(nodes.ownerIdentity).spawn;assert.ok(writeSave(storage,state,spawn));assert.deepEqual(readSave(storage).position,spawn);
});

test('press controls, hydraulic hoses and drawing board have physical supporting connections',()=>{
 const root=new T.Group();buildWorkshopScene(root,nodes.ownerIdentity,layoutFor(nodes.ownerIdentity),helpers());root.updateMatrixWorld(true);
 const bounds=name=>{const o=root.getObjectByName(name);assert.ok(o,name);return new T.Box3().setFromObject(o);};
 for(const [a,b]of [['press-base','press-console-foot'],['press-console-foot','press-control-pedestal'],['press-control-pedestal','press-control-console'],['press-control-console','press-control-face'],['press-base','press-power-pack'],['press-base','press-bed-riser'],['press-bed-riser','press-bed-plate']])assert.ok(bounds(a).intersectsBox(bounds(b)),a+' must touch '+b);
 root.traverse(o=>{if(o.name==='press-console-button')assert.ok(new T.Box3().setFromObject(o).intersectsBox(bounds('press-control-face')));});
 for(let i=0;i<2;i++){const hose=root.getObjectByName('press-hydraulic-hose-'+i),path=hose.geometry.parameters.path;assert.ok(bounds('press-ram-fitting-'+i).distanceToPoint(hose.localToWorld(path.getPoint(0)))<.002);assert.ok(bounds('press-pump-fitting-'+i).distanceToPoint(hose.localToWorld(path.getPoint(1)))<.002);}
 const rails=root.getObjectsByProperty('name','assembly-glazing-rail').map(o=>new T.Box3().setFromObject(o));root.traverse(o=>{if(o.name==='assembly-roof-pane')for(const side of [-1,1]){const edge=o.localToWorld(new T.Vector3(0,0,side*.5));assert.ok(rails.some(b=>b.distanceToPoint(edge)<.002),'Glazing edges must sit on supporting rails');}});
 root.traverse(o=>{if(o.name==='assembly-board-post'){const b=new T.Box3().setFromObject(o);assert.ok(b.intersectsBox(bounds('assembly-board-backing')));assert.ok(root.getObjectsByProperty('name','assembly-board-foot').some(f=>new T.Box3().setFromObject(f).intersectsBox(b)));}});
});

test('electrical conduits terminate in wall-mounted cabinets and junctions in all three workshop rooms',()=>{
 for(const id of ['ownerIdentity','repair-ownerIdentity-0','repair-ownerIdentity-1']){
  const root=new T.Group();buildWorkshopScene(root,nodes[id],layoutFor(nodes[id]),helpers());root.updateMatrixWorld(true);const wall=new T.Box3().setFromObject(root.getObjectByName('workshop-side-wall-left')),services=root.getObjectByName('workshop-electrical-services'),bounds=o=>new T.Box3().setFromObject(o);
  const branches=services.children.filter(o=>o.name.startsWith('service-branch-'));assert.equal(branches.length,3);
  for(const pipe of branches){const z=pipe.name.slice('service-branch-'.length),path=pipe.geometry.parameters.path,cabinet=services.getObjectByName('service-cabinet-'+z),junction=services.getObjectByName('service-junction-'+z);assert.ok(bounds(cabinet).intersectsBox(wall));assert.ok(bounds(cabinet).distanceToPoint(pipe.localToWorld(path.getPoint(0)))<.002);assert.ok(bounds(junction).distanceToPoint(pipe.localToWorld(path.getPoint(1)))<.002);}
  for(const o of services.children.filter(o=>o.name==='service-wall-bracket'))assert.ok(bounds(o).intersectsBox(wall)); const windows=[];root.traverse(o=>{if(o.name.startsWith('workshop-window-left-'))windows.push(bounds(o));});for(const pipe of branches){const b=bounds(pipe);assert.ok(windows.every(w=>b.max.z<w.min.z||b.min.z>w.max.z),'Vertical electrical runs must avoid window openings');}const notice=root.getObjectByName('workshop-notice-board');if(notice)for(const cabinet of services.children.filter(o=>o.name.startsWith('service-cabinet-')&&!o.name.startsWith('service-cabinet-mount-')&&!o.name.endsWith('-label')&&!o.name.endsWith('-handle')))assert.ok(!bounds(cabinet).intersectsBox(bounds(notice)));if(notice)for(const mount of root.getObjectsByProperty('name','workshop-notice-board-mount')){assert.ok(bounds(mount).intersectsBox(wall));assert.ok(bounds(mount).intersectsBox(bounds(notice)));}
 }
});
