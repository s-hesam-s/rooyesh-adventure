import * as T from '../../vendor/three.module.js';
import {createDoorDestinationView} from './archiveRoomView.js';
import {layoutFor} from '../game/world.js';
import {nodes} from '../content/campaign.js';
export function buildOrchardDoors(parent,node,layout,h,m){
 const south=Boolean(node.repairFor),direction=south?-1:1,height=south?19:20;
 const frame=new T.Group();if(south)frame.rotation.y=Math.PI;parent.add(frame);
 const unit=h.geo('orchard-door-unit',()=>new T.BoxGeometry(1,1,1));
 function b(group,x,y,z,w,ht,d,material,dynamic=false){const o=new T.Mesh(unit,material);o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;o.userData.dynamic=dynamic;group.add(o);return o;}
 function tag(text,x,y,z,w=9,ht=1){if(!h.archiveText)return;b(frame,x,y,z-.04,w+.3,ht+.18,.16,m.paper);const o=new T.Mesh(h.geo('orchard-door-sign',()=>new T.PlaneGeometry(1,1)),h.archiveText(text));o.position.set(x,y,z+.045);o.scale.set(w,ht,1);frame.add(o);}
 const walls=south?[{left:-32,right:32,z:-40}]:[{left:-64,right:-21,z:-18},{left:-21,right:21,z:-30},{left:21,right:64,z:-6}];
 for(const wall of walls){const gate=layout.gates.find(g=>{const x=(g.x-640)*.1*direction;return x>wall.left&&x<wall.right;}),gx=(gate.x-640)*.1*direction;for(const [a,bb]of [[wall.left,gx-4.6],[gx+4.6,wall.right]]){const x=(a+bb)/2,w=bb-a;b(frame,x,height/2,wall.z,w,height,1,m.plaster);b(frame,x,1,wall.z+.58,w,2,.24,m.panel);}}
 for(const [i,g]of layout.gates.entries()){
  const x=(g.x-640)*.1*direction,z=(g.y-450)*.1*direction;
  for(const dx of [-4.8,4.8]){b(frame,x+dx,5,z,.5,10,1.1,m.metal);b(frame,x+dx,5.5,z-.35,1.2,11,1.4,m.stone);for(const y of [.5,10.6])b(frame,x+dx,y,z,1.55,.5,1.8,m.stone);}
  b(frame,x,(height+10.4)/2,z,9, height-10.4,1,m.plaster);b(frame,x,10.35,z+.15,10.2,.35,1.5,m.metal);b(frame,x,.05,z,9,.1,1.7,m.stone);
  tag(g.exit.label,x,9.55,z+.58,8.7,1.15);tag(south?'بازگشت به دفتر ثبت سفارش':'تحویل درخواست '+new Intl.NumberFormat('fa-IR').format([...layout.gates].sort((a,b)=>a.x-b.x).findIndex(q=>q.exit.id===g.exit.id)+1),x,12.35,z+.58,10,1.4);
  b(frame,x,10.85,z+.65,10,.12,.18,m.metal);
  const leaves=[],handles=[];
  for(const side of [-1,1]){
   const pivot=new T.Group();pivot.position.set(x+side*4.4,0,z);frame.add(pivot);const cx=-side*2.18;
   for(const dx of [-2.12,2.12])b(pivot,cx+dx,4.15,0,.15,8.3,.24,m.metal,true);
   for(const y of [.1,3.25,8.2])b(pivot,cx,y,0,4.36,.18,.25,m.metal,true);
   b(pivot,cx,1.67,0,4.1,2.9,.18,m.panel,true);b(pivot,cx,5.7,-.02,4.05,4.65,.13,m.glass,true);
   for(const y of [4.5,4.8])b(pivot,cx,y,.09,4,.16,.025,m.paper,true);
   b(pivot,cx,1.67,.12,3.7,.055,.025,m.metal,true);
   const handle=new T.Group();handle.position.set(-side*3.95,4.05,.25);pivot.add(handle);b(handle,0,0,0,.19,.66,.055,m.brass,true);b(handle,side*.20,0,.12,.52,.065,.075,m.brass,true);
   for(const y of [1.2,4.3,7.3])b(pivot,0,y,0,.13,.38,.18,m.brass,true);
   leaves.push({pivot,side});handles.push({root:handle,side});
  }
  g.bar=b(frame,x,9.55,z+.72,.16,.16,.08,m.brass,true);
  g.door={leaves,handles,apply(pose){for(const leaf of leaves)leaf.pivot.rotation.y=-leaf.side*pose.open*1.65;for(const hand of handles)hand.root.rotation.z=hand.side*pose.handle*.32;}};
  let targetCenter={x:0,z:40},targetDoorId='retry';
  if(south){const choice=Number(node.id.at(-1)),gate=layoutFor(nodes.naturalSlip).gates.find(q=>q.exit.id==='route-'+choice);targetCenter={x:(gate.x-640)*.1,z:(gate.y-450)*.1};targetDoorId=gate.exit.id;}
  if(!south&&!/^repair-naturalSlip-/.test(g.exit.next)){const destination=layoutFor(nodes[g.exit.next]);targetCenter={x:(destination.spawn.x-640)*.1,z:(destination.spawn.y-450)*.1+5};targetDoorId='';}
  const view=createDoorDestinationView(parent,g,h,{direction:south?1:-1,targetCenter,targetDoorId});
  // Keep the destination behind the swinging leaves and clip its rays to this doorway.
  const eye=new T.Vector3(),center=new T.Vector3((g.x-640)*.1,0,(g.y-450)*.1),compile=view.material.onBeforeCompile;
  view.userData.aperture={width:8.8,height:10.3};view.onBeforeRender=(_renderer,_scene,camera)=>{eye.setFromMatrixPosition(camera.matrixWorld);};
  view.material.onBeforeCompile=shader=>{compile(shader);shader.uniforms.orderPortalEye={value:eye};shader.uniforms.orderPortalCenter={value:center};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 orderPortalPoint;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\norderPortalPoint=(modelMatrix*vec4(position,1.)).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 orderPortalEye;uniform vec3 orderPortalCenter;varying vec3 orderPortalPoint;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfloat orderPortalRay=(orderPortalCenter.z-orderPortalEye.z)/(orderPortalPoint.z-orderPortalEye.z);vec3 orderPortalHit=mix(orderPortalEye,orderPortalPoint,orderPortalRay);if(abs(orderPortalHit.x-orderPortalCenter.x)>4.4||orderPortalHit.y<0.||orderPortalHit.y>10.3)discard;');};
  view.material.customProgramCacheKey=()=> 'order-aperture-window-v1';
 }
}
