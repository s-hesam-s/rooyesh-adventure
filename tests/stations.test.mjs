import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from '../app/vendor/three.module.js';
import {lowerGuideArms} from '../app/src/render/actors.js';
import {stationStyle} from '../app/src/render/stations.js';
const root=new URL('../app/assets/characters/',import.meta.url);
test('character resources match their hashes and have no external texture dependencies',async()=>{
 for(const entry of JSON.parse(await readFile(new URL('manifest.json',root),'utf8'))){const bytes=await readFile(new URL(entry.file,root));assert.equal(createHash('sha256').update(bytes).digest('hex').toUpperCase(),entry.sha256);}
 const g=JSON.parse(await readFile(new URL('guide.gltf',root),'utf8'));assert.ok(g.skins.length>0);assert.equal((g.extensionsRequired||[]).length,0);
 for(const file of [...g.buffers,...g.images]){assert.ok(file.uri&&!/^(https?:|blob:|data:|\/)/.test(file.uri));assert.ok((await readFile(new URL(file.uri,root))).length>0);}
});
test('guide arms use a relaxed pose and preserve bone lengths',async()=>{
 const g=JSON.parse(await readFile(new URL('guide.gltf',root),'utf8')),scene=new T.Group(),objects=g.nodes.map(n=>{const o=new T.Object3D();o.name=(n.name||'').replaceAll(':','');if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);if(n.matrix)o.applyMatrix4(new T.Matrix4().fromArray(n.matrix));return o;});
 g.nodes.forEach((n,i)=>(n.children||[]).forEach(j=>objects[i].add(objects[j])));g.scenes[g.scene||0].nodes.forEach(i=>scene.add(objects[i]));scene.updateMatrixWorld(true);
 const lengths=['Left','Right'].map(s=>scene.getObjectByName('mixamorig'+s+'Arm').getWorldPosition(new T.Vector3()).distanceTo(scene.getObjectByName('mixamorig'+s+'ForeArm').getWorldPosition(new T.Vector3())));
 lowerGuideArms(scene);for(const [i,side] of ['Left','Right'].entries()){const arm=scene.getObjectByName('mixamorig'+side+'Arm').getWorldPosition(new T.Vector3()),elbow=scene.getObjectByName('mixamorig'+side+'ForeArm').getWorldPosition(new T.Vector3());assert.ok(Math.abs(arm.distanceTo(elbow)-lengths[i])<.0001);assert.ok(elbow.sub(arm).normalize().y<-.95);}
});
test('station props distinguish documents, identity cards, seals and guides',()=>{assert.equal(stationStyle('book'),'book');assert.equal(stationStyle('badge'),'badge');assert.equal(stationStyle('seal'),'seal');assert.equal(stationStyle('guide'),'guide');assert.equal(stationStyle('board'),'clipboard');});
