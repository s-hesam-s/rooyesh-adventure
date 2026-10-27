import {routeSlots} from './routePlacement.js';
export const paymentBoundary=[[-18,-32],[18,-32],[42,-8],[42,19],[18,43],[-18,43],[-42,19],[-42,-8]];
export const paymentRepairBoundary=variant=>variant===1?[[-25,-10],[25,-10],[25,29],[-25,29]]:[[-25,-10],[17,-10],[25,-2],[25,21],[17,29],[-25,29]];
export const paymentPoint=(x,z)=>({x:640+x*10,y:450+z*10});
export function paymentLocal(g,x,z){const yaw=g.travelYaw||0;return paymentPoint((g.x-640)*.1+x*Math.cos(yaw)+z*Math.sin(yaw),(g.y-450)*.1-x*Math.sin(yaw)+z*Math.cos(yaw));}
export function paymentFixtures(variant=null){
 if(variant===null)return [{kind:'intercom',x:-29,z:8,w:4,d:4},{kind:'seat',x:-30,z:16,w:6,d:4},{kind:'supply',x:-21,z:31,w:8,d:5},{kind:'bin',x:-16,z:36,w:3,d:3},{kind:'cart',x:29,z:20,w:6,d:5},{kind:'rolls',x:30,z:0,w:7,d:6},{kind:'qr',x:-28,z:-4,w:4,d:4},{kind:'seat',x:30,z:11,w:6,d:4},{kind:'receipt',x:-12,z:-9,w:8,d:6},{kind:'secure',x:13,z:-9,w:8,d:6},{kind:'network',x:16,z:6,w:6,d:4},{kind:'battery',x:-30,z:25,w:4,d:4}];
 if(variant===1)return [{kind:'capacity',x:-9,z:-2,w:15,d:6},{kind:'budget',x:17,z:-3,w:7,d:5},{kind:'cart',x:-20,z:18,w:5,d:6},{kind:'rolls',x:20,z:18,w:5,d:5},{kind:'intercom',x:-20,z:7,w:4,d:4}];
 return [{kind:'keypad',x:-11,z:0,w:10,d:8},{kind:'units',x:12,z:-4,w:9,d:6},{kind:'seat',x:-18,z:18,w:6,d:4},{kind:'supply',x:19,z:18,w:5,d:5},{kind:'qr',x:-20,z:8,w:3,d:3}];
}
const rectangle=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function paymentLayout(node){
 const p=node.scene,repair=Boolean(node.repairFor),variant=p.paymentVariant,slots=routeSlots(node),objects=node.objects.map((object,i)=>({...object.position||p.stations[i],object}));
 const gate=(point,yaw,exit)=>{const direction={x:-Math.sin(yaw),y:-Math.cos(yaw)};return {...point,travelYaw:yaw,travelDirection:direction,approach:{x:point.x-direction.x*24,y:point.y-direction.y*24},exit};};
 const gates=repair?[gate(paymentPoint(0,29),Math.PI,node.exits.find(e=>e.id==='retry'))]:node.exits.map((exit,i)=>gate(p.targets[slots[i]],slots[i]===0?Math.PI/4:slots[i]===2?-Math.PI/4:0,exit));
 const fixtures=paymentFixtures(repair?variant:null),boundary=(repair?paymentRepairBoundary(variant):paymentBoundary).map(([x,z])=>paymentPoint(x,z));
 const reserved=fixtures.map(f=>rectangle(f.x,f.z,f.w+.3,f.d+.3)),solids=objects.map(o=>rectangle((o.x-640)*.1,(o.y-450)*.1,6.8,4)),blockedPolygons=[];
 for(const g of gates){blockedPolygons.push([[-4.4,-.2],[4.4,-.2],[4.4,.2],[-4.4,.2]].map(([x,z])=>paymentLocal(g,x,z)));for(const side of [-1,1])blockedPolygons.push([[side*4.6,.05],[side*8.85,.05],[side*8.85,side===1?6.8:5.8],[side*4.6,side===1?6.8:5.8]].map(([x,z])=>paymentLocal(g,x,z)));}
 const spawn=p.entry,hub=p.hub,roads=[[spawn,hub]];for(const g of gates)roads.push([hub,g.approach]);for(const o of objects)roads.push([hub,{x:o.x,y:hub.y},o]);
 return {roads,gates,objects,spawn,hub,entryYaw:0,sceneId:p.id,fixtures,boundary,floorPlan:{kind:'open-room',areas:[{minX:repair?390:220,maxX:repair?890:1060,minY:repair?350:130,maxY:repair?740:880}],boundary,boundaryMargin:3,blockedPolygons,barriers:[],reserved,solids}};
}
