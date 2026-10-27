import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {createEnvironmentTestJourney} from '../app/src/game/environmentTest.js';
import {interact,travel,restoreJourney} from '../app/src/game/campaignState.js';
import {layoutFor,findPath,walkable} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {buildAuditScene} from '../app/src/render/auditScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
const ids=['receiptCheck','repair-receiptCheck-0','repair-receiptCheck-1'];
function build(id,l=layoutFor(nodes[id])){const root=new T.Group(),cache=new Map(),mat=new T.MeshStandardMaterial();buildAuditScene(root,nodes[id],l,{mat:()=>mat,geo:(k,fn)=>{if(!cache.has(k))cache.set(k,fn());return cache.get(k);}});root.updateMatrixWorld(true);return root;}
const bounds=o=>new T.Box3().setFromObject(o),contact=(a,b)=>bounds(a).expandByScalar(.025).intersectsBox(bounds(b));
test('wedge workshop has a real recess diagonal entrance and reachable evidence and decisions',()=>{
 for(const id of ids){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,12));for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects)assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length,id+' '+o.object.id);}
 const l=layoutFor(nodes.receiptCheck);assert.equal(l.boundary.length,9);assert.equal(new Set(l.gates.map(g=>g.travelYaw)).size,3);assert.equal(walkable({x:960,y:210},l,12),false);assert.equal(walkable({x:180,y:700},l,12),false);assert.ok(walkable({x:180,y:415},l,12));
});
test('copy and date rooms have distinct plans one door and approximately one third main area',()=>{
 const area=l=>Math.abs(l.boundary.reduce((s,p,i)=>{const q=l.boundary[(i+1)%l.boundary.length];return s+p.x*q.y-q.x*p.y;},0))/2,main=area(layoutFor(nodes.receiptCheck));for(const id of ids.slice(1)){const l=layoutFor(nodes[id]);assert.equal(l.gates.length,1);assert.ok(area(l)/main>.3&&area(l)/main<.4);}assert.notDeepEqual(layoutFor(nodes[ids[1]]).boundary,layoutFor(nodes[ids[2]]).boundary);
});
test('approving original N-200 only marks receipt checked without sending either payment',()=>{
 const s=interact(createEnvironmentTestJourney('receiptCheck','audit-valid'),'evidence'),before=structuredClone(s.ledger),next=travel(s,'route-2');assert.equal(next.nodeId,'investorSend');assert.equal(next.role,'manager');assert.deepEqual(next.ledger,{...before,receiptChecked:true});assert.equal(next.ledger.payments.find(p=>p.id==='N-200').status,'submitted');assert.equal(next.ledger.payments.find(p=>p.id==='N-80').sync,'unknown');assert.deepEqual(restoreJourney(next),next);
});
test('copy and future-date routes preserve the ledger and return beside the same shuffled entrance',()=>{
 try{for(const seed of ['audit-a','audit-b','audit-c']){setRouteSeed(seed);const s=interact(createEnvironmentTestJourney('receiptCheck',seed),'evidence');for(const choice of [0,1]){const wrong=travel(s,'route-'+choice);assert.deepEqual(wrong.ledger,s.ledger);const back=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.receiptCheck),g=l.gates.find(g=>g.exit.id==='route-'+choice),arrival=archiveArrival(back,l);assert.deepEqual(back.ledger,s.ledger);assert.equal(back.completed.includes('receiptCheck'),false);assert.ok(walkable(arrival.position,l,12));assert.equal(arrival.yaw,g.travelYaw+Math.PI);}}}finally{setRouteSeed(null);}
});
test('single pushbar door remains animated after batching and diagonal destination views are reciprocal',()=>{
 try{for(const seed of ['audit-door-a','audit-door-b']){setRouteSeed(seed);for(const id of ids){const l=layoutFor(nodes[id]),root=build(id,l);batchArchitecture(root);for(const g of l.gates){assert.equal(g.door.leaves.length,1);g.door.apply({open:1});assert.ok(g.door.leaves[0].pivot.parent);assert.equal(g.door.leaves[0].pivot.rotation.y,-1.48);assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(id==='receiptCheck')assert.equal(g.destinationLink.rotationYaw,-g.travelYaw);else{const target=layoutFor(nodes.receiptCheck).gates.find(g=>g.exit.id==='route-'+id.at(-1));assert.equal(g.destinationLink.rotationYaw,target.travelYaw);assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});}}}}}finally{setRouteSeed(null);}
});
test('workshop roof has real sloped panels and glazed northlight risers while both review ceilings differ',()=>{
 const root=build('receiptCheck');let panels=0;root.traverse(o=>{if(o.name.startsWith('audit-sawtooth-roof-')){panels++;const p=o.geometry.attributes.position,ys=Array.from({length:p.count},(_,i)=>p.getY(i));assert.ok(Math.max(...ys)-Math.min(...ys)>3.9);}});assert.equal(panels,6);assert.equal(root.getObjectsByProperty('name','audit-northlight-glazing').length,5);const copy=build(ids[1]),date=build(ids[2]);assert.ok(copy.getObjectByName('audit-copy-ceiling'));assert.ok(copy.getObjectByName('audit-copy-baffle'));assert.ok(date.getObjectByName('audit-date-sloped-ceiling'));assert.equal(date.getObjectByName('audit-copy-ceiling'),undefined);
});
test('recognizable document equipment includes lightbox camera scanner magnifier archive cart and protected original',()=>{
 const root=build('receiptCheck');assert.ok(new Set(layoutFor(nodes.receiptCheck).fixtures.map(f=>f.kind)).size>=14);for(const name of ['audit-lightbox-diffuser','audit-camera-column','audit-camera-boom','audit-camera-lens-barrel','audit-scanner-bed-glass','audit-scanner-lid','audit-magnifier-rim','audit-plan-drawer-case','audit-cart-wheel','audit-case-latch','audit-calendar-binding','audit-date-wheel','audit-sort-tray'])assert.ok(root.getObjectByName(name),name);assert.equal(root.getObjectsByProperty('name','audit-cart-wheel').length,4);
});
test('lightbox controls attach to their body and camera lamps feet and lens have physical supports',()=>{
 const root=build('receiptCheck'),lightbox=root.getObjectByName('audit-fixture-lightbox'),camera=root.getObjectByName('audit-fixture-camera');assert.ok(contact(lightbox.getObjectByName('audit-lightbox-switch-plate'),lightbox.getObjectByName('audit-lightbox-body')));for(const foot of camera.getObjectsByProperty('name','audit-camera-lamp-foot'))assert.ok(contact(foot,camera.getObjectByName('audit-worktop')));assert.ok(contact(camera.getObjectByName('audit-camera-lens-barrel'),camera.getObjectByName('audit-camera-body')));assert.ok(contact(camera.getObjectByName('audit-camera-lens-glass'),camera.getObjectByName('audit-camera-lens-barrel')));for(const name of ['audit-camera-column','audit-camera-boom'])assert.ok(contact(camera.getObjectByName(name),camera.getObjectByName('audit-camera-carriage')));
});
test('date document stand faces the reader and does not sink into its worktop',()=>{
 const root=build(ids[2]),form=root.getObjectByName('audit-date-range-form'),normal=new T.Vector3(0,1,0).applyQuaternion(form.getWorldQuaternion(new T.Quaternion()));assert.ok(normal.z>.35&&normal.y>.85);const stand=root.getObjectByName('audit-date-board'),top=root.getObjectByName('audit-fixture-datebench').getObjectByName('audit-worktop');assert.ok(bounds(stand).min.y>=bounds(top).max.y-.03);
});
test('copy history and date-range review use different equipment with no unsupported generic wall banners',()=>{
 const copy=build(ids[1]),date=build(ids[2]);assert.ok(copy.getObjectByName('audit-index-screen-housing'));assert.equal(copy.getObjectByName('audit-date-range-form'),undefined);assert.ok(date.getObjectByName('audit-date-range-form'));assert.equal(date.getObjectByName('audit-index-screen-housing'),undefined);for(const id of ids){const r=build(id);assert.equal(r.getObjectByName('order-review-notice'),undefined);}
});
test('incoming bank portal fits inside arrival clearance and old coordinates expire without losing progress',()=>{
 const l=layoutFor(nodes.receiptCheck);for(const offset of [-8,0,35,65,74])assert.ok(walkable({x:l.spawn.x,y:l.spawn.y+offset},l,12));const s=createEnvironmentTestJourney('receiptCheck','audit-save'),data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};data.set(KEY,JSON.stringify({state:s,position:{x:1100,y:400,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,s);writeSave(storage,s,l.spawn);assert.deepEqual(readSave(storage).position,l.spawn);
});
test('three document-review guides retain distinct fictional faces ages and builds',()=>{
 const keys=ids.map(id=>nodes[id].scene.guide.identity);assert.deepEqual(keys,['auditFarhad','auditLadan','auditKaveh']);for(const field of ['age','height','skin','headWidth','shoulder'])assert.equal(new Set(keys.map(k=>guideIdentities[k][field])).size,3);
});

test('directory support attaches behind the display without covering its writing',()=>{
 const f=build('receiptCheck').getObjectByName('audit-fixture-directory'),column=f.getObjectByName('audit-directory-column'),glass=f.getObjectByName('audit-directory-glass');assert.ok(bounds(column).max.z<bounds(glass).min.z);assert.ok(contact(column,f.getObjectByName('audit-directory-housing')));assert.ok(contact(column,f.getObjectByName('audit-directory-base')));
});
test('glazed northlights and windows transmit sunlight instead of casting opaque pane shadows',()=>{
 const r=build('receiptCheck');for(const name of ['audit-northlight-glazing','audit-wall-window']){const panes=r.getObjectsByProperty('name',name);assert.ok(panes.length>0);assert.ok(panes.every(o=>o.castShadow===false));}assert.ok(r.getObjectByName('audit-sawtooth-roof-0').castShadow);
});
