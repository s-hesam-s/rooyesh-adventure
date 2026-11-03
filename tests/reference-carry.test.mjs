import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {sourceRig} from './helpers/guideRig.mjs';
import {createArchiveHands} from '../app/src/render/archiveHands.js';
import {documentCarryPose} from '../app/src/render/documentCarry.js';
const profiles=[{w:1.55,d:.95,t:.05,y:.025,card:true},{w:3.6,d:2.7,t:.26,y:.12},{w:1.22,d:.9,t:.18,y:.085},{w:1.7,d:1.2,t:.18,y:0},{w:2.2,d:2.8,t:.05,y:.025},{w:2.5,d:3.2,t:.28,y:.09}];
function clipPolygon(poly,axis,limit,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-limit)*sign,db=(b[axis]-limit)*sign;if(da>=0)out.push(a);if((da>=0)!=(db>=0))out.push(a.clone().lerp(b,da/(da-db)));}return out;}
function intersectingTriangles(group,local,p,scale){
 let hits=0;
 group.traverse(mesh=>{
  if(!mesh.isMesh)return;for(let o=mesh;o&&o!==group.parent;o=o.parent)if(!o.visible)return;
  mesh.skeleton?.update();const ix=mesh.geometry.index?.array||Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>i);
  for(let instance=0;instance<(mesh.isInstancedMesh?mesh.count:1);instance++){
   const matrix=new T.Matrix4();if(mesh.isInstancedMesh)mesh.getMatrixAt(instance,matrix);
   const points=new Map();for(const i of new Set(ix))points.set(i,local(mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(matrix).applyMatrix4(mesh.matrixWorld)));
   for(let i=0;i<ix.length;i+=3){let poly=[points.get(ix[i]),points.get(ix[i+1]),points.get(ix[i+2])];for(const [axis,lo,hi]of [['x',-p.w/2+.001/scale,p.w/2-.001/scale],['y',p.y-p.t/2,p.y+p.t/2],['z',-p.d/2+.001/scale,p.d/2-.001/scale]]){poly=clipPolygon(poly,axis,lo,1);poly=clipPolygon(poly,axis,hi,-1);if(!poly.length)break;}if(poly.length>=3)hits++;}
  }
 });return hits;
}
test('reference carry keeps actual hand triangles and wrist accessories outside the sheet through motion and reading',()=>{
 const camera=new T.PerspectiveCamera(72,.87,.08,650),rig=createArchiveHands(camera,sourceRig());
 for(const role of ['client','manager','owner','legal'])for(const p of profiles)for(const blend of [0,.25,.5,.75,1]){
  camera.aspect=blend<.5?.65:16/9;camera.updateProjectionMatrix();camera.position.set(5*blend,2,-3);camera.rotation.set(-.2,blend*1.5,.05,'YXZ');
  const pose=documentCarryPose(camera,p.w,p.d,p.t,{blend,surfaceY:p.y,gripType:p.card?'card':'document'});rig.update({role,pose:pose.hands});camera.updateMatrixWorld(true);
  const local=v=>camera.worldToLocal(v).sub(pose.position).applyQuaternion(pose.rotation.clone().invert()).divideScalar(pose.scale),group=rig.root.getObjectByName('archive-left-hand'),thumb=local(group.getObjectByName('mixamorigLeftHandThumb4').getWorldPosition(new T.Vector3()));
  assert.ok(thumb.y>p.y+p.t/2,'thumb stays on front');
  const actual=camera.worldToLocal(group.getObjectByName('mixamorigLeftHandThumb4').getWorldPosition(new T.Vector3()));assert.ok(new T.Vector3().fromArray(pose.hands.left.position).distanceTo(actual)<1e-6,'thumb follows sheet contact');
  assert.equal(intersectingTriangles(group,local,p,pose.scale),0,role+' '+p.w+' '+blend+' hand crosses sheet');
  const anchor=rig.root.getObjectByName('fitted-left-wrist-anchor');assert.equal(intersectingTriangles(anchor,local,p,pose.scale),0,role+' '+p.w+' '+blend+' wrist or watch crosses sheet');
 }
});
test('card and folder keep the same hand size and approved left-edge grip',()=>{const camera=new T.PerspectiveCamera(72,16/9,.08,650),rig=createArchiveHands(camera,sourceRig());let handScale;for(const p of profiles){const pose=documentCarryPose(camera,p.w,p.d,p.t,{surfaceY:p.y,gripType:p.card?'card':'document'});rig.update({role:'client',pose:pose.hands});const left=rig.root.getObjectByName('archive-left-hand');assert.equal(left.visible,true);assert.equal(rig.root.getObjectByName('archive-right-hand').visible,false);assert.equal(rig.root.getObjectByName('fitted-right-wrist-anchor').visible,false);if(handScale)assert.deepEqual(left.scale.toArray(),handScale);handScale=left.scale.toArray();assert.ok(p.w*pose.scale<.5);}});
