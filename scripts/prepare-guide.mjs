import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../app/assets/characters/',import.meta.url),bytes=await readFile(new URL('guide.glb',root));
if(bytes.readUInt32LE(0)!==0x46546c67)throw Error('Invalid GLB');
const jsonSize=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+jsonSize).toString()),binOffset=20+jsonSize,bin=bytes.subarray(binOffset+8,binOffset+8+bytes.readUInt32LE(binOffset));
g.buffers[0].uri='guide.bin';await writeFile(new URL('guide.bin',root),bin.subarray(0,g.buffers[0].byteLength));
const names=['guide.glb','guide.bin','guide.gltf'];
for(let i=0;i<g.images.length;i++){const image=g.images[i],view=g.bufferViews[image.bufferView],name='guide-'+i+(image.mimeType==='image/png'?'.png':'.jpg');await writeFile(new URL(name,root),bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength));delete image.bufferView;image.uri=name;names.push(name);}
await writeFile(new URL('guide.gltf',root),JSON.stringify(g));
const records=[];for(const name of names){const data=await readFile(new URL(name,root));records.push({file:name,source:name==='guide.glb'?'https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/models/gltf/Michelle.glb':'Extracted locally from guide.glb',sha256:createHash('sha256').update(data).digest('hex').toUpperCase()});}await writeFile(new URL('manifest.json',root),JSON.stringify(records,null,2));console.log('Prepared character with '+g.images.length+' local textures');
