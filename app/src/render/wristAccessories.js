import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {batchArchitecture} from './missionBatches.js';

// All dimensions are in the hand rig's local frame: +Y is dorsal, +Z points up the forearm.
export function wristBandGeometry(rx,ry,width,thickness,segments=96){
 const positions=[],uv=[],indices=[];
 for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
  for(const [r,z]of [[0,-width/2],[0,width/2],[thickness,-width/2],[thickness,width/2]]){positions.push((rx+r)*c,(ry+r)*s,z);uv.push(i/segments,z/width+.5);}
 }
 for(let i=0;i<segments;i++){const a=i*4,b=a+4;for(const [x,y]of [[0,1],[2,0],[1,3],[3,2]])indices.push(a+x,b+x,a+y,a+y,b+x,b+y);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];g.setIndex(indices);g.computeVertexNormals();return g;
}
function dialTexture(style){
 if(typeof document==='undefined'){const texture=new T.DataTexture(new Uint8Array([230,226,211,255]),1,1);texture.needsUpdate=true;return texture;}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const q=canvas.getContext('2d'),sport=style==='client';
 const gradient=q.createRadialGradient(256,235,10,256,256,248);gradient.addColorStop(0,sport?'#24363a':'#f3f0df');gradient.addColorStop(1,sport?'#0c171a':'#d1cbb9');q.fillStyle=gradient;q.fillRect(0,0,512,512);
 q.save();q.translate(256,256);
 for(let i=0;i<60;i++){q.save();q.rotate(i*Math.PI/30);q.strokeStyle=sport?'#b8cbd0':'#314044';q.lineWidth=i%5?1.6:3.5;q.beginPath();q.moveTo(0,-222);q.lineTo(0,i%5?-212:-199);q.stroke();q.restore();}
 q.fillStyle=sport?'#edf4ed':'#24363c';q.textAlign='center';q.textBaseline='middle';q.font='500 44px Georgia';for(const [text,x,y]of [['12',0,-157],['6',0,158],['9',-158,0]])q.fillText(text,x,y);
 q.font='500 14px sans-serif';q.fillStyle=sport?'#8db6b4':'#7c7768';q.fillText(sport?'AUTOMATIC':'PRECISION',0,-72);q.font='400 12px sans-serif';q.fillText(sport?'200 m':'MECHANICAL',0,88);
 q.fillStyle=sport?'#d3dfd7':'#e7e1d3';q.fillRect(109,-22,54,43);q.strokeStyle='#918a79';q.lineWidth=2;q.strokeRect(109,-22,54,43);q.font='500 25px sans-serif';q.fillStyle='#253236';q.fillText('25',136,1);q.restore();
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;return texture;
}
export function createWristAccessory(role){
 const root=new T.Group();root.name={manager:'steel-watch',owner:'square-watch',client:'sport-watch',legal:'gold-bracelets'}[role];
 const steel=new T.MeshStandardMaterial({color:'#aab3b8',metalness:1,roughness:.29,envMapIntensity:1.3}),polish=new T.MeshStandardMaterial({color:'#d9dfe1',metalness:1,roughness:.14,envMapIntensity:1.3}),gold=new T.MeshStandardMaterial({color:'#c7a05c',metalness:.95,roughness:.23,envMapIntensity:1.3}),dark=new T.MeshStandardMaterial({color:'#16252a',roughness:.7}),light=new T.MeshStandardMaterial({color:'#e7eadb',roughness:.5,metalness:.12}),black=new T.MeshStandardMaterial({color:'#142026',roughness:.42,metalness:.4});
 const torusGeometries=new Map();
 const unit=new RoundedBoxGeometry(1,1,1,3,.08);
 function mesh(g,m,x=0,y=0,z=0,parent=root){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 function box(w,h,d,x,y,z,m,parent=root){const o=mesh(unit,m,x,y,z,parent);o.scale.set(w,h,d);return o;}
 function ring(radius,tube,x,y,z,m,parent=root){const key=radius+':'+tube;if(!torusGeometries.has(key))torusGeometries.set(key,new T.TorusGeometry(radius,tube,12,64));return mesh(torusGeometries.get(key),m,x,y,z,parent);}
 function band(rx,ry,width,t,z,m,parent=root){return mesh(wristBandGeometry(rx,ry,width,t),m,0,0,z,parent);}
 const rx=.072,ry=.05,center=.055;
 if(role==='legal'){
  // A fitted hinged oval bangle with a real closure, plus a separate fine link chain.
  const bangle=band(.074,.052,.014,.0035,.043,gold);bangle.name='hinged-oval-bangle';
  for(const z of [.036,.050]){const rim=ring(.075,.0011,0,0,z,polish);rim.scale.y=.71;}
  const clasp=box(.023,.005,.015,.074,0,.043,gold);clasp.name='bracelet-clasp';
  for(const y of [-.004,.004])mesh(new T.SphereGeometry(.0013,12,8),polish,.078,y,.043);
  for(let i=0;i<30;i++){
   const a=i*Math.PI/15,link=ring(.0043,.0009,.076*Math.cos(a),.053*Math.sin(a),.018,gold);link.scale.set(1.45,.8,1);link.rotation.set(0,i%2?Math.PI/3:0,a+Math.PI/2);
  }
  const charm=box(.009,.0025,.013,.008,.056,.018,gold);charm.rotation.y=.2;charm.name='chain-charm';
  batchArchitecture(root);return root;
 }
 if(role==='manager'){
  const bracelet=new T.Group();bracelet.name='articulated-steel-bracelet';root.add(bracelet);
  for(let i=0;i<32;i++){
   const a=i*Math.PI/16;if(a>.88&&a<2.26)continue;
   const link=new T.Group();link.position.set(rx*Math.cos(a),ry*Math.sin(a),center);link.rotation.z=Math.atan2(ry*Math.cos(a),-rx*Math.sin(a));bracelet.add(link);
   box(.014,.005,.039,0,0,0,steel,link);box(.011,.0018,.017,0,-.003,0,polish,link);
   for(const z of [-.014,.014])box(.012,.001,.0009,0,-.003,z,black,link);
  }
  box(.02,.005,.041,0,-.052,center,polish).name='folding-bracelet-clasp';
 }else{
  const leather=role==='owner',material=new T.MeshStandardMaterial({color:leather?'#382c23':'#172b30',roughness:leather?.83:.91,bumpScale:.00045});
  // Local generated surface grain keeps the strap independent of downloaded assets.
  const size=128,bytes=new Uint8Array(size*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++)bytes[y*size+x]=Math.round(125+Math.sin(x*73.1+y*91.7)*Math.sin(x*11.3-y*5.7)*(leather?26:7));
  const bump=new T.DataTexture(bytes,size,size,T.RedFormat);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(6,1);bump.needsUpdate=true;material.bumpMap=bump;
  band(rx,ry,.038,.0035,center,material).name=leather?'stitched-leather-strap':'molded-rubber-strap';
  const stitchGeometry=new T.CapsuleGeometry(.00055,.0025,2,5);
  for(let i=0;i<64;i++){
   const a=i*Math.PI/32;if(a>.85&&a<2.3)continue;
   for(const z of [center-.014,center+.014]){
    if(leather){const stitch=mesh(stitchGeometry,light,(rx+.0038)*Math.cos(a),(ry+.0038)*Math.sin(a),z);stitch.rotation.z=a;}
    else{const groove=box(.009,.001,.027,0,0,0,black);groove.position.set((rx+.0038)*Math.cos(a),(ry+.0038)*Math.sin(a),center);groove.rotation.z=Math.atan2(ry*Math.cos(a),-rx*Math.sin(a));break;}
   }
  }
  for(let i=0;i<5;i++)box(.003,.0007,.006,-.029+i*.014,-.054,center,black);
  box(.025,.005,.045,0,-.054,center,steel).name='strap-buckle';box(.017,.006,.032,0,-.054,center,material);box(.002,.003,.034,0,-.058,center,polish);
 }
 const watch=new T.Group();watch.name='watch-case';watch.position.set(0,ry+.006,center);root.add(watch);
 const square=role==='owner',sport=role==='client',caseRadius=sport?.044:.042;
 if(square){box(.085,.014,.079,0,.002,0,steel,watch);box(.078,.008,.072,0,.012,0,polish,watch);box(.069,.003,.063,0,.017,0,dark,watch);}
 else{
  const points=[[caseRadius-.006,-.008],[caseRadius,-.005],[caseRadius+.001,.003],[caseRadius-.001,.01],[caseRadius-.005,.013]].map(([x,y])=>new T.Vector2(x,y));mesh(new T.LatheGeometry(points,96),sport?black:steel,0,0,0,watch);
  const bezel=ring(caseRadius-.003,.0024,0,.012,0,sport?steel:polish,watch);bezel.rotation.x=Math.PI/2;
 }
 // Shaped lugs and spring-bar shoulders connect the case to the band.
 for(const x of [-.027,.027])for(const side of [-1,1]){const lug=box(.012,.01,.022,x,-.001,side*.044,steel,watch);lug.rotation.x=side*.18;}
 const crown=mesh(new T.CylinderGeometry(.0045,.0045,.007,32),polish,.047,.001,0,watch);crown.rotation.z=Math.PI/2;
 for(let i=0;i<6;i++){const ridge=ring(.0046,.00045,.044+i*.001, .001,0,steel,watch);ridge.rotation.y=Math.PI/2;}
 if(square){
  const screen=new T.MeshStandardMaterial({color:'#172723',roughness:.36});box(.061,.001,.052,0,.019,0,screen,watch);
  // Four sharply defined seven-segment digits, rather than painted square dots.
  const display=new T.Group();display.name='recessed-digital-display';watch.add(display);
  const segments=[[0,.007,.007,.0015],[0,0,.007,.0015],[0,-.007,.007,.0015],[-.004,.0035,.0015,.006],[.004,.0035,.0015,.006],[-.004,-.0035,.0015,.006],[.004,-.0035,.0015,.006]];
  const digits=[[4,6],[0,2,3,4,5,6],[0,2,3,4,5,6],[0,1,2,3,4,5,6]];
  for(let i=0;i<4;i++)for(const j of digits[i]){const [x,z,w,d]=segments[j];box(w,.0007,d,-.022+i*.014+x,.020,z,light,display);}
  for(const z of [-.003,.003])box(.0016,.0007,.0016,-.001,.020,z,light,display);
  for(const x of [-.033,.033])for(const z of [-.03,.03]){mesh(new T.CylinderGeometry(.0015,.0015,.001,16),black,x,.017,z,watch);box(.0019,.0004,.0004,x,.0177,z,steel,watch);}
 }else{
  const dialMaterial=new T.MeshStandardMaterial({map:dialTexture(role),roughness:.76,metalness:.04});
  const dial=mesh(new T.CircleGeometry(caseRadius-.006,96),dialMaterial,0,.0135,0,watch);dial.rotation.x=-Math.PI/2;dial.name='engraved-minute-track';
  for(let i=0;i<12;i++){const a=i*Math.PI/6,index=box(.0018,.0012,i%3?.004:.0055,Math.sin(a)*.030,.0146,-Math.cos(a)*.030,sport?light:polish,watch);index.rotation.y=-a;}
  function hand(name,length,width,angle,material,height){
   const shape=new T.Shape();shape.moveTo(-width*.45,-.005);shape.lineTo(width*.45,-.005);shape.lineTo(width*.48,length*.67);shape.lineTo(0,length);shape.lineTo(-width*.48,length*.67);shape.closePath();
   const pivot=new T.Group();pivot.name=name;pivot.position.y=height;pivot.rotation.y=-angle;watch.add(pivot);
   const h=mesh(new T.ExtrudeGeometry(shape,{depth:.0007,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.00025,bevelThickness:.00025}),material,0,0,0,pivot);h.rotation.x=-Math.PI/2;
  }
  hand('hour-hand',.022,.004,Math.PI*2*10.1667/12,sport?light:black,.016);hand('minute-hand',.031,.0027,Math.PI/3,sport?light:black,.0175);hand('seconds-hand',.033,.0007,Math.PI*1.14,sport?gold:steel,.019);
  mesh(new T.CylinderGeometry(.0023,.0023,.003,24),polish,0,.019,0,watch);
 }
 const crystal=new T.MeshPhysicalMaterial({color:'#d6eef6',roughness:.045,metalness:0,transparent:true,opacity:.10,depthWrite:false,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:1.4});
 const glass=square?box(.065,.001,.057,0,.022,0,crystal,watch):mesh(new T.CylinderGeometry(caseRadius-.006,caseRadius-.006,.0012,96),crystal,0,.022,0,watch);glass.name='watch-crystal';
 batchArchitecture(root);return root;
}
