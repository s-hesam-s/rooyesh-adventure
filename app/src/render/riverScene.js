import * as T from '../../vendor/three.module.js';
export const riverCenter=x=>23+Math.sin(x*.075)*1.2*Math.min(1,Math.abs(x)/15);
export const riverHalfWidth=x=>3.7+.55*Math.sin(x*.11)**2;
export function stripGeometry(rows,columns,point){const vertices=[],uv=[],indices=[];for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){vertices.push(...point(row/rows,col/columns));uv.push(col/columns,row/rows);}for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*(columns+1)+col,b=a+columns+1;const up=(vertices[(a+1)*3+2]-vertices[a*3+2])*(vertices[b*3]-vertices[a*3])-(vertices[(a+1)*3]-vertices[a*3])*(vertices[b*3+2]-vertices[a*3+2])>0;if(up)indices.push(a,a+1,b,a+1,b+1,b);else indices.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.transient=true;return g;}
export function riverPebbleAt(i){const x=-90+i*180/320,z=riverCenter(x)+Math.sin(i*127.1)*riverHalfWidth(x)*.74;return {x,y:-.78,z,sx:.13+Math.abs(Math.sin(i*4.7))*.32,sy:.08+Math.abs(Math.cos(i*8.3))*.12,sz:.12+Math.abs(Math.cos(i*3.3))*.28};}
export function createRiverScene(parent,{ground,path,wood},helpers){
 const {box,beam,cylinder,label,plant,rock,safeDecor}=helpers;ground.side=T.DoubleSide;
 function mesh(g,m){const o=new T.Mesh(g,m);o.receiveShadow=true;parent.add(o);return o;}
 const shore=ground.clone();shore.color.set('#a0a58c');shore.roughness=1;shore.side=T.DoubleSide;shore.userData.transient=true;
 const wet=ground.clone();wet.color.set('#646e5b');wet.roughness=.7;wet.side=T.DoubleSide;wet.userData.transient=true;
 for(const side of [-1,1]){
  mesh(stripGeometry(130,16,(t,u)=>{const x=t*185-92.5,edge=riverCenter(x)+side*(riverHalfWidth(x)+2.8);return [x,-.11,edge+(side*77.5-edge)*u];}),ground);
  mesh(stripGeometry(130,4,(t,u)=>{const x=t*185-92.5,c=riverCenter(x),w=riverHalfWidth(x);return [x,-.7+u*.6,c+side*(w-.4+u*3.2)];}),shore);
  mesh(stripGeometry(130,2,(t,u)=>{const x=t*185-92.5,c=riverCenter(x),w=riverHalfWidth(x);return [x,-.55+u*.19,c+side*(w-.55+u*.8)];}),wet);
 }
 const bed=mesh(stripGeometry(130,8,(t,u)=>{const x=t*185-92.5;return [x,-.86,riverCenter(x)+(u*2-1)*riverHalfWidth(x)];}),path);
 const bedUV=bed.geometry.attributes.uv,bedPosition=bed.geometry.attributes.position;for(let i=0;i<bedUV.count;i++)bedUV.setXY(i,bedPosition.getX(i)*.17,bedPosition.getZ(i)*.17);
 const waterGeometry=stripGeometry(180,10,(t,u)=>{const x=t*185-92.5;return [x,0,riverCenter(x)+(u*2-1)*riverHalfWidth(x)];});
 const stoneGeo=new T.IcosahedronGeometry(1,2),a=stoneGeo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),n=.84+Math.sin(x*17+y*31+z*13)*.12;a.setXYZ(i,x*n,y*n,z*n);}stoneGeo.computeVertexNormals();stoneGeo.userData.transient=true;
 const stoneMat=path.clone();stoneMat.color.set('#7e8274');stoneMat.roughness=.86;stoneMat.userData.transient=true;
 const rocks=new T.InstancedMesh(stoneGeo,stoneMat,210),dummy=new T.Object3D();let count=0;
 for(const side of [-1,1])for(let i=0;i<105;i++){const x=-90+i*1.73;if(Math.abs(x)<7)continue;const variation=Math.sin(i*17.1);dummy.position.set(x,-.28+Math.abs(variation)*.12,riverCenter(x)+side*(riverHalfWidth(x)+.1+variation*.65));dummy.rotation.set(i*.4,i*2.399,0);dummy.scale.set(.35+Math.abs(Math.sin(i*7))*.7,.25+Math.abs(Math.cos(i*11))*.45,.3+Math.abs(Math.cos(i*3))*.7);dummy.updateMatrix();rocks.setMatrixAt(count++,dummy.matrix);}rocks.count=count;rocks.castShadow=rocks.receiveShadow=true;parent.add(rocks);
 const pebbles=new T.InstancedMesh(stoneGeo,stoneMat,320);for(let i=0;i<320;i++){const p=riverPebbleAt(i);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,i*2.399,0);dummy.scale.set(p.sx,p.sy,p.sz);dummy.updateMatrix();pebbles.setMatrixAt(i,dummy.matrix);}pebbles.receiveShadow=true;parent.add(pebbles);
 // Furniture is placed outside the walking corridor.
 for(const side of [-1,1]){
  const x=side*10.5,benchZ=side===1?39:31;
  for(let j=0;j<4;j++)box(parent,x,.9,benchZ+j*.38,5,.18,.32,'#b39769');
  for(const dx of [-1.7,1.7]){box(parent,x+dx,.4,benchZ+.5,.3,1,.8,'#5c6059');beam(parent,[x+dx,.4,benchZ+1.3],[x+dx,2.4,benchZ+1.3],.18,'#5c6059');}
  for(let j=0;j<3;j++)box(parent,x,1.5+j*.36,benchZ+1.3,5,.25,.14,'#b39769');
  const post=side*7.4,lampZ=side===1?37:29.5;cylinder(parent,post,2.1,lampZ,.12,4.2,'#5c6059');box(parent,post,4.77,lampZ,.7,.12,.7,'#5c6059');box(parent,post,3.94,lampZ,.65,.12,.65,'#5c6059');for(const dx of [-.27,.27])for(const dz of [-.27,.27])box(parent,post+dx,4.35,lampZ+dz,.06,.75,.06,'#5c6059');
  const glow=new T.Mesh(new T.BoxGeometry(.48,.55,.48),new T.MeshStandardMaterial({color:'#efdda5',emissive:'#efbe68',emissiveIntensity:.25,roughness:.35}));glow.geometry.userData.transient=true;glow.material.userData.transient=true;glow.position.set(post,4.35,lampZ);parent.add(glow);
  plant(parent,side*12,18.5,0,2.1).position.y=-.11;
 }

 for(let i=0;i<14;i++){const x=-37+i*5.3,z=riverCenter(x)+(i%2?-1:1)*(riverHalfWidth(x)+2);if(safeDecor(x,z))rock(parent,x,z,i,2.2+(i%3)*.65);}
 if(safeDecor(-10,36))rock(parent,-10,36,27,4.7);if(safeDecor(14,43))rock(parent,14,43,28,3.8);
 box(parent,-7.8,1.6,32,.15,3.2,.15,'#b39769');const sign=label('پل آفتاب',-7.8,3.5,32,2.4);sign.material.depthWrite=false;
 return {waterGeometry};
}