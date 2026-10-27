import * as T from '../../vendor/three.module.js';
export function createOrchardMaterials(base,renderer){
 function surface(kind){const c=document.createElement('canvas');c.width=c.height=2048;const q=c.getContext('2d');q.fillStyle=kind==='floor'?'#bbc1c8':kind==='stone'?'#abb4bc':'#b39472';q.fillRect(0,0,2048,2048);const rand=i=>{const n=Math.sin(i*27.19)*27183.77;return n-Math.floor(n);};
  for(let i=0;i<80000;i++){q.fillStyle=i%2?'#ffffff20':'#5e4f3515';q.fillRect(rand(i)*2048,rand(i+1)*2048,1+rand(i+2)*3,kind==='wood'?10+rand(i+3)*140:1+rand(i+3)*2);}
  if(kind==='floor'){q.lineWidth=3;q.strokeStyle='#75664b88';for(let row=0;row<8;row++)for(let col=0;col<8;col++)q.strokeRect(col*256,row*256,256,256);for(let i=0;i<12000;i++){q.fillStyle=i%3?'#edf0ee70':'#66788c55';q.fillRect(rand(i+40)*2048,rand(i+87)*2048,2+rand(i+31)*4,2+rand(i+32)*4);}}
  if(kind==='stone'){q.lineWidth=2;for(let row=0;row<22;row++){q.strokeStyle=row%3?'#9c896633':'#fff4d929';q.beginPath();for(let x=0;x<=2048;x+=16){const y=row*100+Math.sin(x*.004+row)*18+Math.sin(x*.015+row*2)*5;x?q.lineTo(x,y):q.moveTo(x,y);}q.stroke();}}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const material=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.008,roughness:kind==='floor'?.8:.75});
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 orchardPosition=vec4(position,1.);vec3 orchardNormal=normal;
#ifdef USE_INSTANCING
orchardPosition=instanceMatrix*orchardPosition;orchardNormal=mat3(instanceMatrix)*orchardNormal;
#endif
orchardPosition=modelMatrix*orchardPosition;orchardNormal=normalize(mat3(modelMatrix)*orchardNormal);
vec2 orchardUv=(abs(orchardNormal.y)>.5?orchardPosition.xz:(abs(orchardNormal.x)>.5?orchardPosition.zy:orchardPosition.xy))/16.;
#ifdef USE_MAP
vMapUv=orchardUv;
#endif
#ifdef USE_BUMPMAP
vBumpMapUv=orchardUv;
#endif`);};material.customProgramCacheKey=()=> 'orchard-'+kind;return material;
 }
 const sky=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 skyPoint;void main(){skyPoint=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 skyPoint;void main(){vec3 d=normalize(skyPoint);float t=clamp(d.y*1.6,0.,1.);vec3 color=mix(vec3(.81,.85,.78),vec3(.33,.57,.71),t);float cloud=sin(d.x*17.+sin(d.z*9.))*sin(d.z*23.+d.x*7.);cloud=smoothstep(.45,.85,cloud)*(1.-smoothstep(.28,.72,d.y))*smoothstep(.02,.14,d.y);gl_FragColor=vec4(mix(color,vec3(.94,.94,.87),cloud*.27),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const solid=(color,roughness=.75,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 return {ceiling:new T.MeshStandardMaterial({color:'#dbe5ef',emissive:'#5b6876',emissiveIntensity:.25,roughness:.9}),sky,floor:surface('floor'),stone:surface('stone'),wood:surface('wood'),plaster:solid('#dde2e7'),paper:solid('#f1f0e7'),brass:solid('#9b8357',.33,.7),metal:solid('#526374',.52,.4),panel:solid('#324958'),darkWood:solid('#344553'),dark:solid('#253543'),red:solid('#9e6352'),glass:solid('#bdd8e6',.25),leaf:solid('#5c7960'),soil:solid('#62523d'),cover:solid('#90a7ac'),cover2:solid('#a47866'),cloth:solid('#b8aa8b'),glow:new T.MeshStandardMaterial({color:'#eef2de',emissive:'#d4e5dc',emissiveIntensity:.75,roughness:.5}),modelGlass:new T.MeshPhysicalMaterial({color:'#c6dfd7',transparent:true,opacity:.25,roughness:.2,depthWrite:false})};
}
