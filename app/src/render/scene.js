import {plant,livingDetails} from './flora.js';
import {WORLD,layoutFor,walkable,cartAt,distance} from '../game/world.js';
import {missingItems} from '../game/state.js';
const themes={
 garden:{ground:'#b8cd9b',floor:'#d6dfbb',road:'#eee6c9',leaf:'#4f7951',sky:'#e7edda'},
 glass:{ground:'#a8c0a1',floor:'#cedcc1',road:'#e5ddbb',leaf:'#3c7355',sky:'#e3eddf'},
 court:{ground:'#c4c9a2',floor:'#dedac0',road:'#ede5d3',leaf:'#5a7a55',sky:'#eeeada'},
 water:{ground:'#b5caa4',floor:'#c9d7b4',road:'#e9dfba',leaf:'#447960',sky:'#e3ead9'},
 hill:{ground:'#c0c9a0',floor:'#d4d8b0',road:'#e7d9ad',leaf:'#70804d',sky:'#e9e7ce'}
};
function rounded(ctx,x,y,w,h,r,fill,stroke){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
function ellipse(ctx,x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function line(ctx,points,color,width){
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
function text(ctx,value,x,y,size=16,color='#294c3a',weight=500){
 ctx.font=weight+' '+size+'px Vazirmatn';ctx.textAlign='center';ctx.direction='rtl';ctx.fillStyle=color;ctx.fillText(value,x,y);
}
function tree(ctx,x,y,size=1){
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);ellipse(ctx,13,9,28,11,'#25443120');
 rounded(ctx,-4,-30,8,35,3,'#8c7550');
 ellipse(ctx,0,-44,24,39,'#456b46');ellipse(ctx,-10,-48,15,29,'#5a7d4c');ellipse(ctx,6,-55,13,26,'#6d9055');
 line(ctx,[{x:0,y:-13},{x:0,y:-71}],'#a7b87870',1.5);
  line(ctx,[{x:0,y:-37},{x:-12,y:-49}],'#a7b87870',1.5);
 const kind=Math.floor(x/80)%3;
 for(let i=0;i<22;i++){
  const a=i*2.4,r=7+(i%5)*3,xx=Math.cos(a)*r,yy=-48+Math.sin(a)*r*1.4;
  ellipse(ctx,xx,yy,kind===1?7:4,kind===2?9:5,['#88a565','#668d53','#a4b875'][i%3]);
  if(kind===1&&i%4===0){ellipse(ctx,xx,yy+4,3,4,'#dcaa5c');ellipse(ctx,xx-1,yy+3,1,1,'#ffe4a1');}
 }
 ctx.restore();
}
function crop(ctx,x,y,size=1,flower=false){plant(ctx,x,y,size,flower?0:Math.abs(Math.round(x+y))%6);}
function character(ctx,p,palette,time,scale=1){
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
 const stride=p.collecting?Math.sin(p.collecting*Math.PI)*17:p.moving?Math.sin(time*15)*7:0,bob=p.moving?Math.abs(Math.sin(time*15))*1.5:Math.sin(time*2)*.7;
 ellipse(ctx,4,5,18,7,'#23433530');
 rounded(ctx,-10,-3+stride,8,14,4,palette.pants);rounded(ctx,3,-3-stride,8,14,4,palette.pants);
 rounded(ctx,-12,5+stride,11,6,3,'#394037');rounded(ctx,3,5-stride,11,6,3,'#394037');
 ctx.translate(0,-bob);
 rounded(ctx,-13,-35,27,34,10,palette.shirt);
 line(ctx,[{x:-8,y:-29},{x:-8,y:-7}],'#ffffff30',2);
 line(ctx,[{x:9,y:-28},{x:9,y:-6}],'#163a3025',3);
 rounded(ctx,-18,-29-stride*.5,7,21,4,palette.shirt);rounded(ctx,12,-29+stride*.5,7,21,4,palette.shirt);
 ellipse(ctx,-14,-9-stride*.5,4,4,palette.skin);ellipse(ctx,16,-9+stride*.5,4,4,palette.skin);
 line(ctx,[{x:-8,y:-31},{x:12,y:-5}],palette.bag,3);
 rounded(ctx,7,-14,15+(p.collecting?Math.sin(p.collecting*Math.PI)*5:0),17,4,palette.bag);rounded(ctx,9,-12,11,4,2,'#b69b5f');
 ellipse(ctx,1,-43,14,17,palette.skin);
 if(p.facing==='up'){ellipse(ctx,0,-46,15,18,palette.hair);rounded(ctx,-9,-31,19,6,3,palette.hair);}
 else{
  ctx.beginPath();ctx.moveTo(-13,-40);ctx.bezierCurveTo(-20,-66,19,-67,15,-43);ctx.lineTo(8,-50);ctx.quadraticCurveTo(-5,-42,-13,-40);ctx.fillStyle=palette.hair;ctx.fill();
  const direction=p.facing==='left'?-3:p.facing==='right'?3:0;
  ellipse(ctx,-4+direction,-42,1.5,1.6,'#3b4134');ellipse(ctx,6+direction,-42,1.5,1.6,'#3b4134');
  line(ctx,[{x:0+direction,y:-34},{x:5+direction,y:-34}],'#a16c52',1.2);
 }
 if(palette.scarf){line(ctx,[{x:-13,y:-47},{x:-16,y:-24},{x:-7,y:-18}],palette.hair,7);line(ctx,[{x:13,y:-46},{x:16,y:-25},{x:8,y:-20}],palette.hair,7);}
 ctx.restore();
}
export function createRenderer(canvas){
 const ctx=canvas.getContext('2d'),cache=document.createElement('canvas');
 cache.width=WORLD.width;cache.height=WORLD.height;
 const bg=cache.getContext('2d');
 let width=0,height=0,scale=1,ox=0,oy=0,lastNode=null,layout=null;
 let vegetation=[],pickup=null; const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let camera={x:640,y:450},mini={x:24,y:650,w:132,h:93};
 function resize(){
  const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  mini={x:18,y:height-160,w:132,h:93};
 }
 function build(node){
  vegetation=[];layout=layoutFor(node);const t=themes[node.theme]||themes.garden;
  bg.clearRect(0,0,1280,900);bg.fillStyle=t.ground;bg.fillRect(0,0,1280,900);
  for(let i=0;i<25;i++)ellipse(bg,(i*193)%1280,(i*137)%900,100+(i%4)*20,65,t.floor+'55');
  rounded(bg,88,90,1104,745,110,t.floor);
  if(node.theme==='hill'){
   for(let i=0;i<4;i++){bg.beginPath();bg.moveTo(i*350-100,200);bg.lineTo(i*350+170,20);bg.lineTo(i*350+360,200);bg.fillStyle=i%2?'#8fa582':'#a5b491';bg.fill();}
  }
  if(node.theme==='water'){
   line(bg,[{x:0,y:690},{x:230,y:637},{x:470,y:698},{x:820,y:687},{x:1040,y:630},{x:1280,y:660}],'#8cae9d',92);
   line(bg,[{x:0,y:687},{x:230,y:634},{x:470,y:695},{x:820,y:684},{x:1040,y:627},{x:1280,y:657}],'#a3c6b8',76);
   for(let i=0;i<13;i++)line(bg,[{x:i*100,y:675+Math.sin(i)*20},{x:i*100+25,y:672+Math.sin(i)*20}],'#d2e5cd80',2);
  }
    for(const road of layout.roads){line(bg,road,'#80956c40',118);line(bg,road,t.road,108);line(bg,road,'#f7efd335',84);}
  for(let i=0;i<900;i++){
   const x=(i*193.7)%1280,y=(i*113.3)%900;
   if(walkable({x,y},layout,-12)){ellipse(bg,x,y,1+(i%3)*.5,.7,i%2?'#bca97b35':'#fff6d76a');}
  }
  if(node.theme==='water'){
   rounded(bg,583,659,114,91,5,'#b39b69');
   for(let y=665;y<747;y+=10)line(bg,[{x:586,y},{x:694,y}],'#d5c393',8);
   line(bg,[{x:581,y:655},{x:581,y:751}],'#8c7950',5);
   line(bg,[{x:699,y:655},{x:699,y:751}],'#8c7950',5);
   for(const x of [580,700])for(const y of [655,750])rounded(bg,x-4,y-12,8,18,3,'#8b7448');
  }
  for(let x=170;x<1170;x+=135)for(let y=315;y<800;y+=115){
   if([[-45,-25],[45,-25],[-45,25],[45,25],[0,0]].some(([dx,dy])=>walkable({x:x+dx,y:y+dy},layout,-20)))continue;
   rounded(bg,x-46,y-28,98,65,10,'#8a987a40');
   rounded(bg,x-50,y-35,98,63,8,'#aa8c60');
   rounded(bg,x-44,y-29,86,49,6,'#797b4c');
   for(let j=0;j<3;j++)for(let k=0;k<2;k++)vegetation.push({x:x-29+j*29,y:y-8+k*25,size:.72+((j*3+k+x)%5)*.07,kind:Math.floor(x/135+y/115+j)%6});
  }
  for(const [x,y,s] of [[100,310,1.6],[1150,335,1.5],[120,560,1.4],[1140,555,1.7],[205,790,1.3],[1050,855,1.2],[85,150,1.4],[1190,130,1.7],[350,80,1.1],[920,75,1.2]])tree(bg,x,y,s);
  if(node.theme==='glass'||node.theme==='court'){
   rounded(bg,126,95,1028,696,24,null,'#f5f6df88');bg.lineWidth=5;
   line(bg,[{x:125,y:790},{x:125,y:100},{x:640,y:36},{x:1155,y:100},{x:1155,y:790}],'#eff4df',8);
   line(bg,[{x:125,y:100},{x:640,y:155},{x:1155,y:100}],'#eff4dfaa',4);
   for(let i=0;i<5;i++){const x=225+i*200;line(bg,[{x,y:90},{x:x+80,y:735}],'#edf5d530',18);}
  }
  for(let i=0;i<75;i++){const x=(i*193+33)%1280,y=(i*107+41)%900;if(!walkable({x,y},layout,-10))ellipse(bg,x,y,2,1,'#7b99667a');}
  lastNode=node;
 }
 function drawGate(gate,state,time,hold){
  const exit=gate.exit,actual=exit.back?{...exit}:exit,locked=missingItems(state,actual).length>0;
  const {x,y}=gate;
  ellipse(ctx,x+7,y+10,58,15,'#36543b25');
  const glow=ctx.createRadialGradient(x,y-10,4,x,y-10,75);
  glow.addColorStop(0,locked?'#cfb37244':'#fff4bd90');glow.addColorStop(1,'#fff4bd00');ctx.fillStyle=glow;ctx.fillRect(x-80,y-90,160,170);
  rounded(ctx,x-48,y-80,9,92,3,'#96815b');rounded(ctx,x+39,y-80,9,92,3,'#96815b');
  rounded(ctx,x-56,y-88,112,15,5,'#baaa78');
  ctx.beginPath();ctx.moveTo(x-44,y-68);ctx.quadraticCurveTo(x,y-96,x+43,y-68);ctx.strokeStyle='#54744d';ctx.lineWidth=13;ctx.stroke();
  for(let i=0;i<7;i++)ellipse(ctx,x-39+i*13,y-71-Math.sin(i/6*Math.PI)*14,10,5,i%2?'#7e9a58':'#4a704a');
  if(locked){line(ctx,[{x:x-35,y:y-30},{x:x+35,y:y-30}],'#c09a5a',6);rounded(ctx,x-8,y-37,16,19,4,'#b88844');text(ctx,'•',x,y-21,15,'#f0e2b8');}
  else{line(ctx,[{x:x-10,y:y-4},{x,y:y-15},{x:x+10,y:y-4}],'#f8f4d7',3);}
  const labelY=exit.back?y-105:y+58;
  rounded(ctx,x-113,labelY-26,226,39,10,'#fbf7e9ed','#cbd3b8');ctx.lineWidth=1;
  text(ctx,exit.label,x,labelY,15,locked?'#88704c':'#36513d',650);
  text(ctx,locked?'نشان لازم است':'با عبور، این مسیر انتخاب می‌شود',x,labelY+31,10,'#5f7653');
  if(hold>0){ctx.beginPath();ctx.arc(x,y-8,33,-Math.PI/2,-Math.PI/2+Math.PI*2*hold);ctx.strokeStyle='#fbefb4';ctx.lineWidth=5;ctx.stroke();}
 }
 function drawObject(entry,state,time){
  const {x,y,object}=entry,seen=state.seen.includes(state.nodeId+':'+object.id);
  ellipse(ctx,x+6,y+6,29,10,'#314d3426');
  if(object.kind==='guide'){character(ctx,{x,y,facing:'down',moving:false},{shirt:'#779075',pants:'#4a5b45',hair:'#3b4235',skin:'#deb18e',bag:'#baaa7a',scarf:true},time,.9);}
  else{
   rounded(ctx,x-28,y-19,56,27,5,'#92744e');
   rounded(ctx,x-32,y-29,64,17,5,'#c5a577');
   rounded(ctx,x-24,y-12,6,26,2,'#8e7350');rounded(ctx,x+19,y-12,6,26,2,'#8e7350');
   rounded(ctx,x-14,y-42,28,21,3,'#f4edce');
   for(let i=0;i<3;i++)line(ctx,[{x:x-9,y:y-36+i*5},{x:x+8,y:y-36+i*5}],'#9ba78a',1.5);
   if(object.grant)ellipse(ctx,x+11,y-27,6,6,'#bf9051');
  }
  const bob=Math.sin(time*2+x)*3;
  ellipse(ctx,x,y-80+bob,16,16,seen?'#5e8055':'#f5e4a5');
  text(ctx,seen?'✓':object.grant?'✦':'؟',x,y-75+bob,17,seen?'#fff8dc':'#6e7045',700);
  rounded(ctx,x-78,y+25,156,30,8,'#f9f6e8df');text(ctx,object.name,x,y+45,12,'#526747');
 }
 function drawCart(node,time){
  const p=cartAt(node,time);if(!p)return;
  ellipse(ctx,p.x+5,p.y+9,30,10,'#344c3826');
  ellipse(ctx,p.x-19,p.y+4,6,8,'#56604c');ellipse(ctx,p.x+19,p.y+4,6,8,'#56604c');
  rounded(ctx,p.x-28,p.y-28,56,30,6,'#a58458');rounded(ctx,p.x-25,p.y-32,50,22,4,'#c0a16c');
  for(let i=0;i<3;i++)crop(ctx,p.x-15+i*15,p.y-28,.55);
  line(ctx,[{x:p.x+28,y:p.y-18},{x:p.x+39,y:p.y-25}],'#746b4d',4);
 }
 function minimap(player){
  rounded(ctx,mini.x,mini.y,mini.w,mini.h,12,'#f5f5e8d9','#d4dcc8');
  ctx.save();ctx.translate(mini.x+7,mini.y+8);ctx.scale((mini.w-14)/1280,(mini.h-20)/900);
  for(const road of layout.roads)line(ctx,road,'#9cab82',30);
  for(const g of layout.gates)ellipse(ctx,g.x,g.y,30,30,'#6c8955');
  ellipse(ctx,player.x,player.y,38,38,'#c0874c');ctx.restore();
  text(ctx,'نقشه راه · کلیک برای حرکت',mini.x+mini.w/2,mini.y+mini.h-4,8,'#657856');
 }
 function render({node,state,player,palette,time,dt=0,target=null,hold=null,mode='play',fade=0}){
  if(node!==lastNode)build(node);
  const t=themes[node.theme]||themes.garden;
  ctx.clearRect(0,0,width,height);ctx.fillStyle=t.sky;ctx.fillRect(0,0,width,height);
  const compact=width<960;
  scale=compact?.84:Math.min(width/1280,height/900)*.96;
  const desired=compact&&mode==='play'?{x:player.x,y:player.y-60}:{x:640,y:450};
  const smooth=Math.min(1,dt*6||1);camera.x+=(desired.x-camera.x)*smooth;camera.y+=(desired.y-camera.y)*smooth;
  ox=width/2-camera.x*scale;oy=height*.53-camera.y*scale;
  if(mode==='menu'&&width>960){scale=Math.min(width/1280,height/900)*.94;ox=width*.38-640*scale;oy=height*.54-450*scale;}
  ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.drawImage(cache,0,0);
  const visualTime=reduced.matches?0:time;
  for(const v of vegetation)plant(ctx,v.x,v.y,v.size,v.kind,visualTime);
  livingDetails(ctx,node,visualTime);
  if(player.moving&&!reduced.matches){for(let i=0;i<4;i++){const phase=(time*2.8+i/4)%1;ellipse(ctx,player.x+Math.sin(i*7)*10,player.y+10+phase*12,2+phase*3,1+phase*2,'rgba(245,232,196,'+(.3*(1-phase))+')');}}
  if(target){ellipse(ctx,target.x,target.y,15+Math.sin(time*5)*3,7,'#f9efc788');ellipse(ctx,target.x,target.y,4,3,'#688c54');}
  for(const g of layout.gates)drawGate(g,state,time,hold?.id===g.exit.id?hold.progress:0);
  const drawables=layout.objects.map(o=>({y:o.y,draw:()=>drawObject(o,state,time)}));
  drawables.push({y:player.y,draw:()=>character(ctx,{...player,collecting:pickup?Math.min(1,pickup.elapsed/1.15):0},palette,time)});
  const cart=cartAt(node,time);if(cart)drawables.push({y:cart.y,draw:()=>drawCart(node,time)});
  drawables.sort((a,b)=>a.y-b.y).forEach(d=>d.draw());
  if(pickup){
   pickup.elapsed+=dt;const u=Math.min(1,pickup.elapsed/1.15),ease=1-(1-u)**3;
   const x=pickup.x+(player.x+17-pickup.x)*ease,y=pickup.y+(player.y-13-pickup.y)*ease-Math.sin(u*Math.PI)*88;
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(u*Math.PI)*.4);const k=reduced.matches?1:1+Math.sin(u*Math.PI)*.6;ctx.scale(k,k);
   ctx.shadowColor='#fff0ad';ctx.shadowBlur=25;rounded(ctx,-12,-18,24,30,4,'#fff5d5','#b79857');ctx.shadowBlur=0;
   for(let j=0;j<3;j++)line(ctx,[{x:-7,y:-10+j*6},{x:7,y:-10+j*6}],'#8a9f7c',1.5);ellipse(ctx,6,6,4,4,'#d2a25c');ctx.restore();
   for(let j=0;j<12;j++){const a=j*Math.PI/6,r=16+u*34;ellipse(ctx,player.x+17+Math.cos(a)*r,player.y-13+Math.sin(a)*r,2,2,'rgba(255,232,151,'+(1-u)+')');}
   if(u>=1)pickup=null;
  }
  for(let i=0;i<10;i++){const x=(i*173+time*8)%1280,y=170+(i*139)%620+Math.sin(time+i)*7;ellipse(ctx,x,y,2.2,2.2,'#fff3b8aa');}
  if(state.ending){
   if(state.ending==='bloom'||state.ending==='keeper'||state.ending==='recovered'){for(let i=0;i<32;i++)crop(ctx,220+(i*97)%850,220+(i*137)%550,.8,true);}
   else{ctx.fillStyle='#58667035';ctx.fillRect(0,0,1280,900);}
  }
  ctx.restore();
  const shade=ctx.createRadialGradient(width*.48,height*.45,height*.2,width*.48,height*.45,height*.9);
  shade.addColorStop(0,'#123b2700');shade.addColorStop(1,'#23432a18');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
  if(mode==='play')minimap(player);
  if(fade){ctx.fillStyle='rgba(235,238,218,'+fade+')';ctx.fillRect(0,0,width,height);}
 }
 function toWorld(x,y){
  if(x>=mini.x&&x<=mini.x+mini.w&&y>=mini.y&&y<=mini.y+mini.h)return {x:(x-mini.x-7)/(mini.w-14)*1280,y:(y-mini.y-8)/(mini.h-20)*900,minimap:true};
  return {x:(x-ox)/scale,y:(y-oy)/scale};
 }
 function resetCamera(p=START_FOCUS){camera=width<960?{...p}:{x:640,y:450};}
 const START_FOCUS={x:640,y:730};
 resize();
 return {resize,render,toWorld,resetCamera,collect:entry=>{pickup={x:entry.x,y:entry.y-35,elapsed:0};},getLayout:()=>layout};
}
