import {withinInteractionAccess} from './interactionAccess.js';
import {movePlayer} from './world.js';
export function relativeMovement(strafe,forward,yaw){return {dx:Math.cos(yaw)*strafe+Math.sin(yaw)*forward,dy:-Math.sin(yaw)*strafe+Math.cos(yaw)*forward};}
export function clampPitch(value){return Math.max(-1.25,Math.min(1.25,value));}
export function canInspectFrom(player,object,yaw){const access=withinInteractionAccess(player,object,yaw);if(access!==null)return access;const x=object.x-player.x,z=object.y-player.y,d=Math.hypot(x,z);return d<65&&(d<12||(-Math.sin(yaw)*x-Math.cos(yaw)*z)/d>.7);}export function avoidTables(previous,next,objects){
 const blocked=p=>objects.some(o=>!o.object?.office&&o.object?.kind!=='wayfinding'&&Math.abs(p.x-o.x)<30&&Math.abs(p.y-o.y)<22);
 if(!blocked(next))return next;
 const horizontal={...next,y:previous.y};if(!blocked(horizontal))return horizontal;
 const vertical={...next,x:previous.x};if(!blocked(vertical))return vertical;
 return {...previous,moving:false};
}
export const walkingSpeed=140;
export function advanceFirstPerson(player,dx,dy,elapsed,layout){
 const dt=Math.min(.15,Math.max(0,elapsed)),steps=Math.max(1,Math.ceil(dt*120));let next=player;
 for(let i=0;i<steps;i++){const previous=next;next=avoidTables(previous,movePlayer(previous,dx,dy,dt/steps,layout,walkingSpeed),layout.objects);}
 return {...next,moving:Math.hypot(next.x-player.x,next.y-player.y)>.001};
}