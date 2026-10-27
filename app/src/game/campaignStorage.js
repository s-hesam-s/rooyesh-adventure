import {restoreJourney} from './campaignState.js';
const layoutVersion=(id,office)=>office&&!office.done?101:id==='receiptCheck'||/^repair-receiptCheck-(0|1)$/.test(id)?2:id==='verifyBank'||/^repair-verifyBank-(0|2)$/.test(id)?2:id==='gateway'||/^repair-gateway-(1|2)$/.test(id)?2:id==='naturalSlip'||/^repair-naturalSlip-(0|1)$/.test(id)?4:id==='naturalIdentity'||/^repair-naturalIdentity-(1|2)$/.test(id)?2:id==='publish'||/^repair-publish-(0|2)$/.test(id)?2:id==='ownerSend'||/^repair-ownerSend-(1|2)$/.test(id)?2:id==='ownerAmount'||/^repair-ownerAmount-(0|2)$/.test(id)?2:id==='ownerIdentity'||/^repair-ownerIdentity-(0|1)$/.test(id)?2:id==='window'||/^repair-window-(1|2)$/.test(id)?2:id==='project'?4:/^repair-project-(0|2)$/.test(id)?3:1;
export const KEY='rooyesh.campaign.v3';
export function readSave(storage){
 try{
  const raw=storage.getItem(KEY);
  if(!raw)return {state:null,position:null,error:storage.getItem('rooyesh.adventure.v2')?'ذخیره فصل قدیمی محفوظ است؛ داستان تازه از پرونده طرح آغاز می‌شود.':null};
  const parsed=JSON.parse(raw),p=parsed.position,state=restoreJourney(parsed.state);
  return {state,position:p&&p.layout===layoutVersion(state.nodeId,state.office)&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:p.x,y:p.y}:null};
 }catch{return {state:null,position:null,error:'ذخیره این فصل قابل بازسازی نیست. ذخیره قبلی حذف نشده؛ می‌توانی داستان تازه‌ای شروع کنی.'};}
}
export function writeSave(storage,state,position){
 try{storage.setItem(KEY,JSON.stringify({state,position:{x:position.x,y:position.y,layout:layoutVersion(state.nodeId,state.office)}}));return true;}catch{return false;}
}