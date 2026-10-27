import * as T from '../../vendor/three.module.js';
import {createDoorDestinationView} from './archiveRoomView.js';
import {layoutFor} from '../game/world.js';
import {nodes} from '../content/campaign.js';
export function buildCanalDoors(parent,node,layout,h,m){
 const south=Boolean(node.repairFor),direction=south?-1:1,wallZ=south?-40:-26,half=south?32:65,height=south?19:16;
 const frame=new T.Group();if(south)frame.rotation.y=Math.PI;parent.add(frame);
 const unit=h.geo('canal-door-unit',()=>new T.BoxGeometry(1,1,1));
 function b(group,x,y,z,w,ht,d,material,dynamic=false){const o=new T.Mesh(unit,material);o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;o.userData.dynamic=dynamic;group.add(o);return o;}
 function tag(text,x,y,z,w=9,ht=1){if(!h.archiveText)return;const o=new T.Mesh(h.geo('canal-door-sign',()=>new T.PlaneGeometry(1,1)),h.archiveText(text));o.position.set(x,y,z);o.scale.set(w,ht,1);frame.add(o);}
 const centers=layout.gates.map(g=>(g.x-640)*.1*direction).sort((a,b)=>a-b),edges=[-half,...centers.flatMap(x=>[x-4.6,x+4.6]),half];
 for(let i=0;i<edges.length;i+=2){const a=edges[i],bb=edges[i+1],x=(a+bb)/2,w=bb-a;b(frame,x,height/2,wallZ,w,height,1,m.plaster);b(frame,x,1.25,wallZ+.58,w,2.5,.24,m.stone);b(frame,x,height-.4,wallZ+.5,w,.5,1,m.stone);}
 for(const [i,g]of layout.gates.entries()){
  const x=(g.x-640)*.1*direction,z=(g.y-450)*.1*direction;
  for(const dx of [-4.8,4.8]){b(frame,x+dx,5,z,.5,10,1.1,m.metal);b(frame,x+dx,5.5,z-.35,1.2,11,1.4,m.stone);for(const y of [.5,10.6])b(frame,x+dx,y,z,1.55,.5,1.8,m.stone);}
  b(frame,x,(height+10.4)/2,z,9, height-10.4,1,m.plaster);b(frame,x,10.35,z+.15,10.2,.35,1.5,m.metal);b(frame,x,.05,z,9,.1,1.7,m.stone);
  tag(g.exit.label,x,9.55,z+.58,8.7,.95);tag(south?'بازگشت به باغ آبراه':'مسیر بررسی تعهد '+new Intl.NumberFormat('fa-IR').format([...layout.gates].sort((a,b)=>a.x-b.x).findIndex(q=>q.exit.id===g.exit.id)+1),x,12.35,z+.58,10,1.05);
  if(!south){for(const dx of [-6,6]){b(frame,x+dx,.18,z+3,1.2,.36,1.2,m.stone);b(frame,x+dx,7,z+3,.4,14,.4,m.darkWood);}for(const dz of [-2,3])b(frame,x,14,z+dz,13,.4,.5,m.darkWood);for(let i=0;i<9;i++)b(frame,x-6+i*1.5,14.3,z+.5,.35,.25,6.2,m.wood);}
  const leaves=[],handles=[];
  for(const side of [-1,1]){
   const pivot=new T.Group();pivot.position.set(x+side*4.4,0,z);frame.add(pivot);const cx=-side*2.18;
   for(const dx of [-2.12,2.12])b(pivot,cx+dx,4.15,0,.15,8.3,.24,m.metal,true);
   for(const y of [.1,3.25,8.2])b(pivot,cx,y,0,4.36,.18,.25,m.metal,true);
   b(pivot,cx,1.67,0,4.1,2.9,.18,m.panel,true);b(pivot,cx,5.7,-.02,4.05,4.65,.13,m.darkWood,true);
   for(const dx of [-1.35,0,1.35])b(pivot,cx+dx,5.7,.09,.055,4.5,.065,m.brass,true);
   for(const y of [4.2,6.8])b(pivot,cx,y,.09,4,.05,.065,m.brass,true);
   for(const dx of [-1.6,-.8,0,.8,1.6])b(pivot,cx+dx,1.67,.13,.055,2.75,.07,m.darkWood,true);
   for(const sideAngle of [-1,1]){const brace=b(pivot,cx,5.7,.14,.07,5.1,.07,m.brass,true);brace.rotation.z=sideAngle*.55;}
   const handle=new T.Group();handle.position.set(-side*3.95,4.05,.25);pivot.add(handle);b(handle,0,0,0,.19,.66,.055,m.brass,true);b(handle,side*.20,0,.12,.52,.065,.075,m.brass,true);
   for(const y of [1.2,4.3,7.3])b(pivot,0,y,0,.13,.38,.18,m.brass,true);
   leaves.push({pivot,side});handles.push({root:handle,side});
  }
  g.bar=b(frame,x,9.55,z+.72,.16,.16,.08,m.brass,true);
  g.door={leaves,handles,apply(pose){for(const leaf of leaves)leaf.pivot.rotation.y=-leaf.side*pose.open*1.65;for(const hand of handles)hand.root.rotation.z=hand.side*pose.handle*.32;}};
  let targetCenter={x:0,z:40},targetDoorId='retry';
  if(south){const choice=Number(node.id.at(-1)),gate=layoutFor(nodes.ownerAmount).gates.find(q=>q.exit.id==='route-'+choice);targetCenter={x:(gate.x-640)*.1,z:(gate.y-450)*.1};targetDoorId=gate.exit.id;}
  if(!south&&!/^repair-ownerAmount-/.test(g.exit.next)){const destination=layoutFor(nodes[g.exit.next]);targetCenter={x:(destination.spawn.x-640)*.1,z:(destination.spawn.y-450)*.1+5};targetDoorId='';}
  createDoorDestinationView(parent,g,h,{direction:south?1:-1,targetCenter,targetDoorId});
 }
}
