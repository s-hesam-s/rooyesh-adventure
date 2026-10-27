import * as T from '../../vendor/three.module.js';
export function createReceptionMaterials(base,renderer){
 function surface(kind){const c=document.createElement('canvas');c.width=c.height=2048;const q=c.getContext('2d');q.fillStyle=kind==='floor'?'#aeb9bb':kind==='stone'?'#91a3ab':'#b6ac94';q.fillRect(0,0,2048,2048);const rand=i=>{const n=Math.sin(i*27.19)*27183.77;return n-Math.floor(n);};
  for(let i=0;i<80000;i++){q.fillStyle=i%2?'#ffffff20':'#5e4f3515';q.fillRect(rand(i)*2048,rand(i+1)*2048,1+rand(i+2)*3,kind==='wood'?10+rand(i+3)*140:1+rand(i+3)*2);}
  if(kind==='floor'){q.lineWidth=3;q.strokeStyle='#9b8a7155';for(let n=0;n<=4;n++){q.beginPath();q.moveTo(n*512,0);q.lineTo(n*512,2048);q.moveTo(0,n*512);q.lineTo(2048,n*512);q.stroke();}}
  if(kind==='stone'){q.lineWidth=2;for(let row=0;row<22;row++){q.strokeStyle=row%3?'#9c896633':'#fff4d929';q.beginPath();for(let x=0;x<=2048;x+=16){const y=row*100+Math.sin(x*.004+row)*18+Math.sin(x*.015+row*2)*5;x?q.lineTo(x,y):q.moveTo(x,y);}q.stroke();}}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const material=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.008,roughness:kind==='floor'?.72:.84});
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 receptionPosition=vec4(position,1.);vec3 receptionNormal=normal;
#ifdef USE_INSTANCING
receptionPosition=instanceMatrix*receptionPosition;receptionNormal=mat3(instanceMatrix)*receptionNormal;
#endif
receptionPosition=modelMatrix*receptionPosition;receptionNormal=normalize(mat3(modelMatrix)*receptionNormal);
vec2 receptionUv=(abs(receptionNormal.y)>.5?receptionPosition.xz:(abs(receptionNormal.x)>.5?receptionPosition.zy:receptionPosition.xy))/16.;
#ifdef USE_MAP
vMapUv=receptionUv;
#endif
#ifdef USE_BUMPMAP
vBumpMapUv=receptionUv;
#endif`);};material.customProgramCacheKey=()=> 'reception-'+kind;return material;
 }
 const solid=(color,roughness=.75,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 return {screen:solid('#b3c7c2'),floor:surface('floor'),stone:surface('stone'),wood:surface('wood'),plaster:solid('#c4d0d1'),paper:base.paper,brass:solid('#a1aeb0',.33,.7),metal:solid('#455e70',.52,.4),panel:solid('#64818d'),darkWood:solid('#314952'),dark:solid('#293d43'),red:solid('#9e6352'),glass:solid('#adcbce',.25),leaf:solid('#5c7960'),soil:solid('#62523d'),cover:solid('#436c76'),cover2:solid('#8b9ca1'),cloth:solid('#9daeb1'),glow:new T.MeshStandardMaterial({color:'#eef2de',emissive:'#d4e5dc',emissiveIntensity:.75,roughness:.5}),modelGlass:new T.MeshPhysicalMaterial({color:'#c6dfd7',transparent:true,opacity:.25,roughness:.2,depthWrite:false})};
}
