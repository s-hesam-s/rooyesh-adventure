import * as T from '../../vendor/three.module.js';
export function createPostalMaterials(base,renderer){
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=2048;const q=c.getContext('2d');q.fillStyle=kind==='floor'?'#aaa99e':kind==='wall'?'#d8d3c2':'#b59664';q.fillRect(0,0,2048,2048);const rand=i=>{const a=Math.sin(i*17.53)*53781.77;return a-Math.floor(a);};
  for(let i=0;i<95000;i++){q.fillStyle=i%3===0?'#514d4230':'#ffffff35';const s=kind==='wood'?1:1+rand(i+3)*4;q.fillRect(rand(i)*2048,rand(i+1)*2048,s,kind==='wood'?5+rand(i+5)*80:s);}
  if(kind==='floor'){q.strokeStyle='#5a615b66';q.lineWidth=3;for(let i=0;i<=4;i++){q.beginPath();q.moveTo(i*512,0);q.lineTo(i*512,2048);q.moveTo(0,i*512);q.lineTo(2048,i*512);q.stroke();}}
  if(kind==='wall'){q.strokeStyle='#988f7a55';q.lineWidth=3;for(let y=0;y<=2048;y+=256){q.beginPath();q.moveTo(0,y);q.lineTo(2048,y);q.stroke();for(let x=(y/256%2)*256;x<2048;x+=512)q.strokeRect(x,y,512,256);}}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const material=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.009,roughness:kind==='wood'?.68:.85});
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 postalPosition=vec4(position,1.);vec3 postalNormal=normal;
#ifdef USE_INSTANCING
postalPosition=instanceMatrix*postalPosition;postalNormal=mat3(instanceMatrix)*postalNormal;
#endif
postalPosition=modelMatrix*postalPosition;postalNormal=normalize(mat3(modelMatrix)*postalNormal);
vec2 postalUv=(abs(postalNormal.y)>.5?postalPosition.xz:(abs(postalNormal.x)>.5?postalPosition.zy:postalPosition.xy))/16.;
#ifdef USE_MAP
vMapUv=postalUv;
#endif
#ifdef USE_BUMPMAP
vBumpMapUv=postalUv;
#endif`);};material.customProgramCacheKey=()=> 'postal-'+kind;return material;
 }
 const solid=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 return {floor:texture('floor'),tile:texture('wall'),wood:texture('wood'),stone:base.stone||base.plaster,plaster:solid('#dedbce'),paper:base.paper,brass:solid('#a0a89f',.34,.75),metal:solid('#344f60',.5,.5),panel:solid('#57717b',.65,.2),darkWood:solid('#34434a'),dark:solid('#29333b'),iron:solid('#687a80',.42,.7),rubber:solid('#303632',.95),red:solid('#a65a47'),kraft:solid('#b69d77',.95),kraft2:solid('#cfb78e',.93),tape:solid('#d1bb86',.55),glass:solid('#aabfc1',.32),screen:solid('#9aada5',.5),glow:new T.MeshStandardMaterial({color:'#f3edcf',emissive:'#f1e3be',emissiveIntensity:.7,roughness:.7})};
}
