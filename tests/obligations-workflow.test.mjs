import * as T from '../app/vendor/three.module.js';
import {buildObligationsScene} from '../app/src/render/obligationsScene.js';
import {batchArchitecture} from '../app/src/render/missionBatches.js';
import {obligationsNode} from '../app/src/game/obligationsRoom.js';
import {canInspectFrom} from '../app/src/game/firstPerson.js';
import test from 'node:test';
import {obligationsDates} from '../app/src/game/obligationsCalendar.js';
import assert from 'node:assert/strict';
import {createEnvironmentTestJourney} from '../app/src/game/environmentTest.js';
import {obligationsAct,restoreJourney} from '../app/src/game/campaignState.js';
import {obligationsLayout} from '../app/src/game/obligationsRoom.js';
import {walkable,findPath} from '../app/src/game/world.js';

test('obligations can finish without the guide and register exactly one reconciled payment',()=>{
 let state=createEnvironmentTestJourney('schedule','test-obligations');
 const act=(action,value)=>{state=obligationsAct(state,action,value);};
 const plan={annual:'۲۴',interval:'۳',duration:'۱۲',count:'۴',amount:'۶۰'};
 assert.throws(()=>act('schedule',plan));
 assert.throws(()=>act('take-contract'));
 act('open-cabinet');act('take-contract');
 assert.equal(restoreJourney(state).obligations.job,'pickup');
 act('pickup-finish');act('place-contract');
 assert.throws(()=>act('schedule',plan));
 act('open-contract');
 assert.throws(()=>act('schedule',{...plan,amount:'۲۴۰'}));
 act('schedule',plan);
 assert.deepEqual(state.ledger.schedule.map(r=>[r.month,r.amount,r.paid]),[[3,60,false],[6,60,false],[9,60,false],[12,60,false]]);
 assert.throws(()=>act('advance'));
 assert.throws(()=>act('print'));
 assert.equal(restoreJourney(state).obligations.job,'print');
 act('print-finish');
 assert.throws(()=>act('calendar'));
 act('take-plan');act('dock-plan');act('calendar');
 assert.throws(()=>act('take-bank'));
 assert.equal(restoreJourney(state).obligations.job,'calendar');
 act('calendar-finish');assert.throws(()=>act('take-bank'));
 act('receive-finish');act('take-bank');act('load');act('scan');act('scan-finish');
 const payment={installment:'۱',amount:'۶۰',success:'yes'};
 assert.throws(()=>act('payment',{...payment,installment:'۲'}));
 assert.throws(()=>act('payment',{...payment,success:'no'}));
 assert.throws(()=>act('payment',payment));
 act('unload');act('payment',payment);
 assert.equal(state.ending,null);
 assert.equal(state.nodeId,'payment');
 assert.deepEqual(state.ledger.schedule.map(r=>r.paid),[true,false,false,false]);
 assert.equal(state.ledger.interestPayments.length,1);
 assert.deepEqual(restoreJourney(state),state);
 assert.throws(()=>act('payment',payment));
 assert.throws(()=>act('cut-ribbon'));
 const locked=obligationsLayout(state);
 assert.equal(walkable({x:482,y:610},locked,10),false);
 act('open-ceremony-door');act('door-finish');
 const outdoor=obligationsLayout(state),ribbon=outdoor.objects.find(e=>e.object.id==='ceremony-ribbon');
 assert.ok(walkable({x:482,y:610},outdoor,10));
 assert.ok(findPath(outdoor.spawn,ribbon,outdoor).length);
 act('cut-ribbon');
 assert.equal(state.ending,null);
 assert.equal(restoreJourney(state).obligations.job,'ribbon');
 act('ribbon-finish');
 assert.equal(state.ending,'campaign');
 assert.deepEqual(restoreJourney(state),state);
});

test('each station in the obligations office is reachable from its spawn',()=>{
 const layout=obligationsLayout();
 assert.ok(walkable(layout.spawn,layout,10));
 for(const entry of layout.objects){
  assert.ok(walkable(entry,layout,10),entry.object.id);
  assert.ok(findPath(layout.spawn,entry,layout).length,entry.object.id);
  if(['scanner','payment'].includes(entry.object.id)){
   const {maxY}=entry.object.access;
   assert.ok(canInspectFrom(entry,entry,Math.PI),entry.object.id);
   assert.equal(canInspectFrom({x:entry.x,y:maxY+12},entry,0),false,entry.object.id);
  }
 }
});

test('the calendar adds three Persian months and clamps a missing destination day',()=>{
 const regular=obligationsDates('2026-11-04T08:00:00Z');
 assert.equal(regular.end,Date.UTC(2027,1,2));
 const shortMonth=obligationsDates('2024-09-21T21:00:00Z');
 assert.equal(shortMonth.start,Date.UTC(2024,8,22));
 const monthEnd=obligationsDates('2024-09-21T10:00:00Z');
 assert.equal(monthEnd.end,Date.UTC(2024,11,20));
});


test('batching the obligations office preserves animated controls and avoids rebuilding idle ribbon geometry',t=>{
 const previousDocument=globalThis.document;
 const context=new Proxy({}, {get:()=>()=>{}});
 globalThis.document={createElement:()=>({getContext:()=>context})};
 try{
  const materials=new Map(),geometries=new Map(),boxes=[];
  const mat=color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color}));return materials.get(color);};
  const box=(parent,x,y,z,w,height,depth,color)=>{
   const key=[w,height,depth].join(',');
   if(!geometries.has(key))geometries.set(key,new T.BoxGeometry(w,height,depth));
   const mesh=new T.Mesh(geometries.get(key),mat(color));mesh.position.set(x,y,z);parent.add(mesh);boxes.push(mesh);return mesh;
  };
  const beam=(parent,a,b,width,color)=>{
   const start=new T.Vector3(...a),end=new T.Vector3(...b),mesh=box(parent,0,0,0,width,start.distanceTo(end),width,color);
   mesh.position.copy(start).lerp(end,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return mesh;
  };
  const root=new T.Group();buildObligationsScene(root,obligationsNode,obligationsLayout(),{box,beam,mat,tree(){}});
  const drawer=boxes.find(mesh=>mesh.position.x===0&&mesh.position.y===0&&mesh.geometry.parameters.height===1.03).parent;
  const scan=boxes.find(mesh=>mesh.geometry.parameters.width===2.48&&mesh.geometry.parameters.height===.018);
  const lamp=boxes.find(mesh=>mesh.geometry.parameters.width===.24&&mesh.geometry.parameters.height===.1);
  const ribbon=[];root.traverse(mesh=>{if(mesh.geometry?.parameters.widthSegments===24)ribbon.push(mesh.geometry);});
  let before=0;root.traverse(mesh=>{if(mesh.isMesh)before++;});
  const result=batchArchitecture(root);assert.ok(result.removed>100,JSON.stringify(result));
  let after=0;root.traverse(mesh=>{if(mesh.isMesh)after++;});
  t.diagnostic('Office render meshes '+before+' -> '+after+'; batches '+result.batches);
  for(const mesh of [scan,lamp]){assert.ok(mesh.parent);assert.equal(mesh.userData.dynamic,true);}
  const camera=new T.PerspectiveCamera();camera.position.set(-19,4.8,5);
  const state={startedAt:'2026-11-07T08:00:00Z',ledger:{schedule:[]},obligations:{cabinetOpen:true,job:null,held:null}};
  const update=()=>root.userData.obligationsUpdate(state,camera,false,{jobElapsed:1,dt:1/60,reduced:true,carry:{}});
  update();assert.ok(drawer.position.z<7);
  const versions=ribbon.map(geometry=>geometry.attributes.position.version);
  update();assert.deepEqual(ribbon.map(geometry=>geometry.attributes.position.version),versions);
  state.obligations.job='scan';update();assert.equal(scan.visible,true);
  state.obligations.job='print';update();assert.equal(lamp.visible,true);
  state.obligations.job=null;state.obligations.held='contract';
  assert.ok(update().hands.left.visible);
  root.updateMatrixWorld(true);root.traverse(mesh=>assert.ok(mesh.matrixWorld.elements.every(Number.isFinite)));
  assert.equal(root.getObjectByName('courtyard-disco-ball'),undefined);
  assert.equal(root.getObjectByName('courtyard-thanks-sign'),undefined);
 }finally{globalThis.document=previousDocument;}
});
