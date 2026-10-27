import test from 'node:test';
import assert from 'node:assert/strict';
import {nodes,starts,endings,items} from '../app/src/content/story.js';
import {newJourney,interact,travel,collide,restoreJourney,exitsFor,missingItems} from '../app/src/game/state.js';
import {START,layoutFor,walkable,findPath,movePlayer,distance,pushAway} from '../app/src/game/world.js';
import {readSave,writeSave} from '../app/src/game/storage.js';
function collectAll(state){for(const o of nodes[state.nodeId].objects||[])state=interact(state,o.id);return state;}
function follow(role,choices){let state=newJourney(role);for(const id of choices){state=collectAll(state);state=travel(state,id);}return state;}
test('story graph has valid references, positive travel costs and known items',()=>{
 for(const [id,node] of Object.entries(nodes)){
  if(node.ending){assert.ok(endings[node.ending]);continue;}
  assert.ok(node.exits.length>=2&&node.exits.length<=3,id);
  assert.equal(new Set(node.exits.map(e=>e.id)).size,node.exits.length);
  for(const o of node.objects)if(o.grant)assert.ok(items[o.grant]);
  for(const e of exitsFor({nodeId:id})){assert.ok(nodes[e.next],e.next);assert.ok(e.cost>0);for(const key of [e.requires||[]].flat())assert.ok(items[key]);}
 }
});
test('customer can reach a clean ending through identity, receipt and final documents',()=>{
 const state=follow('client',['study','verify','own','100','track','continue','wait','finish']);
 assert.equal(state.ending,'bloom');assert.equal(state.balance,100);
 assert.deepEqual(restoreJourney(JSON.parse(JSON.stringify(state))),state);
});
test('manager can finish a fully documented shift',()=>{
 const state=follow('manager',['payment','reconcile','owner','reserve','follow','final','finish']);
 assert.equal(state.ending,'keeper');assert.equal(state.balance,0);
 assert.ok(state.inventory.includes('refund'));
});
test('wrong paths have distinct early endings instead of the same next stage',()=>{
 assert.equal(follow('client',['spark','borrow']).ending,'identity');
 assert.equal(follow('client',['spark','trust']).ending,'promise');
 assert.equal(follow('client',['identity','own','100','leave']).ending,'lost');
 assert.equal(follow('manager',['payment','charge']).ending,'overflow');
});
test('a repaired wrong route changes the ending',()=>{
 const state=follow('client',['spark','return','verify','own','100','track','continue','wait','finish']);
 assert.equal(state.ending,'recovered');
});
test('locked gate requires a physically collected item and inspection is idempotent',()=>{
 let state=travel(newJourney('client'),'identity');
 assert.throws(()=>travel(state,'own'),/Missing/);
 const original=state;state=interact(state,'badge');
 assert.equal(original.inventory.length,0);assert.equal(state.inventory.length,1);
 assert.equal(interact(state,'badge'),state);
 assert.equal(travel(state,'own').nodeId,'c-allocation');
});
test('missing identity has a real return path, not a soft lock',()=>{
 let state=travel(travel(newJourney('client'),'study'),'rush');
 assert.equal(state.nodeId,'c-allocation');assert.throws(()=>travel(state,'100'));
 state=travel(state,'back');state=interact(state,'badge');state=travel(state,'own');assert.equal(travel(state,'100').nodeId,'c-payment');
});
test('repeated mistakes exhaust opportunity; completed journeys reject changes',()=>{
 let state=newJourney('manager');for(let i=0;i<34;i++)state=collide(state);
 assert.equal(state.ending,'timeout');assert.equal(state.time,0);assert.throws(()=>travel(state,'payment'));
 assert.throws(()=>interact(state,'queue'));
});
test('restoration rejects forged event order and recomputes metrics',()=>{
 const state=follow('client',['identity']);
 const restored=restoreJourney({...state,balance:99999,trust:999,ending:'bloom'});
 assert.equal(restored.balance,200);assert.equal(restored.ending,null);
 assert.throws(()=>restoreJourney({...state,events:[{kind:'travel',node:'m-payment',id:'charge'}]}));
 assert.throws(()=>restoreJourney({...state,version:0}));
});
test('every exit and collectible has a connected, walkable mouse path',()=>{
 for(const [id,node] of Object.entries(nodes)){
  if(node.ending)continue;
  const layout=layoutFor(node);
  assert.ok(walkable(START,layout,10));
  for(const target of [...layout.gates,...layout.objects]){
   const path=findPath(START,target,layout);assert.ok(path.length>0,id+' '+JSON.stringify(target));
   assert.ok(path.every(p=>walkable(p,layout,10)));
   let player={...START,facing:'up'},index=0;
   for(let i=0;i<3000&&index<path.length;i++){
    if(distance(player,path[index])<9){index++;continue;}
    player=movePlayer(player,path[index].x-player.x,path[index].y-player.y,.016,layout);
   }
   assert.ok(distance(player,target)<15,id+' navigation did not arrive');
  }
 }
});
test('keyboard collision prevents walking through crop beds and normalizes diagonals',()=>{
 const layout=layoutFor(nodes[starts.client]);let player={...START};
 for(let i=0;i<200;i++)player=movePlayer(player,1,0,.016,layout);
 assert.ok(walkable(player,layout,10));assert.ok(player.x<690);
 const diagonal=movePlayer(START,1,1,.016,layout);
 assert.ok(distance(START,diagonal)<=235*.016+.001);
});
test('corrupt and unavailable browser storage degrade without crashing',()=>{
 assert.ok(readSave({getItem:()=>'{broken'}).error);
 assert.equal(writeSave({setItem:()=>{throw new Error('quota');}},newJourney('client'),START),false);
});

test('cart impact pushes the player onto safe road outside the next collision radius',()=>{
 const layout=layoutFor(nodes['c-allocation']),cart={x:640,y:707};
 for(const y of [685,700,707,720,735]){
  const pushed=pushAway({x:640,y},cart,layout);
  assert.ok(walkable(pushed,layout,10));assert.ok(distance(pushed,cart)>45);
 }
});