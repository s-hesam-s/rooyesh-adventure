import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {buildCalendarDoors} from './calendarDoors.js';

export function createCalendarMaterials(base){
 const stone=base.stone.clone();stone.color.set('#d4c8b3');return {stone,plaster:base.plaster.clone(),paper:base.paper,brass:base.brass,metal:new T.MeshStandardMaterial({color:'#3c6566',metalness:.62,roughness:.39}),panel:new T.MeshStandardMaterial({color:'#3b585b',metalness:.3,roughness:.57}),glass:new T.MeshStandardMaterial({color:'#a5b9b0',roughness:.36,metalness:.15,emissive:'#7eaba7',emissiveIntensity:.09}),dark:new T.MeshStandardMaterial({color:'#294246',roughness:.8}),glow:base.glow,soil:new T.MeshStandardMaterial({color:'#514836',roughness:1}),copper:new T.MeshStandardMaterial({color:'#a98253',metalness:.7,roughness:.35})};
}
export function buildCalendarScene(parent,node,layout,h){
 const m=h.calendarMaterials||{stone:h.mat('#c3bca4'),plaster:h.mat('#e2ddca'),paper:h.mat('#ece4ca'),brass:h.mat('#a68d5d'),metal:h.mat('#3c6566'),panel:h.mat('#3b585b'),glass:h.mat('#a5b9b0'),dark:h.mat('#294246'),soil:h.mat('#514836'),copper:h.mat('#a98253')},repair=Boolean(node.repairFor),variant=node.scene.calendarVariant;
 const unit=h.geo('calendar-stone-unit',()=>new RoundedBoxGeometry(1,1,1,2,.025));
 function b(x,y,z,w,ht,d,material=m.stone){const o=new T.Mesh(unit,material);o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function cyl(x,y,z,r,height,material=m.brass,top=r){const g=h.geo('calendar-cylinder-'+r+':'+top+':'+height,()=>new T.CylinderGeometry(top,r,height,32)),o=new T.Mesh(g,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function tag(text,x,y,z,w=10,ht=1.2,yaw=0){if(!h.archiveText)return;const o=new T.Mesh(h.geo('calendar-sign',()=>new T.PlaneGeometry(1,1)),h.archiveText(text));o.position.set(x,y,z);o.rotation.y=yaw;o.scale.set(w,ht,1);parent.add(o);}
 function clock(x,y,z,r){
  const dial=new T.Mesh(h.geo('calendar-clock-face-'+r,()=>new T.CylinderGeometry(r,r,.18,96)),m.paper);dial.rotation.x=Math.PI/2;dial.position.set(x,y,z);parent.add(dial);
  const rim=new T.Mesh(h.geo('calendar-clock-rim-'+r,()=>new T.TorusGeometry(r,.15,12,96)),m.brass);rim.position.set(x,y,z+.15);parent.add(rim);
  for(let i=0;i<60;i++){const a=i*Math.PI/30,o=b(x+Math.sin(a)*r*.87,y+Math.cos(a)*r*.87,z+.2,i%5?.04:.11,i%5?.18:.42,.065,i%5?m.dark:m.brass);o.rotation.z=-a;}
  for(const [angle,length,width]of [[-.6,r*.51,.13],[Math.PI/2,r*.73,.085]]){const o=b(x+Math.sin(angle)*length/2,y+Math.cos(angle)*length/2,z+.29,width,length,.09,m.dark);o.rotation.z=-angle;}
  const hub=new T.Mesh(h.geo('calendar-clock-hub',()=>new T.SphereGeometry(.19,20,12)),m.brass);hub.position.set(x,y,z+.35);parent.add(hub);
 }
 function railing(segment){
  const ax=(segment.a.x-640)*.1,az=(segment.a.y-450)*.1,bx=(segment.b.x-640)*.1,bz=(segment.b.y-450)*.1,l=Math.hypot(bx-ax,bz-az),n=Math.ceil(l/2.5);
  for(let i=0;i<=n;i++){const x=ax+(bx-ax)*i/n,z=az+(bz-az)*i/n;b(x,1.35,z,.12,2.7,.12,m.metal);cyl(x,2.74,z,.12,.12);}
  for(const y of [.3,2.25]){const o=b((ax+bx)/2,y,(az+bz)/2,.14,.12,l,m.metal);o.rotation.y=Math.atan2(bx-ax,bz-az);}
  const base=b((ax+bx)/2,.15,(az+bz)/2,.6,.3,l+.4,m.stone);base.rotation.y=Math.atan2(bx-ax,bz-az);
 }
 const floor=b(0,-.48,repair?8:1,repair?66:132,.9,repair?66:94,m.stone);floor.name=repair?'calendar-side-room-floor':'calendar-courtyard-floor';
 // Narrow paving joints form a continuous floor, not a movement mask.
 if(!repair){
  const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 skyPoint;void main(){skyPoint=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:   'varying vec3 skyPoint;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}void main(){vec3 d=normalize(skyPoint);float t=clamp(d.y*1.8,0.,1.);vec3 color=mix(vec3(.76,.81,.79),vec3(.30,.53,.68),t);vec2 uv=d.xz/max(.16,d.y+.22)*2.;float n=noise(uv)*.55+noise(uv*2.1)*.28+noise(uv*4.2)*.17;float cloud=smoothstep(.53,.72,n)*(1.-smoothstep(.38,.7,d.y))*smoothstep(.02,.13,d.y);color=mix(color,vec3(.91,.92,.87),cloud*.75);gl_FragColor=vec4(color,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});
  skyMaterial.userData.transient=true;const sky=new T.Mesh(h.geo('calendar-courtyard-sky',()=>new T.SphereGeometry(250,40,24)),skyMaterial);sky.userData.dynamic=true;sky.name='calendar-courtyard-sky';parent.add(sky);
  // Stone arcades have actual curved reveals, not rectangular painted motifs.
  const arcade=h.geo('calendar-side-arcade',()=>{const shape=new T.Shape();shape.moveTo(-4,0);shape.lineTo(-4,5.8);shape.absarc(0,5.8,4,Math.PI,0,true);shape.lineTo(4,0);shape.lineTo(3.4,0);shape.lineTo(3.4,5.8);shape.absarc(0,5.8,3.4,0,Math.PI,false);shape.lineTo(-3.4,0);shape.closePath();return new T.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:true,bevelSegments:3,bevelSize:.06,bevelThickness:.06,curveSegments:64,steps:1});});
  for(const side of [-1,1]){
   const x=side*61;
   for(const z of [-23,-8,7,22,37]){
    const arch=new T.Mesh(arcade,m.stone);arch.name='calendar-supported-arch';arch.position.set(x,.1,z);arch.rotation.y=side*Math.PI/2;arch.castShadow=arch.receiveShadow=true;parent.add(arch);
    for(const dz of [-4.05,4.05]){
     b(x,.25,z+dz,1.6,.5,1.6);b(x,.58,z+dz,1.3,.18,1.3);
     const pier=b(x,3.14,z+dz,1,5.02,1.1);pier.name='calendar-arcade-pier';
     b(x,5.72,z+dz,1.17,.18,1.28);const capital=b(x,5.91,z+dz,1.4,.24,1.46);capital.name='calendar-supported-capital';
     for(let y=1.4;y<5.5;y+=1.05)b(x-side*.511,y,z+dz,.025,.025,1.09,m.plaster);
    }
    const key=b(x,9.72,z,1.03,.72,.55);key.name='calendar-arch-keystone';
    b(x,10.09,z,1.45,.28,9.6);b(x,10.32,z,1.7,.18,9.9);
   }
   b(x,10.08,7,1.15,.25,70);b(x,10.36,7,1.5,.3,70);
   b(side*63,10.58,7,4.8,.18,70,m.plaster);
  }
  for(let x=-60;x<=60;x+=10)b(x,.002,5,.045,.008,82,m.plaster);
  for(let z=-25;z<44;z+=10)b(0,.004,z,125,.008,.045,m.plaster);
  for(const segment of layout.floorPlan.barriers)railing(segment);
  for(const x of [-65,65]){b(x,4,1,1.1,8,94,m.plaster);b(x,1,1,1.4,2,94,m.stone);for(let z=-35;z<45;z+=12){b(x-Math.sign(x)*.7,5,z,1,10,1.1,m.stone);cyl(x-Math.sign(x)*.7,10.2,z,.7,.35,m.brass);}}
  for(const x of [-38,38])b(x,6,47,55,12,1.2,m.plaster);
  b(0,12.5,47,22,1,1.5,m.stone);for(const x of [-9,9])b(x,6,46,1.3,12,2,m.stone);
  for(let x=-7;x<=7;x+=1)b(x,5,46,.08,10,.1,m.metal);
  // Clock tower, plinth, fluted pilasters and a copper canopy.
  b(-45,.3,-14,13,.6,13,m.stone);b(-45,11,-14,10,22,9,m.plaster);
  for(const x of [-49.9,-40.1]){b(x,11,-9.3,.55,21,.65,m.stone);for(let z=-17;z<-9;z+=2)b(x,10,z,.6,19,.2,m.stone);}
  for(const y of [.9,3.2,21,22.4])b(-45,y,-14,11.7,.45,10.8,m.stone);
  b(-45,23.1,-14,12.5,.8,11.5,m.copper);b(-45,24,-14,10,.9,9,m.metal);cyl(-45,25,-14,.25,1.5,m.brass);
  clock(-45,15,-9.3,4.1);tag('برج ساعت · زمان مجازی پرونده',-45,8.3,-9.2,8.2,1.1);tag('روز دهم از مهلت طرح آفتاب',-45,6.6,-9.2,8.2,1.1);
  // A calendar reading stand sits beside the path, with real stepped pages and binder rings.
  b(-45,1.7,10,5,3.4,4,m.plaster);b(-45,3.5,10,6,.3,5,m.metal);
  for(let i=0;i<6;i++)b(-45,3.7+i*.025,10+i*.035,4.7,.022,3.5,m.paper);
  for(const x of [-46.5,-45,-43.5])cyl(x,4,8.5,.08,.35,m.brass);
  tag('تقویم بررسی مهلت',-45,5.5,11,7,1);
  for(const bed of layout.furniture.beds){b(bed.x,.4,bed.z,bed.w,.8,bed.d,m.stone);b(bed.x,.83,bed.z,bed.w-.5,.07,bed.d-.5,m.soil);for(let i=0;i<5;i++)h.plant(parent,bed.x-3+i*1.5,bed.z+(i%2?1:-1),i+7,1.7+i%3*.2).position.y=.85;}
  for(const bench of layout.furniture.benches){for(let i=0;i<5;i++)b(bench.x,.95,bench.z-1+i*.45,8,.12,.32,m.panel);for(const x of [bench.x-3,bench.x+3]){b(x,.5,bench.z,.22,1,2.7,m.metal);b(x,1.65,bench.z-1,.18,1.5,.18,m.metal);}for(let i=0;i<3;i++)b(bench.x,1.35+i*.33,bench.z-1,8,.18,.15,m.panel);}
  // Freestanding supports carry the directory above the junction, without blocking a door title.
  for(const x of [-11,11]){b(x,11.6,-13,.3,23.2,.3,m.metal);b(x,.3,-13,.75,.6,.75,m.stone);}b(0,23.3,-13,23,.3,.4,m.metal);
 }else{
  for(const x of [-32,32]){b(x,10,8,1,20,64,m.plaster);b(x,1.4,8,1.3,2.8,64,m.panel);for(const z of [-13,13,31]){b(x-Math.sign(x)*.6,11,z,.18,11,9,m.glass);for(const dz of [-4.6,0,4.6])b(x-Math.sign(x)*.8,11,z+dz,.2,11.4,.15,m.metal);}}
  b(0,10,-24,64,20,1,m.plaster);b(0,20.3,8,65,.6,65,m.plaster);for(let z=-20;z<40;z+=12)b(0,19.8,z,64,.35,.5,m.metal);
  // The two offices share the same building fabric, but have different working displays.
  for(const side of [-1,1])for(const z of [-13,13,31]){
   for(const y of [7.6,11.2,14.8])b(side*31.05,y,z,.3,.09,9.4,m.metal);
   b(side*30.85,5.35,z,1,.32,10.2,m.stone);
  }
  for(const side of [-1,1])for(const y of [.3,2.9,18.9])b(side*31.35,y,8,.22,.2,63,m.stone);
  const ceilingStep=variant===1?12:16;
  for(let x=-24;x<30;x+=ceilingStep)for(let z=-16;z<36;z+=14){b(x,19.92,z,ceilingStep-.7,.2,12.6,m.stone);b(x,19.75,z,ceilingStep-1.5,.12,11.4,m.plaster);}
  for(const x of (variant===1?[-18,17]:[-22,0,22])){
   b(x,18.7,7,.045,2.1,.045,m.brass);b(x,17.62,7,3.8,.16,1.8,m.metal);b(x,17.45,7,3.4,.16,1.5,m.glow||m.paper);b(x,17.3,7,3.8,.09,1.8,m.brass);
  }
  b(0,9.2,-23.15,27,8.5,.28,m.panel);b(0,9.2,-22.96,26.3,7.8,.08,m.paper);
  if(variant===1){
   tag('روزهای مهلت پرونده آفتاب',0,12.5,-22.82,20,.9);
   for(let day=1;day<=30;day++){
    const x=-10+((day-1)%10)*2.2,y=10.5-Math.floor((day-1)/10)*1.65;
    b(x,y,-22.83,1.9,1.35,.07,m.plaster);tag(new Intl.NumberFormat('fa-IR').format(day),x,y,-22.76,1.55,.9);
   }
   tag('تقویم معتبر · بررسی مجوز انتشار مستقل است',0,4.2,-23.1,25,1.1);
  }else{
   const statuses=['پرونده طرح','جمع‌آوری وجوه','تأیید عامل','تأیید نهاد مالی','تأیید نهایی'];
   for(let i=0;i<statuses.length;i++){
    const x=-10+i*5;b(x,9.2,-22.77,4.3,4.8,.12,i%2?m.plaster:m.stone);tag(statuses[i],x,10.5,-22.64,3.9,.8);tag(['ثبت پرونده','وضعیت ۵','بررسی عامل','بررسی نهاد','وضعیت ۱۵'][i],x,8.2,-22.63,3.9,.8);
    if(i<statuses.length-1)b(x+2.5,9.1,-22.55,.7,.08,.06,m.brass);
   }
   tag('ثبت وضعیت مطابق مرحله واقعی پرونده',0,4.2,-23.1,25,1.1);
  }
  tag(variant===1?'دفتر بازبینی مجوز انتشار':'دفتر بازبینی وضعیت طرح',0,15.7,-23.3,26,1.6);
  tag('بازگشت فقط از همان درِ ورود',0,13.1,39,24,1.4,Math.PI);
  clock(variant===1?-20:20,12,-23.2,2.6);
  for(const t of layout.furniture.tables){b(t.x,2.5,t.z,t.w,.3,t.d,m.panel);for(const x of [-t.w*.4,t.w*.4])for(const z of [-t.d*.34,t.d*.34])b(t.x+x,1.2,t.z+z,.26,2.4,.26,m.metal);if(variant===1){for(let i=0;i<5;i++){const sheet=b(t.x-2+i*.9,2.7+i*.03,t.z,.8,.04,2.8,i%2?m.paper:m.plaster);sheet.rotation.y=(i-2)*.07;}b(t.x+2.8,3,t.z-.8,.9,.5,.7,m.brass);}else{for(let i=0;i<4;i++){b(t.x-3+i*2,3,t.z,1.2,.9,2.5,i%2?m.panel:m.paper);b(t.x-3+i*2,3.5,t.z,1.3,.12,2.7,m.copper);}}}
  for(const [i,c]of layout.furniture.cabinets.entries()){b(c.x,3.5,c.z,c.w,7,c.d,m.panel);for(let y=1;y<7;y+=1.3){b(c.x,y,c.z+c.d/2+.12,c.w-.3,.9,.14,m.plaster);b(c.x,y,c.z+c.d/2+.22,.75,.1,.07,m.brass);}tag(variant===1?(i?'ثبت پاسخ ارسال':'پرونده مجوزها'):(i?'تاریخچه وضعیت':'دفتر تأییدها'),c.x,7.6,c.z+c.d/2+.25,c.w,.8);}
  const light=new T.PointLight(variant===1?'#ffe9c3':'#e2f2ed',55,90,2);light.position.set(0,13,8);parent.add(light);
 }
 buildCalendarDoors(parent,node,layout,h,m);
 const fill=new T.PointLight('#fff0d8',35,70,2);fill.position.set(0,12,16);parent.add(fill);
 return {variant};
}
export function buildCalendarFurniture(root,guide,h,m={},variant=null){
 const stone=m.stone||h.mat('#c3bca4'),metal=m.metal||h.mat('#3c6566'),paper=m.paper||h.mat('#ece4ca'),brass=m.brass||h.mat('#a68d5d'),panel=m.panel||metal,unit=h.geo('calendar-desk-unit',()=>new RoundedBoxGeometry(1,1,1,2,.045));
 function b(x,y,z,w,ht,d,material){const o=new T.Mesh(unit,material);o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
 b(0,2.1,0,6.8,.3,3.8,stone);b(0,2.28,0,6.2,.035,3.2,panel);
 for(const x of [-2.7,2.7]){b(x,1,0,.35,2,3,metal);b(x,.12,0,.9,.24,3.3,stone);}b(0,.7,-1.2,5.5,.15,.2,brass);
 if(variant===1){for(let i=0;i<3;i++){b(-2.1,2.35+i*.1,-.7,.9,.08,1.2,paper);b(2.15,2.45+i*.22,-.7,1.1,.08,1.2,brass);}}
 else if(variant===2){for(let i=0;i<3;i++){b(-2.1,2.7,-.7,.1,1,.9,metal);b(-1.9+i*.4,2.5,-.7,.25,.4,.7,paper);}b(2.15,2.7,-.7,.5,.7,.5,brass);}
 else{b(-2.1,2.7,-.8,1.1,.8,.18,metal);for(const x of [-2.45,-1.8])b(x,3.17,-.8,.08,.18,.15,brass);b(2.2,2.55,-.8,.9,.45,.65,brass);}
 if(guide)b(-1.8,2.6,.7,1.5,.5,.15,metal);
 return root;
}
