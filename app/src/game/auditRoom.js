import {routeSlots} from './routePlacement.js';
export const auditPoint=(x,z)=>({x:640+x*10,y:450+z*10});
export const auditYaw=-Math.atan2(56,32);
export const auditBoundary=[[-40,-34],[8,-34],[40,22],[40,44],[-40,44],[-40,5],[-48,5],[-48,-12],[-40,-12]];
export const auditRepairBoundary=v=>v===0?[[-25,-8],[25,-8],[25,29],[-25,29]]:[[-24,-10],[16,-10],[24,-2],[24,29],[-24,29]];
export function auditFixtures(v=null){
 if(v===null)return [{kind:'lightbox',x:-18,z:3,w:14,d:8},{kind:'camera',x:9,z:-5,w:10,d:8},{kind:'scanner',x:-28,z:-22,w:10,d:7},{kind:'magnifier',x:-30,z:14,w:7,d:5},{kind:'flatfiles',x:-34,z:34,w:9,d:6},{kind:'cart',x:30,z:35,w:7,d:5},{kind:'protect',x:12,z:27,w:6,d:5},{kind:'trays',x:-28,z:-10,w:6,d:4},{kind:'calendar',x:4,z:-24,w:6,d:5},{kind:'stamp',x:-13,z:-22,w:6,d:4},{kind:'supply',x:30,z:19,w:6,d:5},{kind:'stool',x:-18,z:11,w:4,d:4},{kind:'directory',x:-4,z:-12,w:12,d:3},{kind:'luminaire',x:26,z:6,w:4,d:4},{kind:'humidity',x:-35,z:7,w:3,d:3}];
 if(v===0)return [{kind:'copybench',x:-4,z:0,w:17,d:7},{kind:'index',x:17,z:0,w:8,d:5},{kind:'flatfiles',x:-19,z:20,w:8,d:5},{kind:'trays',x:18,z:20,w:6,d:4},{kind:'magnifier',x:-20,z:6,w:6,d:5},{kind:'stool',x:-4,z:8,w:4,d:4}];
 return [{kind:'datebench',x:-5,z:0,w:15,d:6},{kind:'calendar',x:17,z:7,w:6,d:5},{kind:'protect',x:-18,z:21,w:6,d:5},{kind:'stamp',x:17,z:21,w:6,d:4},{kind:'supply',x:-18,z:4,w:6,d:5},{kind:'humidity',x:-19,z:-5,w:3,d:3}];
}
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function auditLayout(node){
 const p=node.scene,repair=Boolean(node.repairFor),slots=routeSlots(node),objects=node.objects.map((object,i)=>({...object.position||p.stations[i],object}));
 const gate=(q,yaw,exit)=>{const travelDirection={x:-Math.sin(yaw),y:-Math.cos(yaw)};return {...q,exit,travelYaw:yaw,travelDirection,approach:{x:q.x-travelDirection.x*24,y:q.y-travelDirection.y*24}};};
 const gates=repair?[gate(auditPoint(0,29),Math.PI,node.exits.find(e=>e.id==='retry'))]:node.exits.map((exit,i)=>gate(p.targets[slots[i]],[Math.PI/2,0,auditYaw][slots[i]],exit));
 const fixtures=auditFixtures(repair?p.auditVariant:null),boundary=(repair?auditRepairBoundary(p.auditVariant):auditBoundary).map(([x,z])=>auditPoint(x,z)),reserved=fixtures.map(f=>rect(f.x,f.z,f.w+.3,f.d+.3)),solids=objects.map(o=>rect((o.x-640)*.1,(o.y-450)*.1,6.8,4));
 const blockedPolygons=gates.map(g=>[[-4.4,-.2],[4.4,-.2],[4.4,.2],[-4.4,.2]].map(([x,z])=>auditPoint((g.x-640)*.1+x*Math.cos(g.travelYaw)+z*Math.sin(g.travelYaw),(g.y-450)*.1-x*Math.sin(g.travelYaw)+z*Math.cos(g.travelYaw))));
 const roads=[[p.entry,p.hub],...gates.map(g=>repair?[p.hub,g.approach]:g.travelYaw>0?[p.hub,auditPoint(-8,18),auditPoint(-8,-6),auditPoint(-38,-6),auditPoint(-38,-3.5),g.approach]:Math.abs(g.travelYaw)<.1?[p.hub,auditPoint(-8,18),auditPoint(-8,-6),auditPoint(-19,-6),auditPoint(-19,-29),auditPoint(-16,-29),g.approach]:[p.hub,auditPoint(18,18),auditPoint(18,3),g.approach]),...objects.map(o=>[p.hub,o])];
 return {roads,gates,objects,fixtures,boundary,spawn:p.entry,hub:p.hub,entryYaw:0,sceneId:p.id,floorPlan:{kind:'open-room',areas:[{minX:140,maxX:1060,minY:100,maxY:895}],boundary,boundaryMargin:3,blockedPolygons,reserved,solids,barriers:[]}};
}
