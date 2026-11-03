import * as T from '../../vendor/three.module.js';
function solveFinger(joints,tip,target){
 for(let pass=0;pass<24;pass++){if(tip.getWorldPosition(new T.Vector3()).distanceTo(target)<.0004)break;for(const joint of [...joints].reverse()){const pivot=joint.getWorldPosition(new T.Vector3()),a=tip.getWorldPosition(new T.Vector3()).sub(pivot),b=target.clone().sub(pivot);if(a.lengthSq()<1e-10||b.lengthSq()<1e-10)continue;const delta=new T.Quaternion().setFromUnitVectors(a.normalize(),b.normalize());if(delta.angleTo(new T.Quaternion())>.4)delta.slerp(new T.Quaternion(),1-.4/delta.angleTo(new T.Quaternion()));const parent=joint.parent.getWorldQuaternion(new T.Quaternion());joint.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent)).normalize();joint.updateWorldMatrix(true,true);}}
}
export function paperGrip(hand,thickness,handScale){
 const key=(thickness/handScale).toFixed(5),cached=hand.gripCache.get(key);if(cached)return cached;
 const bone=digit=>hand.body.getObjectByName('mixamorig'+(hand.side<0?'Left':'Right')+'Hand'+digit),centre=new T.Vector3(-hand.side*.055,-.10,-.25),gap=thickness/(2*handScale)+.014;
 hand.group.updateWorldMatrix(true,true);const joints=[];
 for(const [digit,sign]of [['Index',-1],['Thumb',1]]){const chain=[1,2,3].map(i=>bone(digit+i)),tip=bone(digit+'4'),target=hand.group.localToWorld(centre.clone().add(new T.Vector3(0,sign*gap,0)));solveFinger(chain,tip,target);joints.push(...chain);}
 hand.group.updateWorldMatrix(true,true);const thumb=hand.group.worldToLocal(bone('Thumb4').getWorldPosition(new T.Vector3())),index=hand.group.worldToLocal(bone('Index4').getWorldPosition(new T.Vector3())),anchor=thumb.clone().add(index).multiplyScalar(.5),result={anchor,joints:joints.map(joint=>({joint,rotation:joint.quaternion.clone()}))};hand.gripCache.set(key,result);return result;
}

export function referencePaperGrip(hand){
 const key='reference-paper',cached=hand.gripCache.get(key);if(cached)return cached;
 const prefix='mixamorig'+(hand.side<0?'Left':'Right')+'Hand',chain=[1,2,3].map(i=>hand.body.getObjectByName(prefix+'Thumb'+i)),tip=hand.body.getObjectByName(prefix+'Thumb4');
 for(const finger of hand.fingers)if(finger.digit==='Thumb')finger.joint.quaternion.copy(finger.rest);
 hand.group.updateWorldMatrix(true,true);
 solveFinger(chain,tip,hand.group.localToWorld(new T.Vector3(-hand.side*.07,-.055,-.225)));
 hand.group.updateWorldMatrix(true,true);
 const result={anchor:hand.group.worldToLocal(tip.getWorldPosition(new T.Vector3())),joints:chain.map(joint=>({joint,rotation:joint.quaternion.clone()}))};
 hand.gripCache.set(key,result);return result;
}
