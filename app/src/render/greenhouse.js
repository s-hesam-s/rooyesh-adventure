import * as T from '../../vendor/three.module.js';

// All ground fixtures are checked against the same corridors used by the player.
export function greenhousePlan(safeDecor=()=>true){
 const columns=[];
 for(const x of [-53,-53/3,53/3,53])for(let z=-36;z<=36;z+=12){
  if(Math.abs(x)===53||safeDecor(x,z,1))columns.push({x,z});
 }
 const benches=[];
 for(const x of [-46,-31,-16,16,31,46])for(const z of [-22,-6,10,26,33]){
  if([-4,0,4].every(dx=>[-2,0,2].every(dz=>safeDecor(x+dx,z+dz,1))))benches.push({x,z});
 }
 return {columns,benches};
}

export function createGreenhouse(parent,{plant,wood,floor,safeDecor,landmark=false}){
 const group=new T.Group();group.name=landmark?'greenhouse-exterior':'greenhouse-interior';parent.add(group);
 if(landmark){group.position.set(0,0,-61);group.scale.set(.62,.72,.4);}
 const plan=greenhousePlan(landmark?()=>true:safeDecor),batches=new Map();
 const steel=new T.MeshStandardMaterial({color:'#9ca9a4',metalness:.78,roughness:.38});
 const dark=new T.MeshStandardMaterial({color:'#3f5653',metalness:.65,roughness:.5});
 const concrete=new T.MeshStandardMaterial({color:'#9c9c89',roughness:.94});
 const clay=new T.MeshStandardMaterial({color:'#9d6243',roughness:.89});
 const soil=new T.MeshStandardMaterial({color:'#373b26',roughness:1});
 const glass=new T.MeshPhysicalMaterial({color:'#c3d9d5',metalness:.12,roughness:.15,transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.3,clearcoat:1});
 for(const m of [steel,dark,concrete,clay,soil,glass])m.userData.transient=true;
 const unit=new T.BoxGeometry(1,1,1),pane=new T.PlaneGeometry(1,1),pot=new T.CylinderGeometry(.68,.48,1,16,1,true),rim=new T.TorusGeometry(.66,.07,6,20),disc=new T.CircleGeometry(.59,16);
 for(const g of [unit,pane,pot,rim,disc])g.userData.transient=true;
 const dummy=new T.Object3D(),direction=new T.Vector3(),up=new T.Vector3(0,1,0);
 function instance(geometry,material,x,y,z,sx,sy,sz,rotation){
  const key=geometry.uuid+material.uuid;if(!batches.has(key))batches.set(key,{geometry,material,matrices:[]});
  dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,0,0);if(rotation)dummy.quaternion.copy(rotation);dummy.updateMatrix();batches.get(key).matrices.push(dummy.matrix.clone());
 }
 function box(x,y,z,w,h,d,m=steel){instance(unit,m,x,y,z,w,h,d);}
 function beam(a,b,width=.13,m=steel){const start=new T.Vector3(...a),end=new T.Vector3(...b),middle=start.clone().add(end).multiplyScalar(.5);direction.copy(end).sub(start);const q=new T.Quaternion().setFromUnitVectors(up,direction.clone().normalize());instance(unit,m,middle.x,middle.y,middle.z,width,direction.length(),width,q);}
 function panel(a,b,depth){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),length=start.distanceTo(end),middle=start.add(end).multiplyScalar(.5);
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.atan2(b[1]-a[1],b[0]-a[0]));
  instance(pane,glass,middle.x,middle.y,middle.z,length,depth,1,new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0)).premultiply(q));
 }
 if(!landmark&&floor){const slab=new T.Mesh(new T.PlaneGeometry(105.5,71.5),floor);slab.geometry.userData.transient=true;slab.rotation.x=-Math.PI/2;slab.position.y=-.065;slab.receiveShadow=true;group.add(slab);}
 const eave=11.5,ridge=17,bay=106/3;
 for(const {x,z} of plan.columns){
  box(x,.3,z,.85,.6,.85,concrete);box(x,5.9,z,.22,11.2,.22);
  box(x,1.1,z,.36,.32,.36,dark);for(const dx of [-.21,.21])box(x+dx,.65,z,.09,.1,.09,dark);
  if(Math.abs(x)===53){beam([x,8.8,z],[x-Math.sign(x)*2.5,eave,z],.12);}
 }
 for(let b=0;b<3;b++){
  const left=-53+b*bay,mid=left+bay/2,right=left+bay;
  for(let z=-36;z<=36;z+=6){
   beam([left,eave,z],[mid,ridge,z],.17);beam([mid,ridge,z],[right,eave,z],.17);
   if(z%12===0){beam([left,eave,z],[right,eave,z],.1);beam([left+bay*.25,eave,z],[mid,ridge,z],.07);beam([right-bay*.25,eave,z],[mid,ridge,z],.07);}
  }
  for(let k=0;k<=8;k++){
   const x=left+bay*k/8,y=eave+(1-Math.abs(k-4)/4)*(ridge-eave);beam([x,y,-36],[x,y,36],k===4?.18:.085);
  }
  // Separate roof panes preserve reflections and the visible glazing grid.
  for(let z=-33;z<36;z+=6)for(let k=0;k<8;k++){
   const x1=left+bay*k/8+.04,x2=left+bay*(k+1)/8-.04;
   const y=x=>eave+(1-Math.abs((x-left)/bay*2-1))*(ridge-eave);
   panel([x1,y(x1),z],[x2,y(x2),z],5.86);
  }
  for(const z of [-18,18]){
   // Raised ridge vents with their hinges and short actuator arms.
   beam([mid-3,ridge+.5,z-2.7],[mid+3,ridge+.5,z-2.7],.1,dark);
   beam([mid-3,ridge+.5,z+2.7],[mid+3,ridge+.5,z+2.7],.1,dark);
   panel([mid-3,ridge+.5,z],[mid+3,ridge+1.5,z],5.4);
   for(const dz of [-2.7,2.7])beam([mid,ridge,z+dz],[mid+2,ridge+1.3,z+dz],.07,dark);
  }
 }
 for(const x of [-53,-53/3,53/3,53]){
  box(x,eave+.06,0,.38,.25,72,dark);
  for(const z of [-35,35])beam([x,eave,z],[x,.7,z],.13,dark);
 }
 for(const x of [-53,53]){
  box(x,.35,0,.42,.7,72,concrete);
  for(const y of [1,5.5,9.5])beam([x,y,-36],[x,y,36],.1);
  for(let z=-36;z<=36;z+=3)beam([x,.7,z],[x,eave,z],.09);
  for(let z=-34.5;z<36;z+=3){
   const q=new T.Quaternion().setFromAxisAngle(up,Math.PI/2);instance(pane,glass,x,6.1,z,2.88,10.6,1,q);
  }
  for(const z of [-30,30]){beam([x,1,z-5],[x,10,z+5],.065,dark);beam([x,10,z-5],[x,1,z+5],.065,dark);}
 }
 for(const z of [-36,36]){
  for(const x of [-6,6]){box(x,4.1,z,.24,8.2,.24,dark);box(x+Math.sign(x)*2.8,4,z,5.5,.1,.2);box(x+Math.sign(x)*2.8,8,z,5.5,.16,.2);}
  // Sliding doors remain open at the centre of the main route.
  for(let x=-51;x<53;x+=3){if(Math.abs(x)<7)continue;beam([x,.6,z],[x,eave,z],.09);instance(pane,glass,x+1.4,6.1,z,2.8,10.6,1);}
  beam([-53,eave,z],[53,eave,z],.2);
 }
 if(!landmark)for(let i=0;i<plan.benches.length;i++){
  const {x,z}=plan.benches[i];box(x,2.1,z,8.6,.22,4.4,wood);
  for(const dx of [-3.6,3.6])for(const dz of [-1.65,1.65])box(x+dx,1.05,z+dz,.14,2.1,.14,dark);
  beam([x-3.6,.8,z-1.65],[x+3.6,.8,z-1.65],.12,dark);
  box(x,2.38,z-1.8,8.2,.09,.09,dark);
  for(let j=0;j<3;j++){
   const px=x+(j-1)*2.5,pz=z+(j%2?.55:-.55);instance(pot,clay,px,2.6,pz,1,.75,1);
   const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);instance(rim,clay,px,2.98,pz,1,1,1,q);instance(disc,soil,px,2.94,pz,1,1,1,q);
   const p=plant(group,px,pz,i+j,1.4+(i%3)*.3);p.position.y=2.95;
  }
 }
 for(const {geometry,material,matrices} of batches.values()){
  const mesh=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=material!==glass;mesh.receiveShadow=material!==glass;mesh.computeBoundingSphere();group.add(mesh);
 }
 return group;
}
