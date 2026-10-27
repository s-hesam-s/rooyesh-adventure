import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,interact,travel} from '../app/src/game/campaignState.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildCanalScene} from '../app/src/render/canalScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
function helpers(){const material=new T.MeshStandardMaterial({color:'#888888'}),geometry=new Map(),water=new T.ShaderMaterial({uniforms:{time:{value:0}}});return {mat:()=>material,geo:(k,fn)=>{if(!geometry.has(k))geometry.set(k,fn());return geometry.get(k);},canalMaterials:Object.fromEntries(['floor','stone','tile','wood','darkWood','plaster','paper','brass','metal','panel','glass','iron','dark','soil','glow','water'].map(k=>[k,k==='water'?water:material]))};}
function amountState(){let state=newJourney('manager','canal-test');for(const route of ['route-1','route-0','route-2'])state=travel(interact(state,'evidence'),route);return state;}
function scene(id){const root=new T.Group();buildCanalScene(root,nodes[id],layoutFor(nodes[id]),helpers());root.updateMatrixWorld(true);return root;}
const box=o=>new T.Box3().setFromObject(o);
test('garden paths use the physical bridges, keep water inaccessible and reach every document and choice',()=>{
 const l=layoutFor(nodes.ownerAmount);for(const x of [-25,25]){assert.ok(walkable({x:640+x*10,y:550},l,10));for(const z of [-12,0,22])assert.equal(walkable({x:640+x*10,y:450+z*10},l,10),false);}
 for(const id of ['ownerAmount','repair-ownerAmount-0','repair-ownerAmount-2']){const layout=layoutFor(nodes[id]);assert.ok(walkable(layout.spawn,layout,10));for(const g of layout.gates)assert.ok(findPath(layout.spawn,g,layout).length,id+' '+g.exit.id);for(const o of layout.objects.filter(o=>o.object.kind!=='wayfinding'))assert.ok(findPath(layout.spawn,{x:o.x,y:o.y+40},layout).length,id+' '+o.object.id);}
});
test('water is contained below the flush bridge deck and bridge posts have supported feet',()=>{
 const root=scene('ownerAmount'),decks=root.getObjectsByProperty('name','canal-bridge-deck'),water=root.getObjectsByProperty('name','canal-water-surface'),bearings=root.getObjectsByProperty('name','canal-bridge-bearing');assert.equal(water.length,2);assert.equal(decks.length,16);
 for(const d of decks){assert.ok(Math.abs(box(d).max.y+.05)<.001);assert.ok(bearings.some(b=>box(b).intersectsBox(box(d))));}
 for(const w of water){const b=box(w);assert.ok(b.max.y<box(decks[0]).min.y+.1);assert.ok(b.min.y>box(root.getObjectByName('canal-trough-bed')).max.y);assert.equal(w.userData.dynamic,true);}
 for(const x of [-25,25]){const crossing=new T.Box3(new T.Vector3(x-4.1,0,9),new T.Vector3(x+4.1,2,11));root.traverse(o=>{if(['canal-bank','canal-bank-upper','canal-coping'].includes(o.name))assert.ok(!box(o).intersectsBox(crossing),'Stone curbs must not cross the walking deck');});}
 for(const p of root.getObjectsByProperty('name','canal-bridge-post'))assert.ok(decks.some(d=>box(d).expandByScalar(.002).intersectsBox(box(p))));
});
test('correction pavilions have one physical return door, distinct fixtures and about one third of the garden area',()=>{
 const main=box(scene('ownerAmount').getObjectByName('canal-floor')).getSize(new T.Vector3());for(const id of ['repair-ownerAmount-0','repair-ownerAmount-2']){const l=layoutFor(nodes[id]),size=box(scene(id).getObjectByName('canal-floor')).getSize(new T.Vector3());assert.equal(l.gates.length,1);assert.equal(l.gates[0].exit.id,'retry');assert.ok(size.x*size.z/(main.x*main.z)>.3&&size.x*size.z/(main.x*main.z)<.38);}assert.notDeepEqual(layoutFor(nodes['repair-ownerAmount-0']).fixtures,layoutFor(nodes['repair-ownerAmount-2']).fixtures);
});
test('abacus rods meet the frame and every bead sits on a rod',()=>{
 const root=scene('repair-ownerAmount-0'),rods=root.getObjectsByProperty('name','canal-abacus-rod'),beads=root.getObjectsByProperty('name','canal-abacus-bead'),jambs=root.getObjectsByProperty('name','canal-abacus-jamb');assert.equal(rods.length,5);assert.equal(beads.length,50);for(const rod of rods)for(const jamb of jambs)assert.ok(box(rod).intersectsBox(box(jamb)));for(const bead of beads)assert.ok(rods.some(r=>box(r).containsPoint(bead.getWorldPosition(new T.Vector3()))));
});
test('neutral route signs, preserved hinges and reciprocal destinations agree after randomization and batching',()=>{
 try{for(const seed of ['canal-a','canal-b','canal-c']){setRouteSeed(seed);const main=layoutFor(nodes.ownerAmount),directory=main.objects.find(o=>o.object.kind==='wayfinding');assert.deepEqual(directory.object.routes.map(r=>r.id),[...main.gates].sort((a,b)=>a.x-b.x).map(g=>g.exit.id));for(const id of ['ownerAmount','repair-ownerAmount-0','repair-ownerAmount-2']){const n=nodes[id],l=layoutFor(n),root=new T.Group();buildCanalScene(root,n,l,helpers());batchArchitecture(root);for(const g of l.gates){g.door.apply({open:1,handle:1});for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(n.repairFor){const target=main.gates.find(t=>t.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});assert.equal(g.destinationLink.targetDoorId,target.exit.id);}}}}}finally{setRouteSeed(null);}
});
test('wrong totals cannot register receipts; correct total registers both receipts without sending or publishing',()=>{
 const start=interact(amountState(),'evidence');assert.equal(start.role,'owner');for(const choice of [0,2]){const wrong=travel(start,'route-'+choice);assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,'retry'));const returned=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.ownerAmount),g=l.gates.find(g=>g.exit.id==='route-'+choice);assert.deepEqual(returned.ledger,start.ledger);assert.equal(returned.completed.includes('ownerAmount'),false);assert.deepEqual(archiveArrival(returned,l),{position:{x:g.x,y:g.y+52},yaw:Math.PI});}
 const correct=travel(start,'route-1');assert.equal(correct.nodeId,'ownerSend');assert.equal(correct.role,'manager');assert.deepEqual(correct.ledger.ownerReceipts.map(r=>r.amount),[100,20]);assert.equal(correct.ledger.ownerSent,false);assert.equal(correct.ledger.published,false);
});
test('garden guides have three separate fictional identities with varied builds and faces',()=>{
 const ids=['ownerAmount','repair-ownerAmount-0','repair-ownerAmount-2'].map(id=>nodes[id].scene.guide.identity);assert.equal(new Set(ids).size,3);for(const id of ids)assert.ok(!['nika','arzu','afshin','rana','elnaz','ehsan','bahram','azadeh','ashkan'].includes(id));for(const key of ['height','shoulder','headWidth','skin'])assert.equal(new Set(ids.map(id=>guideIdentities[id][key])).size,3);
});
test('canal layout version discards only obsolete coordinates and preserves the valid saved ledger',()=>{
 const state=amountState(),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};map.set(KEY,JSON.stringify({state,position:{x:820,y:800,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,state);const p=layoutFor(nodes.ownerAmount).spawn;assert.ok(writeSave(storage,state,p));assert.deepEqual(readSave(storage).position,p);
});
