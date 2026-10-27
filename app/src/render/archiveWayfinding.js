import * as T from '../../vendor/three.module.js';
export function createArchiveDirectory(entry,h,materials={}){
 const root=new T.Group();root.position.set(entry.x*.1-64,0,entry.y*.1-45);
 const wood=materials.darkWood||h.mat('#4b3d32'),brass=materials.brass||h.mat('#ab905d'),unit=h.geo('archive-directory-frame',()=>new T.BoxGeometry(1,1,1));
 const box=(x,y,z,w,ht,d,m)=>{const o=new T.Mesh(unit,m);o.position.set(x,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;root.add(o);return o;};
 box(0,13.45,0,19,5.3,.45,wood);
 for(const x of [-9.2,9.2])box(x,13.45,.29,.1,4.95,.06,brass);
 for(const y of [10.99,15.91])box(0,y,.29,18.5,.1,.06,brass);
 if(entry.object.directoryMount==='posts'){
  for(const x of [-10.1,10.1]){const post=box(x,8.2,0,.45,16.5,.45,wood);post.name='canal-directory-post';box(x,.12,0,1.3,.34,1.3,wood);for(const y of [12,15])box(Math.sign(x)*9.7,y,0,.9,.2,.35,brass);}box(0,16.45,0,21,.3,.45,wood);
 }else for(const x of [-7,7])box(x,19.45,0,.055,6.9,.055,brass);
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=768;
 const q=canvas.getContext('2d');q.fillStyle='#1d3136';q.fillRect(0,0,2048,768);
 q.direction='rtl';q.textAlign='center';q.fillStyle='#d3bf88';q.font='600 62px Vazirmatn';q.fillText(entry.object.directoryTitle||'راهنمای سه ورودی · پرونده طرح آفتاب',1024,86,1900);
 const directions=['چپ','مستقیم','راست'],arrows=['←','↑','→'];
 for(let i=0;i<3;i++){
  const y=204+i*204;q.fillStyle=i%2?'#293e42':'#22363b';q.fillRect(40,y-66,1968,184);
  q.strokeStyle='#bda26b';q.lineWidth=2;q.strokeRect(40,y-66,1968,184);
  q.fillStyle='#ecdfb7';q.font='600 86px Vazirmatn';q.textAlign='right';q.fillText(entry.object.routes[i].label,1880,y+42,1470);
  q.textAlign='center';q.font='700 80px sans-serif';q.fillText(arrows[i],210,y+14);
  q.font='500 42px Vazirmatn';q.fillText(directions[i]+' · '+new Intl.NumberFormat('fa-IR').format(i+1),210,y+79);
 }
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
 const material=new T.MeshStandardMaterial({map,roughness:.78,emissive:'#ffffff',emissiveMap:map,emissiveIntensity:.18});material.userData.transient=true;material.userData.ownedMap=true;
 const panel=new T.Mesh(h.geo('archive-directory-panel',()=>new T.PlaneGeometry(18.4,4.8)),material);panel.position.set(0,13.45,.26);root.add(panel);
 const paper=new T.Group();root.add(paper);
 return {entry,root,paper};
}
export function buildArchiveBarriers(parent,plan,h,materials={}){
 const brass=materials.brass||h.mat('#ab905d'),red=materials.rope||h.mat('#7d2430');
 const postGeo=h.geo('archive-stanchion-post',()=>new T.CylinderGeometry(.085,.115,2.65,20)),baseGeo=h.geo('archive-stanchion-base',()=>new T.CylinderGeometry(.48,.57,.16,32)),ballGeo=h.geo('archive-stanchion-ball',()=>new T.SphereGeometry(.17,20,16));
 const posts=new Set();let count=0;
 for(const segment of plan.barriers){
  const ax=(segment.a.x-640)*.1,az=(segment.a.y-450)*.1,bx=(segment.b.x-640)*.1,bz=(segment.b.y-450)*.1;
  const length=Math.hypot(bx-ax,bz-az),pieces=Math.ceil(length/8);
  for(let i=0;i<=pieces;i++){
   const x=ax+(bx-ax)*i/pieces,z=az+(bz-az)*i/pieces,key=x.toFixed(3)+':'+z.toFixed(3);
   if(!posts.has(key)){posts.add(key);for(const [g,y]of [[postGeo,1.4],[baseGeo,.1],[ballGeo,2.82]]){const o=new T.Mesh(g,brass);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);}count++;}
   if(i===pieces)continue;
   const distance=length/pieces,geometry=h.geo('archive-velvet-rope-'+distance.toFixed(4),()=>new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(distance*.5,-.42,0),new T.Vector3(distance,0,0)]),20,.075,8,false)),rope=new T.Mesh(geometry,red);
   rope.position.set(x,2.65,z);rope.rotation.y=-Math.atan2(bz-az,bx-ax);rope.castShadow=rope.receiveShadow=true;parent.add(rope);
  }
 }
 return {posts:count};
}