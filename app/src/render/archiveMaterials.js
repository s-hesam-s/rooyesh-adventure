import {workwearMaterial} from './workwear.js';
import * as T from '../../vendor/three.module.js';
export function createArchiveMaterials(renderer){
 const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 function texture(paint,size=1024,repeat=[1,1],linear=false){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const q=canvas.getContext('2d');paint(q,size);
  const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(...repeat);map.anisotropy=anisotropy;map.colorSpace=linear?T.NoColorSpace:T.SRGBColorSpace;return map;
 }
 const noise=(i,j)=>{const n=Math.sin(i*12.9898+j*78.233)*43758.5453;return n-Math.floor(n);};
 const wood=texture((q,s)=>{q.fillStyle='#70513a';q.fillRect(0,0,s,s);for(let i=0;i<3600;i++){const x=noise(i,2)*s,y=noise(i,4)*s;q.strokeStyle=i%3?'#b68b5c18':'#30251a25';q.lineWidth=.5+noise(i,3)*2;q.beginPath();q.moveTo(x,y);q.bezierCurveTo(x+12,y+45,x-10,y+110,x+Math.sin(i)*9,y+170);q.stroke();}for(let i=0;i<6;i++){q.strokeStyle='#201c1525';q.beginPath();q.ellipse((i+.4)*s/6,s*.4,8+i,70+i*7,.07,0,Math.PI*2);q.stroke();}});
 const stone=texture((q,s)=>{q.fillStyle='#b9b0a0';q.fillRect(0,0,s,s);const tile=s/4;for(let y=0;y<4;y++)for(let x=0;x<4;x++){const n=noise(x,y);q.fillStyle='rgb('+(191+n*19)+','+(182+n*17)+','+(162+n*18)+')';q.fillRect(x*tile+2,y*tile+2,tile-4,tile-4);q.strokeStyle='#f0e8d238';q.lineWidth=2;q.strokeRect(x*tile+4,y*tile+4,tile-8,tile-8);}for(let i=0;i<8500;i++){const x=noise(i,13)*s,y=noise(i,15)*s;q.fillStyle=i%2?'#ffffff0b':'#584b3b09';q.fillRect(x,y,1+noise(i,11)*2,1);}q.strokeStyle='#988c7833';for(let i=0;i<100;i++){q.beginPath();const x=noise(i,9)*s,y=noise(i,10)*s;q.moveTo(x,y);q.bezierCurveTo(x+20,y+18,x-10,y+35,x+45,y+75);q.stroke();}},1024,[12,9]);
 const carpet=texture((q,s)=>{q.fillStyle='#3b4b52';q.fillRect(0,0,s,s);for(let y=0;y<s;y+=3){q.strokeStyle=y%2?'#bd9a6528':'#132d3540';q.beginPath();q.moveTo(0,y);q.lineTo(s,y);q.stroke();}for(let x=0;x<s;x+=5){q.strokeStyle='#d3b58415';q.beginPath();q.moveTo(x,0);q.lineTo(x,s);q.stroke();}for(let x=32;x<s;x+=64)for(let y=32;y<s;y+=64){q.strokeStyle='#b39a6f55';q.lineWidth=2;q.beginPath();q.moveTo(x,y-16);q.lineTo(x+12,y);q.lineTo(x,y+16);q.lineTo(x-12,y);q.closePath();q.stroke();}},512,[1.5,1.5]);
 const plaster=texture((q,s)=>{q.fillStyle='#d7cfba';q.fillRect(0,0,s,s);for(let i=0;i<50000;i++){q.fillStyle=i%2?'#ffffff14':'#65594608';q.fillRect(noise(i,17)*s,noise(i,19)*s,1.5,1.5);}},512,[3,2]);
 const paper=texture((q,s)=>{q.fillStyle='#e7dfc9';q.fillRect(0,0,s,s);for(let i=0;i<12000;i++){q.fillStyle=i%2?'#ffffff14':'#776b4f16';q.fillRect(noise(i,3)*s,noise(i,5)*s,1,2);}},512,[1,1]);
 const result={
  wood:new T.MeshStandardMaterial({map:wood,color:'#ad8a68',roughness:.48,metalness:.03}),
  darkWood:new T.MeshStandardMaterial({map:wood,color:'#75614e',roughness:.5}),
  stone:new T.MeshStandardMaterial({map:stone,roughness:.64,metalness:.02}),
  plaster:new T.MeshStandardMaterial({map:plaster,roughness:.95}),
  carpet:new T.MeshStandardMaterial({map:carpet,roughness:1}),
  paper:new T.MeshStandardMaterial({map:paper,color:'#f3eedb',roughness:.93}),
  leather:new T.MeshStandardMaterial({map:carpet,color:'#263d43',roughness:.76}),
  brass:new T.MeshStandardMaterial({color:'#aa8d52',roughness:.34,metalness:.78}),
  rope:new T.MeshStandardMaterial({color:'#b62e3e',roughness:.93,bumpMap:carpet,bumpScale:.018,emissive:'#59151d',emissiveIntensity:.18}),
  iron:new T.MeshStandardMaterial({color:'#303b3e',roughness:.54,metalness:.72}),
  glass:new T.MeshPhysicalMaterial({color:'#c8d9d5',transparent:true,opacity:.24,roughness:.16,metalness:0,depthWrite:false}),
  window:new T.MeshStandardMaterial({color:'#e6e6d2',emissive:'#d3dedb',emissiveIntensity:.55,roughness:.8}),
  glow:new T.MeshStandardMaterial({color:'#f4dfb1',emissive:'#f7c77b',emissiveIntensity:1.1,roughness:.4}),
  uniform:workwearMaterial('#3e5359',{repeat:5}),shirt:workwearMaterial('#d4cfbc',{repeat:4}),
  books:[]
 };
 const titles=['دفتر طرح','گزارش سالانه','صورت مالی','قراردادها','اسناد طرح','بایگانی','ارزیابی','مکاتبات'];
 const colors=['#365158','#783e37','#727147','#ac8054','#344761','#675270','#3f6554','#a18c70','#6d4832','#394648','#9c6152','#5b6741'];
 for(let i=0;i<48;i++){
  const map=texture((q,s)=>{
   q.fillStyle=colors[i%colors.length];q.fillRect(0,0,s,s);
   for(let j=0;j<500;j++){q.fillStyle=j%2?'#ffffff0d':'#00000016';q.fillRect(noise(j,i)*s,noise(j,i+3)*s,1,2+noise(j,i+9)*6);}
   const style=Math.floor(i/12);q.strokeStyle='#c5ad78';q.fillStyle='#dfcc9d';q.lineWidth=2;
   if(style===0){q.strokeRect(22,18,s-44,s-36);q.fillRect(24,49,s-48,3);}
   if(style===1)for(const y of [30,42,s-40])q.fillRect(12,y,s-24,2);
   if(style===2){q.fillStyle='#d9cba7';q.fillRect(26,s*.31,s-52,s*.4);q.fillStyle='#3b3a32';}
   q.save();q.translate(s/2,s*.5);q.rotate(-Math.PI/2);q.direction='rtl';q.textAlign='center';q.font='600 29px Vazirmatn';q.fillText(titles[i%titles.length],0,9,s*.65);q.restore();
   q.font='20px serif';q.textAlign='center';q.fillText(String(101+i*7),s/2,s*.84);
   if(style===3){q.strokeStyle='#ded2ac44';for(let j=0;j<6;j++){q.beginPath();q.moveTo(15+noise(j,i)*50,noise(j,i+6)*s);q.lineTo(s-15,noise(j,i+7)*s);q.stroke();}}
  },256);
  result.books.push(new T.MeshStandardMaterial({map,color:'#ffffff',roughness:.65+(i%4)*.08}));
 }
 for(const key of ['wood','stone','carpet','leather']){result[key].bumpMap=result[key].map.clone();result[key].bumpMap.colorSpace=T.NoColorSpace;result[key].bumpScale=key==='wood'?.045:.025;}
 return result;
}