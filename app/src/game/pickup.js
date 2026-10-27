import {documentHandlingDuration,documentHandlingPose,documentHandlingCues} from './documentHandling.js';
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
export const pickupDuration=(reduced,style='legacy')=>style==='archive'?(reduced?.9:documentHandlingDuration):(reduced?.9:2.9);
export const pickupEvents=Object.freeze([{at:.48,phase:'grab'},{at:1.72,phase:'insert'},{at:2.32,phase:'zip'},{at:2.72,phase:'done'}]);
export function pickupCuesBetween(before,after,reduced=false,style='legacy'){if(style==='archive')return documentHandlingCues(before,after,reduced);const scale=pickupDuration(reduced)/2.9;return pickupEvents.filter(e=>before<e.at*scale&&after>=e.at*scale).map(e=>e.phase);}
export function pickupPose(elapsed,reduced=false,style='legacy'){if(style==='archive')return documentHandlingPose(elapsed,reduced);
 const t=Math.max(0,elapsed)*2.9/pickupDuration(reduced),lift=smooth((t-.4)/.65),insert=smooth((t-1.65)/.65),release=smooth((t-2.35)/.45);
 return {lift:reduced?(t>=.4?1:0):lift,insert:reduced?0:insert,reach:reduced?0:smooth(t/.6)*(1-release),grip:reduced?0:smooth((t-.45)/.2)*(1-release),bag:reduced?0:smooth((t-1.45)/.25)*(1-smooth((t-2.55)/.3)),open:reduced?0:smooth((t-1.5)/.25)*(1-smooth((t-2.3)/.4)),zip:smooth((t-2.32)/.3),zipHand:reduced?0:smooth((t-2.15)/.18)*(1-smooth((t-2.64)/.2)),documentVisible:t<2.27,complete:elapsed>=pickupDuration(reduced)};
}
export function pickupSound(phase,kind){
 if(phase==='grab')return {type:'noise',frequency:kind==='seal'?950:kind==='badge'?2600:1800,endFrequency:1400,duration:.18,gain:.09,pan:0};
 if(phase==='insert')return {type:'noise',frequency:650,endFrequency:420,duration:.23,gain:.1,pan:.5};
 if(phase==='zip')return {type:'noise',frequency:1700,endFrequency:3800,duration:.29,gain:.09,pan:.6};
 return {type:'tone',frequency:660,endFrequency:880,duration:.13,gain:.035,pan:.4};
}
