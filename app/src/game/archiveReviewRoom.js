// Separate, single-entry archive rooms: 64 x 64, approximately one third of the 132 x 94 hall.
export function archiveReviewFurniture(variant){
 const shelves=variant===0?
  [{x:-20,z:-21},{x:0,z:-21},{x:20,z:-21},{x:-29,z:1,rotation:Math.PI/2},{x:29,z:22,rotation:-Math.PI/2}]:
  [{x:-20,z:-21},{x:20,z:-21},{x:-29,z:20,rotation:Math.PI/2},{x:29,z:2,rotation:-Math.PI/2}];
 return {shelves,tables:variant===0?[{x:-11,z:-8,w:10,d:5},{x:14,z:-8,w:7,d:5}]:[{x:-12,z:-9,w:7,d:7},{x:11,z:-8,w:11,d:4}],cabinets:variant===0?[]:[{x:0,z:-21,w:7,d:4},{x:28,z:29,w:4,d:7}]};
}
export function archiveReviewLayout(node){
 const p=node.scene,objects=node.objects.map((object,i)=>({...p.stations[i],object}));
 // The legacy briefing action remains replayable in old saves, but has no second physical door.
 const exit=node.exits.find(e=>e.id==='retry'),gates=[{x:640,y:850,approach:{x:640,y:826},travelYaw:Math.PI,travelDirection:{x:0,y:1},exit}];
 const hub={x:640,y:700},roads=[[p.entry,hub]];
 for(const o of objects)roads.push([hub,{x:o.x,y:700},o]);
 roads.push([hub,gates[0]]);
 const rect=(x,z,w,d)=>({minX:640+(x-w/2)*10,maxX:640+(x+w/2)*10,minY:450+(z-d/2)*10,maxY:450+(z+d/2)*10});
 const furniture=archiveReviewFurniture(p.archiveVariant),solids=[],barriers=[],reserved=[];
 for(const s of furniture.shelves)reserved.push(rect(s.x,s.z,s.rotation?6:12,s.rotation?12:6));
 for(const c of furniture.cabinets)solids.push(rect(c.x,c.z,c.w,c.d));
 for(const t of furniture.tables){
  reserved.push(rect(t.x,t.z,t.w+2,t.d+2));
  const x=t.x-t.w/2-1,xx=t.x+t.w/2+1,z=t.z-t.d/2-1,zz=t.z+t.d/2+1;
  for(const [a,b]of [[[x,z],[xx,z]],[[xx,z],[xx,zz]],[[xx,zz],[x,zz]],[[x,zz],[x,z]]])barriers.push({a:{x:640+a[0]*10,y:450+a[1]*10},b:{x:640+b[0]*10,y:450+b[1]*10},radius:2.5});
 }
 solids.push(rect(-32,8,1,64),rect(32,8,1,64),rect(0,-24,64,1));
 solids.push({minX:320,maxX:594,minY:845,maxY:855},{minX:686,maxX:960,minY:845,maxY:855},{minX:596,maxX:684,minY:848,maxY:852});
 for(const o of objects)solids.push({minX:o.x-34,maxX:o.x+34,minY:o.y-20,maxY:o.y+20});
 return {roads,gates,objects,hub,spawn:p.entry,entryYaw:0,sceneId:p.id,floorPlan:{kind:'open-room',areas:[{minX:320,maxX:960,minY:210,maxY:870}],barriers,reserved,solids},furniture};
}
