import * as T from '../../vendor/three.module.js';
import {paymentTools} from './paymentTools.js';
import {buildPaymentProp} from './paymentProps.js';
import {buildPaymentDoors} from './paymentDoors.js';
export function buildPaymentScene(root,node,layout,h){
 const colors={doorGlass:'#64858a',floor:'#344954',body:'#d6e2df',metal:'#59717b',steel:'#a5bdc4',dark:'#243842',black:'#071b24',accent:'#d78d65',paper:'#f1eee1',screen:'#0f3942',glass:'#b6e3e4',glow:'#a9e7df',ceiling:'#dae6e3'},m=h.paymentMaterials||Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,h.mat(v)]));
 const {box:b,cylinder:c,beam,ring,screen}=paymentTools(root,h,m),repair=Boolean(node.repairFor),height=repair?(node.scene.paymentVariant===1?16:14.5):18;
 const points=layout.boundary.map(p=>[(p.x-640)*.1,(p.y-450)*.1]),shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const geo=h.geo('payment-floor-'+node.id,()=>new T.ExtrudeGeometry(shape,{depth:.6,bevelEnabled:false})),floor=new T.Mesh(geo,m.floor);floor.name='payment-floor';floor.rotation.x=-Math.PI/2;floor.position.y=-.6;floor.receiveShadow=true;root.add(floor);
 const roof=new T.Mesh(h.geo('payment-roof-'+node.id,()=>new T.ExtrudeGeometry(shape,{depth:.3,bevelEnabled:false})),m.ceiling);roof.name='payment-ceiling';roof.rotation.x=-Math.PI/2;roof.position.y=height;roof.receiveShadow=true;root.add(roof);
 for(let i=0;i<points.length;i++){
  const a=points[i],bb=points[(i+1)%points.length],dx=bb[0]-a[0],dz=bb[1]-a[1],length=Math.hypot(dx,dz),mid=[(a[0]+bb[0])/2,(a[1]+bb[1])/2],wall=new T.Group();wall.name='payment-wall';wall.position.set(mid[0],0,mid[1]);wall.rotation.y=Math.atan2(-dz,dx);root.add(wall);const wt=paymentTools(wall,h,m),gate=layout.gates.find(g=>Math.abs(((g.x-640)*.1-mid[0])*dz-((g.y-450)*.1-mid[1])*dx)<.01);
  if(gate){const center=(((gate.x-640)*.1-a[0])*dx+((gate.y-450)*.1-a[1])*dz)/length-length/2;for(const [left,right]of [[-length/2,center-4.6],[center+4.6,length/2]])wt.box('payment-solid-wall',(left+right)/2,height/2,0,right-left,height,.6,m.body);wt.box('payment-door-header',center,(height+10.4)/2,0,9.2,height-10.4,.6,m.body);}
  else{wt.box('payment-wall-base',0,3.5,0,length,7,.6,m.body);wt.box('payment-window-pane',0,10.5,0,length,7,.12,m.glass);wt.box('payment-wall-crown',0,(height+14)/2,0,length,height-14,.6,m.body);for(let x=-length/2;x<=length/2;x+=length/4)wt.box('payment-window-post',x,10.5,.04,.16,7,.22,m.steel);for(const y of [7,14])wt.box('payment-window-sill',0,y,0,length,.18,.8,m.steel);}
  if(!gate)wt.box('payment-wall-kickplate',0,.5,.34,length,1,.1,m.dark);
  beam('payment-radial-ceiling-rib',[0,height-.08,5],[mid[0],height-.08,mid[1]],.18,m.metal);
 }
 // A recessed threshold remains level with the continuous floor.
 for(const g of layout.gates){const strip=new T.Group();strip.position.set((g.x-640)*.1,0,(g.y-450)*.1);strip.rotation.y=g.travelYaw;root.add(strip);const t=paymentTools(strip,h,m);t.box('payment-threshold',0,.015,0,8.8,.03,1,m.steel);}
 if(!repair){
  ring('payment-pendant-ring',0,16.2,5,8,.14,m.glow,true);for(const [x,z]of [[-8,5],[8,5],[0,-3],[0,13]])c('payment-pendant-rod',x,17.15,z,.035,1.7,m.steel);
  const choices=[...layout.gates].sort((a,b)=>a.x-b.x);screen('payment-directory',0,10,-9,17,4.2,['خرید دوم آرمان',...choices.map((g,i)=>['چپ','میانه','راست'][i]+' · '+g.exit.label)]);for(const x of [-6,6])b('payment-directory-hanger',x,15.125,-9,.06,5.75,.06,m.steel);
 }else if(node.scene.paymentVariant===1){for(const x of [-20,-10,0,10,20]){b('payment-capacity-ceiling-blade',x,15.75,8,.15,.5,36,m.metal);b('payment-capacity-ceiling-light',x,15.475,8,.07,.05,32,m.glow);}}
 else{for(let i=0;i<8;i++){const depth=i===7?25:35,z=i===7?9.5:8,panel=b('payment-amount-ceiling-fin',-21+i*6,14.24,z,4.5,.18,depth,m.metal);panel.rotation.z=.08;const light=b('payment-amount-ceiling-light',-21+i*6,14.13,z,3,.04,depth-7,m.glow);light.rotation.z=.08;}}
 for(const f of layout.fixtures){const group=new T.Group();group.name='payment-fixture-'+f.kind;group.position.set(f.x,0,f.z);root.add(group);buildPaymentProp(group,f,h,m);}
 buildPaymentDoors(root,node,layout,h,m);
 const fill=new T.PointLight('#c6eeeb',120,100,2);fill.position.set(0,11,8);root.add(fill);return {variant:node.scene.paymentVariant};
}
export function buildPaymentFurniture(root,guide,h,m){const t=paymentTools(root,h,m);t.feet(6.8,4);t.box('payment-document-dock',0,1.18,0,6.8,2.16,4,m.body,true);t.box('payment-document-tray',0,2.265,0,6,.03,3.4,m.dark);if(guide)t.reader(2,3,-.6);else{t.box('payment-file-clip',-1.8,2.38,-.6,.5,.2,.16,m.steel);t.receipt(2.2,2.8,-.8);}return root;}
