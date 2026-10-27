import {routeSlots} from './routePlacement.js';
export const bankPoint=(x,z)=>({x:640+x*10,y:450+z*10});
export const bankBoundary=[[-42,-32],[12,-32],[12,-10],[42,-10],[42,44],[-42,44]];
export const bankRepairBoundary=v=>v===0?[[-23,-10],[23,-10],[23,29],[-23,29]]:[[-27,-5],[21,-5],[27,1],[27,23],[21,29],[-27,29]];
export function bankFixtures(v=null){
 if(v===null)return [{kind:'reconcile',x:-6,z:-6,w:20,d:9},{kind:'printer',x:27,z:22,w:7,d:5},{kind:'files',x:-35,z:-22,w:9,d:6},{kind:'secure',x:5,z:-24,w:6,d:5},{kind:'shredder',x:32,z:32,w:4,d:4},{kind:'chair',x:-6,z:-14,w:4,d:4},{kind:'chair',x:-6,z:3,w:4,d:4},{kind:'archive',x:-34,z:27,w:10,d:5},{kind:'stamp',x:-25,z:11,w:6,d:4},{kind:'status',x:22,z:-3,w:10,d:4},{kind:'clock',x:-34,z:16,w:3,d:3},{kind:'power',x:8,z:-17,w:3,d:3},{kind:'supply',x:20,z:33,w:6,d:4},{kind:'directory',x:0,z:-21,w:12,d:3}];
 if(v===0)return [{kind:'history',x:-9,z:0,w:14,d:6},{kind:'printer',x:16,z:1,w:7,d:5},{kind:'shredder',x:18,z:21,w:4,d:4},{kind:'archive',x:-17,z:20,w:7,d:5},{kind:'stamp',x:-18,z:8,w:6,d:4}];
 return [{kind:'mismatch',x:5,z:3,w:18,d:7},{kind:'files',x:-19,z:1,w:8,d:5},{kind:'supply',x:20,z:18,w:6,d:4},{kind:'chair',x:5,z:10,w:4,d:4},{kind:'secure',x:-21,z:20,w:5,d:4}];
}
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function bankLayout(node){
 const p=node.scene,repair=Boolean(node.repairFor),slots=routeSlots(node),objects=node.objects.map((object,i)=>({...object.position||p.stations[i],object}));
 const gate=(q,yaw,exit)=>{const travelDirection={x:-Math.sin(yaw),y:-Math.cos(yaw)};return {...q,exit,travelYaw:yaw,travelDirection,approach:{x:q.x-travelDirection.x*24,y:q.y-travelDirection.y*24}};};
 const gates=repair?[gate(bankPoint(0,29),Math.PI,node.exits.find(e=>e.id==='retry'))]:node.exits.map((e,i)=>gate(p.targets[slots[i]],[Math.PI/2,0,-Math.PI/2][slots[i]],e));
 const fixtures=bankFixtures(repair?p.bankVariant:null),boundary=(repair?bankRepairBoundary(p.bankVariant):bankBoundary).map(([x,z])=>bankPoint(x,z)),reserved=fixtures.map(f=>rect(f.x,f.z,f.w+.3,f.d+.3)),solids=objects.map(o=>rect((o.x-640)*.1,(o.y-450)*.1,6.8,4));
 if(!repair)reserved.push(rect(-27,-9,15.3,.4));
 const blockedPolygons=gates.map(g=>[[-4.4,-.2],[4.4,-.2],[4.4,.2],[-4.4,.2]].map(([x,z])=>bankPoint((g.x-640)*.1+x*Math.cos(g.travelYaw)+z*Math.sin(g.travelYaw),(g.y-450)*.1-x*Math.sin(g.travelYaw)+z*Math.cos(g.travelYaw))));
 const roads=[[p.entry,p.hub],...gates.map(g=>repair?[p.hub,g.approach]:Math.abs(g.travelYaw)<.1?[p.hub,bankPoint(-18,14),bankPoint(-18,-26),bankPoint(-14,-26),g.approach]:g.travelYaw>0?[p.hub,bankPoint(-18,14),bankPoint(-18,0),g.approach]:[p.hub,bankPoint(32,14),bankPoint(32,8),g.approach]),...objects.map(o=>[p.hub,o])];
 return {roads,gates,objects,fixtures,boundary,spawn:p.entry,hub:p.hub,entryYaw:0,sceneId:p.id,floorPlan:{kind:'open-room',areas:[{minX:200,maxX:1080,minY:110,maxY:895}],boundary,boundaryMargin:3,blockedPolygons,reserved,solids,barriers:[]}};
}
