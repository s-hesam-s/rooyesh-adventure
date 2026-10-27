import test from 'node:test';
import assert from 'node:assert/strict';
import {testEnvironments,createEnvironmentTestJourney,createEnvironmentTestSession} from '../app/src/game/environmentTest.js';
import {nodes,challenges} from '../app/src/content/campaign.js';
import {interact,travel,restoreJourney} from '../app/src/game/campaignState.js';
import {layoutFor,walkable} from '../app/src/game/world.js';
test('temporary menu lists only the eleven built main environments in story order',()=>{
 assert.deepEqual(testEnvironments.map(e=>e.id),['project','window','ownerIdentity','ownerAmount','ownerSend','publish','naturalIdentity','naturalSlip','gateway','verifyBank','receiptCheck']);for(const e of testEnvironments)assert.equal(e.name,nodes[e.id].scene.name);
});
test('every direct entry replays valid prerequisites without completing or collecting the target decision',()=>{
 for(const [i,e]of testEnvironments.entries()){const s=createEnvironmentTestJourney(e.id,'menu-test-'+i);assert.equal(s.nodeId,e.id);assert.equal(s.role,nodes[e.id].role);assert.equal(s.completed.length,i);assert.equal(s.completed.includes(e.id),false);assert.equal(s.inventory.includes('evidence:'+e.id),false);assert.deepEqual(restoreJourney(s),s);assert.ok(walkable(layoutFor(nodes[e.id]).spawn,layoutFor(nodes[e.id]),12));}
});
test('direct entry preserves the real correct and wrong route interactions of each environment',()=>{
 for(const e of testEnvironments){const s=interact(createEnvironmentTestJourney(e.id,'routes-'+e.id),'evidence'),c=challenges.find(c=>c.id===e.id);for(const [index,choice]of c.choices.entries()){const next=travel(s,'route-'+index);if(choice.correct){assert.equal(next.nodeId,nodes[e.id].exits[index].next);}else{assert.equal(next.nodeId,'repair-'+e.id+'-'+index);assert.deepEqual(next.ledger,s.ledger);const back=travel(interact(next,'review'),'retry');assert.equal(back.nodeId,e.id);assert.deepEqual(back.ledger,s.ledger);}}}
});
test('environment test session blocks all progress writes until returning to normal play',()=>{
 const session=createEnvironmentTestSession();let saved='original journey',writes=0;const persist=()=>{saved='changed';writes++;};session.enter('naturalSlip','isolated');assert.equal(session.active,true);assert.equal(session.persist(persist),false);assert.equal(saved,'original journey');assert.equal(writes,0);session.enter('project','second-test');session.persist(persist);assert.equal(writes,0);session.leave();assert.equal(session.active,false);assert.equal(session.persist(persist),true);assert.equal(writes,1);
});
test('unsupported locations do not enter test mode or create an arbitrary campaign state',()=>{
 const session=createEnvironmentTestSession();for(const id of ['investorSend','repair-naturalSlip-1','missing','__proto__'])assert.throws(()=>session.enter(id,'invalid'));assert.equal(session.active,false);
});
