import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {nodes} from '../app/src/content/campaign.js';
import {layoutFor} from '../app/src/game/world.js';
import {setRouteSeed} from '../app/src/game/routePlacement.js';
import {buildArchiveRoomViews} from '../app/src/render/archiveRoomView.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {playerAppearances,createPlayerWear} from '../app/src/render/playerAppearance.js';
import {createArchiveHands} from '../app/src/render/archiveHands.js';
import {documentHandlingPose} from '../app/src/game/documentHandling.js';
import {sourceRig} from './helpers/guideRig.mjs';

test('each wrong doorway previews its own actual destination and survives batching while hidden',()=>{
 try{for(const seed of ['room-a','room-b','room-c']){
  setRouteSeed(seed);const layout=layoutFor(nodes.project),root=new T.Group(),geos=new Map();
  buildArchiveRoomViews(root,layout,{geo:(k,f)=>{if(!geos.has(k))geos.set(k,f());return geos.get(k);}});batchArchitecture(root);root.updateMatrixWorld(true);
  const previews=layout.gates.filter(g=>g.destinationView);assert.equal(previews.length,2);
  assert.deepEqual(new Set(previews.map(g=>g.destinationView.userData.destinationId)),new Set(['repair-project-0','repair-project-2']));
  for(const g of previews){const p=g.destinationView;assert.equal(p.parent,root);assert.equal(p.visible,false);const bounds=new T.Box3().setFromObject(p);assert.ok(bounds.max.z<(g.y-450)*.1);assert.ok(bounds.min.y<.02&&bounds.max.y>8);const eye=new T.Vector3((g.x-640)*.1,4.8,(g.y-450)*.1+1.5),ray=new T.Raycaster(eye,new T.Vector3(0,0,-1));assert.ok(ray.intersectObject(p).length);}
 }}finally{setRouteSeed(null);}
});
test('four player roles have distinct wearable geometry and only their own accessories remain visible after switching',()=>{
 const group=new T.Group(),left=createPlayerWear(group,-1),right=createPlayerWear(group,1);
 assert.equal(new Set(Object.values(playerAppearances).map(p=>p.accessory)).size,4);
 assert.equal(new Set(Object.values(playerAppearances).map(p=>p.cuff)).size,4);
 for(const role of [...Object.keys(playerAppearances),'manager']){
  left.update(role);right.update(role);assert.deepEqual(left.root.children.filter(o=>o.visible).map(o=>o.name),['wear-'+role]);assert.ok(left.root.getObjectByName(playerAppearances[role].accessory));
  group.updateMatrixWorld(true);group.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
 }
});
test('natural hand rig preserves role-specific hand size, sleeve width and accessories during all pickup phases',()=>{
 const camera=new T.PerspectiveCamera(),rig=createArchiveHands(camera,sourceRig()),sizes=[];
 for(const role of Object.keys(playerAppearances)){
  for(const time of [0,1.7,2.65,3.45,4.3]){rig.update({role,pose:documentHandlingPose(time),time});camera.updateMatrixWorld(true);rig.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}
  const hand=rig.root.getObjectByName('archive-left-hand');sizes.push(hand.scale.x);const anchor=rig.root.getObjectByName('fitted-left-wrist-anchor');assert.equal(anchor.getObjectByName('wear-'+role).visible,true);assert.ok(anchor.position.distanceTo(hand.position)<1e-8);assert.equal(hand.scale.x,playerAppearances[role].handScale);
 }
 assert.equal(new Set(sizes).size,4);rig.update({visible:false});assert.equal(rig.root.visible,false);
});

test('wrist bands have outward-facing outer surfaces and bounded, finite geometry',async()=>{
 const {wristBandGeometry}=await import('../app/src/render/wristAccessories.js'),g=wristBandGeometry(.072,.05,.038,.0035),p=g.attributes.position,n=g.attributes.normal;
 for(let i=2;i<p.count;i+=4){const outward=p.getX(i)*n.getX(i)+p.getY(i)*n.getY(i);assert.ok(outward>0,'outer strap surface must face away from the wrist');}
 for(const attribute of Object.values(g.attributes))assert.ok([...attribute.array].every(Number.isFinite));assert.equal(g.index.count,96*24);g.dispose();
});
test('detailed watches and bracelet fit a wrist and stay within the accessory render budget',async()=>{
 const {createWristAccessory}=await import('../app/src/render/wristAccessories.js');
 for(const role of ['manager','owner','client','legal']){
  const root=createWristAccessory(role);root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root);
  assert.ok(bounds.min.x>-.09&&bounds.max.x<.09);assert.ok(bounds.min.y>-.065&&bounds.max.y<.09);assert.ok(bounds.max.z<.13);
  let drawObjects=0,triangles=0;root.traverse(o=>{if(o.isMesh){drawObjects++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  assert.ok(drawObjects<=24,'repeated links and stitches must be batched');assert.ok(triangles<100000);
  if(role!=='legal'){const watch=root.getObjectByName('watch-case');assert.ok(watch);assert.ok(root.getObjectByName('watch-crystal'));assert.ok(role==='owner'?root.getObjectByName('recessed-digital-display'):root.getObjectByName('minute-hand'));}
 }
});
