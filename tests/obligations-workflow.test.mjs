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
