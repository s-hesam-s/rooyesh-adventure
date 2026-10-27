import {openFloorWalkable} from './openFloor.js';
import {missionLayout} from '../content/missionScenes.js';
export const WORLD={width:1280,height:900};
export const START={x:640,y:790};
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
export function segmentDistance(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
 const t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
const point=(x,y)=>({x,y});
import {officeLayout} from './officeRoom.js';
export function layoutFor(node){
 if(node.scene?.officeRoom)return officeLayout();
 if(node.scene)return missionLayout(node);
 const count=node.exits?.length||2;
 const targets=count===3?[point(240,190),point(640,145),point(1040,190)]:[point(320,190),point(960,190)];
 const hub=point(640,455);
 const roads=[[point(640,830),hub]];
 const gates=(node.exits||[]).map((exit,i)=>{
  const p=targets[i];
  roads.push([hub,point((640+p.x)/2,365),point(p.x,285),p]);
  return {...p,exit};
 });
 const objects=(node.objects||[]).map((object,i)=>({...point(i%2===0?440:840,600),object}));
 const aisle=node.theme==='water'?625:660;for(const o of objects)roads.push([point(640,aisle),point(o.x,aisle),o]);
 if(node.back){const p=point(1080,785);roads.push([point(640,710),point(920,785),p]);gates.push({...p,exit:{id:'back',label:'دفتر هویت',back:true}});}
 return {roads,gates,objects,hub};
}
export function walkable(p,layout,margin=0){
 if(layout.floorPlan)return openFloorWalkable(p,layout.floorPlan,margin);
 if(p.x<60||p.y<80||p.x>1220||p.y>855)return false;
 return layout.roads.some(road=>road.some((a,i)=>i>0&&segmentDistance(p,road[i-1],a)<=54-margin));
}
export function movePlayer(player,dx,dy,dt,layout,speed=235){
 const magnitude=Math.hypot(dx,dy);
 if(!magnitude)return {...player,moving:false};
 const step=Math.min(dt,.05)*speed;
 const nx=dx/magnitude,ny=dy/magnitude;
 let {x,y}=player;
 if(walkable({x:x+nx*step,y},layout,10))x+=nx*step;
 if(walkable({x,y:y+ny*step},layout,10))y+=ny*step;
 return {...player,x,y,moving:distance(player,{x,y})>.01,facing:Math.abs(nx)>Math.abs(ny)?(nx>0?'right':'left'):(ny>0?'down':'up')};
}
export function nearestWalkable(target,layout){
 const entrance=layout.floorPlan&&layout.gates.find(g=>g.approach&&distance(g,target)<1);if(entrance&&walkable(entrance.approach,layout,12))return entrance.approach;
 if(walkable(target,layout,12))return target;
 for(let radius=10;radius<=130;radius+=10)for(let a=0;a<Math.PI*2;a+=Math.PI/16){
  const p={x:target.x+Math.cos(a)*radius,y:target.y+Math.sin(a)*radius};
  if(walkable(p,layout,12))return p;
 }
 return null;
}
export function findPath(start,target,layout){
 const destination=nearestWalkable(target,layout);
 if(!destination)return [];
 const size=20,cols=65,rows=46,key=(x,y)=>y*cols+x;
 const toCell=p=>({x:Math.round(p.x/size),y:Math.round(p.y/size)});
 const valid=(x,y)=>x>=0&&y>=0&&x<cols&&y<rows&&walkable({x:x*size,y:y*size},layout,12);
 const a=toCell(start),b=toCell(destination);
 if(!valid(a.x,a.y)||!valid(b.x,b.y))return [];
 const startKey=key(a.x,a.y),endKey=key(b.x,b.y),open=[startKey],parents=new Map(),cost=new Map([[startKey,0]]),closed=new Set();
 while(open.length){
  open.sort((u,v)=>(cost.get(u)+Math.hypot(u%cols-b.x,Math.floor(u/cols)-b.y))-(cost.get(v)+Math.hypot(v%cols-b.x,Math.floor(v/cols)-b.y)));
  const current=open.shift();if(current===endKey){
   const route=[];let c=current;
   while(c!==startKey){route.unshift({x:(c%cols)*size,y:Math.floor(c/cols)*size});c=parents.get(c);}
   return [...route,destination];
  }
  closed.add(current);const x=current%cols,y=Math.floor(current/cols);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const xx=x+dx,yy=y+dy,next=key(xx,yy);
   if(!valid(xx,yy)||closed.has(next)||(dx&&dy&&(!valid(x+dx,y)||!valid(x,y+dy))))continue;
   const nextCost=cost.get(current)+Math.hypot(dx,dy);
   if(nextCost<(cost.get(next)??Infinity)){cost.set(next,nextCost);parents.set(next,current);if(!open.includes(next))open.push(next);}
  }
 }
 return [];
}
export function cartAt(node,time){if(node.scene)return null;return node.theme==='water'?{x:640,y:700+Math.sin(time*.52)*34}:node.theme==='court'?{x:640+Math.sin(time*.52)*210,y:707}:null;}

export function pushAway(player,obstacle,layout){
 const direction=player.y>=obstacle.y?1:-1;
 const candidates=[{...player,y:player.y+direction*55},{...player,x:player.x+55},{...player,x:player.x-55}];
 return candidates.find(p=>walkable(p,layout,10)&&distance(p,obstacle)>45)||player;
}