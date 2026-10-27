import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../../app/vendor/three.module.js';
export function sourceRig(){
 const g=JSON.parse(fs.readFileSync(new URL('../../app/assets/characters/guide.gltf',import.meta.url))),bytes=fs.readFileSync(new URL('../../app/assets/characters/guide.bin',import.meta.url));
 const constructors={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array},sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
 function data(i){const a=g.accessors[i],b=g.bufferViews[a.bufferView],C=constructors[a.componentType],offset=bytes.byteOffset+(b.byteOffset||0)+(a.byteOffset||0);assert.equal(b.byteStride,undefined);return new C(bytes.buffer.slice(offset,offset+a.count*sizes[a.type]*C.BYTES_PER_ELEMENT));}
 const scene=new T.Group(),objects=g.nodes.map(n=>{const o=n.mesh!==undefined?new T.SkinnedMesh():new T.Bone();o.name=(n.name||'').replaceAll(':','');if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);if(n.matrix)o.applyMatrix4(new T.Matrix4().fromArray(n.matrix));return o;});
 g.nodes.forEach((n,i)=>(n.children||[]).forEach(j=>objects[i].add(objects[j])));g.scenes[g.scene||0].nodes.forEach(i=>scene.add(objects[i]));scene.updateMatrixWorld(true);
 g.nodes.forEach((n,i)=>{if(n.mesh===undefined)return;const primitive=g.meshes[n.mesh].primitives[0],geometry=new T.BufferGeometry(),names={POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv',JOINTS_0:'skinIndex',WEIGHTS_0:'skinWeight'};for(const [name,a]of Object.entries(primitive.attributes))geometry.setAttribute(names[name],new T.BufferAttribute(data(a),sizes[g.accessors[a].type]));geometry.setIndex(new T.BufferAttribute(data(primitive.indices),1));objects[i].geometry=geometry;objects[i].material=new T.MeshStandardMaterial();const skin=g.skins[n.skin],inverses=data(skin.inverseBindMatrices);objects[i].bind(new T.Skeleton(skin.joints.map(j=>objects[j]),skin.joints.map((_,j)=>new T.Matrix4().fromArray(inverses,j*16))),objects[i].matrixWorld);});
 return scene;
}
