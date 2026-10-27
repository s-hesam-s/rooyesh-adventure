import * as T from '../../vendor/three.module.js';
export function plantVariation(index,x,z){
 const random=seed=>{const n=Math.sin(seed*127.1+x*17.7+z*31.3)*43758.5453;return n-Math.floor(n);};
 return {kind:((index%5)+5)%5,variant:Math.floor(random(index+11)*1000),turn:random(index+23)*Math.PI*2,width:.9+random(index+37)*.2,depth:.9+random(index+53)*.2,height:.92+random(index+71)*.16};
}
export function createFlowerVariants(nearScene,farScene){
 const nearMaterials=new Map(),sharedTextures=new Set();nearScene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){nearMaterials.set(m.name,m);for(const v of Object.values(m))if(v?.isTexture)sharedTextures.add(v);}});
 const replaced=new Set();farScene.traverse(o=>{if(!o.isMesh)return;function shared(m){const replacement=nearMaterials.get(m.name);if(replacement&&replacement!==m)replaced.add(m);return replacement||m;}o.material=Array.isArray(o.material)?o.material.map(shared):shared(o.material);});
 const disposedTextures=new Set();for(const m of replaced){for(const v of Object.values(m))if(v?.isTexture&&!sharedTextures.has(v)&&!disposedTextures.has(v)){v.dispose();disposedTextures.add(v);}m.dispose();}
 const farByName=new Map(farScene.children.map(o=>[o.name,o]));
 return nearScene.children.map(near=>{
  const far=farByName.get(near.name);if(!far)throw Error('Flower LOD variant is missing: '+near.name);
  const reference=near.clone(true);reference.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(reference),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=1/Math.max(.001,size.x,size.y,size.z);
  function normalize(source){const group=new T.Group(),model=source.clone(true);group.name=source.name;model.position.sub(new T.Vector3(center.x,bounds.min.y,center.z));group.add(model);group.scale.setScalar(scale);group.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.side=T.DoubleSide;m.envMapIntensity=.6;m.transparent=false;m.alphaTest=.12;m.depthWrite=true;m.forceSinglePass=true;}});return group;}
  return {near:normalize(near),far:normalize(far),name:near.name};
 });
}
export function flowerCluster(variants,seed,count){
 const near=new T.Group(),far=new T.Group();for(let i=0;i<count;i++){const variant=variants[(seed+i*3)%variants.length],angle=i*2.399+seed*.7,radius=count===1?0:.26+.06*(i%2);for(const [parent,prototype] of [[near,variant.near],[far,variant.far]]){const model=prototype.clone(true);model.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);model.rotation.y=angle;model.scale.multiplyScalar(.76+(i%3)*.07);parent.add(model);}}return {near,far};
}