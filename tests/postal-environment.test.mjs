import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,interact,travel} from '../app/src/game/campaignState.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildPostalScene} from '../app/src/render/postalScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
const ids=['ownerSend','repair-ownerSend-1','repair-ownerSend-2'];
function state(){let s=newJourney('manager','postal-test');for(const route of ['route-1','route-0','route-2','route-1'])s=travel(interact(s,'evidence'),route);return s;}
function scene(id){const root=new T.Group(),cache=new Map(),material=new T.MeshStandardMaterial();buildPostalScene(root,nodes[id],layoutFor(nodes[id]),{mat:()=>material,geo:(k,fn)=>{if(!cache.has(k))cache.set(k,fn());return cache.get(k);}});root.updateMatrixWorld(true);return root;}
const bounds=o=>new T.Box3().setFromObject(o),near=(a,b)=>bounds(a).expandByScalar(.005).intersectsBox(bounds(b));
test('postal room fixtures match visible obstacles and every station and choice remains reachable',()=>{
 for(const id of ids){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,10));for(const f of l.fixtures)assert.equal(walkable({x:640+f.x*10,y:450+f.z*10},l,10),false);for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects.filter(o=>o.object.kind!=='wayfinding'))assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length,id+' '+o.object.id);}
});
test('postal correction rooms have one physical door, about one third the floor area and independent equipment',()=>{
 const size=bounds(scene('ownerSend').getObjectByName('postal-floor')).getSize(new T.Vector3());for(const id of ids.slice(1)){const root=scene(id),s=bounds(root.getObjectByName('postal-floor')).getSize(new T.Vector3());assert.ok(s.x*s.z/(size.x*size.z)>.3&&s.x*s.z/(size.x*size.z)<.4);assert.equal(layoutFor(nodes[id]).gates.length,1);}assert.ok(scene(ids[1]).getObjectByName('postal-fixture-packing'));assert.ok(!scene(ids[1]).getObjectByName('postal-fixture-tracking'));assert.ok(scene(ids[2]).getObjectByName('postal-fixture-tracking'));
});
test('shelf contents and trolley loads are supported; wheels connect to forks and axles',()=>{
 const root=scene('ownerSend');for(const parcel of root.getObjectsByProperty('name','postal-parcel')){const group=parcel.parent,b=bounds(parcel);assert.ok(group.children.some(o=>['postal-rack-shelf','postal-cart-tray','postal-cutting-mat'].includes(o.name)&&Math.abs(bounds(o).max.y-b.min.y)<.025),group.name);}
 for(const rail of root.getObjectsByProperty('name','postal-cart-rail'))assert.ok(rail.parent.children.filter(o=>o.name==='postal-cart-post').some(p=>near(p,rail)));for(const wheel of root.getObjectsByProperty('name','postal-cart-wheel')){assert.ok(wheel.parent.children.some(o=>o.name==='postal-caster-fork'&&near(wheel,o)));assert.ok(wheel.parent.children.some(o=>o.name==='postal-cart-axle'&&near(wheel,o)));assert.ok(Math.abs(bounds(wheel).min.y-.01)<.015);}
});
test('printer receipt exits the real slot and suspended lamps connect to ceiling and frames',()=>{
 for(const id of ids){const root=scene(id);for(const p of root.getObjectsByProperty('name','postal-printer-paper')){const siblings=p.parent.children;assert.ok(siblings.some(o=>o.name==='postal-printer-slot'&&near(p,o)));assert.ok(siblings.some(o=>o.name==='postal-printer-receipt'&&near(p,o)));}for(const rod of root.getObjectsByProperty('name','postal-lamp-rod')){assert.ok(near(rod,root.getObjectByName('postal-ceiling')));assert.ok(root.getObjectsByProperty('name','postal-lamp-frame').some(o=>near(rod,o)));}}
});
test('sorting pockets contain packets and their address/flap layers touch the envelope',()=>{
 const root=scene('ownerSend'),sorter=root.getObjectByName('postal-fixture-pigeonholes');for(const o of sorter.getObjectsByProperty('name','postal-envelope')){const b=bounds(o);assert.ok(sorter.children.some(s=>s!==o&&['postal-sorter-shelf','postal-envelope'].includes(s.name)&&Math.abs(bounds(s).max.y-b.min.y)<.025));}for(const flap of root.getObjectsByProperty('name','postal-envelope-flap'))assert.ok(flap.parent.children.some(p=>p.name==='postal-envelope'&&near(flap,p)));
});
test('randomized postal directory, working hinges and reverse destinations agree in both side rooms',()=>{
 try{for(const seed of ['postal-a','postal-b','postal-c']){setRouteSeed(seed);const main=layoutFor(nodes.ownerSend),directory=main.objects.find(o=>o.object.kind==='wayfinding');assert.deepEqual(directory.object.routes.map(r=>r.id),[...main.gates].sort((a,b)=>a.x-b.x).map(g=>g.exit.id));for(const id of ids){const n=nodes[id],l=layoutFor(n);const testRoot=new T.Group(),material=new T.MeshStandardMaterial(),cache=new Map();buildPostalScene(testRoot,n,l,{mat:()=>material,geo:(k,fn)=>{if(!cache.has(k))cache.set(k,fn());return cache.get(k);}});batchArchitecture(testRoot);for(const g of l.gates){g.door.apply({open:1,handle:1});for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(n.repairFor){const target=main.gates.find(t=>t.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});assert.equal(g.destinationLink.targetDoorId,target.exit.id);}}}}}finally{setRouteSeed(null);}
});
test('incomplete contents and missing tracking cannot send receipts; valid success sends both without publishing',()=>{
 const start=interact(state(),'evidence');assert.equal(start.role,'manager');for(const choice of [1,2]){const wrong=travel(start,'route-'+choice);assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,'retry'));const returned=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.ownerSend),g=l.gates.find(g=>g.exit.id==='route-'+choice);assert.deepEqual(returned.ledger,start.ledger);assert.equal(returned.completed.includes('ownerSend'),false);assert.deepEqual(archiveArrival(returned,l),{position:{x:g.x,y:g.y+52},yaw:Math.PI});}const sent=travel(start,'route-0');assert.equal(sent.nodeId,'publish');assert.ok(sent.ledger.ownerSent);assert.ok(sent.ledger.ownerReceipts.every(r=>r.sent));assert.equal(sent.ledger.published,false);
});
test('postal guides have three new fictional identities and separate body and facial proportions',()=>{
 const keys=ids.map(id=>nodes[id].scene.guide.identity);assert.equal(new Set(keys).size,3);for(const key of keys)assert.ok(!['nika','arzu','afshin','rana','elnaz','ehsan','bahram','azadeh','ashkan','mina','baran','babak'].includes(key));for(const field of ['height','shoulder','headWidth','skin'])assert.equal(new Set(keys.map(key=>guideIdentities[key][field])).size,3);
});
test('postal map invalidates obsolete coordinates while preserving receipts and valid journey history',()=>{
 const s=state(),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};map.set(KEY,JSON.stringify({state:s,position:{x:240,y:800,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,s);const p=layoutFor(nodes.ownerSend).spawn;assert.ok(writeSave(storage,s,p));assert.deepEqual(readSave(storage).position,p);
});

test('weighing pan connects to load cells, display has a stem and review notices stay clear of sorting cabinets',()=>{
 const root=scene('ownerSend'),scale=root.getObjectByName('postal-fixture-scale'),pan=scale.getObjectByName('postal-scale-pan');for(const cell of scale.getObjectsByProperty('name','postal-scale-loadcell'))assert.ok(near(cell,pan));assert.ok(near(scale.getObjectByName('postal-scale-display'),scale.getObjectByName('postal-scale-neck')));
 const room=scene('repair-ownerSend-1'),paper=bounds(room.getObjectByName('postal-notice-paper')),cabinet=bounds(room.getObjectByName('postal-fixture-pigeonholes'));assert.ok(paper.min.x>cabinet.max.x);
});
test('all three postal approach lanes have clearance for the walking body rather than only a point path',()=>{
 const l=layoutFor(nodes.ownerSend);for(const gate of l.gates){for(let y=l.hub.y;y>=gate.approach.y;y-=5)assert.ok(walkable({x:gate.x,y},l,12),gate.exit.id+' '+y);for(let x=Math.min(l.hub.x,gate.x);x<=Math.max(l.hub.x,gate.x);x+=5)assert.ok(walkable({x,y:l.hub.y},l,12));}
});