import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MeshoptSimplifier as M} from './vendor/meshopt_simplifier.module.js';
const root=new URL('../app/assets/realism/coast_land_rocks_02/',import.meta.url);
const source=JSON.parse(await readFile(new URL('source.gltf',root),'utf8'));
const buffers=await Promise.all(source.buffers.map(b=>readFile(new URL(b.uri,root))));
const counts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},types={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array};
function attribute(id){const a=source.accessors[id],view=source.bufferViews[a.bufferView],Type=types[a.componentType];if(a.sparse||!Type||!counts[a.type])throw Error('Unsupported source accessor');const channels=counts[a.type],size=Type.BYTES_PER_ELEMENT,raw=buffers[view.buffer],out=new Type(a.count*channels);const start=(view.byteOffset||0)+(a.byteOffset||0),stride=view.byteStride||channels*size;for(let i=0;i<a.count;i++){const bytes=raw.subarray(start+i*stride,start+i*stride+channels*size);new Uint8Array(out.buffer,i*channels*size,channels*size).set(bytes);}return {a,data:out,channels};}
await M.ready;
const reports=[];
for(const [name,ratio,error] of [['near',.045,.003],['far',.012,.012]]){
 const result=structuredClone(source);result.buffers=[];result.bufferViews=[];result.accessors=[];const parts=[];let offset=0,original=0,remaining=0;
 function add(data,a){const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}const bytes=Buffer.from(data.buffer,data.byteOffset,data.byteLength),viewId=result.bufferViews.length;result.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length});parts.push(bytes);offset+=bytes.length;const record={bufferView:viewId,componentType:a.componentType,count:data.length/counts[a.type],type:a.type};if(a.normalized)record.normalized=true;if(a.type==='VEC3'&&a.isPosition){record.min=[Infinity,Infinity,Infinity];record.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<data.length;i++){const k=i%3;record.min[k]=Math.min(record.min[k],data[i]);record.max[k]=Math.max(record.max[k],data[i]);}}result.accessors.push(record);return result.accessors.length-1;}
 for(let mi=0;mi<source.meshes.length;mi++)for(let pi=0;pi<source.meshes[mi].primitives.length;pi++){
  const p=source.meshes[mi].primitives[pi],out=result.meshes[mi].primitives[pi],position=attribute(p.attributes.POSITION),indices=attribute(p.indices).data;
  const target=Math.max(3,Math.floor(indices.length*ratio/3)*3);
  const [reducedRaw]=M.simplify(indices,position.data,3,target,error,['Prune']);
  const reduced=new Uint32Array(reducedRaw);const [remap,unique]=M.compactMesh(reduced);original+=indices.length/3;remaining+=reduced.length/3;
  out.indices=add(new Uint32Array(reduced),{componentType:5125,type:'SCALAR'});out.attributes={};
  for(const [key,id] of Object.entries(p.attributes)){const attr=attribute(id),packed=new attr.data.constructor(unique*attr.channels);for(let i=0;i<attr.a.count;i++){const dest=remap[i];if(dest===undefined||dest>=unique)continue;for(let k=0;k<attr.channels;k++)packed[dest*attr.channels+k]=attr.data[i*attr.channels+k];}out.attributes[key]=add(packed,{...attr.a,isPosition:key==='POSITION'});}
 }
 result.buffers=[{uri:name+'.bin',byteLength:offset}];delete result.extensionsUsed;delete result.extensionsRequired;
 const bin=Buffer.concat(parts);await writeFile(new URL(name+'.bin',root),bin);await writeFile(new URL(name+'.gltf',root),JSON.stringify(result));reports.push({name,originalTriangles:original,triangles:remaining,bytes:bin.length,ratio,error});
}
await writeFile(new URL('optimization.json',root),JSON.stringify({tool:'meshoptimizer 0.24.0',reports},null,2));
const manifest=[];for(const name of ['near.gltf','near.bin','far.gltf','far.bin','optimization.json']){const bytes=await readFile(new URL(name,root));manifest.push({file:'coast_land_rocks_02/'+name,source:'Derived locally from coast_land_rocks_02 source.gltf',sha256:createHash('sha256').update(bytes).digest('hex').toUpperCase()});}await writeFile(new URL('../rock-derived-manifest.json',root),JSON.stringify(manifest,null,2));console.log(JSON.stringify(reports));