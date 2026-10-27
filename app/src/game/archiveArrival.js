// Return through the selected side-room door, rather than restarting at the building entrance.
export function archiveArrival(state,layout){
 const previous=state.events?.findLast(e=>e.kind==='travel');
 if(state.nodeId==='receiptCheck'&&/^repair-receiptCheck-(0|1)$/.test(previous?.node||'')){const gate=layout.gates.find(g=>g.exit.id==='route-'+previous.node.at(-1));return {position:{x:gate.x-gate.travelDirection.x*52,y:gate.y-gate.travelDirection.y*52},yaw:gate.travelYaw+Math.PI};}
 if(state.nodeId==='verifyBank'&&/^repair-verifyBank-(0|2)$/.test(previous?.node||'')){const gate=layout.gates.find(g=>g.exit.id==='route-'+previous.node.at(-1));return {position:{x:gate.x-gate.travelDirection.x*52,y:gate.y-gate.travelDirection.y*52},yaw:gate.travelYaw+Math.PI};}
 if(state.nodeId==='gateway'&&/^repair-gateway-(1|2)$/.test(previous?.node||'')){const gate=layout.gates.find(g=>g.exit.id==='route-'+previous.node.at(-1));return {position:{x:gate.x-gate.travelDirection.x*52,y:gate.y-gate.travelDirection.y*52},yaw:gate.travelYaw+Math.PI};}
 if((state.nodeId==='naturalSlip'&&/^repair-naturalSlip-(0|1)$/.test(previous?.node||''))||(state.nodeId==='naturalIdentity'&&/^repair-naturalIdentity-(1|2)$/.test(previous?.node||''))||(state.nodeId==='publish'&&/^repair-publish-(0|2)$/.test(previous?.node||''))||(state.nodeId==='ownerSend'&&/^repair-ownerSend-(1|2)$/.test(previous?.node||''))||(state.nodeId==='ownerAmount'&&/^repair-ownerAmount-(0|2)$/.test(previous?.node||''))||(state.nodeId==='ownerIdentity'&&/^repair-ownerIdentity-(0|1)$/.test(previous?.node||''))||(state.nodeId==='project'&&/^repair-project-(0|2)$/.test(previous?.node||''))||(state.nodeId==='window'&&/^repair-window-(1|2)$/.test(previous?.node||''))){
  const choice=Number(previous.node.at(-1)),gate=layout.gates.find(g=>g.exit.id==='route-'+choice);
  return {position:{x:gate.x,y:gate.y+52},yaw:Math.PI};
 }
 return {position:layout.spawn,yaw:layout.entryYaw||0};
}
