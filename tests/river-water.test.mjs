import {terrainHeight} from '../app/src/render/landscape.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from '../app/vendor/three.module.js';
import {waterFlow,prepareWaterGeometry,createRiverWater,waterInView} from '../app/src/render/riverWater.js';
import {stripGeometry,riverCenter,riverHalfWidth,riverPebbleAt} from '../app/src/render/riverScene.js';
const geometry=()=>stripGeometry(10,4,(t,u)=>{const x=-90+t*180;return [x,0,riverCenter(x)+(u*2-1)*riverHalfWidth(x)];});
test('water plane has an upward world normal and world-scaled ripple coordinates',()=>{
 const g=prepareWaterGeometry(geometry()),m=new T.Mesh(g);m.rotation.x=-Math.PI/2;m.updateMatrixWorld(true);const n=new T.Vector3(0,0,1).transformDirection(m.matrixWorld);assert.ok(n.y>.999);
 for(let i=0;i<g.attributes.position.count;i++){const p=new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrixWorld);assert.ok(Math.abs(p.y)<.00001);assert.ok(Math.abs(g.attributes.uv.getX(i)-p.x*.12)<.00001);assert.ok(Math.abs(g.attributes.uv.getY(i)-p.z*.12)<.00001);assert.ok(g.attributes.shoreDistance.getX(i)>=0&&g.attributes.shoreDistance.getX(i)<=1);}g.dispose();
});
test('flow phases are cyclic, stable while paused and keep their half-cycle separation',()=>{
 for(let t=0;t<100;t+=.013){const [a,b,c]=waterFlow(t);assert.ok(a>=0&&a<.15&&b>=0&&b<.15);assert.ok(Math.abs(((b-a+.15)%.15)-c)<1e-10);assert.deepEqual(waterFlow(t),waterFlow(t));}assert.deepEqual(waterFlow(-1),waterFlow(0));
});
test('water quality switching avoids extra rendering and releases targets only once',()=>{
 const maps=[new T.Texture(),new T.Texture()],g=geometry(),surface=createRiverWater(g,maps,{resolution:32});let releases=0;surface.targets.forEach(t=>t.addEventListener('dispose',()=>releases++));assert.ok(surface.mesh.material.isShaderMaterial);
 surface.setQuality(false);assert.ok(surface.mesh.material.isMeshPhysicalMaterial);assert.doesNotThrow(()=>surface.mesh.onBeforeRender(null,{},null));surface.setQuality(true);assert.doesNotThrow(()=>surface.mesh.onBeforeRender(null,{overrideMaterial:{}},null));surface.dispose();surface.dispose();assert.equal(releases,2);g.dispose();maps.forEach(m=>m.dispose());
});
test('water reflection can reject a channel fully behind the viewer',()=>{
 const surface=createRiverWater(geometry(),[new T.Texture(),new T.Texture()],{resolution:32}),camera=new T.PerspectiveCamera(72,1,.1,500);surface.mesh.updateMatrixWorld(true);camera.position.set(0,5,40);camera.lookAt(0,0,23);camera.updateMatrixWorld(true);assert.equal(waterInView(surface.mesh,camera),true);camera.lookAt(0,5,100);camera.updateMatrixWorld(true);assert.equal(waterInView(surface.mesh,camera),false);surface.dispose();surface.mesh.geometry.dispose();
});
test('underwater pebbles stay inside the channel and below the surface',()=>{
 for(let i=0;i<320;i++){const p=riverPebbleAt(i);assert.ok(Math.abs(p.z-riverCenter(p.x))+p.sz<riverHalfWidth(p.x));assert.ok(p.y+p.sy<-.27);assert.ok(p.y-p.sy>=-.99);}
});
test('water addon and normal-map hashes match the local source manifest',async()=>{
 const root=new URL('../app/',import.meta.url),records=JSON.parse(await readFile(new URL('assets/water/manifest.json',root),'utf8'));for(const row of records){assert.ok(!row.file.includes('..'));assert.equal(createHash('sha256').update(await readFile(new URL(row.file,root))).digest('hex').toUpperCase(),row.sha256);}
});

test('background terrain stays beneath the entire river bed',()=>{for(let x=-92.5;x<=92.5;x+=.5)for(const side of [-1,0,1])assert.ok(terrainHeight(x,riverCenter(x)+side*riverHalfWidth(x))<-.86);});