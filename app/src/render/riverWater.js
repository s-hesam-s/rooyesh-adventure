import * as T from '../../vendor/three.module.js';
import {Water} from '../../vendor/addons/objects/Water2.js';
import {Reflector} from '../../vendor/addons/objects/Reflector.js';
import {Refractor} from '../../vendor/addons/objects/Refractor.js';
import {riverCenter,riverHalfWidth} from './riverScene.js';

export async function loadWaterMaps(){const loader=new T.TextureLoader();return Promise.all([1,2].map(i=>loader.loadAsync(new URL('../../assets/water/normal-'+i+'.jpg',import.meta.url).href)));}
export function waterFlow(time){const phase=((Math.max(0,time)*.025)%.15);return [phase,(phase+.075)%.15,.075,1];}
export function prepareWaterGeometry(geometry){
 const p=geometry.attributes.position,edge=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);geometry.attributes.uv.setXY(i,x*.12,z*.12);edge.push(Math.min(1,Math.abs(z-riverCenter(x))/riverHalfWidth(x)));}
 geometry.setAttribute('shoreDistance',new T.Float32BufferAttribute(edge,1));
 // Reflector and Refractor use the object's local +Z plane normal.
 geometry.rotateX(Math.PI/2);geometry.computeBoundingBox();return geometry;
}
export function waterInView(mesh,camera){
 const projection=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),frustum=new T.Frustum().setFromProjectionMatrix(projection);
 return frustum.intersectsBox(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
}
export function createRiverWater(geometry,maps,{excluded=[],high=true,resolution=768}={}){
 prepareWaterGeometry(geometry);for(const map of maps){map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;}
 const reflector=new Reflector(geometry,{textureWidth:resolution,textureHeight:resolution,clipBias:.003,multisample:0}),refractor=new Refractor(geometry,{textureWidth:resolution,textureHeight:resolution,clipBias:.003,multisample:0});
 reflector.matrixAutoUpdate=refractor.matrixAutoUpdate=false;
 const uniforms=T.UniformsUtils.merge([T.UniformsLib.fog,Water.WaterShader.uniforms]);
 Object.assign(uniforms,{flowDirection:{value:new T.Vector2(-1,0)},surfaceTime:{value:0}});
 uniforms.tReflectionMap.value=reflector.getRenderTarget().texture;uniforms.tRefractionMap.value=refractor.getRenderTarget().texture;uniforms.tNormalMap0.value=maps[0];uniforms.tNormalMap1.value=maps[1];uniforms.color.value=new T.Color('#b3cbc2');uniforms.reflectivity.value=.035;uniforms.textureMatrix.value=new T.Matrix4();uniforms.config.value.fromArray(waterFlow(0));
 let vertex=Water.WaterShader.vertexShader.replace('#include <common>','#include <common>\nattribute float shoreDistance;varying float vWaterEdge;varying vec3 vWaterWorld;').replace('vUv = uv;','vUv = uv;vWaterEdge=shoreDistance;').replace('vToEye = cameraPosition - worldPosition.xyz;','vToEye = cameraPosition - worldPosition.xyz;vWaterWorld=worldPosition.xyz;');
 let fragment=Water.WaterShader.fragmentShader.replace('normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0','(normalColor.r * 2.0 - 1.0)*.38, normalColor.b, (normalColor.g * 2.0 - 1.0)*.38').replace('normal.xz * 0.05','normal.xz * 0.025').replace('#include <common>','#include <common>\nuniform float surfaceTime;varying float vWaterEdge;varying vec3 vWaterWorld;').replace('#include <tonemapping_fragment>',`float edgeFoam=smoothstep(.87,1.,vWaterEdge)*(.45+.55*sin(vWaterWorld.x*5.2+surfaceTime*1.4)*sin(vWaterWorld.z*4.7-surfaceTime));gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.62,.69,.62),max(0.,edgeFoam)*.08);\n#include <tonemapping_fragment>`);
 const detailed=new T.ShaderMaterial({name:'RiverReflectionRefraction',uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:false,fog:true});
 const simple=new T.MeshPhysicalMaterial({color:'#507f76',normalMap:maps[0],normalScale:new T.Vector2(.18,.18),roughness:.19,metalness:.03,clearcoat:1,envMapIntensity:1,transparent:true,opacity:.83});
 const mesh=new T.Mesh(geometry,detailed);mesh.name='flowing-river';mesh.rotation.x=-Math.PI/2;mesh.position.y=-.27;
 let enabled=high,disposed=false;
 mesh.onBeforeRender=(renderer,scene,camera)=>{
  if(!enabled||disposed||scene.overrideMaterial||!waterInView(mesh,camera))return;
  uniforms.textureMatrix.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(mesh.matrixWorld);
  const visibility=excluded.map(o=>o.visible);mesh.visible=false;excluded.forEach(o=>o.visible=false);
  try{reflector.matrixWorld.copy(mesh.matrixWorld);refractor.matrixWorld.copy(mesh.matrixWorld);reflector.onBeforeRender(renderer,scene,camera);refractor.onBeforeRender(renderer,scene,camera);}finally{mesh.visible=true;excluded.forEach((o,i)=>o.visible=visibility[i]);}
 };
 function setQuality(value){enabled=value;mesh.material=value?detailed:simple;}
 function update(time){uniforms.config.value.fromArray(waterFlow(time));uniforms.surfaceTime.value=time;maps[0].offset.set(time*.012,0);}
 function dispose(){if(disposed)return;disposed=true;reflector.dispose();refractor.dispose();detailed.dispose();simple.dispose();}
 setQuality(high);const controller={mesh,update,setQuality,dispose,targets:[reflector.getRenderTarget(),refractor.getRenderTarget()]};mesh.userData.riverWater=controller;return controller;
}
