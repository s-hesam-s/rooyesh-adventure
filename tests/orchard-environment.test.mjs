import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,interact,travel,restoreJourney} from '../app/src/game/campaignState.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildOrchardScene} from '../app/src/render/orchardScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
const ids=['naturalSlip','repair-naturalSlip-0','repair-naturalSlip-1'];
function receptionState(){let s=newJourney('manager','order-test');for(const route of ['route-1','route-0','route-2','route-1','route-0','route-1'])s=travel(interact(s,'evidence'),route);return s;}
function state(){return travel(interact(receptionState(),'evidence'),'route-0');}
function scene(id,l=layoutFor(nodes[id])){const root=new T.Group(),cache=new Map(),material=new T.MeshStandardMaterial();buildOrchardScene(root,nodes[id],l,{mat:()=>material,geo:(k,fn)=>{if(!cache.has(k))cache.set(k,fn());return cache.get(k);}});root.updateMatrixWorld(true);return root;}
const bounds=o=>new T.Box3().setFromObject(o),near=(a,b)=>bounds(a).expandByScalar(.006).intersectsBox(bounds(b));
test('orchard choices and evidence are reachable and all three main walking lanes have body clearance',()=>{
 for(const id of ids){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,12));for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects.filter(o=>o.object.kind!=='wayfinding'))assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length,id+' '+o.object.id);}
 const l=layoutFor(nodes.naturalSlip);for(const g of l.gates){for(let y=l.hub.y;y>=g.approach.y;y-=5)assert.ok(walkable({x:g.x,y},l,12),g.exit.id+' '+y);for(let x=Math.min(l.hub.x,g.x);x<=Math.max(l.hub.x,g.x);x+=5)assert.ok(walkable({x,y:l.hub.y},l,12));}
});
test('stepped office has continuous floor seams and real equipment collisions instead of garden fixtures',()=>{
 const l=layoutFor(nodes.naturalSlip);assert.equal(new Set(l.gates.map(g=>g.y)).size,3);for(const x of [425,430,435,845,850,855])assert.ok(walkable({x,y:600},l,12));for(const f of l.fixtures)assert.equal(walkable({x:640+f.x*10,y:450+f.z*10},l,12),false);assert.ok(l.fixtures.every(f=>!['bed','pergola','tree'].includes(f.kind)));for(const p of [{x:200,y:200},{x:1100,y:300}])assert.equal(walkable(p,l,12),false);
});
test('office and two correction rooms use sawtooth barrel and acoustic ceilings with connected fittings',()=>{
 const main=scene(ids[0]),calculation=scene(ids[1]),conditions=scene(ids[2]);assert.ok(main.getObjectByName('order-sawtooth-roof'));assert.ok(main.getObjectByName('order-clerestory-glass'));assert.ok(calculation.getObjectByName('order-vault-panel'));assert.ok(conditions.getObjectByName('order-acoustic-inset'));assert.equal(main.getObjectByName('order-vault-panel'),undefined);for(const root of [main,calculation])for(const rod of root.getObjectsByProperty('name','order-lamp-rod')){assert.ok(root.getObjectsByProperty('name','order-lamp-body').some(o=>near(o,rod)));assert.ok(root.children.filter(o=>['order-sawtooth-roof','order-vault-panel'].includes(o.name)).some(o=>near(o,rod)));}
});
test('both correction pavilions have one physical door and about a third of the main garden floor',()=>{
 const mainArea=scene(ids[0]).getObjectsByProperty('name','order-floor').reduce((sum,o)=>{const s=bounds(o).getSize(new T.Vector3());return sum+s.x*s.z;},0);for(const id of ids.slice(1)){const root=scene(id),s=bounds(root.getObjectByName('order-floor')).getSize(new T.Vector3());assert.ok(s.x*s.z/mainArea>.3&&s.x*s.z/mainArea<.45);assert.equal(layoutFor(nodes[id]).gates.length,1);}assert.ok(scene(ids[1]).getObjectByName('order-fixture-unit205'));assert.ok(scene(ids[2]).getObjectByName('order-fixture-minimum'));
});
test('205 example consists of twenty complete ten-million units and one five-million partial piece',()=>{
 const f=scene(ids[1]).getObjectByName('order-fixture-unit205'),full=f.getObjectsByProperty('name','order-full-unit'),partial=f.getObjectsByProperty('name','order-half-unit');assert.equal(full.length,20);assert.equal(partial.length,1);assert.equal(full.length*10+partial.length*5,205);for(const token of full)assert.ok(near(token,f.getObjectByName('order-unit205-mat')));assert.ok(near(partial[0],f.getObjectByName('order-tabletop')));
});
test('minimum example distinguishes four units from five supported units without registering a purchase',()=>{
 const f=scene(ids[2]).getObjectByName('order-fixture-minimum'),center=f.getWorldPosition(new T.Vector3()).x,tokens=f.getObjectsByProperty('name','order-full-unit');assert.equal(tokens.filter(o=>o.getWorldPosition(new T.Vector3()).x<center).length,4);assert.equal(tokens.filter(o=>o.getWorldPosition(new T.Vector3()).x>center).length,5);for(const token of tokens)assert.ok(f.children.some(o=>o.name==='order-minimum-tray'&&near(o,token)));
});
test('equipment title plates and printer buttons have physical supports',()=>{
 for(const id of ids){const root=scene(id);for(const plate of root.getObjectsByProperty('name','order-title-plate'))assert.ok(plate.parent.children.some(o=>o.name==='order-table-apron'&&near(o,plate)));for(const button of root.getObjectsByProperty('name','order-printer-button'))assert.ok(near(button,button.parent.getObjectByName('order-printer-control-panel')));}
});test('neutral directory and animated gates agree with shuffled choices and both return destinations',()=>{
 try{for(const seed of ['order-a','order-b','order-c']){setRouteSeed(seed);const main=layoutFor(nodes.naturalSlip),directory=main.objects.find(o=>o.object.kind==='wayfinding');assert.deepEqual(directory.object.routes.map(r=>r.id),[...main.gates].sort((a,b)=>a.x-b.x).map(g=>g.exit.id));for(const id of ids){const l=layoutFor(nodes[id]),root=scene(id,l);batchArchitecture(root);for(const g of l.gates){g.door.apply({open:1,handle:1});for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}assert.equal(g.destinationView.userData.destinationId,g.exit.next);assert.deepEqual(g.destinationView.userData.aperture,{width:8.8,height:10.3});assert.equal(g.destinationView.position.x,(g.x-640)*.1);if(nodes[id].repairFor){const target=main.gates.find(t=>t.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});assert.equal(g.destinationLink.targetDoorId,target.exit.id);}}}}}finally{setRouteSeed(null);}
});
test('invalid 205 and 40 choices preserve the ledger and returning with a report cannot complete the purchase',()=>{
 const start=interact(state(),'evidence');for(const choice of [0,1]){const wrong=travel(start,'route-'+choice);assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,'retry'));const returned=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.naturalSlip),g=l.gates.find(g=>g.exit.id==='route-'+choice);assert.deepEqual(returned.ledger,start.ledger);assert.equal(returned.completed.includes('naturalSlip'),false);assert.deepEqual(archiveArrival(returned,l),{position:{x:g.x,y:g.y+52},yaw:Math.PI});}
});
test('reception to orchard continuation preserves Arman identity and valid 200 registers only the first slip',()=>{
 const reception=receptionState(),garden=state();assert.equal(reception.nodeId,'naturalIdentity');assert.equal(garden.nodeId,'naturalSlip');assert.equal(garden.role,'client');assert.equal(garden.ledger.identities.arman.sejam,true);const next=travel(interact(garden,'evidence'),'route-2');assert.equal(next.nodeId,'gateway');assert.equal(next.role,'client');assert.equal(next.ledger.payments.length,2);assert.deepEqual(next.ledger.payments[1],{id:'N-200',amount:200,method:'slip',date:10,tracking:'N-200',file:true,bank:true,owner:'arman',status:'submitted'});assert.equal(next.ledger.receiptChecked,false);assert.equal(next.ledger.payments.some(p=>p.id==='N-80'),false);assert.deepEqual(restoreJourney(next),next);
});
test('Simin and the two pavilion guides have new fictional identities and different faces ages and builds',()=>{
 const keys=ids.map(id=>nodes[id].scene.guide.identity);assert.deepEqual(keys,['simin','tara','hamed']);for(const field of ['height','shoulder','headWidth','skin','age'])assert.equal(new Set(keys.map(key=>guideIdentities[key][field])).size,3);
});
test('new orchard map discards only stale coordinates and retains valid reception and publication events',()=>{
 const s=state(),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};for(const layout of [1,2,3]){map.set(KEY,JSON.stringify({state:s,position:{x:350,y:800,layout}}));assert.equal(readSave(storage).position,null);}assert.deepEqual(readSave(storage).state,s);const p=layoutFor(nodes.naturalSlip).spawn;assert.ok(writeSave(storage,s,p));assert.deepEqual(readSave(storage).position,p);
});

test('annotation sheets remain outside raised unit trays and measuring mats instead of intersecting their surfaces',()=>{
 for(const id of ids){const root=scene(id);root.traverse(f=>{if(!f.name.startsWith('order-fixture-'))return;for(const paper of f.getObjectsByProperty('name','order-document'))for(const tray of f.children.filter(o=>['order-unit-tray','order-unit205-mat','order-minimum-tray'].includes(o.name)))assert.equal(bounds(paper).intersectsBox(bounds(tray)),false,f.name);});}
});

test('printer cable has connected segments and a grounded power pedestal with matching collision',()=>{
 const root=scene(ids[0]),f=root.getObjectByName('order-fixture-printer'),cables=f.getObjectsByProperty('name','order-printer-cable');assert.equal(cables.length,3);assert.ok(near(cables[0],f.getObjectByName('order-printer-body')));assert.ok(near(cables[0],cables[1]));assert.ok(near(cables[1],cables[2]));assert.ok(near(cables[2],f.getObjectByName('order-printer-power-socket')));assert.ok(near(f.getObjectByName('order-power-pedestal'),f.getObjectByName('order-power-foot')));assert.ok(near(f.getObjectByName('order-power-foot'),root.getObjectsByProperty('name','order-floor')[2]));const pedestal=f.getObjectByName('order-power-pedestal').getWorldPosition(new T.Vector3());assert.equal(walkable({x:640+pedestal.x*10,y:450+pedestal.z*10},layoutFor(nodes.naturalSlip),12),false);
});
test('office replaces text banners with varied physical equipment and independently furnished correction rooms',()=>{
 const main=scene(ids[0]);for(const id of ids){const root=scene(id);for(const name of ['order-title-plate','order-review-notice','order-process-panel','order-workzone-inlay','order-condition-board'])assert.equal(root.getObjectByName(name),undefined,name);assert.ok(root.getObjectByName('office-wall-organizer-back'));}
 assert.ok(new Set(layoutFor(nodes.naturalSlip).fixtures.map(f=>f.kind)).size>=14);for(const name of ['office-cart-wheel','office-dispenser-spine','office-scanner-lid','office-punch-handle','office-storage-box','office-shredder-head'])assert.ok(main.getObjectByName(name),name);
 const review=scene(ids[2]);assert.ok(review.getObjectByName('office-empty-pocket-label'));assert.ok(review.getObjectByName('office-conditions-sheet'));for(const id of ids.slice(1)){const root=scene(id);for(const folder of root.getObjectsByProperty('name','office-wall-folder'))assert.ok(root.getObjectsByProperty('name','office-organizer-pocket-lip').some(lip=>near(folder,lip)));}
});