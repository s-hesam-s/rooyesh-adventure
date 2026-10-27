import {routeSlots} from './routePlacement.js';
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
const point=(x,z)=>({x:640+x*10,y:450+z*10});
export function canalFixtures(variant=null){
 if(variant===null)return [{kind:'bed',x:-12,z:23,w:9,d:7},{kind:'bed',x:12,z:23,w:9,d:7},{kind:'tree',x:-58,z:-18,w:3,d:3},{kind:'tree',x:58,z:-18,w:3,d:3},{kind:'pergola',x:-47,z:-10,w:17,d:13},{kind:'pergola',x:47,z:-10,w:17,d:13},{kind:'bed',x:-48,z:7,w:14,d:11},{kind:'bed',x:48,z:7,w:14,d:11},{kind:'tree',x:-59,z:31,w:3,d:3},{kind:'tree',x:59,z:31,w:3,d:3}];
 if(variant===0)return [{kind:'abacus',x:-19,z:-12,w:16,d:6},{kind:'binders',x:27,z:17,w:5,d:14},{kind:'seats',x:-27,z:23,w:5,d:10}];
 return [{kind:'sorting',x:14,z:-12,w:18,d:7},{kind:'drawers',x:-27,z:0,w:5,d:12},{kind:'binders',x:27,z:26,w:5,d:9}];
}
export function canalLayout(node){
 const repair=node.repairFor==='ownerAmount',variant=repair?Number(node.id.at(-1)):null,p=node.scene,slots=routeSlots(node),objects=node.objects.map((object,i)=>({...(object.position||p.stations[i]),object}));
 const gates=repair?[{x:640,y:850,approach:{x:640,y:826},travelYaw:Math.PI,travelDirection:{x:0,y:1},exit:node.exits.find(e=>e.id==='retry')}]:node.exits.map((exit,i)=>{const q=p.targets[slots[i]];return {...q,approach:{x:q.x,y:q.y+24},travelYaw:0,travelDirection:{x:0,y:-1},exit};});
 for(const o of objects)if(o.object.kind==='wayfinding'){const routes=[...gates].sort((a,b)=>a.x-b.x).map(g=>({id:g.exit.id,label:g.exit.label}));o.object={...o.object,routes,directoryMount:'posts',directoryTitle:'مقایسه بسته‌های فیش تعهد',text:'جمع مبالغ و تعداد فیش‌های هر سه مسیر را مقایسه کن.\n\n'+routes.map((r,i)=>['سمت چپ','روبه‌رو','سمت راست'][i]+': '+r.label).join('\n\n')};}
 const spawn=p.entry,hub=repair?point(0,28):p.hub,roads=[[spawn,hub]];for(const g of gates)roads.push([hub,{x:g.x,y:hub.y},g]);for(const o of objects)if(o.object.kind!=='wayfinding')roads.push([spawn,{x:o.x,y:spawn.y},o]);
 const fixtures=canalFixtures(variant),reserved=fixtures.map(f=>rect(f.x,f.z,f.w+.6,f.d+.6)),solids=[],barriers=[];
 function edge(a,b){barriers.push({a:point(...a),b:point(...b),radius:3});}
 if(repair){solids.push(rect(-32,8,1,64),rect(32,8,1,64),rect(0,-24,64,1),{minX:320,maxX:594,minY:845,maxY:855},{minX:686,maxX:960,minY:845,maxY:855});}
 else{
  solids.push(rect(-63,1,1,94),rect(63,1,1,94),rect(0,47,126,1),rect(-10.1,-13.5,1.3,1.3),rect(10.1,-13.5,1.3,1.3));
  for(const x of [-25,25]){reserved.push(rect(x,-7,6.6,26),rect(x,22,6.6,16));for(const z of [6,14])edge([x-4.1,z],[x+4.1,z]);}
  const ends=[0,...[...gates].sort((a,b)=>a.x-b.x).flatMap(g=>[g.x-46,g.x+46]),1280];for(let i=0;i<ends.length;i+=2)solids.push({minX:ends[i],maxX:ends[i+1],minY:185,maxY:195});
 }
 for(const g of gates)solids.push({minX:g.x-44,maxX:g.x+44,minY:g.y-2,maxY:g.y+2});for(const o of objects)if(o.object.kind!=='wayfinding')solids.push({minX:o.x-34,maxX:o.x+34,minY:o.y-20,maxY:o.y+20});
 return {roads,gates,objects,hub,spawn,entryYaw:0,sceneId:p.id,fixtures,floorPlan:{kind:'open-room',areas:repair?[{minX:320,maxX:960,minY:210,maxY:870}]:[{minX:20,maxX:1260,minY:100,maxY:880}],barriers,reserved,solids}};
}
