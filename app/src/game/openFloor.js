/* The same geometry data drives collision and visible archive barriers. World units are decimetric scene units, not pixels. */
const point=(x,z)=>({x:x*10+640,y:z*10+450});
const rectangle=(x,z,halfX,halfZ)=>({minX:(x-halfX)*10+640,maxX:(x+halfX)*10+640,minY:(z-halfZ)*10+450,maxY:(z+halfZ)*10+450});
export function archiveFloorPlan(objects=[],gates=[]){
 const areas=[{minX:100,maxX:1180,minY:100,maxY:845},{minX:560,maxX:720,minY:820,maxY:880}];
 const barriers=[],reserved=[],solids=[];
 const edge=(a,b)=>barriers.push({a:point(...a),b:point(...b),radius:2.5});
 edge([-54,-35],[54,-35]);edge([-54,-35],[-54,39.5]);edge([54,-35],[54,39.5]);
 edge([-54,39.5],[-8,39.5]);edge([8,39.5],[54,39.5]);
 // Freestanding stacks are visibly reserved, rather than inaccessible patches of floor.
 for(const [x,z] of [[-34,30],[34,30],[-16,8],[16,8]]){
  const left=x-7.4,right=x+7.4,back=z-2,front=z+3.8;
  edge([left,back],[right,back]);edge([left,front],[right,front]);edge([left,back],[left,front]);edge([right,back],[right,front]);
  reserved.push(rectangle(x,z+.9,7.4,2.9));
 }
 for(const x of [-47,47])solids.push(rectangle(x,-6,5,2));
 for(const x of [-48,48])solids.push(rectangle(x,35,2.2,2.2));
 // The partition and door leaves are visible architectural collisions.
 if(gates.length){const edges=[100,...gates.flatMap(g=>[g.x-46,g.x+46]),1180].sort((a,b)=>a-b);for(let i=0;i<edges.length;i+=2)solids.push({minX:edges[i],maxX:edges[i+1],minY:185,maxY:195});for(const g of gates){solids.push({minX:g.x-44,maxX:g.x+44,minY:g.y-2,maxY:g.y+2});if(g.y<190)for(const side of [-1,1])solids.push({minX:g.x+side*49-5,maxX:g.x+side*49+5,minY:g.y,maxY:190});}}
 // A closed timber entrance door visibly terminates the short entrance vestibule.
 solids.push({minX:550,maxX:730,minY:875,maxY:897});
 for(const object of objects)if(object.object?.kind!=='wayfinding')solids.push({minX:object.x-34,maxX:object.x+34,minY:object.y-20,maxY:object.y+20});
 return {kind:'open-room',areas,barriers,reserved,solids};
}
export function insideRectangle(p,r,margin=0){return p.x>=r.minX-margin&&p.x<=r.maxX+margin&&p.y>=r.minY-margin&&p.y<=r.maxY+margin;}
export function segmentDistanceSquared(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
 return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
}
export function insidePolygon(p,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function openFloorWalkable(p,plan,margin=0){
 const clearance=Math.max(0,margin);
 if(plan.boundary&&(!insidePolygon(p,plan.boundary)||plan.boundary.some((a,i)=>segmentDistanceSquared(p,a,plan.boundary[(i+1)%plan.boundary.length])<(clearance+(plan.boundaryMargin||0))**2)))return false;
 if(plan.blockedPolygons?.some(polygon=>insidePolygon(p,polygon)||polygon.some((a,i)=>segmentDistanceSquared(p,a,polygon[(i+1)%polygon.length])<=clearance**2)))return false;
 if(!plan.areas.some(a=>insideRectangle(p,a,-clearance)))return false;
 if([...plan.reserved,...plan.solids].some(r=>insideRectangle(p,r,clearance)))return false;
 return !plan.barriers.some(b=>segmentDistanceSquared(p,b.a,b.b)<=(b.radius+clearance)**2);
}