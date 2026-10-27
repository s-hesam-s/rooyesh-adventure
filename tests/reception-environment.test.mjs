import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,interact,travel} from '../app/src/game/campaignState.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildReceptionScene} from '../app/src/render/receptionScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
const ids=['naturalIdentity','repair-naturalIdentity-1','repair-naturalIdentity-2'];
function state(){let s=newJourney('manager','reception-test');for(const route of ['route-1','route-0','route-2','route-1','route-0','route-1'])s=travel(interact(s,'evidence'),route);return s;}
function scene(id,l=layoutFor(nodes[id])){const root=new T.Group(),cache=new Map(),material=new T.MeshStandardMaterial();buildReceptionScene(root,nodes[id],l,{mat:()=>material,geo:(k,fn)=>{if(!cache.has(k))cache.set(k,fn());return cache.get(k);}});root.updateMatrixWorld(true);return root;}
const bounds=o=>new T.Box3().setFromObject(o),near=(a,b)=>bounds(a).expandByScalar(.006).intersectsBox(bounds(b));
test('reception furniture blocks walking while every station and physical gate stays reachable with body clearance',()=>{
 for(const id of ids){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,12));for(const f of l.fixtures)assert.equal(walkable({x:640+f.x*10,y:450+f.z*10},l,12),false);for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects.filter(o=>o.object.kind!=='wayfinding'))assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length,id+' '+o.object.id);}
 const l=layoutFor(nodes.naturalIdentity);for(const g of l.gates){for(let y=l.hub.y;y>=g.approach.y;y-=5)assert.ok(walkable({x:g.x,y},l,12),g.exit.id+' '+y);for(let x=Math.min(l.hub.x,g.x);x<=Math.max(l.hub.x,g.x);x+=5)assert.ok(walkable({x,y:l.hub.y},l,12));}
});
test('identity and pending-status review offices have independent equipment, one shared entry-return and smaller floors',()=>{
 const main=bounds(scene(ids[0]).getObjectByName('reception-floor')).getSize(new T.Vector3());for(const id of ids.slice(1)){const root=scene(id),s=bounds(root.getObjectByName('reception-floor')).getSize(new T.Vector3());assert.ok(s.x*s.z/(main.x*main.z)>.3&&s.x*s.z/(main.x*main.z)<.4);assert.equal(layoutFor(nodes[id]).gates.length,1);}assert.ok(scene(ids[1]).getObjectByName('reception-fixture-comparison'));assert.ok(!scene(ids[1]).getObjectByName('reception-fixture-status'));assert.ok(scene(ids[2]).getObjectByName('reception-fixture-status'));
});
test('scanner rests on its desk, glazing meets its base and raised lid is attached at the two hinge axes',()=>{
 for(const id of [ids[0],ids[2]]){const root=scene(id),base=root.getObjectByName('reception-scanner-base'),lid=root.getObjectByName('reception-scanner-lid'),shell=root.getObjectByName('reception-scanner-lid-shell');assert.ok(near(base,root.getObjectByName('reception-desktop'))||base.parent.children.some(o=>o.name==='reception-desktop'&&near(base,o)));const p=lid.getWorldPosition(new T.Vector3());for(const hinge of root.getObjectsByProperty('name','reception-scanner-hinge')){assert.ok(near(hinge,base));assert.ok(near(hinge,shell));assert.ok(Math.abs(hinge.getWorldPosition(new T.Vector3()).y-p.y)<.001);}assert.ok(Math.abs(lid.rotation.x)>1);}
});
test('document camera has a continuous support from desk to mast, arm, head and downward lens',()=>{
 const root=scene(ids[0]),camera=root.getObjectByName('reception-fixture-camera');for(const [a,b]of [['reception-camera-base','reception-desktop'],['reception-camera-base','reception-camera-mast'],['reception-camera-mast','reception-camera-arm'],['reception-camera-arm','reception-camera-head'],['reception-camera-head','reception-camera-lens-ring'],['reception-camera-lens-ring','reception-camera-lens']])assert.ok(near(camera.getObjectByName(a),camera.getObjectByName(b)),a+' '+b);const lens=camera.getObjectByName('reception-camera-lens').getWorldPosition(new T.Vector3()),card=camera.getObjectByName('reception-id-card').getWorldPosition(new T.Vector3());assert.ok(Math.hypot(lens.x-card.x,lens.z-card.z)<.2);assert.ok(lens.y>card.y);
});
test('recessed lights connect to ceiling and waiting chair arms and backs connect to their supports',()=>{
 for(const id of ids){const root=scene(id);for(const frame of root.getObjectsByProperty('name','reception-light-frame'))assert.ok(near(frame,root.getObjectByName('reception-ceiling')));for(const diffuser of root.getObjectsByProperty('name','reception-light-diffuser'))assert.ok(root.getObjectsByProperty('name','reception-light-frame').some(o=>near(o,diffuser)));for(const arm of root.getObjectsByProperty('name','reception-seat-arm'))assert.ok(arm.parent.children.some(o=>o.name==='reception-seat-arm-post'&&near(o,arm)));for(const back of root.getObjectsByProperty('name','reception-seat-back'))assert.ok(back.parent.children.some(o=>o.name==='reception-seat-back-post'&&near(o,back)));}
});
test('neutral signs follow saved door placement and animated leaves and reciprocal destinations survive batching',()=>{
 try{for(const seed of ['reception-a','reception-b','reception-c']){setRouteSeed(seed);const main=layoutFor(nodes.naturalIdentity),directory=main.objects.find(o=>o.object.kind==='wayfinding');assert.deepEqual(directory.object.routes.map(r=>r.id),[...main.gates].sort((a,b)=>a.x-b.x).map(g=>g.exit.id));for(const id of ids){const l=layoutFor(nodes[id]),root=scene(id,l);batchArchitecture(root);for(const g of l.gates){g.door.apply({open:1,handle:1});for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(nodes[id].repairFor){const target=main.gates.find(t=>t.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});assert.equal(g.destinationLink.targetDoorId,target.exit.id);}}}}}finally{setRouteSeed(null);}
});
test('another person and pending Sejam cannot register investor identity and corrected return still requires a decision',()=>{
 const start=interact(state(),'evidence');for(const choice of [1,2]){const wrong=travel(start,'route-'+choice);assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,'retry'));const returned=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.naturalIdentity),g=l.gates.find(g=>g.exit.id==='route-'+choice);assert.deepEqual(returned.ledger,start.ledger);assert.equal(returned.completed.includes('naturalIdentity'),false);assert.deepEqual(archiveArrival(returned,l),{position:{x:g.x,y:g.y+52},yaw:Math.PI});}
});
test('valid Arman identity registers only complete investor identity without buying units or sending another payment',()=>{
 const start=interact(state(),'evidence'),next=travel(start,'route-0');assert.equal(next.nodeId,'naturalSlip');assert.equal(next.role,'client');assert.deepEqual(next.ledger.identities.arman,{id:'arman',type:'natural',sejam:true,bank:true,bourse:true});assert.deepEqual(next.ledger.payments,start.ledger.payments);assert.deepEqual(next.ledger.ownerReceipts,start.ledger.ownerReceipts);assert.equal(next.ledger.published,true);assert.equal(next.ledger.certificate,null);
});
test('three reception guides have separate new identities, ages and body and facial proportions',()=>{
 const keys=ids.map(id=>nodes[id].scene.guide.identity);assert.equal(new Set(keys).size,3);for(const key of keys)assert.ok(!['nika','arzu','afshin','rana','elnaz','ehsan','bahram','azadeh','ashkan','mina','baran','babak','shahab','behnaz','behnam','ava','paniz','pedram'].includes(key));for(const field of ['height','shoulder','headWidth','skin','age'])assert.equal(new Set(keys.map(key=>guideIdentities[key][field])).size,3);
});
test('reception layout invalidates old coordinates without discarding publication history or sent receipts',()=>{
 const s=state(),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};map.set(KEY,JSON.stringify({state:s,position:{x:600,y:800,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,s);const p=layoutFor(nodes.naturalIdentity).spawn;assert.ok(writeSave(storage,s,p));assert.deepEqual(readSave(storage).position,p);
});

test('equipment captions are attached to the front apron and remain below scanner and monitor sightlines',()=>{
 for(const id of ids){const root=scene(id);for(const plate of root.getObjectsByProperty('name','reception-plaque')){assert.ok(plate.parent.children.some(o=>o.name==='reception-desk-front-apron'&&near(o,plate)));assert.ok(bounds(plate).max.y<2.25);}}
});
test('ownership review wall notice stays clear of the freestanding identity comparison board',()=>{
 const root=scene('repair-naturalIdentity-1');assert.ok(bounds(root.getObjectByName('reception-notice-paper')).max.x<bounds(root.getObjectByName('reception-fixture-identity')).min.x);
});
test('information kiosk screen is entirely above its support and the case remains physically connected',()=>{
 const root=scene('naturalIdentity'),pedestal=root.getObjectByName('reception-kiosk-pedestal'),screen=root.getObjectByName('reception-kiosk-screen'),shell=root.getObjectByName('reception-kiosk-case');assert.ok(bounds(screen).min.y>bounds(pedestal).max.y);assert.ok(near(pedestal,shell));assert.ok(near(pedestal,root.getObjectByName('reception-kiosk-foot')));
});