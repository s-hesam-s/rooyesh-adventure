import {createWristAccessory} from './wristAccessories.js';
import * as T from '../../vendor/three.module.js';
export const playerAppearances={
 manager:{handScale:.94,armWidth:.93,cuff:'tailored',cuffColor:'#e8e1d3',accessory:'steel-watch',bagScale:[1,.95,1]},
 owner:{handScale:1.08,armWidth:1.12,cuff:'rolled',cuffColor:'#80552f',accessory:'square-watch',bagScale:[1.06,1.06,1.08]},
 client:{handScale:1,armWidth:1.02,cuff:'ribbed',cuffColor:'#344b3d',accessory:'sport-watch',bagScale:[.95,1.04,.94]},
 legal:{handScale:.9,armWidth:.87,cuff:'double',cuffColor:'#eee1dc',accessory:'gold-bracelets',bagScale:[.96,.9,.93]}
};
export function createPlayerWear(parent,side){
 const root=new T.Group();root.name='player-wrist-details';parent.add(root);const styles=new Map();
 const metal=new T.MeshStandardMaterial({color:'#b6bdc0',metalness:.85,roughness:.26}),gold=new T.MeshStandardMaterial({color:'#bb9355',metalness:.8,roughness:.3}),dark=new T.MeshStandardMaterial({color:'#172c32',roughness:.65});
 const cuffMaterial=new T.MeshStandardMaterial({color:'#eee1dc',roughness:.95});
 function mesh(group,geometry,material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);group.add(o);return o;}
 function ring(group,r,t,z,material){const o=mesh(group,new T.TorusGeometry(r,t,10,40),material,0,0,z);o.scale.y=.83;return o;}
 function block(group,w,h,d,x,y,z,material){return mesh(group,new T.BoxGeometry(w,h,d),material,x,y,z);}
 for(const [role,p]of Object.entries(playerAppearances)){
  const group=new T.Group();group.name='wear-'+role;group.visible=false;root.add(group);styles.set(role,group);
  const cuff=new T.Group();cuff.name='cuff-'+p.cuff;group.add(cuff);
  const sleeve=mesh(cuff,new T.CylinderGeometry(.079,.083,p.cuff==='rolled'?.15:.085,32,1,true),cuffMaterial,0,0,p.cuff==='rolled'?.23:.185);sleeve.rotation.x=Math.PI/2;
  if(p.cuff==='ribbed')for(let i=0;i<7;i++)ring(cuff,.08,.002,.143+i*.013,dark);
  if(p.cuff==='rolled'){ring(cuff,.085,.014,.155,dark);ring(cuff,.084,.012,.305,cuffMaterial);}
  if(p.cuff==='tailored'||p.cuff==='double'){block(cuff,.022,.012,.03,-side*.065,.048,.185,p.cuff==='double'?gold:metal);if(p.cuff==='double')ring(cuff,.082,.005,.225,gold);}
  if(side<0)group.add(createWristAccessory(role));

 }
 function update(role='manager'){const p=playerAppearances[role]||playerAppearances.manager;for(const [id,g]of styles)g.visible=id===role;cuffMaterial.color.set(p.cuffColor);root.userData.role=role;return p;}
 return {root,update};
}
