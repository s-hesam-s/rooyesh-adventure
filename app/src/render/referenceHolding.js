import * as T from '../../vendor/three.module.js';

export function createReferenceGrip(rig){
 const hidden={visible:false,position:[0,0,0],rotation:[0,0,0],grip:0};
 return {
  pose(position,rotation,width,depth,thickness){
   const q=rotation.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-.90)).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI));
   const contact=new T.Vector3(-width/2+Math.min(.043,width*.23),thickness/2+.012,-depth*.20).applyQuaternion(rotation).add(position);
   const euler=new T.Euler().setFromQuaternion(q,'YXZ');
   return {left:{visible:true,position:contact.toArray(),rotation:[euler.x,euler.y,euler.z],grip:.03,grasp:'reference-paper',thickness},right:hidden,bag:{visible:false,position:[0,-2,-1],open:0,zip:0}};
  },
  apply(){}
 };
}
