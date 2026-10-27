import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {createEnvironmentTestJourney} from '../app/src/game/environmentTest.js';
import {interact,travel,availableAmount,restoreJourney} from '../app/src/game/campaignState.js';
import {layoutFor,findPath,walkable} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {buildPaymentScene} from '../app/src/render/paymentScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
const ids=['gateway','repair-gateway-1','repair-gateway-2'];
function build(id,l=layoutFor(nodes[id])){const root=new T.Group(),cache=new Map(),material=new T.MeshStandardMaterial();buildPaymentScene(root,nodes[id],l,{mat:()=>material,geo:(key,fn)=>{if(!cache.has(key))cache.set(key,fn());return cache.get(key);}});root.updateMatrixWorld(true);return root;}
const bounds=o=>new T.Box3().setFromObject(o),contact=(a,b)=>bounds(a).expandByScalar(.01).intersectsBox(bounds(b));
test('octagonal payment station has diagonal entries, real perimeter and reachable evidence and gates',()=>{
 const main=layoutFor(nodes.gateway);assert.equal(main.boundary.length,8);assert.equal(new Set(main.gates.map(g=>g.travelYaw)).size,3);for(const id of ids){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,12));for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects)assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length,id+' '+o.object.id);}assert.equal(walkable({x:230,y:140},main,12),false);assert.equal(walkable({x:800,y:144},main,12),false);
});
test('both payment correction spaces are independent and roughly one third of main area',()=>{
 const area=l=>Math.abs(l.boundary.reduce((sum,p,i)=>{const q=l.boundary[(i+1)%l.boundary.length];return sum+p.x*q.y-q.x*p.y;},0))/2,main=area(layoutFor(nodes.gateway));for(const id of ids.slice(1)){const l=layoutFor(nodes[id]);assert.equal(l.gates.length,1);assert.ok(area(l)/main>.3&&area(l)/main<.42);}assert.notDeepEqual(layoutFor(nodes[ids[1]]).boundary,layoutFor(nodes[ids[2]]).boundary);
});
test('payment cabins expose screens keypad reader printer privacy service and replaceable paper hardware',()=>{
 const root=build('gateway'),cabins=root.getObjectsByProperty('name','payment-cabin');assert.equal(cabins.length,3);for(const cabin of cabins){for(const name of ['payment-transaction-display-housing','payment-keypad','payment-card-reader','payment-receipt-tray','payment-cabin-privacy-fin','payment-console-service-hinge','payment-console-lock','payment-paper-spindle']){assert.ok(cabin.getObjectByName(name),name);}assert.equal(cabin.getObjectsByProperty('name','payment-key').length,12);const keypad=cabin.getObjectByName('payment-keypad'),display=cabin.getObjectByName('payment-transaction-display-housing');assert.equal(bounds(keypad).intersectsBox(bounds(display)),false);}
});
test('sliding leaves survive batching and destination views rotate reciprocally for shuffled entries',()=>{
 try{for(const seed of ['pay-a','pay-b','pay-c']){setRouteSeed(seed);const main=layoutFor(nodes.gateway);for(const id of ids){const l=layoutFor(nodes[id]),root=build(id,l);batchArchitecture(root);for(const g of l.gates){const before=g.door.leaves.map(v=>v.pivot.position.x);g.door.apply({open:1});g.door.leaves.forEach((leaf,i)=>{assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.position.x-before[i])>4);});assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(id!=='gateway'){const target=main.gates.find(g=>g.exit.id==='route-'+id.at(-1));assert.equal(g.destinationLink.rotationYaw,target.travelYaw);assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});}else assert.equal(g.destinationLink.rotationYaw,-g.travelYaw);}}}}finally{setRouteSeed(null);}
});
test('110 and 75 leave finances unchanged and return beside the chosen angled entrance',()=>{
 const s=interact(createEnvironmentTestJourney('gateway','wrong-pay'),'evidence');for(const choice of [1,2]){const wrong=travel(s,'route-'+choice);assert.deepEqual(wrong.ledger,s.ledger);const back=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.gateway),g=l.gates.find(g=>g.exit.id==='route-'+choice),arrival=archiveArrival(back,l);assert.deepEqual(back.ledger,s.ledger);assert.equal(back.completed.includes('gateway'),false);assert.ok(walkable(arrival.position,l,12));assert.equal(arrival.yaw,g.travelYaw+Math.PI);assert.ok((arrival.position.x-g.x)*g.travelDirection.x+(arrival.position.y-g.y)*g.travelDirection.y<0);}
});
test('valid 80 reserves capacity and creates only a pending bank request, preserving the first slip',()=>{
 const s=createEnvironmentTestJourney('gateway','valid-pay'),before=structuredClone(s.ledger.payments.find(p=>p.id==='N-200'));assert.equal(availableAmount(s.ledger),680);const next=travel(interact(s,'evidence'),'route-0');assert.equal(next.nodeId,'verifyBank');assert.equal(next.role,'manager');assert.equal(availableAmount(next.ledger),600);assert.deepEqual(next.ledger.payments.find(p=>p.id==='N-200'),before);assert.deepEqual(next.ledger.payments.find(p=>p.id==='N-80'),{id:'N-80',amount:80,method:'gateway',owner:'arman',status:'pending',bankSuccess:false,trace:null});assert.equal(next.ledger.receiptChecked,false);assert.deepEqual(restoreJourney(next),next);
});
test('directory and pendant are mounted, receipt rolls rest on shelves and there are no prose wall banners',()=>{
 const root=build('gateway');for(const rod of root.getObjectsByProperty('name','payment-directory-hanger')){assert.ok(contact(rod,root.getObjectByName('payment-ceiling')));assert.ok(contact(rod,root.getObjectByName('payment-directory-housing')));}for(const rod of root.getObjectsByProperty('name','payment-pendant-rod')){assert.ok(contact(rod,root.getObjectByName('payment-ceiling')));assert.ok(contact(rod,root.getObjectByName('payment-pendant-ring')));}root.traverse(o=>{if(o.name==='payment-receipt-roll')assert.ok(o.parent.getObjectsByProperty('name','payment-supply-shelf').some(s=>contact(o,s)));});assert.equal(root.getObjectByName('order-review-notice'),undefined);
});
test('three payment guides have distinct fictional ages faces and builds',()=>{
 const keys=ids.map(id=>nodes[id].scene.guide.identity);assert.deepEqual(keys,['paymentSaman','paymentRaha','paymentMaziar']);for(const field of ['age','height','skin','headWidth','shoulder'])assert.equal(new Set(keys.map(key=>guideIdentities[key][field])).size,3);
});
test('old payment coordinates are discarded while original progress remains valid',()=>{
 const s=createEnvironmentTestJourney('gateway','saved-pay'),data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};data.set(KEY,JSON.stringify({state:s,position:{x:700,y:600,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,s);const pos=layoutFor(nodes.gateway).spawn;assert.ok(writeSave(storage,s,pos));assert.deepEqual(readSave(storage).position,pos);
});

test('bank-state and QR heads are supported and capacity segments are mounted on the display',()=>{
 const main=build('gateway');for(const kind of ['network','qr']){const f=main.getObjectByName('payment-fixture-'+kind),post=f.getObjectByName(kind==='qr'?'payment-qr-neck':'payment-status-pole');assert.ok(contact(post,f.getObjectByName('payment-device-shell')));assert.ok(contact(post,f.getObjectByName(kind==='qr'?'payment-qr-body':'payment-bank-state-housing')));}
 const f=build('repair-gateway-1').getObjectByName('payment-fixture-capacity');for(const segment of f.getObjectsByProperty('name','payment-capacity-segment'))assert.ok(contact(segment,f.getObjectByName('payment-review-display-glass')));
});
test('radial ribs and correction-room ceiling lights connect to the roof or a real fin',()=>{
 for(const id of ids){const root=build(id),roof=root.getObjectByName('payment-ceiling');for(const rib of root.getObjectsByProperty('name','payment-radial-ceiling-rib'))assert.ok(contact(rib,roof));for(const fin of root.getObjectsByProperty('name','payment-amount-ceiling-fin'))assert.ok(contact(fin,roof));for(const light of root.getObjectsByProperty('name','payment-amount-ceiling-light'))assert.ok(root.getObjectsByProperty('name','payment-amount-ceiling-fin').some(fin=>contact(fin,light)));}
});
test('cabin cables connect visible glands to grounded floor ports on the plinths',()=>{
 const root=build('gateway');for(const cabin of root.getObjectsByProperty('name','payment-cabin')){assert.equal(cabin.getObjectsByProperty('name','payment-cabin-cable').length,6);for(const port of cabin.getObjectsByProperty('name','payment-floor-power-port')){assert.ok(cabin.getObjectsByProperty('name','payment-cabin-cable').some(cable=>contact(cable,port)));assert.ok(cabin.getObjectsByProperty('name','payment-cabin-plinth').some(plinth=>contact(plinth,port)));}for(const gland of cabin.getObjectsByProperty('name','payment-cable-gland')){assert.ok(cabin.getObjectsByProperty('name','payment-cabin-console').some(console=>contact(console,gland)));assert.ok(cabin.getObjectsByProperty('name','payment-cabin-cable').some(cable=>contact(cable,gland)));}}
});