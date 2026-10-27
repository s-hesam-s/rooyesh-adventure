import {sourceRig} from './helpers/guideRig.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {layoutFor,walkable} from '../app/src/game/world.js';
import {advanceFirstPerson} from '../app/src/game/firstPerson.js';
import {documentHandlingPose,documentHandlingCues,documentHandlingDuration} from '../app/src/game/documentHandling.js';
import {extractHandGeometry,createArchiveHands} from '../app/src/render/archiveHands.js';
const layout=layoutFor(nodes.project);
test('archive has a continuous walkable floor instead of invisible road edges',()=>{
 for(const p of [{x:640,y:800},{x:640,y:840},{x:640,y:850},{x:520,y:700},{x:760,y:600},{x:500,y:400},{x:780,y:400},{x:640,y:240}])assert.ok(walkable(p,layout,10),JSON.stringify(p));
 assert.equal(layout.objects.filter(e=>e.object.kind==='wayfinding').length,1);
});
test('red rope boundaries, shelves and desks are impassable',()=>{
 for(const b of layout.floorPlan.barriers){const p={x:(b.a.x+b.b.x)/2,y:(b.a.y+b.b.y)/2};assert.equal(walkable(p,layout,10),false);}
 for(const r of [...layout.floorPlan.reserved,...layout.floorPlan.solids])assert.equal(walkable({x:(r.minX+r.maxX)/2,y:(r.minY+r.maxY)/2},layout,10),false);
});
test('formerly white floor supports smooth movement at different frame rates',()=>{
 for(const fps of [20,30,60,120]){let p={x:530,y:720};for(let i=0;i<fps;i++)p=advanceFirstPerson(p,1,0,1/fps,layout);assert.ok(Math.abs(p.x-670)<.001);assert.equal(p.y,720);}
 let p={x:640,y:850};for(let i=0;i<60;i++)p=advanceFirstPerson(p,0,-1,1/60,layout);assert.ok(Math.abs(p.y-710)<.001,'vestibule has no invisible seam');
});
test('the largest allowed frame cannot tunnel through ropes',()=>{
 let p={x:1135,y:500};for(let i=0;i<10;i++)p=advanceFirstPerson(p,1,0,.15,layout);assert.ok(p.x<1170);assert.ok(walkable(p,layout,10));
});
test('all three choices remain reachable across the open floor',()=>{
 const step=10,start={x:640,y:800},seen=new Set(['640,800']),queue=[start];
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const q={x:p.x+dx,y:p.y+dy},key=q.x+','+q.y;if(!seen.has(key)&&walkable(q,layout,10)){seen.add(key);queue.push(q);}}}
 for(const gate of layout.gates)assert.ok(queue.some(p=>Math.hypot(p.x-gate.x,p.y-gate.y)<29),'cannot reach closed door trigger '+gate.exit.id);
 const directory=nodes.project.objects.find(o=>o.kind==='wayfinding');assert.deepEqual(directory.routes,nodes.project.exits.map(e=>({id:e.id,label:e.label})));
});
test('document becomes hidden only after it is fully inside the open bag',()=>{
 const before=documentHandlingPose(3.73),after=documentHandlingPose(3.75);assert.ok(before.documentVisible);assert.equal(after.documentVisible,false);assert.ok(before.bag.open>.9);
 const documentTop=before.document.position[1]+.3;const mouth=before.bag.position[1]+.31;assert.ok(documentTop<mouth);assert.ok(documentHandlingPose(4.45).bag.open===0);assert.ok(documentHandlingPose(documentHandlingDuration).complete);
 for(let time=0;time<5;time+=.013){const p=documentHandlingPose(time);for(const numbers of [p.document.position,p.document.rotation,p.left.position,p.right.position,p.bag.position])assert.ok(numbers.every(Number.isFinite));}
});
test('pickup, insertion and zipper cues fire exactly once even with skipped frames',()=>{
 for(const reduced of [false,true]){let cues=[],duration=reduced?.9:4.9;for(let time=0;time<duration+.2;time+=.17)cues.push(...documentHandlingCues(time,time+.17,reduced));assert.deepEqual(cues,['grab','insert','zip','done']);assert.equal(documentHandlingPose(duration,reduced).complete,true);}
});
test('actual local human rig supplies five articulated fingers without changing the source mesh',()=>{
 const source=sourceRig();let original;source.traverse(o=>{if(o.isSkinnedMesh)original=o;});const count=original.geometry.index.count,positions=original.geometry.attributes.position.array.slice();
 for(const side of ['Left','Right']){const hand=extractHandGeometry(original.geometry,original.skeleton,side);assert.ok(hand.index.count>6000);assert.ok(hand.index.count<count);assert.equal(original.skeleton.bones.filter(b=>b.name.startsWith('mixamorig'+side+'Hand')).length,21);}
 const camera=new T.PerspectiveCamera(),rig=createArchiveHands(camera,source);for(const aspect of [.6,1.78,2.4])for(const time of [0,1.7,2.65,3.45,4.3,4.9]){rig.update({pose:documentHandlingPose(time),time,aspect});camera.updateMatrixWorld(true);rig.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}
 rig.update({visible:false});assert.equal(rig.root.visible,false);assert.equal(original.geometry.index.count,count);assert.deepEqual(original.geometry.attributes.position.array,positions);
});
