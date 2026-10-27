import {routeSlots} from './routePlacement.js';
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function receptionFixtures(variant=null){
 if(variant===null)return [{kind:'scanner',x:-47,z:8,w:18,d:9},{kind:'requirements',x:-47,z:-14,w:18,d:4},{kind:'camera',x:47,z:8,w:18,d:9},{kind:'identity',x:47,z:-14,w:18,d:4},{kind:'kiosk',x:-21,z:-10,w:8,d:5},{kind:'brochures',x:21,z:-10,w:8,d:5},{kind:'seats',x:-42,z:32,w:17,d:6},{kind:'seats',x:42,z:32,w:17,d:6},{kind:'plant',x:-54,z:22,w:5,d:5},{kind:'plant',x:54,z:22,w:5,d:5}];
 if(variant===1)return [{kind:'comparison',x:-16,z:-5,w:21,d:8},{kind:'identity',x:16,z:-6,w:20,d:4},{kind:'cabinet',x:26,z:17,w:5,d:12},{kind:'seats',x:-23,z:28,w:11,d:4}];
 return [{kind:'status',x:-17,z:-5,w:20,d:8},{kind:'trays',x:16,z:-5,w:19,d:8},{kind:'scanner',x:26,z:17,w:5,d:12},{kind:'seats',x:-23,z:28,w:11,d:4}];
}
export function receptionLayout(node){
 const repair=Boolean(node.repairFor),p=node.scene,slots=routeSlots(node),objects=node.objects.map((object,i)=>({...object.position||p.stations[i],object}));
 const gates=repair?[{x:640,y:850,approach:{x:640,y:826},travelYaw:Math.PI,travelDirection:{x:0,y:1},exit:node.exits.find(e=>e.id==='retry')}]:node.exits.map((exit,i)=>{const q=p.targets[slots[i]];return {...q,approach:{x:q.x,y:q.y+24},travelYaw:0,travelDirection:{x:0,y:-1},exit};});
 for(const o of objects)if(o.object.kind==='wayfinding'){const routes=[...gates].sort((a,b)=>a.x-b.x).map(g=>({id:g.exit.id,label:g.exit.label}));o.object={...o.object,routes,directoryMount:'posts',directoryTitle:'مقایسه صاحب پرونده و وضعیت سجام',text:'نام صاحب مدارک و وضعیت پیش‌نیازهای هر سه پرونده را مقایسه کن.\n\n'+routes.map((r,i)=>['چپ','روبه‌رو','راست'][i]+': '+r.label).join('\n\n')};}
 const spawn=p.entry,hub=p.hub,roads=[[spawn,hub]];for(const g of gates)roads.push([hub,{x:g.x,y:hub.y},g]);for(const o of objects)if(o.object.kind!=='wayfinding')roads.push([spawn,{x:o.x,y:spawn.y},o]);
 const fixtures=receptionFixtures(repair?p.receptionVariant:null),reserved=fixtures.map(f=>rect(f.x,f.z,f.w+.5,f.d+.5)),solids=[];
 if(repair)solids.push(rect(-31,14,1,52),rect(31,14,1,52),rect(0,-12,62,1),rect(-17.8,40,26.4,1),rect(17.8,40,26.4,1));
 else{solids.push(rect(-60,9,1,70),rect(60,9,1,70),rect(0,44,120,1),rect(-10.1,-13.5,1.3,1.3),rect(10.1,-13.5,1.3,1.3));const edges=[40,...[...gates].sort((a,b)=>a.x-b.x).flatMap(g=>[g.x-46,g.x+46]),1240];for(let i=0;i<edges.length;i+=2)solids.push({minX:edges[i],maxX:edges[i+1],minY:185,maxY:195});}
 for(const g of gates)solids.push(rect((g.x-640)*.1,(g.y-450)*.1,8.8,.4));for(const o of objects)if(o.object.kind!=='wayfinding')solids.push(rect((o.x-640)*.1,(o.y-450)*.1,6.8,4));
 return {roads,gates,objects,spawn,hub,entryYaw:0,sceneId:p.id,fixtures,floorPlan:{kind:'open-room',areas:repair?[{minX:330,maxX:950,minY:330,maxY:870}]:[{minX:40,maxX:1240,minY:185,maxY:880}],barriers:[],reserved,solids}};
}
