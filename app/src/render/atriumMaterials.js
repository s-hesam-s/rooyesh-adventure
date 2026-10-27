import * as T from '../../vendor/three.module.js';
export function createAtriumMaterials(base,renderer){
 function surface(kind){const c=document.createElement('canvas');c.width=c.height=2048;const q=c.getContext('2d');q.fillStyle=kind==='floor'?'#d1c9b6':kind==='stone'?'#d2bfa0':'#917154';q.fillRect(0,0,2048,2048);const rand=i=>{const n=Math.sin(i*27.19)*27183.77;return n-Math.floor(n);};
  for(let i=0;i<80000;i++){q.fillStyle=i%2?'#ffffff20':'#5e4f3515';q.fillRect(rand(i)*2048,rand(i+1)*2048,1+rand(i+2)*3,kind==='wood'?10+rand(i+3)*140:1+rand(i+3)*2);}
  if(kind==='floor'){q.lineWidth=3;q.strokeStyle='#9b8a7155';for(let n=0;n<=4;n++){q.beginPath();q.moveTo(n*512,0);q.lineTo(n*512,2048);q.moveTo(0,n*512);q.lineTo(2048,n*512);q.stroke();}}
  if(kind==='stone'){q.lineWidth=2;for(let row=0;row<22;row++){q.strokeStyle=row%3?'#9c896633':'#fff4d929';q.beginPath();for(let x=0;x<=2048;x+=16){const y=row*100+Math.sin(x*.004+row)*18+Math.sin(x*.015+row*2)*5;x?q.lineTo(x,y):q.moveTo(x,y);}q.stroke();}}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const material=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.008,roughness:kind==='floor'?.55:.75});
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 atriumPosition=vec4(position,1.);vec3 atriumNormal=normal;
#ifdef USE_INSTANCING
atriumPosition=instanceMatrix*atriumPosition;atriumNormal=mat3(instanceMatrix)*atriumNormal;
#endif
atriumPosition=modelMatrix*atriumPosition;atriumNormal=normalize(mat3(modelMatrix)*atriumNormal);
vec2 atriumUv=(abs(atriumNormal.y)>.5?atriumPosition.xz:(abs(atriumNormal.x)>.5?atriumPosition.zy:atriumPosition.xy))/16.;
#ifdef USE_MAP
vMapUv=atriumUv;
#endif
#ifdef USE_BUMPMAP
vBumpMapUv=atriumUv;
#endif`);};material.customProgramCacheKey=()=> 'atrium-'+kind;return material;
 }
 const solid=(color,roughness=.75,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 return {floor:surface('floor'),stone:surface('stone'),wood:surface('wood'),plaster:solid('#e6dfcc'),paper:base.paper,brass:solid('#aa926b',.33,.7),metal:solid('#79664f',.52,.4),panel:solid('#798e82'),darkWood:solid('#5b4c40'),dark:solid('#344c46'),red:solid('#9e6352'),glass:solid('#b8cecc',.25),leaf:solid('#5c7960'),soil:solid('#62523d'),cover:solid('#496b61'),cover2:solid('#976f52'),cloth:solid('#c3ae8b'),glow:new T.MeshStandardMaterial({color:'#eef2de',emissive:'#d4e5dc',emissiveIntensity:.75,roughness:.5}),modelGlass:new T.MeshPhysicalMaterial({color:'#c6dfd7',transparent:true,opacity:.25,roughness:.2,depthWrite:false})};
}
