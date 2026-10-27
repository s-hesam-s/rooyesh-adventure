import * as T from '../../vendor/three.module.js';

// Small deterministic material tiles: no image requests or canvas dependency.
export function workwearPixels(size=256,leather=false){
 const color=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4);
 function height(x,y){const grain=Math.sin(x*73.13+y*137.71)*Math.sin(x*19.17-y*41.31);return leather?grain*.12+Math.sin(x*.38+Math.sin(y*.47))*.05:Math.sin(x*Math.PI/2)*.15+Math.sin(y*Math.PI/2)*.15+(((x>>2)+(y>>2))%2?.07:-.07)+grain*.018;}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,h=height(x,y),dx=height((x+1)%size,y)-height((x+size-1)%size,y),dy=height(x,(y+1)%size)-height(x,(y+size-1)%size),length=Math.hypot(dx,dy,1),v=Math.round(211+h*65),r=leather?188+h*90:235+h*30;color.set([v,v,v,255],i);normal.set([Math.round(128-dx/length*127),Math.round(128-dy/length*127),Math.round(128+127/length),255],i);roughness.set([r,r,r,255],i);}
 return {color,normal,roughness,size};
}
export function workwearMaterial(color,{leather=false,repeat=2}={}){
 const p=workwearPixels(256,leather);
 function texture(bytes,srgb=false){const map=new T.DataTexture(bytes,p.size,p.size);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(repeat,repeat);map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.anisotropy=4;if(srgb)map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;return map;}
 return new T.MeshStandardMaterial({color,map:texture(p.color,true),normalMap:texture(p.normal),roughnessMap:texture(p.roughness),normalScale:new T.Vector2(leather?.22:.3,leather?.22:.3),roughness:1});
}
export function sleeveGeometry(){
 const rings=[];for(let i=0;i<=28;i++){const t=i/28,fold=Math.sin(t*Math.PI*10)*.008*Math.sin(Math.PI*t);rings.push(new T.Vector2(.11+t*.025+fold,t));}const g=new T.LatheGeometry(rings,24);g.translate(0,-.5,0);return g;
}