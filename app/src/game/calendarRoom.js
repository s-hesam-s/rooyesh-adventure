import {routeSlots} from './routePlacement.js';
const point=(x,z)=>({x:640+x*10,y:450+z*10});
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function calendarFurniture(variant=null){
 if(variant===null)return {beds:[{x:-46,z:28,w:10,d:6},{x:46,z:28,w:10,d:6},{x:-45,z:-3,w:8,d:5},{x:45,z:-16,w:8,d:5}],benches:[{x:45,z:6,w:9,d:3}],tower:{x:-45,z:-14,w:12,d:12},tables:[],cabinets:[]};
 if(variant===1)return {beds:[],benches:[],tables:[{x:-13,z:-8,w:9,d:5},{x:15,z:-11,w:7,d:4}],cabinets:[{x:-28,z:20,w:5,d:10},{x:25,z:-19,w:9,d:4}]};
 return {beds:[],benches:[],tables:[{x:12,z:-7,w:11,d:4}],cabinets:[{x:-27,z:-14,w:6,d:12},{x:27,z:20,w:5,d:10},{x:22,z:-20,w:11,d:4}]};
}
export function calendarLayout(node){
 const repair=node.repairFor==='window',variant=repair?Number(node.id.at(-1)):null,p=node.scene;
 const objects=node.objects.map((object,i)=>({...(object.position||p.stations[i]),object})),slots=routeSlots(node);
 const gates=repair?[{x:640,y:850,approach:{x:640,y:826},travelYaw:Math.PI,travelDirection:{x:0,y:1},exit:node.exits.find(e=>e.id==='retry')}]:node.exits.map((exit,i)=>({...p.targets[slots[i]],approach:{x:p.targets[slots[i]].x,y:p.targets[slots[i]].y+24},travelYaw:0,travelDirection:{x:0,y:-1},exit}));
 for(const entry of objects)if(entry.object.kind==='wayfinding'){
  const routes=[...gates].sort((a,b)=>a.x-b.x).map(g=>({id:g.exit.id,label:g.exit.label}));entry.object={...entry.object,routes,directoryTitle:'راهنمای مسیرها · مهلت و وضعیت',text:'هر سه گزینه را از همین تابلو مقایسه کن.\n\n'+routes.map((r,i)=>['سمت چپ','روبه‌رو','سمت راست'][i]+': '+r.label).join('\n\n')+'\n\nبرای ثبت تصمیم به در مربوط نزدیک شو.'};
 }
 const spawn=p.entry,hub=repair?point(0,25):point(0,11),roads=[[spawn,hub]];
 for(const g of gates)roads.push([hub,{x:g.x,y:hub.y},g]);
 for(const o of objects)if(o.object.kind!=='wayfinding')roads.push([spawn,{x:o.x,y:spawn.y},o]);
 const furniture=calendarFurniture(variant),barriers=[],reserved=[],solids=[];
 function edge(a,b){barriers.push({a:point(...a),b:point(...b),radius:3});}
 if(!repair){
  edge([-54,-35],[-54,39.5]);edge([54,-35],[54,39.5]);edge([-54,39.5],[-8,39.5]);edge([8,39.5],[54,39.5]);
  for(const b of furniture.beds)reserved.push(rect(b.x,b.z,b.w+1,b.d+1));
  solids.push(rect(-45,-14,12,12),rect(45,6,9,3),rect(-45,10,6,6),rect(-11,-13,.8,.8),rect(11,-13,.8,.8));
  const centers=[...gates].sort((a,b)=>a.x-b.x),ends=[100,...centers.flatMap(g=>[g.x-46,g.x+46]),1180];
  for(let i=0;i<ends.length;i+=2)solids.push({minX:ends[i],maxX:ends[i+1],minY:185,maxY:195});
  solids.push(rect(0,44,18,1));
 }else{
  solids.push(rect(-32,8,1,64),rect(32,8,1,64),rect(0,-24,64,1));
  solids.push({minX:320,maxX:594,minY:845,maxY:855},{minX:686,maxX:960,minY:845,maxY:855});
  for(const t of [...furniture.tables,...furniture.cabinets])reserved.push(rect(t.x,t.z,t.w+1,t.d+1));
 }
 for(const g of gates)solids.push({minX:g.x-44,maxX:g.x+44,minY:g.y-2,maxY:g.y+2});
 for(const o of objects)if(o.object.kind!=='wayfinding')solids.push({minX:o.x-34,maxX:o.x+34,minY:o.y-20,maxY:o.y+20});
 return {roads,gates,objects,hub,spawn,entryYaw:0,sceneId:p.id,furniture,floorPlan:{kind:'open-room',areas:repair?[{minX:320,maxX:960,minY:210,maxY:870}]:[{minX:100,maxX:1180,minY:100,maxY:845},{minX:560,maxX:720,minY:820,maxY:880}],barriers,reserved,solids}};
}
