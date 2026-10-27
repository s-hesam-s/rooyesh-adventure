import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {newJourney,interact,travel} from '../app/src/game/campaignState.js';
import {layoutFor,walkable,findPath} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {archiveArrival} from '../app/src/game/archiveArrival.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
import {buildAtriumScene} from '../app/src/render/atriumScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {guideIdentities} from '../app/src/content/guideIdentities.js';
const ids=['publish','repair-publish-0','repair-publish-2'];
function state(){let s=newJourney('manager','atrium-test');for(const route of ['route-1','route-0','route-2','route-1','route-0'])s=travel(interact(s,'evidence'),route);return s;}
function helpers(){const cache=new Map(),material=new T.MeshStandardMaterial();return {mat:()=>material,geo:(k,fn)=>{if(!cache.has(k))cache.set(k,fn());return cache.get(k);}};}
function scene(id,layout=layoutFor(nodes[id])){const root=new T.Group();buildAtriumScene(root,nodes[id],layout,helpers());root.updateMatrixWorld(true);return root;}
const bounds=o=>new T.Box3().setFromObject(o),near=(a,b)=>bounds(a).expandByScalar(.006).intersectsBox(bounds(b));
test('atrium fixtures block walking and every document, guide and choice is reachable with body clearance',()=>{
 for(const id of ids){const l=layoutFor(nodes[id]);assert.ok(walkable(l.spawn,l,12));for(const f of l.fixtures)assert.equal(walkable({x:640+f.x*10,y:450+f.z*10},l,12),false);for(const g of l.gates)assert.ok(findPath(l.spawn,g,l).length,id+' '+g.exit.id);for(const o of l.objects.filter(o=>o.object.kind!=='wayfinding'))assert.ok(findPath(l.spawn,{x:o.x,y:o.y+40},l).length,id+' '+o.object.id);}
 const l=layoutFor(nodes.publish);for(const g of l.gates){for(let y=l.hub.y;y>=g.approach.y;y-=5)assert.ok(walkable({x:g.x,y},l,12),g.exit.id+' '+y);for(let x=Math.min(l.hub.x,g.x);x<=Math.max(l.hub.x,g.x);x+=5)assert.ok(walkable({x,y:l.hub.y},l,12));}
});
test('two independent correction rooms each have one door and roughly a third of the main floor',()=>{
 const main=bounds(scene('publish').getObjectByName('atrium-floor')).getSize(new T.Vector3());for(const id of ids.slice(1)){const root=scene(id),s=bounds(root.getObjectByName('atrium-floor')).getSize(new T.Vector3());assert.ok(s.x*s.z/(main.x*main.z)>.3&&s.x*s.z/(main.x*main.z)<.4);assert.equal(layoutFor(nodes[id]).gates.length,1);}assert.ok(scene(ids[1]).getObjectByName('atrium-fixture-workflow'));assert.ok(!scene(ids[1]).getObjectByName('atrium-fixture-calendar'));assert.ok(scene(ids[2]).getObjectByName('atrium-fixture-calendar'));
});
test('skylight fills the ceiling opening and connects to its frame; pendant rods attach at both ends',()=>{
 for(const id of ids){const root=scene(id),sky=root.getObjectByName('atrium-skylight');for(const wing of root.getObjectsByProperty('name','atrium-ceiling-wing'))assert.ok(near(wing,sky));for(const bar of root.getObjectsByProperty('name','atrium-skylight-crossbar'))assert.ok(near(bar,sky));for(const rod of root.getObjectsByProperty('name','atrium-lamp-rod')){assert.ok(root.getObjectsByProperty('name','atrium-ceiling-wing').some(o=>near(o,rod)));assert.ok(root.getObjectsByProperty('name','atrium-lamp-frame').some(o=>near(o,rod)));}}
});
test('greenhouse model roof meets rafters, crops touch their beds and soil rests on its base',()=>{
 const root=scene('publish'),model=root.getObjectByName('atrium-fixture-model'),rafters=model.getObjectsByProperty('name','atrium-model-rafter');assert.equal(rafters.length,10);for(const roof of model.getObjectsByProperty('name','atrium-model-roof-glass'))assert.ok(rafters.some(o=>near(o,roof)));assert.ok(near(model.getObjectByName('atrium-model-ground'),model.getObjectByName('atrium-model-base')));for(const crop of model.getObjectsByProperty('name','atrium-model-crop'))assert.ok(model.getObjectsByProperty('name','atrium-model-bed').some(o=>near(o,crop)));assert.equal(model.getObjectsByProperty('name','atrium-model-crop').length,48);
});
test('brochure trays connect through brackets to real posts and their packets rest on the trays',()=>{
 const root=scene('publish');for(const fixture of root.children.filter(o=>o.name==='atrium-fixture-brochure')){const brackets=fixture.getObjectsByProperty('name','atrium-brochure-bracket'),posts=fixture.getObjectsByProperty('name','atrium-brochure-post');for(const shelf of fixture.getObjectsByProperty('name','atrium-brochure-tray'))assert.ok(brackets.some(o=>near(o,shelf)));for(const bracket of brackets)assert.ok(posts.some(o=>near(o,bracket)));for(const page of fixture.getObjectsByProperty('name','atrium-sheet'))assert.ok(fixture.getObjectsByProperty('name','atrium-brochure-tray').some(o=>near(o,page)));}
});
test('desk lamp shades and calendar bindings have physical supporting connections',()=>{
 for(const id of ids){const root=scene(id);for(const shade of root.getObjectsByProperty('name','atrium-reading-lamp-shade'))assert.ok(shade.parent.children.some(o=>o.name==='atrium-reading-lamp-stem'&&near(o,shade)));for(const ring of root.getObjectsByProperty('name','atrium-calendar-binding'))assert.ok(ring.parent.children.some(o=>o.name==='atrium-calendar-board'&&near(o,ring)));for(const face of root.getObjectsByProperty('name','atrium-status-frame'))assert.ok(face.parent.children.some(o=>o.name==='atrium-status-post'&&near(o,face)));}
});
test('stone door arches rest on piers and animated leaves survive batching and return to the selected door',()=>{
 try{for(const seed of ['atrium-a','atrium-b','atrium-c']){setRouteSeed(seed);const main=layoutFor(nodes.publish),directory=main.objects.find(o=>o.object.kind==='wayfinding');assert.deepEqual(directory.object.routes.map(r=>r.id),[...main.gates].sort((a,b)=>a.x-b.x).map(g=>g.exit.id));for(const id of ids){const l=layoutFor(nodes[id]),root=scene(id,l);for(const arch of root.getObjectsByProperty('name','atrium-door-arch'))assert.equal(root.getObjectsByProperty('name','atrium-door-arch-pier').filter(o=>near(o,arch)).length,2);batchArchitecture(root);for(const g of l.gates){g.door.apply({open:1,handle:1});for(const leaf of g.door.leaves){assert.ok(leaf.pivot.parent);assert.ok(Math.abs(leaf.pivot.rotation.y)>1.5);}assert.equal(g.destinationView.userData.destinationId,g.exit.next);if(nodes[id].repairFor){const target=main.gates.find(t=>t.exit.id==='route-'+id.at(-1));assert.deepEqual(g.destinationLink.targetCenter,{x:(target.x-640)*.1,z:(target.y-450)*.1});assert.equal(g.destinationLink.targetDoorId,target.exit.id);}}}}}finally{setRouteSeed(null);}
});
test('incorrect publication choices cannot complete funding or modify the ledger and return still requires a new decision',()=>{
 const start=interact(state(),'evidence');for(const choice of [0,2]){const wrong=travel(start,'route-'+choice);assert.deepEqual(wrong.ledger,start.ledger);assert.throws(()=>travel(wrong,'retry'));const returned=travel(interact(wrong,'review'),'retry'),l=layoutFor(nodes.publish),g=l.gates.find(g=>g.exit.id==='route-'+choice);assert.deepEqual(returned.ledger,start.ledger);assert.equal(returned.completed.includes('publish'),false);assert.deepEqual(archiveArrival(returned,l),{position:{x:g.x,y:g.y+52},yaw:Math.PI});}
});
test('publication requires successful owner submission, allowed status and current date and only opens public investment',()=>{
 const start=interact(state(),'evidence');for(const invalid of [{ownerSent:false},{status:6},{end:9},{start:11}])assert.throws(()=>travel({...start,ledger:{...start.ledger,...invalid}},'route-1'));const next=travel(start,'route-1');assert.equal(next.nodeId,'naturalIdentity');assert.equal(next.role,'client');assert.equal(next.ledger.published,true);assert.equal(next.ledger.status,5);assert.equal(next.ledger.agent,false);assert.equal(next.ledger.institution,false);assert.equal(next.ledger.certificate,null);assert.equal(next.ledger.payments.length,1);assert.equal(next.ledger.payments[0].amount,120);
});
test('atrium guides have three separate new fictional faces and builds',()=>{
 const keys=ids.map(id=>nodes[id].scene.guide.identity);assert.equal(new Set(keys).size,3);for(const key of keys)assert.ok(!['nika','arzu','afshin','rana','elnaz','ehsan','bahram','azadeh','ashkan','mina','baran','babak','shahab','behnaz','behnam'].includes(key));for(const field of ['height','shoulder','headWidth','skin'])assert.equal(new Set(keys.map(key=>guideIdentities[key][field])).size,3);
});
test('publication map version rejects obsolete coordinates while preserving all valid events and receipts',()=>{
 const s=state(),map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};map.set(KEY,JSON.stringify({state:s,position:{x:1030,y:800,layout:1}}));assert.equal(readSave(storage).position,null);assert.deepEqual(readSave(storage).state,s);const p=layoutFor(nodes.publish).spawn;assert.ok(writeSave(storage,s,p));assert.deepEqual(readSave(storage).position,p);
});
