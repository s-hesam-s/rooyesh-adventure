const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return clamp(t*t*t*(t*(t*6-15)+10));};
export function doorJourneyTiming(reduced=false){return reduced?{walk:.15,fade:.25,swap:.5,end:.9}:{walk:1.75,fade:2.55,swap:2.95,end:3.4};}
export function doorJourneyPose(elapsed,reduced=false){
 const t=Math.max(0,elapsed),timing=doorJourneyTiming(reduced),open=reduced?(t>=.1?1:0):ease((t-.55)/1.05),approach=reduced?0:ease(t/.48),walk=reduced?0:ease((t-timing.walk)/.78),reach=reduced?0:ease(t/.38)*(1-ease((t-.85)/.55));
 const fade=t<timing.swap?ease((t-timing.fade)/(timing.swap-timing.fade)):1-ease((t-timing.swap)/(timing.end-timing.swap));
 return {open,handle:reduced?0:ease((t-.28)/.24)*(1-ease((t-.85)/.35)),approach,walk,fade,complete:t>=timing.end,
 hands:{left:{position:[-.29,-.67,-.66],rotation:[.15,-.12,-.17],grip:.18},right:{position:[.29+reach*.27,-.67+reach*.17,-.66-reach*.2],rotation:[.15,.12,.17],grip:.18+reach*.4},bag:{visible:false,position:[0,-2,-1.4],open:0,zip:0}}};
}
export function doorJourneyPosition(start,gate,elapsed,reduced=false){const p=doorJourneyPose(elapsed,reduced);if(reduced)return {...start,moving:false};const direction=gate.travelDirection||{x:0,y:-1};return {x:start.x+(gate.x-direction.x*15-start.x)*p.approach+direction.x*p.walk*58,y:start.y+(gate.y-direction.y*15-start.y)*p.approach+direction.y*p.walk*58,facing:direction.y>0?'down':'up',moving:p.walk>0&&p.walk<1};}
export function doorJourneyCues(before,after,reduced=false){const events=reduced?[]:[{at:.34,phase:'latch'},{at:.62,phase:'swing'},{at:1.95,phase:'step'},{at:2.3,phase:'step'}];return events.filter(e=>before<e.at&&after>=e.at).map(e=>e.phase);}
