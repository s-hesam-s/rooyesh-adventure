import * as T from '../../vendor/three.module.js';
import {walkable} from '../game/world.js';
import {riverCenter,riverHalfWidth} from './riverScene.js';

const random=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
function smoothNoise(x,z){const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(random(a,b),random(a+1,b),s),T.MathUtils.lerp(random(a,b+1),random(a+1,b+1),s),t);}
export function terrainHeight(x,z){
 const radius=Math.hypot(x/100,z/79),rise=T.MathUtils.smoothstep(radius,1,2.4);
 let ridges=0,amplitude=1,frequency=.018;
 for(let i=0;i<5;i++){ridges+=(1-Math.abs(smoothNoise(x*frequency+17,z*frequency+31)*2-1))*amplitude;frequency*=2.17;amplitude*=.47;}
 return -.95+rise*(12+ridges*34)+rise*smoothNoise(x*.25,z*.25)*1.2;
}
export function terrainGeometry(){
 const g=new T.PlaneGeometry(600,520,240,208);g.rotateX(-Math.PI/2);
 const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(p.getX(i),p.getZ(i)));
 g.computeVertexNormals();return g;
}
export function vegetationAllowed(x,z,layout,theme){
 if(walkable({x:(x+64)*10,y:(z+45)*10},layout,-18))return false;
 if((theme==='glass'||theme==='court')&&Math.abs(x)<54&&Math.abs(z)<37)return false;
 if(theme==='water'&&Math.abs(z-riverCenter(x))<riverHalfWidth(x)+2.8)return false;
 if(theme!=='glass'&&theme!=='court'&&Math.abs(x)<34&&z< -45)return false;
 return true;
}
export function roadsideSpots(layout,theme){
 if(theme==='glass'||theme==='court')return [];
 const points=[];
 for(const road of layout.roads)for(let i=1;i<road.length;i++){
  const a={x:road[i-1].x*.1-64,z:road[i-1].y*.1-45},b={x:road[i].x*.1-64,z:road[i].y*.1-45},dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  if(length<5)continue;
  for(const t of [.25,.7])for(const side of [-1,1]){
   const offset=9.3+random(a.x+t,b.z)*2,x=a.x+dx*t-dz/length*offset*side,z=a.z+dz*t+dx/length*offset*side;
   if(Math.abs(x)>58||z< -32||z>36||!vegetationAllowed(x,z,layout,theme))continue;
   let inBed=false;for(let xx=180;xx<1150;xx+=155)for(let yy=330;yy<800;yy+=140){if(Math.abs(x-(xx*.1-64))<5.7&&Math.abs(z-(yy*.1-45))<5.2)inBed=true;}
   if(inBed||points.some(p=>Math.hypot(p.x-x,p.z-z)<4))continue;
   points.push({x,z,index:[0,1,3,4][points.length%4],height:1.1+random(x,z)*.6});if(points.length===24)return points;
  }
 }
 return points;
}
export function grassTuftGeometry(blades=12,segments=5){
 const vertices=[],colors=[],uv=[],indices=[];
 for(let b=0;b<blades;b++){
  const angle=b*2.399,dx=Math.cos(angle),dz=Math.sin(angle),height=.65+random(b,3)*.65,width=.018+random(b,5)*.025;
  const bx=dx*random(b,7)*.38,bz=dz*random(b,7)*.38,base=vertices.length/3;
  for(let j=0;j<=segments;j++){
   const t=j/segments,bend=t*t*(.2+random(b,9)*.3),w=width*(1-t)*(.9+.2*Math.sin(t*Math.PI));
   for(const side of [-1,1]){
    vertices.push(bx+dx*bend-dz*w*side,t*height,bz+dz*bend+dx*w*side);
    const c=new T.Color().setHSL(.22+random(b,11)*.045,.25+random(b,13)*.2,.13+t*.17);colors.push(c.r,c.g,c.b);uv.push((side+1)/2,t);
   }
  }
  for(let j=0;j<segments;j++){const k=base+j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function landscapeShader(shader,{rock,meadow}){
 shader.uniforms.landRock={value:rock.map};shader.uniforms.landMeadow={value:meadow.map};
 shader.uniforms.landRockNormal={value:rock.normalMap};shader.uniforms.landMeadowNormal={value:meadow.normalMap};shader.uniforms.landRockRough={value:rock.roughnessMap};shader.uniforms.landMeadowRough={value:meadow.roughnessMap};
 const varying='varying vec3 vLandPosition; varying vec3 vLandNormal;';
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+varying).replace('#include <begin_vertex>','#include <begin_vertex>\nvLandPosition = (modelMatrix * vec4(position,1.0)).xyz; vLandNormal = normalize(mat3(modelMatrix) * normal);');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 ${varying}
 uniform sampler2D landRock;uniform sampler2D landMeadow;uniform sampler2D landRockNormal;uniform sampler2D landMeadowNormal;uniform sampler2D landRockRough;uniform sampler2D landMeadowRough;
 vec3 landWeights(){vec3 w=pow(abs(vLandNormal),vec3(4.));return w/max(.0001,w.x+w.y+w.z);}
 vec4 landSample(sampler2D source,float frequency){vec3 w=landWeights();return texture2D(source,vLandPosition.yz*frequency)*w.x+texture2D(source,vLandPosition.xz*frequency)*w.y+texture2D(source,vLandPosition.xy*frequency)*w.z;}
 float landStone(){return smoothstep(.08,.43,1.-abs(normalize(vLandNormal).y))*.85+smoothstep(45.,95.,vLandPosition.y)*.15;}
 `).replace('#include <map_fragment>',`
 float stone=landStone();vec3 rockColor=landSample(landRock,.13).rgb*vec3(.82,.86,.9);vec3 meadowColor=landSample(landMeadow,.065).rgb*vec3(.7,.83,.6);
 diffuseColor.rgb*=mix(meadowColor,rockColor,stone)*( .87+.13*sin(vLandPosition.x*.037+vLandPosition.z*.028));
 `).replace('#include <roughnessmap_fragment>',`float roughnessFactor=clamp(mix(landSample(landMeadowRough,.065).g,landSample(landRockRough,.13).g,landStone()),.55,1.);`).replace('#include <normal_fragment_maps>',`
 vec3 w=landWeights();vec3 nx=texture2D(landRockNormal,vLandPosition.yz*.13).xyz*2.-1.;vec3 ny=texture2D(landMeadowNormal,vLandPosition.xz*.065).xyz*2.-1.;vec3 nz=texture2D(landRockNormal,vLandPosition.xy*.13).xyz*2.-1.;
 vec3 detail=vec3(0.,nx.x,nx.y)*w.x+vec3(ny.x,0.,ny.y)*w.y+vec3(nz.x,nz.y,0.)*w.z;
 vec3 landNormal=normalize(vLandNormal+detail*.42);normal=normalize(mat3(viewMatrix)*landNormal);
 `);
 return shader;
}
export function createLandscape(materials,{plant}={}){
 let detailed=false;const grassCells=[];
 const mountainGeo=terrainGeometry(),nearGrass=grassTuftGeometry(),farGrass=grassTuftGeometry(4,2),wind={value:0};
 const terrainMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:1});
 terrainMat.onBeforeCompile=shader=>landscapeShader(shader,{rock:materials.cliff,meadow:materials.meadow});terrainMat.customProgramCacheKey=()=> 'landscape-triplanar-v1';
 const grassMat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.88});
 grassMat.onBeforeCompile=shader=>{
  shader.uniforms.meadowTime=wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float meadowTime;').replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 tuftOrigin=instanceMatrix[3].xyz;float tip=pow(max(position.y,0.),1.7);
   transformed.x+=sin(meadowTime*1.6+tuftOrigin.x*.3+tuftOrigin.z*.21)*tip*.13;
   transformed.z+=cos(meadowTime*1.1+tuftOrigin.z*.19)*tip*.08;
  `);
 };grassMat.customProgramCacheKey=()=> 'meadow-wind-v1';
 function build(parent,layout,theme){grassCells.length=0;
  const terrain=new T.Mesh(mountainGeo,terrainMat);terrain.receiveShadow=true;terrain.name='layered-rocky-landscape';parent.add(terrain);
  if(plant)for(const p of roadsideSpots(layout,theme)){const model=plant(parent,p.x,p.z,p.index,p.height);model.position.y=-.04;}
  const patches=new Map(),step=.85;
  for(let x=-89;x<90;x+=step)for(let z=-71;z<72;z+=step){
   const xx=x+(random(x,z)-.5)*step,zz=z+(random(z,x)-.5)*step;
   if(!vegetationAllowed(xx,zz,layout,theme)||random(x+1,z)<.15)continue;
   const cx=Math.floor((xx+90)/22)*22-79,cz=Math.floor((zz+72)/22)*22-61,key=cx+':'+cz;
   if(!patches.has(key))patches.set(key,{x:cx,z:cz,points:[]});patches.get(key).points.push({x:xx,z:zz,scale:.65+random(x,zz)*.6});
  }
  const dummy=new T.Object3D(),color=new T.Color();
  for(const patch of patches.values()){
   const lod=new T.LOD();lod.position.set(patch.x,-.06,patch.z);
   for(const [geometry,distance] of [[nearGrass,0],[farGrass,detailed?43:25]]){
    const mesh=new T.InstancedMesh(geometry,grassMat,patch.points.length);
    patch.points.forEach((p,i)=>{dummy.position.set(p.x-patch.x,0,p.z-patch.z);dummy.rotation.set(0,random(p.x,p.z)*Math.PI*2,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);color.setHSL(.23,.15,.78+random(p.z,p.x)*.18);mesh.setColorAt(i,color);});
    mesh.receiveShadow=true;mesh.computeBoundingSphere();lod.addLevel(mesh,distance,.12);
   }
   lod.addLevel(new T.Group(),detailed?105:85,.12);parent.add(lod);grassCells.push(lod);
  }
 }
 return {build,setQuality:high=>{detailed=high;for(const lod of grassCells){lod.levels[1].distance=high?43:25;lod.levels[2].distance=high?105:85;}},update:time=>{wind.value=time;}};
}
