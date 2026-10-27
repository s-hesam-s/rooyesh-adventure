import * as T from '../../vendor/three.module.js';
export function createCanalMaterials(base,renderer){
 const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 function surface(kind){const c=document.createElement('canvas');c.width=c.height=2048;const q=c.getContext('2d'),size=2048;
  q.fillStyle=kind==='floor'?'#bdb7a5':kind==='tile'?'#315e69':'#d4cbb4';q.fillRect(0,0,size,size);
  const noise=i=>{const v=Math.sin(i*23.71)*43758.54;return v-Math.floor(v);};
  for(let i=0;i<70000;i++){q.fillStyle=i%2?'#ffffff12':'#655b470d';q.fillRect(noise(i*3)*size,noise(i*3+1)*size,1+noise(i*3+2)*2,1);}
  if(kind==='floor'){q.strokeStyle='#867b6655';q.lineWidth=3;for(let i=0;i<5;i++){q.beginPath();q.moveTo(i*512,0);q.lineTo(i*512,size);q.moveTo(0,i*512);q.lineTo(size,i*512);q.stroke();}}
  if(kind==='tile')for(let x=0;x<size;x+=256)for(let y=0;y<size;y+=256){q.strokeStyle='#d6ceb4';q.lineWidth=7;q.strokeRect(x+8,y+8,240,240);q.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?48:93,xx=x+128+Math.cos(a)*r,yy=y+128+Math.sin(a)*r;i?q.lineTo(xx,yy):q.moveTo(xx,yy);}q.closePath();q.fillStyle=(x+y)%512?'#9b8c63':'#d4d7bf';q.fill();}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=anisotropy;
  const material=new T.MeshStandardMaterial({map,roughness:kind==='tile'?.36:.86,bumpMap:map,bumpScale:kind==='tile'?.006:.012});
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 canalPosition=vec4(position,1.);vec3 canalNormal=normal;
#ifdef USE_INSTANCING
canalPosition=instanceMatrix*canalPosition;canalNormal=mat3(instanceMatrix)*canalNormal;
#endif
canalPosition=modelMatrix*canalPosition;canalNormal=normalize(mat3(modelMatrix)*canalNormal);
vec2 canalUv=(abs(canalNormal.y)>.5?canalPosition.xz:(abs(canalNormal.x)>.5?canalPosition.zy:canalPosition.xy))/${kind==='tile'?'8.':'16.'};
#ifdef USE_MAP
vMapUv=canalUv;
#endif
#ifdef USE_BUMPMAP
vBumpMapUv=canalUv;
#endif`);};material.customProgramCacheKey=()=> 'canal-surface-'+kind;return material;
 }
 const sky=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 skyPoint;void main(){skyPoint=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 skyPoint;void main(){vec3 d=normalize(skyPoint);float t=clamp(d.y*1.6,0.,1.);vec3 color=mix(vec3(.81,.85,.78),vec3(.33,.57,.71),t);float cloud=sin(d.x*17.+sin(d.z*9.))*sin(d.z*23.+d.x*7.);cloud=smoothstep(.45,.85,cloud)*(1.-smoothstep(.28,.72,d.y))*smoothstep(.02,.14,d.y);gl_FragColor=vec4(mix(color,vec3(.94,.94,.87),cloud*.27),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const water=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec3 waterPoint;void main(){vec4 p=modelMatrix*vec4(position,1.);waterPoint=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:'uniform float time;varying vec3 waterPoint;void main(){vec2 p=waterPoint.xz;float wave=sin(p.x*5.+p.y*2.1-time*1.3)*.5+cos(p.y*7.-p.x*1.7+time*.8)*.3;float glint=pow(max(0.,sin(p.y*9.+p.x*3.-time)),24.);vec3 color=mix(vec3(.12,.28,.29),vec3(.26,.48,.44),wave*.3+.5)+glint*.08;gl_FragColor=vec4(color,.88);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});
 return {folio:new T.MeshStandardMaterial({color:'#6d8381',roughness:.9}),folio2:new T.MeshStandardMaterial({color:'#a08c6a',roughness:.9}),sky,floor:surface('floor'),stone:surface('stone'),tile:surface('tile'),wood:base.wood,darkWood:base.darkWood,plaster:base.plaster,paper:base.paper,brass:base.brass,metal:base.darkWood,panel:base.wood,glass:new T.MeshStandardMaterial({color:'#c0d0c8',emissive:'#95b5ba',emissiveIntensity:.16,roughness:.4}),iron:base.iron,dark:new T.MeshStandardMaterial({color:'#31453d',roughness:.86}),soil:new T.MeshStandardMaterial({color:'#4d4e36',roughness:1}),water,glow:base.glow};
}
