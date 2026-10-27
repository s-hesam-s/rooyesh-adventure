import {routeSlots} from './routePlacement.js';
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function atriumFixtures(variant=null){
 if(variant===null)return [{kind:'model',x:-46,z:9,w:18,d:10},{kind:'project',x:-47,z:-14,w:20,d:4},{kind:'workflow',x:47,z:-14,w:20,d:4},{kind:'reading',x:46,z:10,w:18,d:8},{kind:'bench',x:-44,z:34,w:15,d:5},{kind:'bench',x:44,z:34,w:15,d:5},{kind:'planter',x:-55,z:22,w:6,d:6},{kind:'planter',x:55,z:22,w:6,d:6},{kind:'brochure',x:-16,z:1,w:6,d:4},{kind:'brochure',x:16,z:1,w:6,d:4},{kind:'calendar',x:-22,z:-11,w:10,d:5},{kind:'status',x:22,z:-11,w:10,d:5}];
 if(variant===0)return [{kind:'workflow',x:-17,z:-6,w:21,d:4},{kind:'review',x:15,z:-5,w:20,d:8},{kind:'cabinet',x:27,z:16,w:5,d:12},{kind:'bench',x:-24,z:27,w:11,d:4}];
 return [{kind:'status',x:-18,z:-5,w:19,d:7},{kind:'calendar',x:16,z:-5,w:19,d:8},{kind:'reading',x:27,z:17,w:5,d:12},{kind:'planter',x:-26,z:27,w:4,d:4}];
}
export function atriumLayout(node){
 const repair=Boolean(node.repairFor),p=node.scene,variant=repair?p.atriumVariant:null,slots=routeSlots(node),objects=node.objects.map((object,i)=>({...object.position||p.stations[i],object}));
 const gates=repair?[{x:640,y:850,approach:{x:640,y:826},travelYaw:Math.PI,travelDirection:{x:0,y:1},exit:node.exits.find(e=>e.id==='retry')}]:node.exits.map((exit,i)=>{const q=p.targets[slots[i]];return {...q,approach:{x:q.x,y:q.y+24},travelYaw:0,travelDirection:{x:0,y:-1},exit};});
 for(const o of objects)if(o.object.kind==='wayfinding'){const routes=[...gates].sort((a,b)=>a.x-b.x).map(g=>({id:g.exit.id,label:g.exit.label}));o.object={...o.object,routes,directoryMount:'posts',directoryTitle:'مقایسه تصمیم‌های انتشار طرح',text:'پیش‌نیازها و پیامد هر سه تصمیم را مقایسه کن.\n\n'+routes.map((r,i)=>['چپ','روبه‌رو','راست'][i]+': '+r.label).join('\n\n')};}
 const spawn=p.entry,hub=p.hub,roads=[[spawn,hub]];for(const g of gates)roads.push([hub,{x:g.x,y:hub.y},g]);for(const o of objects)if(o.object.kind!=='wayfinding')roads.push([spawn,{x:o.x,y:spawn.y},o]);
 const fixtures=atriumFixtures(variant),reserved=fixtures.map(f=>rect(f.x,f.z,f.w+.5,f.d+.5)),solids=[];
 if(repair)solids.push(rect(-32,14,1,52),rect(32,14,1,52),rect(0,-12,64,1),rect(-18.3,40,27.4,1),rect(18.3,40,27.4,1));
 else{solids.push(rect(-63,10.5,1,73),rect(63,10.5,1,73),rect(0,47,126,1),rect(-10.1,-13.5,1.3,1.3),rect(10.1,-13.5,1.3,1.3));const edges=[0,...[...gates].sort((a,b)=>a.x-b.x).flatMap(g=>[g.x-46,g.x+46]),1280];for(let i=0;i<edges.length;i+=2)solids.push({minX:edges[i],maxX:edges[i+1],minY:185,maxY:195});}
 for(const g of gates)solids.push(rect((g.x-640)*.1,(g.y-450)*.1,8.8,.4));for(const o of objects)if(o.object.kind!=='wayfinding')solids.push(rect((o.x-640)*.1,(o.y-450)*.1,6.8,4));
 return {roads,gates,objects,spawn,hub,entryYaw:0,sceneId:p.id,fixtures,floorPlan:{kind:'open-room',areas:repair?[{minX:320,maxX:960,minY:330,maxY:870}]:[{minX:20,maxX:1260,minY:185,maxY:880}],barriers:[],reserved,solids}};
}
