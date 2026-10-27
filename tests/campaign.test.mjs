import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {nodes,challenges,chapters,project} from '../app/src/content/campaign.js';
import {characters} from '../app/src/content/characters.js';
import {newJourney,interact,travel,restoreJourney,availableAmount,assessInvestment,validateReceipt,requiredOwnerAmount,chapterProgress} from '../app/src/game/campaignState.js';
import {KEY,readSave,writeSave} from '../app/src/game/campaignStorage.js';
import {START,layoutFor,findPath} from '../app/src/game/world.js';
const solve=s=>travel(interact(s,'evidence'),nodes[s.nodeId].exits.find(e=>challenges.find(c=>c.id===s.nodeId).choices[e.choice].correct).id);
const until=id=>{let s=newJourney();while(s.nodeId!==id&&!s.ending)s=solve(s);assert.equal(s.nodeId,id);return s;};
test('ten ordered chapters have mandatory decisions and four automatic roles',()=>{
 assert.equal(chapters.length,10);assert.equal(challenges.length,20);
 for(const chapter of chapters)assert.ok(challenges.some(c=>c.chapter===chapter.id));
 const s=newJourney('legal');assert.equal(s.nodeId,'project');assert.equal(s.role,'manager');
 assert.equal(new Set(Object.values(characters).map(c=>c.shirt)).size,4);
});
for(const c of challenges){
 test(c.id+': evidence alone cannot complete a mandatory challenge or change role',()=>{
  const s=until(c.id),exit=nodes[c.id].exits.find(e=>c.choices[e.choice].correct),before=structuredClone(s);
  assert.throws(()=>travel(s,exit.id),/مدرک/);assert.deepEqual(s,before);
  const inspected=interact(s,'evidence');assert.equal(inspected.completed.includes(c.id),false);assert.equal(inspected.role,s.role);
  const next=travel(inspected,exit.id);assert.ok(next.completed.includes(c.id));
  assert.deepEqual(s,before);
  assert.equal(next.role,nodes[next.nodeId].role);
 });
 test(c.id+': every invalid path requires corrective evidence and preserves business ledger',()=>{
  const s=interact(until(c.id),'evidence');
  for(const exit of nodes[c.id].exits.filter(e=>!c.choices[e.choice].correct)){
   const stopped=travel(s,exit.id);assert.equal(nodes[stopped.nodeId].repairFor,c.id);
   assert.equal(stopped.role,s.role);assert.deepEqual(stopped.ledger,s.ledger);assert.deepEqual(stopped.completed,s.completed);
   assert.ok(stopped.trust<s.trust);assert.throws(()=>travel(stopped,'retry'),/مدرک/);
   const retry=travel(interact(stopped,'review'),'retry');assert.equal(retry.nodeId,c.id);assert.deepEqual(retry.completed,s.completed);
   assert.equal(solve(retry).completed.includes(c.id),true);
   assert.deepEqual(restoreJourney(solve(retry)),solve(retry));
  }
 });
}
test('complete campaign records exact owner amount, separate banks, traces, certificate and only one paid installment',()=>{
 let s=newJourney();const roles=[s.role],snapshots={};
 for(const c of challenges){assert.equal(s.nodeId,c.id);s=solve(s);snapshots[c.id]=s;if(roles.at(-1)!==s.role)roles.push(s.role);}
 assert.deepEqual(roles,['manager','owner','manager','client','manager','legal','manager','client','manager']);
 assert.equal(s.completed.length,20);assert.equal(s.ending,'campaign');assert.equal(s.balance,0);
 assert.equal(requiredOwnerAmount(1000),120);assert.equal(requiredOwnerAmount(1001),120.1);assert.equal(snapshots.ownerAmount.ledger.ownerSent,false);assert.equal(snapshots.ownerSend.ledger.published,false);
 assert.equal(snapshots.gateway.ledger.payments.find(p=>p.id==='N-80').status,'pending');
 assert.equal(snapshots.verifyBank.ledger.payments.find(p=>p.id==='N-80').status,'paid');assert.equal(snapshots.verifyBank.ledger.payments.find(p=>p.id==='N-80').trace,null);
 assert.equal(snapshots.investorSend.ledger.payments.find(p=>p.id==='N-80').reconciled,true);
 assert.equal(snapshots.close.ledger.status,'awaiting-approval');assert.equal(snapshots.close.ledger.certificate,null);
 assert.equal(s.ledger.status,15);assert.deepEqual(s.ledger.certificate,{owner:'arman',amount:280,issued:true});
 assert.deepEqual(s.ledger.schedule.map(r=>r.paid),[true,false,false,false]);assert.equal(s.ledger.interestPayments.length,1);
 assert.equal(chapterProgress(s).completedChapters,10);assert.deepEqual(restoreJourney(s),s);
});
test('investment limits use unit, identity, cumulative commitments and reserved capacity',()=>{
 const l=until('gateway').ledger;
 assert.equal(availableAmount(l),680);
 assert.equal(assessInvestment(l,{id:'arman',type:'natural',amount:80,budget:80}),true);
 for(const request of [{id:'arman',type:'natural',amount:110},{id:'arman',type:'natural',amount:75},{id:'sun-owner',type:'legal',amount:100},{id:'arman',type:'legal',amount:100}])assert.throws(()=>assessInvestment(l,request));
 const pending=until('verifyBank').ledger;assert.equal(availableAmount(pending),600);assert.equal(pending.payments.find(p=>p.id==='N-80').status,'pending');
 const full=until('legalSend').ledger;assert.equal(availableAmount(full),0);assert.throws(()=>assessInvestment(full,{id:'bahar',type:'legal',amount:10}));
 const closed=until('final').ledger;assert.throws(()=>assessInvestment(closed,{id:'arman',type:'natural',amount:10}));
});
test('receipt rules reject duplicate tracking, future date, missing image and nonpositive value',()=>{
 const l=until('gateway').ledger,valid={id:'new',amount:10,date:10,tracking:'fresh',file:true,bank:true};
 assert.equal(validateReceipt(l,valid),true);
 for(const altered of [{tracking:'N-200'},{date:31},{date:0},{file:false},{bank:false},{amount:0}])assert.throws(()=>validateReceipt(l,{...valid,...altered}));
});
test('ledger guards prevent advancing on forged business prerequisites',()=>{
 for(const [id,mutate]of [
 ['ownerSend',l=>l.ownerReceipts.pop()],['publish',l=>l.ownerSent=false],
 ['verifyBank',l=>l.payments.find(p=>p.id==='N-80').amount=81],
 ['investorSend',l=>l.payments.find(p=>p.id==='N-80').bankSuccess=false],
 ['legalSend',l=>l.ownerSent=false],['close',l=>l.payments.find(p=>p.id==='L-600').trace=null],
 ['final',l=>l.status=5],['certificate',l=>l.status=5],['schedule',l=>l.status=5],
 ['payment',l=>l.schedule[0].paid=true]
 ]){
  const s=until(id);mutate(s.ledger);assert.throws(()=>solve(s),id);
 }
});
test('save replay ignores forged stage, role, money and completion, and rejects skipped events',()=>{
 const s=until('legalAmount'),tampered={...structuredClone(s),role:'manager',nodeId:'payment',completed:challenges.map(c=>c.id),balance:9999,ledger:{}};
 assert.deepEqual(restoreJourney(tampered),s);
 assert.throws(()=>restoreJourney({...s,events:[{kind:'travel',node:'payment',id:'route-2'}]}));
 const skipped=structuredClone(s);skipped.events.splice(0,1);assert.throws(()=>restoreJourney(skipped));
 assert.throws(()=>restoreJourney({...s,version:2}));
});
test('campaign storage preserves legacy save and handles corrupt data and positions safely',()=>{
 const map=new Map([['rooyesh.adventure.v2','legacy']]),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 assert.ok(readSave(storage).error);assert.equal(readSave(storage).state,null);
 const s=until('ownerAmount');assert.equal(writeSave(storage,s,{x:640,y:790}),true);
 assert.equal(map.get('rooyesh.adventure.v2'),'legacy');assert.deepEqual(readSave(storage).state,s);
 map.set(KEY,'bad JSON');assert.equal(readSave(storage).state,null);assert.ok(readSave(storage).error);
 assert.equal(writeSave({setItem:()=>{throw Error('disabled');}},s,START),false);
});
test('every decision and corrective destination has physical routes and a reachable evidence table',()=>{
 for(const node of Object.values(nodes)){
  const layout=layoutFor(node);for(const gate of layout.gates){assert.ok(nodes[gate.exit.next]);assert.ok(findPath(layout.spawn||START,gate,layout).length,node.id);}
  for(const object of layout.objects)assert.ok(findPath(layout.spawn||START,{x:object.x,y:object.y+40},layout).length,node.id);
 }
});
test('all four portraits are local resources and first-person outfits are distinct',async()=>{
 for(const c of Object.values(characters)){assert.match(c.portrait,/^\.\/assets\/characters\//);assert.match(await readFile(new URL('../app/'+c.portrait.slice(2),import.meta.url),'utf8'),/<svg/);}
 assert.equal(new Set(Object.values(characters).map(c=>c.glove)).size,4);
});