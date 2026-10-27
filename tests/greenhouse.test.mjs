import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../app/vendor/three.module.js';
import {greenhousePlan,createGreenhouse} from '../app/src/render/greenhouse.js';
import {nodes} from '../app/src/content/story.js';
import {layoutFor,walkable} from '../app/src/game/world.js';

test('greenhouse columns and growing benches keep every playable corridor clear',()=>{
 for(const node of Object.values(nodes).filter(n=>['glass','court'].includes(n.theme))){
  const layout=layoutFor(node),safe=(x,z)=>!walkable({x:(x+64)*10,y:(z+45)*10},layout,-30);
  const {columns,benches}=greenhousePlan(safe);
  assert.ok(benches.length>=4);
  for(const p of columns)assert.ok(safe(p.x,p.z));
  for(const p of benches)for(let x=-4.3;x<=4.3;x+=.43)for(let z=-2.2;z<=2.2;z+=.44){
   assert.equal(walkable({x:(p.x+x+64)*10,y:(p.z+z+45)*10},layout,10),false);
  }
 }
});

test('greenhouse batches detailed architecture into finite instanced geometry',()=>{
 const parent=new T.Group();let plants=0;
 const group=createGreenhouse(parent,{wood:new T.MeshStandardMaterial(),safeDecor:()=>true,plant:(p)=>{plants++;const g=new T.Group();p.add(g);return g;}});
 const meshes=group.children.filter(m=>m.isInstancedMesh);
 assert.ok(meshes.length<12);assert.ok(meshes.reduce((n,m)=>n+m.count,0)>900);assert.ok(plants>20);
 for(const mesh of meshes){assert.ok([...mesh.instanceMatrix.array].every(Number.isFinite));assert.ok(Number.isFinite(mesh.boundingSphere.radius));}
 const glass=meshes.find(m=>m.material.transparent);assert.equal(glass.castShadow,false);assert.equal(glass.material.depthWrite,false);
});
