import * as T from '../../vendor/three.module.js';
export function roadHalfWidth(x,z){return 5.05+.3*Math.sin(x*.6+z*.37);}
export function roadRibbonGeometry(a,b){
 const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),segments=Math.max(2,Math.ceil(length*1.5)),vertices=[],uv=[],indices=[];
 if(length<.001)throw Error('Road segment needs a length');
 for(let i=0;i<=segments;i++){const t=i/segments,x=a.x+dx*t,z=a.z+dz*t,half=roadHalfWidth(x,z);for(const side of [-1,1]){const px=x-dz/length*half*side,pz=z+dx/length*half*side;vertices.push(px,.035,pz);uv.push(px*.17,pz*.17);}}
 for(let i=0;i<segments;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.transient=true;return g;
}
export function roadJunctionGeometry(x,z){const g=new T.CircleGeometry(5.35,40);g.rotateX(-Math.PI/2);g.translate(x,.04,z);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)*.17,p.getZ(i)*.17);g.userData.transient=true;return g;}
export function roadSegments(layout){return layout.roads.flatMap(points=>points.slice(1).map((b,i)=>{const a=points[i];return {ax:a.x*.1-64,az:a.y*.1-45,bx:b.x*.1-64,bz:b.y*.1-45};}));}
export function roadSample(x,z,segments){
 let distance=Infinity;for(const s of segments){const dx=s.bx-s.ax,dz=s.bz-s.az,t=T.MathUtils.clamp(((x-s.ax)*dx+(z-s.az)*dz)/(dx*dx+dz*dz||1),0,1);distance=Math.min(distance,Math.hypot(x-s.ax-dx*t,z-s.az-dz*t));}
 const width=roadHalfWidth(x,z)+.55,edge=T.MathUtils.smoothstep(distance,width-.7,width+.45),track=Math.exp(-(((distance-1.55)/.54)**2)),patch=(Math.sin(x*.29+Math.sin(z*.19))*Math.sin(z*.23+x*.09)+1)*.5;
 const height=.035+.065*(1-Math.min(1,distance/width))**2-track*.016+Math.sin(x*1.7)*Math.sin(z*1.3)*.007;
 return {distance,alpha:1-edge,edge,track,patch,height};
}
export function createRoadGeometry(layout,step=.7){
 const segments=roadSegments(layout);if(!segments.length)throw Error('A road needs connected segments');
 const minX=Math.floor((Math.min(...segments.flatMap(s=>[s.ax,s.bx]))-7)/step)*step,minZ=Math.floor((Math.min(...segments.flatMap(s=>[s.az,s.bz]))-7)/step)*step,columns=Math.ceil((Math.max(...segments.flatMap(s=>[s.ax,s.bx]))+7-minX)/step),rows=Math.ceil((Math.max(...segments.flatMap(s=>[s.az,s.bz]))+7-minZ)/step);
 const samples=[];for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++)samples.push(roadSample(minX+col*step,minZ+row*step,segments));
 const vertices=[],uv=[],colors=[],damp=[],indices=[],cache=new Map(),center=new T.Color('#e0d6bd'),soil=new T.Color('#89704b'),color=new T.Color();
 function vertex(row,col){const key=row*(columns+1)+col;if(cache.has(key))return cache.get(key);const p=samples[key],x=minX+col*step,z=minZ+row*step,index=vertices.length/3;vertices.push(x,p.height,z);uv.push(x*.17,z*.17);color.copy(center).lerp(soil,p.edge*.84).multiplyScalar(.88+p.patch*.12+p.track*.045);colors.push(color.r,color.g,color.b,p.alpha);damp.push(p.patch*.65+p.track*.25);cache.set(key,index);return index;}
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const key=row*(columns+1)+col;if([key,key+1,key+columns+1,key+columns+2].every(i=>samples[i].alpha<.005))continue;const a=vertex(row,col),b=vertex(row,col+1),c=vertex(row+1,col),d=vertex(row+1,col+1);indices.push(a,c,b,c,d,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,4));g.setAttribute('roadDamp',new T.Float32BufferAttribute(damp,1));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();g.userData.transient=true;return g;
}
export function createRoadMaterial(source){
 const material=source.clone();material.name='compacted-garden-path';material.vertexColors=true;material.transparent=true;material.depthWrite=true;material.alphaTest=.025;material.userData.transient=true;
 material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float roadDamp;varying float vRoadDamp;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRoadDamp=roadDamp;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vRoadDamp;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*(1.-.22*vRoadDamp),.65,1.);');};material.customProgramCacheKey=()=> 'compacted-path-v1';return material;
}
export function roadGravel(layout,count=800){
 const segments=roadSegments(layout),positions=[];const random=i=>{const n=Math.sin(i*127.1+41.7)*43758.5453;return n-Math.floor(n);};
 for(let i=0;i<count;i++){const s=segments[i%segments.length],dx=s.bx-s.ax,dz=s.bz-s.az,length=Math.hypot(dx,dz)||1,t=random(i+100),side=i%2?1:-1,offset=(i%5?4.25+random(i+200)*1.7:random(i+200)*3.4)*side,x=s.ax+dx*t-dz/length*offset,z=s.az+dz*t+dx/length*offset,p=roadSample(x,z,segments);if(p.alpha<.04)continue;positions.push({x,z,y:p.height+.018,scale:.035+random(i+300)*.115,rotation:random(i+400)*Math.PI*2,tint:.72+random(i+500)*.28});}return positions;
}