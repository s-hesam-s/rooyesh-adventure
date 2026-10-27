const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*t*(t*(t*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*t;
const v=(a,b,t)=>a.map((n,i)=>mix(n,b[i],t));
export const documentHandlingDuration=4.9;
export const documentHandlingEvents=[{at:.58,phase:'grab'},{at:3.1,phase:'insert'},{at:4.05,phase:'zip'},{at:4.68,phase:'done'}];
const frames=[
 {at:0,doc:[0,-.3,-1.45],left:[-.29,-.67,-.66],right:[.29,-.67,-.66],lg:.15,rg:.15,bag:0,open:0,zip:0},
 {at:.6,doc:[0,-.18,-1.3],left:[-.27,-.42,-.96],right:[.3,-.34,-.99],lg:.55,rg:.65,bag:0,open:0,zip:0},
 {at:1.25,doc:[0,-.1,-1.3],left:[-.33,-.3,-1.0],right:[.33,-.3,-1.0],lg:.8,rg:.8,bag:0,open:0,zip:0},
 {at:1.95,doc:[0,-.1,-1.3],left:[-.33,-.3,-1.0],right:[.33,-.3,-1.0],lg:.8,rg:.8,bag:0,open:0,zip:0},
 {at:2.35,doc:[.12,-.1,-1.34],left:[.49,-.54,-1.12],right:[.43,-.28,-1.05],lg:.3,rg:.8,bag:1,open:.15,zip:0},
 {at:2.85,doc:[.12,-.15,-1.36],left:[-.52,-.55,-1.13],right:[.43,-.3,-1.07],lg:.4,rg:.8,bag:1,open:1,zip:1},
 {at:3.65,doc:[.12,-.96,-1.41],left:[-.5,-.56,-1.12],right:[.43,-.66,-1.05],lg:.4,rg:.7,bag:1,open:1,zip:1},
 {at:3.95,doc:[.12,-1.04,-1.41],left:[-.49,-.55,-1.12],right:[-.49,-.49,-1.09],lg:.3,rg:.15,bag:1,open:.3,zip:1},
 {at:4.45,doc:[.12,-1.04,-1.41],left:[-.45,-.59,-.95],right:[.5,-.51,-1.09],lg:.2,rg:.3,bag:1,open:0,zip:0},
 {at:4.9,doc:[.12,-1.04,-1.41],left:[-.29,-.67,-.66],right:[.29,-.67,-.66],lg:.15,rg:.15,bag:0,open:0,zip:0}
];
export function documentHandlingPose(elapsed,reduced=false){
 const time=Math.max(0,elapsed);
 if(reduced)return {lift:time>=.12?1:0,document:{position:[0,-.12,-1.35],rotation:[0,0,0]},documentVisible:time<.7,left:{position:[-.3,-.5,-.8],rotation:[.1,0,-.2],grip:.2},right:{position:[.3,-.5,-.8],rotation:[.1,0,.2],grip:.2},bag:{visible:false,position:[0,-2,-1.4],open:0,zip:0},complete:time>=.9};
 let i=0;while(i<frames.length-2&&time>frames[i+1].at)i++;
 const a=frames[i],b=frames[i+1],t=smooth((time-a.at)/(b.at-a.at)),blend=key=>mix(a[key],b[key],t),insert=smooth((time-2.85)/.8);
 return {
  lift:smooth((time-.25)/1),document:{position:v(a.doc,b.doc,t),rotation:[mix(.06,.13,insert),mix(-.05,.09,insert),mix(-.025,.04,insert)]},
  documentVisible:time<3.74,
  left:{position:v(a.left,b.left,t),rotation:[1.05,-.28,-.2],grip:blend('lg')},
  right:{position:v(a.right,b.right,t),rotation:[1.05-insert*.65,.28,.2],grip:blend('rg')},
  bag:{visible:blend('bag')>.001,position:[0,-1.95+blend('bag')*1.03,-1.4],open:blend('open'),zip:blend('zip')},
  complete:time>=documentHandlingDuration
 };
}
export function documentHandlingCues(before,after,reduced=false){
 const scale=reduced?.9/documentHandlingDuration:1;
 return documentHandlingEvents.filter(e=>before<e.at*scale&&after>=e.at*scale).map(e=>e.phase);
}