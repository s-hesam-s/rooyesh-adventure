import * as T from '../../vendor/three.module.js';
export function createWorkshopMaterials(base,renderer){
 const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 function surface(kind){const size=2048,c=document.createElement('canvas');c.width=c.height=size;const q=c.getContext('2d');
  q.fillStyle=kind==='brick'?'#95897a':'#b7b9b0';q.fillRect(0,0,size,size);
  function random(i){const v=Math.sin(i*17.73)*43758.5;return v-Math.floor(v);}
  if(kind==='brick')for(let row=0;row<16;row++)for(let col=-1;col<9;col++){const n=random(row*23+col+5),x=col*256+(row%2)*128,y=row*128;q.fillStyle='rgb('+Math.round(142+n*35)+','+Math.round(100+n*25)+','+Math.round(74+n*19)+')';q.fillRect(x+5,y+5,246,118);q.fillStyle='#f3d5b020';q.fillRect(x+7,y+7,242,2);}
  for(let i=0;i<110000;i++){q.fillStyle=i%2?'#ffffff0c':'#35382d0b';q.fillRect(random(i*3)*size,random(i*3+1)*size,1+random(i*3+2)*2,1);}
  if(kind!=='brick'){q.strokeStyle='#6b71634a';q.lineWidth=3;for(let i=1;i<4;i++){q.beginPath();q.moveTo(i*512,0);q.lineTo(i*512,size);q.moveTo(0,i*512);q.lineTo(size,i*512);q.stroke();}for(let i=0;i<28;i++){q.strokeStyle='#80887812';q.lineWidth=5;q.beginPath();q.ellipse(random(i+100)*size,random(i+200)*size,40+random(i)*100,16,.5,0,Math.PI*2);q.stroke();}}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(...(kind==='brick'?[3,1.5]:[8,6]));map.anisotropy=anisotropy;
  const material=new T.MeshStandardMaterial({map,roughness:kind==='brick'?.92:.78,bumpMap:map,bumpScale:kind==='brick'?.035:.012});
  // Keep mortar and floor joints at their physical scale, including batched instances.
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 workshopPosition=vec4(position,1.);vec3 workshopNormal=normal;
#ifdef USE_INSTANCING
workshopPosition=instanceMatrix*workshopPosition;workshopNormal=mat3(instanceMatrix)*workshopNormal;
#endif
workshopPosition=modelMatrix*workshopPosition;workshopNormal=normalize(mat3(modelMatrix)*workshopNormal);
vec2 workshopUv=`+(kind==='brick'?'(abs(workshopNormal.x)>.5?workshopPosition.zy:workshopPosition.xy)/9.6;':'workshopPosition.xz/16.;')+`
#ifdef USE_MAP
vMapUv=workshopUv;
#endif
#ifdef USE_BUMPMAP
vBumpMapUv=workshopUv;
#endif`);};material.customProgramCacheKey=()=> 'workshop-world-surface-'+kind;return material;
 }
 const drawing=document.createElement('canvas');drawing.width=2048;drawing.height=1024;const q=drawing.getContext('2d');q.fillStyle='#234950';q.fillRect(0,0,2048,1024);q.strokeStyle='#9bc5bd25';q.lineWidth=1;for(let x=0;x<2048;x+=40){q.beginPath();q.moveTo(x,0);q.lineTo(x,1024);q.stroke();}for(let y=0;y<1024;y+=40){q.beginPath();q.moveTo(0,y);q.lineTo(2048,y);q.stroke();}
 q.strokeStyle='#d0e1ca';q.lineWidth=5;for(const offset of [180,1020]){q.strokeRect(offset,350,650,440);q.beginPath();q.moveTo(offset,350);q.lineTo(offset+325,170);q.lineTo(offset+650,350);q.stroke();for(let i=1;i<6;i++){q.beginPath();q.moveTo(offset+i*108,350);q.lineTo(offset+i*108,790);q.stroke();}q.beginPath();q.moveTo(offset,560);q.lineTo(offset+650,560);q.stroke();}
 q.direction='rtl';q.textAlign='center';q.font='600 46px Vazirmatn';q.fillStyle='#e6e2bd';q.fillText('نقشه مونتاژ سازه گلخانه · شرکت آفتاب',1024,950);const blueprintMap=new T.CanvasTexture(drawing);blueprintMap.colorSpace=T.SRGBColorSpace;blueprintMap.anisotropy=anisotropy;
 const blueprint=new T.MeshStandardMaterial({map:blueprintMap,roughness:.88});
 const steel=new T.MeshStandardMaterial({color:'#3b4b4c',roughness:.43,metalness:.76}),paint=new T.MeshStandardMaterial({color:'#416c62',roughness:.55,metalness:.35});
 return {blueprint,brick:surface('brick'),floor:surface('floor'),stone:base.stone,plaster:base.plaster,paper:base.paper,brass:base.brass,wood:base.wood,steel,metal:steel,panel:paint,glass:new T.MeshStandardMaterial({color:'#bacbc4',roughness:.24,metalness:.22}),dark:new T.MeshStandardMaterial({color:'#243435',roughness:.65}),silver:new T.MeshStandardMaterial({color:'#aeb7b4',roughness:.3,metalness:.87}),rubber:new T.MeshStandardMaterial({color:'#242b2b',roughness:.92}),safety:new T.MeshStandardMaterial({color:'#c3943e',roughness:.65}),glow:base.glow};
}
