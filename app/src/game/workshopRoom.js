import {routeSlots} from './routePlacement.js';
const point=(x,z)=>({x:640+x*10,y:450+z*10});
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function workshopFixtures(variant=null){
 if(variant===null)return [{kind:'assembly',x:-45,z:-10,w:17,d:12},{kind:'press',x:46,z:0,w:12,d:11},{kind:'rack',x:-48,z:28,w:12,d:6},{kind:'parts',x:46,z:30,w:13,d:6},{kind:'toolbench',x:44,z:-19,w:13,d:6}];
 if(variant===0)return [{kind:'seating',x:-27,z:3,w:5,d:18},{kind:'comparison',x:-18,z:-13,w:16,d:6},{kind:'files',x:26,z:13,w:5,d:15},{kind:'parts',x:-27,z:25,w:5,d:9}];
 return [{kind:'drawers',x:-27,z:2,w:5,d:10},{kind:'lighttable',x:15,z:-12,w:18,d:7},{kind:'sealpress',x:-23,z:-13,w:8,d:7},{kind:'files',x:27,z:25,w:5,d:10}];
}
export function workshopLayout(node){
 const repair=node.repairFor==='ownerIdentity',variant=repair?Number(node.id.at(-1)):null,p=node.scene,slots=routeSlots(node);
 const objects=node.objects.map((object,i)=>({...(object.position||p.stations[i]),object}));
 const gates=repair?[{x:640,y:850,approach:{x:640,y:826},travelYaw:Math.PI,travelDirection:{x:0,y:1},exit:node.exits.find(e=>e.id==='retry')}]:node.exits.map((exit,i)=>{const q=p.targets[slots[i]];return {...q,approach:{x:q.x,y:q.y+24},travelYaw:0,travelDirection:{x:0,y:-1},exit};});
 for(const o of objects)if(o.object.kind==='wayfinding'){const routes=[...gates].sort((a,b)=>a.x-b.x).map(g=>({id:g.exit.id,label:g.exit.label}));o.object={...o.object,routes,directoryTitle:'راهنمای مسیر ثبت هویت شرکت',text:'نام شرکت و نوع مسیر را هم‌زمان مقایسه کن.\n\n'+routes.map((r,i)=>['سمت چپ','روبه‌رو','سمت راست'][i]+': '+r.label).join('\n\n')};}
 const spawn=p.entry,hub=repair?point(0,29):p.hub,roads=[[spawn,hub]];
 for(const g of gates)roads.push([hub,{x:g.x,y:hub.y},g]);
 for(const o of objects)if(o.object.kind!=='wayfinding')roads.push([spawn,{x:o.x,y:spawn.y},o]);
 const fixtures=workshopFixtures(variant),reserved=fixtures.map(f=>rect(f.x,f.z,f.w+.8,f.d+.8)),solids=[],barriers=[];
 if(repair){solids.push(rect(-32,8,1,64),rect(32,8,1,64),rect(0,-24,64,1));solids.push({minX:320,maxX:594,minY:845,maxY:855},{minX:686,maxX:960,minY:845,maxY:855});}
 else{solids.push(rect(-63,6,1,86),rect(63,6,1,86),rect(0,46,126,1),rect(-11,-10.5,.8,.8),rect(11,-10.5,.8,.8));const edges=[10,...[...gates].sort((a,b)=>a.x-b.x).flatMap(g=>[g.x-46,g.x+46]),1270];for(let i=0;i<edges.length;i+=2)solids.push({minX:edges[i],maxX:edges[i+1],minY:185,maxY:195});}
 for(const g of gates)solids.push({minX:g.x-44,maxX:g.x+44,minY:g.y-2,maxY:g.y+2});
 for(const o of objects)if(o.object.kind!=='wayfinding')solids.push({minX:o.x-34,maxX:o.x+34,minY:o.y-20,maxY:o.y+20});
 return {roads,gates,objects,hub,spawn,entryYaw:0,sceneId:p.id,fixtures,floorPlan:{kind:'open-room',areas:repair?[{minX:320,maxX:960,minY:210,maxY:870}]:[{minX:20,maxX:1260,minY:100,maxY:870}],barriers,reserved,solids}};
}
