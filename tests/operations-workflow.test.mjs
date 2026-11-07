import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {createEnvironmentTestJourney} from '../app/src/game/environmentTest.js';
import {operationsAct,restoreJourney,journeyLog} from '../app/src/game/campaignState.js';
import {operationsFields,inOperations,operationsDurations} from '../app/src/game/operationsWorkflow.js';
import {operationsNode,operationsLayout,operationsFixtures,operationsBoundary} from '../app/src/game/operationsRoom.js';
import {operationsPanel} from '../app/src/ui/operationsUI.js';
import {buildOperationsScene} from '../app/src/render/operationsScene.js';
import {walkable,findPath} from '../app/src/game/world.js';
import {canInspectFrom} from '../app/src/game/firstPerson.js';
import {readSave,writeSave,KEY} from '../app/src/game/campaignStorage.js';
const act=(s,a,v)=>operationsAct(s,a,a==='begin'&&v===undefined?1:v),begin=()=>act(createEnvironmentTestJourney('verifyBank','operations-test'),'begin');
function bankVerified(){let s=begin();for(const [a,v]of [['intake'],['bank'],['bank-finish'],['bank-record','exact'],['verify-bank']])s=act(s,a,v);return s;}
function scan(s,id){for(const [a,v]of [['take',id],['lid'],['load'],['lid'],['scan'],['scan-finish'],['lid'],['unload'],['lid'],['return']])s=act(s,a,v);return s;}
function approved(){let s=scan(bankVerified(),'original');for(const key of operationsFields)s=act(s,'check',key);return act(s,'verify-receipt');}
function sent(){let s=approved();for(const [a,v]of [['query'],['query-finish'],['send','N-200'],['send-finish']])s=act(s,a,v);return s;}
function completed(){let s=sent();for(const a of ['print','print-finish','collect-report','assemble','collect-case'])s=act(s,a);return s;}
function built(){const root=new T.Group(),cache=new Map(),mat=new T.MeshStandardMaterial();buildOperationsScene(root,operationsNode,operationsLayout(),{mat:()=>mat,geo:(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);}});return root;}
test('operations completes all three canonical decisions without guide and keeps N-80 separate from N-200',()=>{let s=bankVerified(),online=s.ledger.payments.find(p=>p.id==='N-80');assert.equal(online.status,'paid');assert.equal(online.sync,'unknown');assert.equal(s.ledger.payments.find(p=>p.id==='N-200').status,'submitted');s=completed();assert.equal(s.nodeId,'legalIdentity');assert.equal(inOperations(s),true);assert.equal(s.role,'manager');assert.equal(s.operations.onlineTrace,'FB-80');assert.equal(s.operations.slipTrace,'FB-200');assert.equal(s.ledger.payments.find(p=>p.id==='N-80').trace,'FB-80');assert.equal(s.ledger.payments.find(p=>p.id==='N-200').trace,'FB-200');assert.deepEqual(s.ledger.payments.map(p=>({id:p.id,amount:p.amount})),[{id:'OWNER',amount:120},{id:'N-200',amount:200},{id:'N-80',amount:80}]);assert.equal(act(s,'leave').operations.done,true);assert.equal(act(s,'leave').role,'legal');assert.ok(journeyLog(s).some(e=>e.label.includes('FB-80')));});
test('wrong bank amount and uncertain result never confirm a payment and can be corrected locally',()=>{let s=begin();for(const a of ['intake','bank','bank-finish'])s=act(s,a);for(const v of ['mismatch','pending']){s=act(s,'bank-record',v);s=act(s,'verify-bank');assert.equal(s.operations.issue,'bank');assert.equal(s.ledger.payments.find(p=>p.id==='N-80').status,'pending');}s=act(act(s,'bank-record','exact'),'verify-bank');assert.equal(s.operations.bankVerified,true);});
test('copy and future-dated receipts are rejected even after scanning and checking every field',()=>{let s=bankVerified();for(const id of ['copy','future']){s=scan(s,id);for(const key of operationsFields)s=act(s,'check',key);s=act(s,'verify-receipt');assert.equal(s.operations.issue,'receipt');assert.equal(s.ledger.receiptChecked,false);assert.equal(s.nodeId,'receiptCheck');}s=scan(s,'original');for(const key of operationsFields)s=act(s,'check',key);assert.equal(act(s,'verify-receipt').ledger.receiptChecked,true);});
test('financial operations require real prerequisites and cannot resend online or duplicate paper submission',()=>{let s=begin();for(const a of ['bank','scan','send','query','print','collect-report','assemble','leave','send-finish','query-finish'])assert.throws(()=>act(s,a,'N-80'));s=approved();assert.throws(()=>act(s,'send','N-200'));s=act(act(s,'query'),'query-finish');assert.throws(()=>act(s,'send','N-80'));assert.throws(()=>act(s,'query'));s=act(act(s,'send','N-200'),'send-finish');assert.throws(()=>act(s,'send','N-200'));assert.throws(()=>act(s,'send-finish'));assert.throws(()=>act(s,'leave'));assert.deepEqual(s.ledger.payments.map(p=>({id:p.id,amount:p.amount})),[{id:'OWNER',amount:120},{id:'N-200',amount:200},{id:'N-80',amount:80}]);});
test('scanner requires loaded paper and closed lid, and jobs cannot be overwritten',()=>{let s=act(begin(),'intake');s=act(s,'take','copy');assert.throws(()=>act(s,'load'));s=act(act(s,'lid'),'load');assert.throws(()=>act(s,'scan'));s=act(act(s,'lid'),'scan');for(const a of ['bank','lid','unload','take'])assert.throws(()=>act(s,a,'original'));assert.equal(act(s,'scan-finish').operations.scanned[0],'copy');assert.ok(Object.values(operationsDurations).every(n=>n>=2));});
test('operation events replay and forged raw flags cannot bypass validation; obsolete layout positions reset',()=>{const s=completed(),restored=restoreJourney({...s,operations:{...s.operations,slipTrace:'FORGED'}});assert.deepEqual(restored.operations,s.operations);const bad=structuredClone(s);bad.events=bad.events.filter(e=>!(e.kind==='operations'&&e.action==='query-finish'));assert.throws(()=>restoreJourney(bad));const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};writeSave(storage,s,{x:500,y:550});assert.deepEqual(readSave(storage).position,{x:500,y:550});const raw=JSON.parse(store.get(KEY));raw.position.layout=2;store.set(KEY,JSON.stringify(raw));assert.equal(readSave(storage).position,null);assert.equal(readSave(storage).state.operations.slipTrace,'FB-200');});
test('chamfered layout has one real exit and connected accessible workstation fronts',()=>{const l=operationsLayout();assert.equal(l.gates.length,1);assert.equal(l.gates[0].exit.next,'legalIdentity');assert.equal(operationsBoundary.length,6);assert.ok(walkable(l.spawn,l,10));for(const e of l.objects){assert.ok(walkable(e,l,10),e.object.id+' standing');assert.ok(findPath(l.spawn,e,l).length,e.object.id+' route');if(e.object.access){const a=e.object.access,yaw=Math.atan2(-(a.lookX-e.x),-(a.lookY-e.y));assert.ok(canInspectFrom(e,e,yaw),e.object.id+' access');}}assert.equal(l.gates.some(g=>g.exit.next.startsWith('repair')),false);});
test('review table and guide support side access while powered devices reject operation from behind',()=>{const l=operationsLayout();for(const id of ['review','guide','bank','scanner','dispatch','printer']){const e=l.objects.find(e=>e.object.id===id),a=e.object.access,p={x:a.lookX,y:a.minY-22},yaw=Math.atan2(-(a.lookX-p.x),-(a.lookY-p.y));assert.equal(canInspectFrom(p,e,yaw),['review','guide'].includes(id),id);}});
test('new environment has recognizable supported equipment and finite geometry with bounded complexity',()=>{const root=built();for(const name of ['operations-woven-access-floor','operations-light-table-diffuser','operations-magnifier-lens','operations-scan-carriage','operations-network-port','operations-network-rack','operations-ups-cabinet','operations-printer-feed-roller','operations-entry-frame','operations-secure-shredder','operations-ceiling-hanger','operations-tray-crosslink'])assert.ok(root.getObjectByName(name),name);let vertices=0;root.updateWorldMatrix(true,true);root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry){vertices+=o.geometry.attributes.position.count;assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));}});assert.ok(vertices<1500000,'bounded mesh cost '+vertices);assert.ok(operationsFixtures.length>=15);});
test('scanner head and printer paper animate with the job while reduced motion remains meaningful',()=>{const root=built(),camera=new T.PerspectiveCamera(72,16/9,.08,650);let s=act(begin(),'intake');s=act(s,'take','original');for(const a of ['lid','load','lid','scan'])s=act(s,a);root.userData.operationsUpdate(s,1/60,camera,false,{jobElapsed:.2});const beam=root.getObjectByName('operations-scan-carriage'),z=beam.position.z;root.userData.operationsUpdate(s,1/60,camera,false,{jobElapsed:2});assert.ok(beam.position.z>z);assert.equal(beam.visible,true);root.userData.operationsUpdate(s,1/60,camera,false,{jobElapsed:1,reduced:true});assert.equal(beam.position.z,0);s=act(sent(),'print');root.userData.operationsUpdate(s,1/60,camera,false,{jobElapsed:0});const paper=root.getObjectByName('operations-printed-report'),start=paper.position.z;root.userData.operationsUpdate(s,1/60,camera,false,{jobElapsed:2});assert.ok(paper.position.z>start);root.userData.operationsUpdate(act(s,'print-finish'),1/60,camera,false,{});assert.equal(paper.visible,true);});
test('operations carries the same lower left-hand grip immediately and follows camera translation and rotation',()=>{const root=built(),camera=new T.PerspectiveCamera(72,.87,.08,650),s=begin();const p=root.userData.operationsUpdate(s,1/60,camera,false,{carry:{blend:.5}}),g=root.getObjectByName('operations-held-dossier');assert.equal(p.hands.left.grasp,'reference-paper');assert.equal(p.hands.right.visible,false);assert.equal(g.scale.x,p.scale);const local=()=>g.position.clone().sub(camera.position).applyQuaternion(camera.quaternion.clone().invert()),first=local();camera.position.set(8,4,-9);camera.rotation.set(-.2,1.4,0,'YXZ');root.userData.operationsUpdate(s,1/60,camera,false,{carry:{blend:.5}});assert.ok(local().distanceTo(first)<1e-6);});
test('panels show only station data and actions; guide remains optional and all actions are keyboard buttons',()=>{for(const id of ['intake','bank','review','scanner','dispatch','printer','pack','guide']){const p=operationsPanel(begin(),id);assert.ok(p.title);assert.ok(p.body.includes('button')||p.guide);}const p=operationsPanel(sent(),'dispatch');assert.ok(p.body.includes('FB-80'));assert.ok(p.body.includes('FB-200'));assert.equal(p.body.includes('data-operations-value="N-80"'),false);});

test('monitor necks remain behind the readable screen and printed sheet rests fully on its physical output tray',()=>{const root=built();root.updateWorldMatrix(true,true);for(const name of ['operations-bank','operations-online-status','operations-slip-status']){const neck=root.getObjectByName(name+'-neck'),screen=root.getObjectByName(name+'-screen'),box=new T.Box3().setFromObject(neck);assert.ok(box.max.z<screen.getWorldPosition(new T.Vector3()).z,name+' neck occludes display');assert.ok(root.getObjectByName(name+'-vesa-mount'));}const camera=new T.PerspectiveCamera();root.userData.operationsUpdate(act(act(sent(),'print'),'print-finish'),1/60,camera,false,{});root.updateWorldMatrix(true,true);const sheet=root.getObjectByName('operations-printed-report'),tray=root.getObjectByName('operations-printer-output-tray'),paperBox=new T.Box3().setFromObject(sheet),trayBox=new T.Box3().setFromObject(tray);assert.ok(paperBox.min.x>=trayBox.min.x&&paperBox.max.x<=trayBox.max.x);assert.ok(paperBox.min.z>=trayBox.min.z&&paperBox.max.z<=trayBox.max.z);assert.ok(paperBox.min.y>=trayBox.max.y&&paperBox.min.y-trayBox.max.y<.012,'paper supported on tray');assert.equal(sheet.rotation.y,0);});

test('modern operations tracks the original through each station and restores the complete route',()=>{
 const root=built(),camera=new T.PerspectiveCamera();
 let s=operationsAct(createEnvironmentTestJourney('verifyBank','operations-test'),'begin');
 const run=(action,value)=>{s=act(s,action,value);assert.deepEqual(restoreJourney(s),s,action);};
 const visible=name=>{
  root.userData.operationsUpdate(s,1/60,camera,false,{reduced:true});
  const mesh=root.getObjectByName(name);
  for(let parent=mesh;parent;parent=parent.parent)if(!parent.visible)return false;
  return true;
 };
 assert.equal(s.operations.version,2);
 run('intake');
 assert.throws(()=>act(s,'bank'));
 assert.equal(visible('operations-intake-original'),false);
 run('open-bundle');
 assert.equal(visible('operations-intake-original'),true);
 assert.equal(visible('operations-intake-online'),true);
 for(const a of ['bank','bank-finish'])run(a);
 run('bank-record','exact');run('verify-bank');
 assert.throws(()=>act(s,'take','copy'));
 run('take','original');
 assert.equal(visible('operations-intake-original'),false);
 assert.throws(()=>act(act(s,'lid'),'load'));
 run('place-review');
 assert.equal(visible('operations-review-original'),true);
 assert.equal(visible('operations-review-copy'),false);
 assert.throws(()=>act(s,'lift-review'));
 for(const field of operationsFields.filter(field=>field!=='image'))run('check',field);
 for(const a of ['lift-review','lid','load','lid','scan','scan-finish'])run(a);
 assert.throws(()=>act(s,'check','image'));
 run('lid');run('unload');run('check','image');run('verify-receipt');
 assert.throws(()=>act(s,'query'));
 run('file-original');
 assert.equal(visible('operations-filed-original'),true);
 run('query');run('query-finish');
 assert.equal(s.operations.onlineTrace,'FB-80');
 assert.throws(()=>act(s,'send','N-80'));
 run('send','N-200');
 for(const a of ['send-finish','print','print-finish','collect-report','assemble','collect-case','leave'])run(a);
 assert.equal(s.operations.slipTrace,'FB-200');
 assert.equal(s.operations.done,true);
});
