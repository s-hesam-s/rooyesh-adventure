import * as T from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';

// Shelf-local seeds keep authored variation stable across reloads and camera movement.
export function dressArchiveShelf(parent,shelfIndex,h,materials={}){
 let seed=(shelfIndex+1)*374761393;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 const pick=n=>Math.floor(random()*n),paper=materials.paper||h.mat('#e7dfc9'),ink=materials.darkWood||h.mat('#54483e'),brass=materials.brass||h.mat('#ab905d');
 const box=h.geo('archive-book-page-block',()=>new T.BoxGeometry(1,1,1));
 const rounded=h.geo('archive-book-binding',()=>new RoundedBoxGeometry(1,1,1,2,.06));
 const plane=h.geo('archive-book-spine-face',()=>new T.PlaneGeometry(1,1));
 const colors=['#365158','#783e37','#727147','#ac8054','#344761','#675270','#3f6554','#a18c70','#6d4832','#394648','#9c6152','#5b6741'];
 let count=0;
 function volume(x,y,z,horizontal=false){
  const book=new T.Group();book.name='archive-volume-'+shelfIndex+'-'+count++;parent.add(book);
  const thickness=.28+random()*.36,height=1.4+random()*.84,depth=1.1+random()*.57,coverThickness=.035+random()*.025;
  const color=colors[pick(colors.length)],cover=h.mat(color),spine=materials.books?.[pick(materials.books.length)]||cover;
  const add=(name,xx,yy,zz,w,ht,d,material,geometry=box)=>{const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.position.set(xx,yy,zz);mesh.scale.set(w,ht,d);mesh.castShadow=mesh.receiveShadow=true;book.add(mesh);return mesh;};
  // Covers project beyond the recessed page block; only the narrow spine faces the aisle.
  add('page-block',0,0,-.025,thickness-coverThickness*2,height-.13,depth-.13,paper);
  for(const side of [-1,1])add('cover',side*(thickness-coverThickness)/2,0,0,coverThickness,height,depth,cover,rounded);
  add('rounded-spine',0,0,depth/2-.04,thickness,height,.13,cover,rounded);
  add('spine-title',0,0,depth/2+.029,thickness*.83,height*.94,1,spine,plane);
  // A restrained mix of cloth bindings, raised leather ribs and paper catalog labels.
  const binding=pick(5);
  if(binding===0||binding===3)for(const yy of [-height*.34,height*(.23+random()*.15)])add('binding-rib',0,yy,depth/2+.045,thickness*.97,.045,.045,brass,rounded);
  if(binding===1||binding===4)add('catalog-label',0,-height*(.12+random()*.2),depth/2+.044,thickness*.68,.23+random()*.12,.012,paper);
  if(binding===2)add('cloth-seam',-thickness*.3,0,depth/2+.045,.017,height*.9,.012,ink);
  if(random()<.18)add('ribbon',thickness*.12,height/2+.025,-depth*.06,.065,.15,depth*.4,h.mat(['#9e453c','#b69a52','#335967'][pick(3)]));
  // Fine exposed page edges make the top and fore-edge read as paper, not a closed box.
  for(let j=0;j<2;j++)add('page-edge',thickness/2-coverThickness+.002,(j-.5)*height*.36,-.07,.004,.009,depth*.8,ink);
  if(horizontal){book.rotation.z=Math.PI/2;book.position.set(x,y+thickness/2,z);book.rotation.y=(random()-.5)*.13;}
  else {const lean=(random()-.5)*.13;book.rotation.z=lean;book.position.set(x,y+height/2+Math.abs(lean)*thickness/2,z);}
  return {thickness,height};
 }
 for(let row=0;row<4;row++){
  const floor=.75+row*2.7,stackSide=pick(3),stackX=stackSide===0?-4.3:4.1;
  let stackHeight=0;
  if(stackSide!==2)for(let j=0,n=2+pick(2);j<n;j++){const v=volume(stackX+(random()-.5)*.17,floor+stackHeight,1.25+random()*.12,true);stackHeight+=v.thickness+.025;}
  const left=stackSide===0?-2.8:-5.05,right=stackSide===1?2.6:5.05;
  const number=stackSide===2?10:7,spacing=(right-left)/number;
  for(let j=0;j<number;j++)volume(left+spacing*(j+.5)+(random()-.5)*.1,floor,1.15+random()*.38);
 }
 return count;
}
