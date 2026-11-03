export const roleExchanges={
 office:{from:'manager',to:'owner',recipient:'nader',duration:4.8,target:{x:5,z:14.2,yaw:Math.PI},source:{x:5,z:20.7,yaw:0},tray:{x:5,y:2.48,z:16.3}},
 issuer:{from:'owner',to:'manager',recipient:'sara',duration:4.8,target:{x:26.5,z:9.2,yaw:Math.PI},source:{x:26.5,z:15.8,yaw:0},tray:{x:26.5,y:2.76,z:11.1}}
};
export function exchangeOrigin(value,environment){const fallback=roleExchanges[environment].source;if(value===undefined)return {...fallback};if(!value||!['x','z','yaw'].every(k=>Number.isFinite(value[k]))||Math.abs(value.x)>40||Math.abs(value.z)>40||Math.abs(value.yaw)>1000)throw Error('محل تحویل معتبر نیست.');return {x:value.x,z:value.z,yaw:value.yaw};}
const smooth=t=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
export function exchangePose(environment,elapsed,origin,reduced=false){const c=roleExchanges[environment],p=Math.max(0,Math.min(1,elapsed/c.duration)),source=origin||c.source,move=smooth((p-.58)/.42),travel=reduced?(p>=.9?1:0):move,side={x:Math.max(source.x,c.target.x)+4,z:(source.z+c.target.z)/2},x=(1-travel)**2*source.x+2*(1-travel)*travel*side.x+travel**2*c.target.x,z=(1-travel)**2*source.z+2*(1-travel)*travel*side.z+travel**2*c.target.z,yaw=source.yaw+Math.atan2(Math.sin(c.target.yaw-source.yaw),Math.cos(c.target.yaw-source.yaw))*travel;
 return {progress:p,receive:reduced?(p>=.25&&p<.75?1:0):Math.sin(smooth((p-.08)/.57)*Math.PI),transfer:smooth((p-.1)/.38),settle:smooth((p-.48)/.1),move:travel,camera:{pitch:-.08-.18*travel,x,y:4.8+(reduced?0:Math.sin(travel*Math.PI)*.3),z,yaw},sourceVisible:travel>.22,targetVisible:travel<.96};
}
