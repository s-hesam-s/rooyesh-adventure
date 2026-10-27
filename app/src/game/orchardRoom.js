import {routeSlots} from './routePlacement.js';
const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
export function orchardFixtures(variant=null){
 if(variant===null)return [{kind:'calculator',x:-48,z:1,w:12,d:9},{kind:'unit',x:-12,z:2,w:14,d:7},{kind:'budget',x:-12,z:-11,w:12,d:7},{kind:'preparation',x:17,z:25,w:16,d:9},{kind:'printer',x:46,z:27,w:14,d:10},{kind:'cabinet',x:-56,z:29,w:5,d:13},{kind:'waiting',x:-39,z:38,w:14,d:4},{kind:'dispatch',x:51,z:10,w:10,d:6},{kind:'forms',x:-40,z:33,w:5,d:5},{kind:'cart',x:-27,z:20,w:6,d:7},{kind:'scanner',x:46,z:0,w:10,d:7},{kind:'binding',x:51,z:38,w:9,d:7},{kind:'shelving',x:-56,z:13,w:9,d:8},{kind:'shredder',x:29,z:36,w:4,d:4}];
 if(variant===0)return [{kind:'unit205',x:-16,z:-5,w:21,d:8},{kind:'calculator',x:17,z:-3,w:15,d:11},{kind:'budget',x:26,z:26,w:10,d:7},{kind:'cabinet',x:-27,z:18,w:5,d:12},{kind:'cart',x:8,z:27,w:5,d:6},{kind:'forms',x:7,z:7,w:5,d:5},{kind:'shelving',x:-26,z:32,w:7,d:4}];
 return [{kind:'minimum',x:-12,z:5,w:21,d:8},{kind:'ledger',x:25,z:-1,w:6,d:18,sideways:true},{kind:'condition',x:-10,z:-7,w:14,d:5},{kind:'waiting',x:-26,z:-6,w:8,d:4},{kind:'cart',x:8,z:29,w:5,d:6},{kind:'forms',x:25,z:29,w:5,d:5},{kind:'binding',x:6,z:-5,w:6,d:6}];
}
export function orchardObstacles(f){return [rect(f.x,f.z,f.w+.5,f.d+.5),...(f.kind==='printer'?[rect(f.x+4,f.z-5.6,1.4,1.4)]:[])];}
export function orchardLayout(node){
 const repair=Boolean(node.repairFor),p=node.scene,slots=routeSlots(node),objects=node.objects.map((object,i)=>({...object.position||p.stations[i],object}));
 const gates=repair?[{x:640,y:850,approach:{x:640,y:826},travelYaw:Math.PI,travelDirection:{x:0,y:1},exit:node.exits.find(e=>e.id==='retry')}]:node.exits.map((exit,i)=>{const q=p.targets[slots[i]];return {...q,approach:{x:q.x,y:q.y+24},travelYaw:0,travelDirection:{x:0,y:-1},exit};});
 for(const o of objects)if(o.object.kind==='wayfinding'){const routes=[...gates].sort((a,b)=>a.x-b.x).map(g=>({id:g.exit.id,label:g.exit.label}));o.object={...o.object,routes,directoryMount:'posts',directoryTitle:'مقایسه درخواست خرید اول آرمان',text:'سه محل تحویل در عمق‌های متفاوت دفتر قرار دارند. مبلغ هر درخواست را با بودجه، حداقل و قیمت واحد تطبیق بده.\n\n'+routes.map((r,i)=>['ضلع چپ','انتهای دفتر','ضلع راست'][i]+': '+r.label).join('\n\n')};}
 const spawn=p.entry,hub=p.hub,roads=[[spawn,hub]];for(const g of gates)roads.push([hub,{x:g.x,y:hub.y},g]);for(const o of objects)if(o.object.kind!=='wayfinding')roads.push([spawn,{x:o.x,y:spawn.y},o]);
 const fixtures=orchardFixtures(repair?p.orchardVariant:null),reserved=fixtures.flatMap(orchardObstacles),solids=[];
 if(repair)solids.push(rect(-32,14,1,52),rect(32,14,1,52),rect(0,-12,64,1),rect(0,-10.7,20,1.6),rect(-18.3,40,27.4,1),rect(18.3,40,27.4,1));
 else{
  solids.push(rect(-64,14,1,64),rect(64,20,1,52),rect(0,46,128,1),rect(-21,-24,1,12),rect(21,-18,1,24),rect(-10.1,-17.5,1.3,1.3),rect(10.1,-17.5,1.3,1.3));
  for(const [x,z,w]of [[-42.5,-18,43],[0,-30,42],[42.5,-6,43]]){const g=gates.find(g=>Math.abs((g.x-640)*.1-x)<20),gx=(g.x-640)*.1;for(const [a,b]of [[x-w/2,gx-4.6],[gx+4.6,x+w/2]])solids.push(rect((a+b)/2,z,b-a,1));}
 }
 if(repair)for(const side of [-1,1])for(const z of p.orchardVariant===0?[18,33]:[20,33])solids.push(rect(side*31,z,1.6,6.4));
 for(const g of gates)solids.push(rect((g.x-640)*.1,(g.y-450)*.1,8.8,.4));for(const o of objects)if(o.object.kind!=='wayfinding')solids.push(rect((o.x-640)*.1,(o.y-450)*.1,6.8,4));
 const areas=repair?[{minX:320,maxX:960,minY:330,maxY:870}]:[{minX:0,maxX:430,minY:270,maxY:900},{minX:430,maxX:850,minY:150,maxY:900},{minX:850,maxX:1280,minY:390,maxY:900},{minX:400,maxX:880,minY:410,maxY:900}];
 return {roads,gates,objects,spawn,hub,entryYaw:0,sceneId:p.id,fixtures,floorPlan:{kind:'open-room',areas,barriers:[],reserved,solids}};
}
