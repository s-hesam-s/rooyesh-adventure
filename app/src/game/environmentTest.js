import {nodes,challenges} from '../content/campaign.js';
import {newJourney,interact,travel,obligationsAct} from './campaignState.js';
const authoredFlags=['archiveRoom','calendarRoom','workshopRoom','canalRoom','postalRoom','atriumRoom','receptionRoom','orchardRoom','paymentRoom','bankRoom','auditRoom'];
export const testEnvironments=challenges.filter(c=>authoredFlags.some(flag=>nodes[c.id].scene[flag])).map(c=>({id:c.id,name:nodes[c.id].scene.name}));
export function createEnvironmentTestJourney(target,id=globalThis.crypto.randomUUID()){
 if(target==='ceremony'){
  let state=createEnvironmentTestJourney('schedule',id);
  for(const [action,value] of [
   ['open-cabinet'],['take-contract'],['pickup-finish'],['place-contract'],['open-contract'],
   ['schedule',{annual:24,interval:3,duration:12,count:4,amount:60}],['print-finish'],
   ['take-plan'],['dock-plan'],['calendar'],['calendar-finish'],['receive-finish'],
   ['take-bank'],['load'],['scan'],['scan-finish'],['unload'],
   ['payment',{installment:1,amount:60,success:'yes'}],['open-ceremony-door'],['door-finish']
  ])state=obligationsAct(state,action,value);
  return state;
 }
 if(target!=='schedule'&&target!=='legalIdentity'&&!testEnvironments.some(e=>e.id===target))throw new Error('این محیط هنوز برای تست مستقیم آماده نشده است.');
 let state=newJourney('manager',id);
 for(let i=0;i<challenges.length;i++){
  if(state.nodeId===target)return state;
  const challenge=challenges.find(c=>c.id===state.nodeId),choice=challenge?.choices.findIndex(c=>c.correct);
  if(choice===undefined||choice<0)throw new Error('پیش‌نیاز معتبر محیط پیدا نشد.');
  state=travel(interact(state,'evidence'),'route-'+choice);
 }
 throw new Error('محیط انتخاب‌شده در مسیر داستان پیدا نشد.');
}
export function createEnvironmentTestSession(){
 let active=false;
 return {get active(){return active;},enter(target,id){const state=createEnvironmentTestJourney(target,id);active=true;return state;},leave(){active=false;},persist(action){if(active)return false;action();return true;}};
}
