import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
export function buildArchiveDoors(parent,layout,h,{south=false,frontZ=-26,halfWidth=65,wallHeight=24,section='بایگانی'}={}){
 const direction=south?-1:1;if(south){const frame=new T.Group();frame.rotation.y=Math.PI;parent.add(frame);parent=frame;}
 const m=h.archiveMaterials||{},wood=m.wood||h.mat('#73533b'),dark=m.darkWood||h.mat('#4a3b30'),stone=m.stone||h.mat('#c7bca8'),plaster=m.plaster||h.mat('#d7cfba'),brass=m.brass||h.mat('#ab905d');
 const unit=h.geo('archive-door-unit',()=>new RoundedBoxGeometry(1,1,1,3,.035));
 function box(group,x,y,z,w,ht,d,material,dynamic=false){const o=new T.Mesh(unit,material);o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;o.userData.dynamic=dynamic;group.add(o);return o;}
 function plaque(text,x,y,z,w,ht){if(!h.archiveText){h.label(text,x,y,z,w);return;}const o=new T.Mesh(h.geo('archive-door-plaque',()=>new T.PlaneGeometry(1,1)),h.archiveText(text));o.position.set(x,y,z);o.scale.set(w,ht,1);parent.add(o);}
 const centers=layout.gates.map(g=>(g.x-640)*.1*direction).sort((a,b)=>a-b);
 const fronts=[-halfWidth,...centers.flatMap(x=>[x-4.6,x+4.6]),halfWidth];
 for(let i=0;i<fronts.length;i+=2){const left=fronts[i],right=fronts[i+1],x=(left+right)/2,w=right-left;box(parent,x,wallHeight/2,frontZ,w,wallHeight,1.05,plaster);box(parent,x,2.2,frontZ+.65,w,4.4,.25,dark);for(let px=left+2.2;px<right-1;px+=4.4){box(parent,px,2.2,frontZ+.86,3.8,3.45,.16,wood);box(parent,px,2.2,frontZ+.97,3.3,2.95,.08,dark);}box(parent,x,4.7,frontZ+.8,w,.26,.32,wood);}
 for(const [i,gate]of layout.gates.entries()){
  const x=(gate.x-640)*.1*direction,z=(gate.y-450)*.1*direction,depth=frontZ-z;
  // The central recess and all three rooms connect to the existing library walls.
  for(const dx of [-4.9,4.9]){box(parent,x+dx,wallHeight/2,z,1.15,wallHeight,1.8,plaster);box(parent,x+dx,4.8,z+.25,.65,9.6,1.3,wood);box(parent,x+dx,.3,z+.4,1,.6,1.5,stone);if(depth>0)box(parent,x+dx,5.2,z+depth/2,.8,10.4,depth,wood);}
  box(parent,x,(wallHeight+10)/2,z,8.8,wallHeight-10,1.1,plaster);box(parent,x,10,z+.2,11,.8,1.8,wood);box(parent,x,10.55,z+.2,11.7,.3,2,stone);box(parent,x,.07,z,8.8,.12,2,stone);
  box(parent,x,8.92,z+.3,8.6,1.15,.5,dark);plaque(gate.exit.label,x,8.92,z+.58,8.1,.87);plaque(section+' '+new Intl.NumberFormat('fa-IR').format(i+1),x,11.55,z+.6,4.5,.8);
  const leaves=[],handles=[];
  for(const side of [-1,1]){
   const pivot=new T.Group();pivot.name='archive-door-hinge-'+side;pivot.position.set(x+side*4.4,0,z);parent.add(pivot);const cx=-side*2.19;
   box(pivot,cx,4.05,0,4.34,8.05,.35,wood,true);if(side===1)box(pivot,-4.37,4.05,.2,.12,8.05,.05,dark,true);
   for(const y of [1.8,5.5]){box(pivot,cx,y,.21,3.5,y<3?2.3:4,.12,dark,true);for(const dx of [-1.77,1.77])box(pivot,cx+dx,y,.28,.075,y<3?2.35:4.05,.05,brass,true);}
   for(const y of [.62,2.98,3.48,7.52])box(pivot,cx,y,.28,3.6,.07,.05,brass,true);
   for(const y of [1.2,4,7]){const hinge=new T.Mesh(h.geo('archive-door-hinge',()=>new T.CylinderGeometry(.075,.075,.42,16)),brass);hinge.position.set(0,y,0);hinge.userData.dynamic=true;pivot.add(hinge);}
   const handle=new T.Group();handle.position.set(-side*4.02,4.12,.33);pivot.add(handle);box(handle,0,0,0,.2,.68,.055,brass,true);const lever=box(handle,side*.19,0,.13,.5,.075,.09,brass,true);handles.push({root:handle,lever,side});
   leaves.push({pivot,side});
  }
  const lock=box(parent,x,8.92,z+.68,.16,.16,.06,brass,true);gate.bar=lock;
  gate.door={leaves,handles,apply(pose){for(const leaf of leaves)leaf.pivot.rotation.y=-leaf.side*pose.open*1.65;for(const hand of handles)hand.root.rotation.z=hand.side*pose.handle*.32;}};
  const roomLight=new T.PointLight('#ffdfb2',20,22,2);roomLight.position.set(x,8,z-7);parent.add(roomLight);
 }
}
