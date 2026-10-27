import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {createEnvironmentTestJourney} from '../app/src/game/environmentTest.js';
import {interact,travel,availableAmount,restoreJourney} from '../app/src/game/campaignState.js';
import {layoutFor,findPath,walkable} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {buildBankScene} from '../app/src/render/bankScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
const ids=['verifyBank','repair-verifyBank-0','repair-verifyBank-2'];
function build(id,l=layoutFor(nodes[id])){const root=new T.Group(),cache=new Map(),material=new T.MeshStandardMaterial();buildBankScene(root,nodes[id],l,{mat:()=>material,geo:(k,fn)=>{if(!cache.has(k))cache.set(k,fn());return cache.get(k);}});root.updateMatrixWorld(true);return root;}
const bounds=o=>new T.Box3().setFromObject(o),contact=(a,b)=>bounds(a).expandByScalar(.025).intersectsBox(bounds(b));
test('L-shaped banking floor has three directions, real notch and reachable decision and evidence',()=>{
 for(const id of ids){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,12),id);for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects)assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length,id+' '+o.object.id);}
 const l=layoutFor(nodes.verifyBank);assert.equal(new Set(l.gates.map(g=>g.travelYaw)).size,3);assert.equal(walkable({x:900,y:200},l,12),false);assert.equal(walkable({x:370,y:360},l,12),false);
});
test('bank review rooms have separate footprints, around one third area and one physical return',()=>{
 const area=l=>Math.abs(l.boundary.reduce((s,p,i)=>{const q=l.boundary[(i+1)%l.boundary.length];return s+p.x*q.y-q.x*p.y;},0))/2,main=area(layoutFor(nodes.verifyBank));for(const id of ids.slice(1)){const l=layoutFor(nodes[id]);assert.equal(l.gates.length,1);assert.ok(area(l)/main>.3&&area(l)/main<.4);}assert.notDeepEqual(layoutFor(nodes[ids[1]]).boundary,layoutFor(nodes[ids[2]]).boundary);
});
test('bank confirmation updates existing N-80 without a second charge capacity change or premature sync',()=>{
 const s=interact(createEnvironmentTestJourney('verifyBank','bank-valid'),'evidence'),before=structuredClone(s.ledger),next=travel(s,'route-1');assert.equal(next.nodeId,'receiptCheck');assert.equal(next.role,'manager');assert.equal(next.ledger.payments.length,before.payments.length);assert.equal(availableAmount(next.ledger),availableAmount(before));assert.deepEqual(next.ledger.payments.find(p=>p.id==='N-80'),{...before.payments.find(p=>p.id==='N-80'),bankSuccess:true,status:'paid',sync:'unknown'});assert.deepEqual(next.ledger.payments.find(p=>p.id==='N-200'),before.payments.find(p=>p.id==='N-200'));assert.equal(next.ledger.receiptChecked,false);assert.deepEqual(restoreJourney(next),next);
});
test('duplicate charge and mismatched 800 never alter finances and return beside the correct shuffled entry',()=>{
 try{for(const seed of ['bank-a','bank-b','bank-c']){setRouteSeed(seed);const s=interact(createEnvironmentTestJourney('verifyBank',seed),'evidence');for(const choice of [0,2]){const wrong=travel(s,'route-'+choice);assert.deepEqual(wrong.ledger,s.ledger);const back=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.verifyBank),g=l.gates.find(g=>g.exit.id==='route-'+choice),a=archiveArrival(back,l);assert.deepEqual(back.ledger,s.ledger);assert.equal(back.completed.includes('verifyBank'),false);assert.equal(a.yaw,g.travelYaw+Math.PI);assert.ok(walkable(a.position,l,12));}}}finally{setRouteSeed(null);}
});
test('hinged leaves remain dynamic after batching and portals match each physical entrance in both directions',()=>{
 try{for(const seed of ['bank-doors-a','bank-doors-b']){setRouteSeed(seed);for(const id of ids){const l=layoutFor(nodes[id]),root=build(id,l);batchArchitecture(root);for(const g of l.gates){g.door.apply({open:1});assert.equal(g.door.leaves.length,2);for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.4);}assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(id!=='verifyBank'){const target=layoutFor(nodes.verifyBank).gates.find(g=>g.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});assert.equal(g.destinationLink.rotationYaw,target.travelYaw);}else assert.equal(g.destinationLink.rotationYaw,-g.travelYaw);}}}}finally{setRouteSeed(null);}
});
test('bank operations expose varied functional equipment with supported screens controls and receipts',()=>{
 const root=build('verifyBank');assert.ok(new Set(layoutFor(nodes.verifyBank).fixtures.map(f=>f.kind)).size>=13);const counter=root.getObjectByName('bank-fixture-reconcile');assert.equal(counter.getObjectsByProperty('name','bank-monitor-housing').length,2);assert.equal(counter.getObjectsByProperty('name','bank-key').length,80);for(const foot of counter.getObjectsByProperty('name','bank-monitor-foot'))assert.ok(contact(foot,counter.getObjectByName('bank-counter-top')));for(const neck of counter.getObjectsByProperty('name','bank-monitor-neck')){assert.ok(counter.getObjectsByProperty('name','bank-monitor-foot').some(o=>contact(neck,o)));assert.ok(counter.getObjectsByProperty('name','bank-monitor-housing').some(o=>contact(neck,o)));}const printer=root.getObjectByName('bank-fixture-printer');assert.ok(contact(printer.getObjectByName('bank-printed-bank-receipt'),printer.getObjectByName('payment-receipt-tray')));assert.ok(root.getObjectByName('bank-shredder-feed-sheet'));assert.ok(root.getObjectByName('bank-date-stamp-frame'));assert.ok(root.getObjectByName('bank-floor-cable-port'));
});
test('lights touch ceiling supports and directory status and partition are physically mounted',()=>{
 for(const id of ids){const root=build(id);for(const light of root.getObjectsByProperty('name','bank-linear-light'))assert.ok(root.getObjectsByProperty('name','bank-ceiling-batten').some(o=>contact(light,o)));}const root=build('verifyBank');for(const kind of ['directory','status']){const f=root.getObjectByName('bank-fixture-'+kind),name=kind==='directory'?'bank-directory':'bank-two-status';for(const post of f.getObjectsByProperty('name','bank-'+kind+'-post'))assert.ok(contact(post,f.getObjectByName(name+'-housing')));}for(const pane of root.getObjectsByProperty('name','bank-partition-glass'))assert.ok(root.getObjectsByProperty('name','bank-partition-clamp').some(o=>contact(pane,o)));
});
test('mismatch review uses real paired form holders and duplicate review uses separate history equipment',()=>{
 const a=build('repair-verifyBank-0'),b=build('repair-verifyBank-2');assert.ok(a.getObjectByName('bank-history-file-rack'));assert.equal(a.getObjectByName('bank-comparison-form'),undefined);assert.equal(b.getObjectsByProperty('name','bank-comparison-form').length,2);assert.ok(b.getObjectByName('bank-marking-pen'));for(const form of b.getObjectsByProperty('name','bank-comparison-form'))assert.ok(contact(form,form.parent.getObjectByName('bank-comparison-board')));
});
test('old bank coordinates expire while the valid pending-payment journey remains intact',()=>{
 const s=createEnvironmentTestJourney('verifyBank','bank-save'),data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};data.set(KEY,JSON.stringify({state:s,position:{x:900,y:200,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,s);const p=layoutFor(nodes.verifyBank).spawn;assert.ok(writeSave(storage,s,p));assert.deepEqual(readSave(storage).position,p);
});

test('comparison forms face the reader and monitor cables terminate in the physical tray',()=>{
 const review=build('repair-verifyBank-2');for(const form of review.getObjectsByProperty('name','bank-comparison-form')){const normal=new T.Vector3(0,1,0).applyQuaternion(form.getWorldQuaternion(new T.Quaternion()));assert.ok(normal.y>.8&&normal.z>.25);}
 for(const id of ['verifyBank','repair-verifyBank-0']){const root=build(id);for(const cable of root.getObjectsByProperty('name','bank-monitor-cable-return'))assert.ok(root.getObjectsByProperty('name','bank-counter-cable-tray').some(tray=>contact(cable,tray)));}
});
test('incoming payment view fits inside bank arrival clearance before and after the threshold',()=>{
 const l=layoutFor(nodes.verifyBank);for(const offset of [-8,0,35,65,74])assert.ok(walkable({x:l.spawn.x,y:l.spawn.y+offset},l,12),'arrival offset '+offset);
});