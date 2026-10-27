import {nodes,starts,items,endings} from '../content/story.js';
export const VERSION=2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function newJourney(role,id=globalThis.crypto.randomUUID()){
 if(!starts[role])throw new Error('Unknown role');
 return {version:VERSION,id,role,nodeId:starts[role],trust:70,time:100,balance:role==='client'?200:100,inventory:[],flags:[],seen:[],events:[],ending:null,startedAt:new Date().toISOString()};
}
export function exitsFor(state){
 const node=nodes[state.nodeId];
 return [...(node.exits||[]),...(node.back?[{id:'back',label:'بازگشت به دفتر هویت',next:node.back,cost:9,detail:'برای گرفتن نشان هویت برگرد.',flags:['recovered'],back:true}]:[])];
}
export function missingItems(state,exit){return [exit.requires||[]].flat().filter(key=>!state.inventory.includes(key));}
export function interact(state,id){
 if(state.ending)throw new Error('Journey ended');
 const object=nodes[state.nodeId].objects.find(o=>o.id===id);
 if(!object)throw new Error('Unknown object');
 const key=state.nodeId+':'+id;
 if(state.seen.includes(key))return state;
 return {...state,seen:[...state.seen,key],inventory:object.grant?[...new Set([...state.inventory,object.grant])]:state.inventory,events:[...state.events,{kind:'inspect',node:state.nodeId,id}]};
}
export function travel(state,id){
 if(state.ending)throw new Error('Journey ended');
 const exit=exitsFor(state).find(e=>e.id===id);
 if(!exit)throw new Error('Unknown exit');
 if(missingItems(state,exit).length)throw new Error('Missing required item');
 if(state.balance+(exit.balance||0)<0)throw new Error('Insufficient balance');
 const next={...state,nodeId:exit.next,time:Math.max(0,state.time-exit.cost),trust:clamp(state.trust+(exit.trust||0),0,100),balance:state.balance+(exit.balance||0),flags:[...new Set([...state.flags,...(exit.flags||[])])],events:[...state.events,{kind:'travel',node:state.nodeId,id}]};
 let ending=next.time===0?'timeout':nodes[next.nodeId].ending;
 if(['bloom','keeper'].includes(ending)&&next.flags.includes('recovered'))ending='recovered';
 return {...next,ending:ending||null};
}
export function collide(state){
 if(state.ending)return state;
 const time=Math.max(0,state.time-3);
 return {...state,time,ending:time===0?'timeout':null,events:[...state.events,{kind:'collision',node:state.nodeId}]};
}
export function restoreJourney(raw){
 if(!raw||raw.version!==VERSION||typeof raw.id!=='string'||raw.id.length>100||!Array.isArray(raw.events)||raw.events.length>500||typeof raw.startedAt!=='string'||!Number.isFinite(Date.parse(raw.startedAt)))throw new Error('Invalid journey');
 let state={...newJourney(raw.role,raw.id),startedAt:raw.startedAt};
 for(const e of raw.events){
  if(e.node!==state.nodeId||state.ending)throw new Error('Invalid event sequence');
  if(e.kind==='inspect')state=interact(state,e.id);
  else if(e.kind==='travel')state=travel(state,e.id);
  else if(e.kind==='collision')state=collide(state);
  else throw new Error('Invalid event');
 }
 return state;
}
export function itemLabel(key){return items[key]?.label||key;}
export function journeyLog(state){
 return state.events.filter(e=>e.kind==='travel').map(e=>({from:nodes[e.node].title,label:exitsFor({...state,nodeId:e.node}).find(x=>x.id===e.id).label}));
}
export function summary(state){return state.ending?endings[state.ending]:null;}
