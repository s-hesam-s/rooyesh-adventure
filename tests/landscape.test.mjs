import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainHeight,terrainGeometry,vegetationAllowed,grassTuftGeometry,roadsideSpots} from '../app/src/render/landscape.js';
import {layoutFor,walkable} from '../app/src/game/world.js';
import {nodes} from '../app/src/content/story.js';
import {riverCenter,riverHalfWidth} from '../app/src/render/riverScene.js';

test('landscape remains below the playable ground and rises outside the garden',()=>{
 for(let x=-64;x<=64;x+=2)for(let z=-45;z<=45;z+=2)assert.equal(terrainHeight(x,z),-.95);
 assert.ok(terrainHeight(230,150)>25);
 const g=terrainGeometry();for(const attribute of ['position','normal','uv'])assert.ok([...g.attributes[attribute].array].every(Number.isFinite));
 for(let i=0;i<g.attributes.normal.count;i++)assert.ok(g.attributes.normal.getY(i)>0);g.dispose();
});

test('vegetation keeps roads, glazed interiors, landmarks and the river clear',()=>{
 for(const node of Object.values(nodes)){
  const layout=layoutFor(node);
  for(const road of layout.roads)for(let i=1;i<road.length;i++)for(let t=0;t<=1;t+=.1){const a=road[i-1],b=road[i];assert.equal(vegetationAllowed((a.x+(b.x-a.x)*t)*.1-64,(a.y+(b.y-a.y)*t)*.1-45,layout,node.theme),false);}
  for(let x=-85;x<85;x+=3)for(let z=-68;z<68;z+=3){if(!vegetationAllowed(x,z,layout,node.theme))continue;
   for(const dx of [-1,0,1])for(const dz of [-1,0,1])assert.equal(walkable({x:(x+dx+64)*10,y:(z+dz+45)*10},layout,10),false);
   if(['glass','court'].includes(node.theme))assert.ok(Math.abs(x)>=54||Math.abs(z)>=37);
   if(node.theme==='water')assert.ok(Math.abs(z-riverCenter(x))>=riverHalfWidth(x)+2.8);
  }
 }
});

test('curved grass has finite geometry, rooted blades and a lighter distant version',()=>{
 const near=grassTuftGeometry(),far=grassTuftGeometry(4,2);
 assert.ok(far.index.count<near.index.count*.3);
 for(const g of [near,far]){g.computeBoundingBox();assert.equal(g.boundingBox.min.y,0);assert.ok(g.boundingBox.max.y> .6&&g.boundingBox.max.y<1.4);for(const attribute of ['position','normal','color'])assert.ok([...g.attributes[attribute].array].every(Number.isFinite));for(const index of g.index.array)assert.ok(index<g.attributes.position.count);g.dispose();}
});

test('roadside plants are bounded, varied and leave a clear passage',()=>{
 let count=0;for(const node of Object.values(nodes)){
  const layout=layoutFor(node),points=roadsideSpots(layout,node.theme);assert.ok(points.length<=24);count+=points.length;
  if(['glass','court'].includes(node.theme))assert.equal(points.length,0);
  for(const p of points){assert.ok(p.height>=1.1&&p.height<=1.7);assert.ok([0,1,3,4].includes(p.index));for(const dx of [-1.8,0,1.8])for(const dz of [-1.8,0,1.8])assert.equal(walkable({x:(p.x+dx+64)*10,y:(p.z+dz+45)*10},layout,10),false);}
 }assert.ok(count>20);
});
import * as T from '../app/vendor/three.module.js';
import {plantVariation,createFlowerVariants} from '../app/src/render/flora.js';
test('plant placement varies deterministically across all five species',()=>{
 const kinds=new Set(),turns=new Set();for(let i=0;i<100;i++){const p=plantVariation(i,i*.4,7);assert.deepEqual(p,plantVariation(i,i*.4,7));kinds.add(p.kind);turns.add(p.turn);assert.ok(p.variant>=0&&p.variant<1000);assert.ok(p.width>=.9&&p.width<1.1);assert.ok(p.depth>=.9&&p.depth<1.1);assert.ok(p.height>=.92&&p.height<1.08);}assert.equal(kinds.size,5);assert.equal(turns.size,100);
});
test('flower variants share materials and use the same near reference for both LODs',()=>{
 const near=new T.Group(),far=new T.Group(),nearMap=new T.Texture(),farMap=new T.Texture(),nearMat=new T.MeshStandardMaterial({map:nearMap}),farMat=new T.MeshStandardMaterial({map:farMap});nearMat.name=farMat.name='flower';let nearDisposals=0,farDisposals=0;nearMap.addEventListener('dispose',()=>nearDisposals++);farMap.addEventListener('dispose',()=>farDisposals++);
 for(const [parent,g,m] of [[near,new T.BoxGeometry(2,1,4),nearMat],[far,new T.BoxGeometry(1.8,.8,3.8),farMat]]){const model=new T.Mesh(g,m);model.name='variant-a';model.position.set(3,2,4);parent.add(model);}
 const [variant]=createFlowerVariants(near,far),nearBox=new T.Box3().setFromObject(variant.near),farBox=new T.Box3().setFromObject(variant.far);assert.equal(nearBox.min.y,0);assert.equal(nearBox.getSize(new T.Vector3()).z,1);assert.ok(nearBox.getCenter(new T.Vector3()).distanceTo(farBox.getCenter(new T.Vector3()))<1e-6);assert.equal(variant.near.children[0].material,variant.far.children[0].material);assert.equal(variant.near.children[0].material,nearMat);assert.equal(nearDisposals,0);assert.equal(farDisposals,1);near.children[0].geometry.dispose();far.children[0].geometry.dispose();nearMat.dispose();nearMap.dispose();
});
import {flowerCluster} from '../app/src/render/flora.js';
test('flower clusters keep near and far placements aligned and within the planting footprint',()=>{
 const material=new T.MeshStandardMaterial(),geometry=new T.BoxGeometry(1,1,1),variants=Array.from({length:5},(_,i)=>({near:new T.Mesh(geometry,material),far:new T.Mesh(geometry,material)}));for(const count of [2,4]){const cluster=flowerCluster(variants,17,count);assert.equal(cluster.near.children.length,count);for(let i=0;i<count;i++){const a=cluster.near.children[i],b=cluster.far.children[i];assert.deepEqual(a.position,b.position);assert.deepEqual(a.rotation.toArray(),b.rotation.toArray());assert.deepEqual(a.scale,b.scale);assert.ok(Math.hypot(a.position.x,a.position.z)<=.321);assert.ok(a.scale.x<=.9);}}geometry.dispose();material.dispose();
});