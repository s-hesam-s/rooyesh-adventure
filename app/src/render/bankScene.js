import * as T from '../../vendor/three.module.js';
import {paymentTools} from './paymentTools.js';
import {buildBankProp} from './bankProps.js';
import {buildBankDoors} from './bankDoors.js';
export function buildBankScene(root,node,layout,h){
 const palette={floor:'#34414a',wood:'#806c54',body:'#d8d8ca',metal:'#555e66',steel:'#a9b6b9',dark:'#24313d',black:'#101b25',accent:'#ad9564',paper:'#f1ead6',screen:'#102e40',glass:'#a5c7cf',doorGlass:'#76909a',glow:'#e6e4d3',ceiling:'#c4c7c4'},m=h.bankMaterials||Object.fromEntries(Object.entries(palette).map(([k,v])=>[k,h.mat(v)])),repair=Boolean(node.repairFor),height=repair?(node.scene.bankVariant===0?14:15):18;
 const t=paymentTools(root,h,m),{box:b,beam}=t,points=layout.boundary.map(p=>[(p.x-640)*.1,(p.y-450)*.1]),shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 for(const [name,y,depth,material]of [['bank-floor',-.4,.4,m.floor],['bank-ceiling',height,.3,m.ceiling]]){const o=new T.Mesh(h.geo(name+'-'+node.id,()=>new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false})),material);o.name=name;o.rotation.x=-Math.PI/2;o.position.y=y;o.receiveShadow=true;root.add(o);}
 for(let i=0;i<points.length;i++){
  const a=points[i],q=points[(i+1)%points.length],dx=q[0]-a[0],dz=q[1]-a[1],length=Math.hypot(dx,dz),mx=(a[0]+q[0])/2,mz=(a[1]+q[1])/2,g=new T.Group();g.name='bank-wall';g.position.set(mx,0,mz);g.rotation.y=Math.atan2(-dz,dx);root.add(g);const wt=paymentTools(g,h,m),gate=layout.gates.find(g=>Math.abs(((g.x-640)*.1-mx)*dz-((g.y-450)*.1-mz)*dx)<.01),wood=i%2===0||repair;
  function section(left,right){if(right-left<.01)return;const x=(left+right)/2,w=right-left;wt.box('bank-wall-solid',x,3.6,0,w,7.2,.6,wood?m.wood:m.body);wt.box('bank-wall-upper',x,(height+13)/2,0,w,height-13,.6,m.body);wt.box('bank-clerestory-glass',x,10.1,0,w,5.8,.12,m.glass);for(const yy of [7.2,13])wt.box('bank-window-rail',x,yy,0,w,.15,.55,m.steel);for(let xx=left+.15;xx<right;xx+=5)wt.box('bank-window-mullion',xx,10.1,0,.12,5.8,.25,m.metal);wt.box('bank-kickplate',x,.25,.34,w,.5,.1,m.dark);if(wood)for(let xx=left+.35;xx<right;xx+=.85)wt.box('bank-acoustic-slat',xx,3.7,.34,.12,6.8,.12,m.wood);}
  if(gate){const center=(((gate.x-640)*.1-a[0])*dx+((gate.y-450)*.1-a[1])*dz)/length-length/2;section(-length/2,center-4.6);section(center+4.6,length/2);wt.box('bank-door-wall-header',center,(height+10.4)/2,0,9.2,height-10.4,.6,m.body);}else section(-length/2,length/2);
  wt.box('bank-wall-cornice',0,height-.25,0,length,.5,.85,m.metal);
 }
 // Two independent ceiling grids follow the two wings of the L-shaped room.
 const regions=repair?(node.scene.bankVariant===0?[{x:0,z:9.5,w:45,d:38}]:[{x:-2,z:12,w:48,d:32}]):[{x:-15,z:6,w:53,d:75},{x:27,z:17,w:29,d:53}];
 for(const r of regions){const vz=r.z+1.5;b('bank-ceiling-vent-frame',r.x,height-.07,vz,4,.14,2,m.steel);for(let i=0;i<12;i++)b('bank-ceiling-vent-slot',r.x-1.65+i*.3,height-.145,vz,.12,.02,1.6,m.dark);for(let z=r.z-r.d/2+2;z<r.z+r.d/2;z+=7){b('bank-ceiling-batten',r.x,height-.15,z,r.w,.3,.2,m.metal);b('bank-linear-light',r.x,height-.33,z,r.w-3,.06,.32,m.glow);}for(let x=r.x-r.w/2+2;x<r.x+r.w/2;x+=8)b('bank-ceiling-track',x,height-.12,r.z,.12,.24,r.d,m.dark);}
 for(const f of layout.fixtures){const group=new T.Group();group.name='bank-fixture-'+f.kind;group.position.set(f.x,0,f.z);root.add(group);buildBankProp(group,f,h,m,layout);}
 // A glazed operational partition has its own posts, shoes and clamps.
 if(!repair){for(let i=0;i<3;i++){const x=-32+i*5;b('bank-partition-glass',x,4,-9,4.8,7,.12,m.glass);for(const side of [-1,1]){b('bank-partition-shoe',x+side*2.3,.12,-9,.6,.24,.65,m.metal);b('bank-partition-clamp',x+side*2.3,.65,-9,.2,1,.25,m.steel);}}for(const y of [7.5])b('bank-partition-rail',-27,y,-9,15,.18,.22,m.metal);}
 for(const g of layout.gates){const threshold=new T.Group();threshold.position.set((g.x-640)*.1,0,(g.y-450)*.1);threshold.rotation.y=g.travelYaw;root.add(threshold);paymentTools(threshold,h,m).box('bank-threshold',0,.015,0,8.8,.03,.8,m.steel);}
 buildBankDoors(root,node,layout,h,m);
 for(const [x,z]of repair?[[0,8]]:[[-14,-7],[22,20]]){const light=new T.PointLight('#e2e8e8',110,75,2);light.position.set(x,11,z);root.add(light);}return {variant:node.scene.bankVariant};
}
