import {officeAction as applyOfficeAction} from './officeWorkflow.js';
import {nodes,items,challenges,chapters,project,endings} from '../content/campaign.js';
export const VERSION=3;
const requireRule=(valid,message)=>{if(!valid)throw new Error(message);};
const clone=value=>structuredClone(value);
export const requiredOwnerAmount=total=>Math.ceil(total*10_000_000/10)/10_000_000+project.extra;
export const availableAmount=ledger=>project.total-ledger.payments.filter(p=>p.status!=='cancelled').reduce((sum,p)=>sum+p.amount,0);
export function assessInvestment(ledger,{id,type,amount,budget=Infinity}){
 const identity=ledger.identities[id];
 requireRule(ledger.published&&ledger.ownerSent&&ledger.status===5&&project.today>=ledger.start&&project.today<=ledger.end,'طرح هنوز برای مشارکت عمومی باز نیست.');
 requireRule(identity?.type===type&&identity.sejam&&identity.bank&&identity.bourse&&id!==project.ownerId,'هویت، نوع سرمایه‌گذار یا اطلاعات سجام و بانکی معتبر نیست.');
 requireRule(Number.isSafeInteger(amount)&&amount>0&&amount%project.unit===0,'مبلغ باید مثبت و مضرب واحد طرح باشد.');
 const previous=ledger.payments.filter(p=>p.owner===id&&p.status!=='cancelled').reduce((sum,p)=>sum+p.amount,0);
 const min=type==='natural'?project.naturalMin:project.legalMin,max=type==='natural'?project.naturalMax:project.legalMax;
 requireRule(previous+amount>=min,'حداقل سرمایه‌گذاری رعایت نشده است.');
 requireRule(previous+amount<=max,'سقف تجمیعی سرمایه‌گذار رعایت نشده است.');
 requireRule(amount<=availableAmount(ledger),'مبلغ از ظرفیت آزاد، پس از کسر تعهدات قطعی و در انتظار، بیشتر است.');
 requireRule(amount<=budget,'بودجه این خرید کافی نیست.');
 return true;
}
export function validateReceipt(ledger,receipt,{excludeId=null}={}){
 requireRule(Number.isSafeInteger(receipt.amount)&&receipt.amount>0,'مبلغ فیش معتبر نیست.');
 requireRule(receipt.date>=ledger.start&&receipt.date<=ledger.end&&receipt.date<=project.today,'تاریخ فیش خارج از مهلت یا در آینده است.');
 requireRule(receipt.file&&receipt.bank&&typeof receipt.tracking==='string'&&receipt.tracking.length>0,'تصویر، مشخصات بانکی و کد رهگیری لازم است.');
 requireRule(!ledger.payments.some(p=>p.id!==excludeId&&p.tracking===receipt.tracking),'کد رهگیری فیش تکراری است.');
 return true;
}
export function newJourney(_role='manager',id=globalThis.crypto.randomUUID()){
 return {version:VERSION,id,startedAt:new Date().toISOString(),role:'manager',nodeId:'project',trust:70,time:100,balance:1000,inventory:[],seen:[],flags:[],events:[],completed:[],ending:null,lastFeedback:null,
 ledger:{imported:false,status:null,start:1,end:30,ownerIdentity:false,ownerReceipts:[],ownerSent:false,published:false,identities:{},payments:[],receiptChecked:false,agent:false,institution:false,certificate:null,schedule:[],interestPayments:[]}};
}
export const exitsFor=state=>nodes[state.nodeId]?.exits||[];
export const missingItems=(state,exit)=>[exit?.requires||[]].flat().filter(key=>!state.inventory.includes(key));
export const itemLabel=key=>items[key]?.label||key;
export function interact(state,id){
 requireRule(!state.ending,'سفر پایان یافته است.');
 const object=nodes[state.nodeId]?.objects.find(o=>o.id===id);requireRule(object,'شیء نامعتبر است.');
 const key=state.nodeId+':'+id;if(state.seen.includes(key))return state;
 return {...state,seen:[...state.seen,key],inventory:object.grant?[...new Set([...state.inventory,object.grant])]:state.inventory,events:[...state.events,{kind:'inspect',node:state.nodeId,id}]};
}
function applyDecision(ledger,challenge,value){
 const l=clone(ledger),v=value;
 switch(challenge.action){
 case 'import':
  requireRule(v.total===project.total&&v.unit===project.unit&&v.ownerId===project.ownerId,'پرونده با طرح تطابق ندارد.');l.imported=true;break;
 case 'window':
  requireRule(l.imported&&v.status===5&&v.start<=project.today&&v.end>=project.today,'بازه یا وضعیت نامعتبر است.');Object.assign(l,{status:v.status,start:v.start,end:v.end});break;
 case 'ownerIdentity':
  requireRule(l.imported&&v.ownerId===project.ownerId&&v.route==='owner','مسیر و هویت مجری معتبر نیست.');l.ownerIdentity=true;break;
 case 'ownerDeposit':{
  const sum=v.amounts.reduce((a,b)=>a+b,0);
  requireRule(l.ownerIdentity&&v.ownerId===project.ownerId&&sum===requiredOwnerAmount(project.total),'جمع تعهد سرمایه‌پذیر باید دقیق و هویت منطبق باشد.');
  l.ownerReceipts=v.amounts.map((amount,i)=>({id:'O-'+i,amount,tracking:'O-'+i,date:10,file:true,bank:true,sent:false}));break;}
 case 'ownerSend':
  requireRule(l.ownerReceipts.length>0&&l.ownerReceipts.reduce((s,r)=>s+r.amount,0)===requiredOwnerAmount(project.total)&&!l.ownerSent&&v.all&&v.success&&v.trace,'ارسال کامل تعهد با پاسخ موفق و پیگیری لازم است.');
  l.ownerReceipts=l.ownerReceipts.map(r=>({...r,sent:true,trace:v.trace}));l.ownerSent=true;
  l.payments.push({id:'OWNER',owner:project.ownerId,amount:requiredOwnerAmount(project.total),status:'sent',method:'owner',trace:v.trace});break;
 case 'publish':
  requireRule(l.ownerSent&&l.status===5&&project.today>=l.start&&project.today<=l.end&&v.publish,'پیش‌نیاز انتشار کامل نیست.');l.published=true;break;
 case 'naturalIdentity':case 'legalIdentity':
  requireRule(v.id!==project.ownerId&&v.sejam&&v.bank&&v.bourse&&v.type===(challenge.action==='naturalIdentity'?'natural':'legal'),'هویت سرمایه‌گذار معتبر نیست.');l.identities[v.id]=clone(v);break;
 case 'naturalSlip':case 'legalAmount':{
  const natural=challenge.action==='naturalSlip',id=natural?project.naturalId:project.legalId;
  assessInvestment(l,{id,type:natural?'natural':'legal',amount:v.amount,budget:natural?200:800});validateReceipt(l,v);
  if(!natural)requireRule(v.amount===availableAmount(l),'هدف این مأموریت، بیشترین مبلغ مجاز در ظرفیت است.');
  requireRule(!l.payments.some(p=>p.id===v.id),'پرداخت تکراری است.');l.payments.push({...clone(v),owner:id,status:'submitted'});break;}
 case 'gateway':
  assessInvestment(l,{id:project.naturalId,type:'natural',amount:v.amount,budget:80});
  requireRule(!l.payments.some(p=>p.id===v.id),'درخواست تکراری است.');l.payments.push({...clone(v),owner:project.naturalId,status:'pending',bankSuccess:false,trace:null});break;
 case 'verifyBank':{
  const p=l.payments.find(p=>p.id==='N-80');requireRule(p?.status==='pending'&&v.success&&v.amount===p.amount,'مبلغ یا وضعیت تأیید بانک معتبر نیست.');p.bankSuccess=true;p.status='paid';p.sync='unknown';break;}
 case 'receiptCheck':{
  const p=l.payments.find(p=>p.id===v.id);requireRule(p?.status==='submitted','فیش قابل بررسی نیست.');validateReceipt(l,{...p,...v},{excludeId:p.id});l.receiptChecked=true;break;}
 case 'investorSend':{
  const slip=l.payments.find(p=>p.id==='N-200'),online=l.payments.find(p=>p.id==='N-80');
  requireRule(l.ownerSent&&l.receiptChecked&&slip?.status==='submitted'&&online?.status==='paid'&&online.bankSuccess&&online.sync==='unknown'&&v.slipTrace&&v.gatewayTrace&&v.reconcile,'ارسال فیش و تطبیق آنلاین هنوز شرایط لازم را ندارند.');
  Object.assign(slip,{status:'sent',trace:v.slipTrace});Object.assign(online,{status:'sent',trace:v.gatewayTrace,sync:'confirmed',reconciled:true});break;}
 case 'legalSend':{
  const p=l.payments.find(p=>p.id==='L-600');requireRule(l.ownerSent&&p?.status==='submitted'&&v.trace,'فیش حقوقی یا پیگیری معتبر نیست.');validateReceipt(l,p,{excludeId:p.id});Object.assign(p,{status:'sent',trace:v.trace});break;}
 case 'close':
  requireRule(availableAmount(l)===0&&l.payments.every(p=>p.status==='sent'&&p.trace)&&v.close,'ظرفیت و ارسال‌های پرونده هنوز کامل نیستند.');l.published=false;l.status='awaiting-approval';break;
 case 'final':
  requireRule(l.status==='awaiting-approval'&&v.agent&&v.institution&&v.status===15,'تأییدهای نهایی کامل نیستند.');l.agent=true;l.institution=true;l.status=15;break;
 case 'certificate':{
  const total=l.payments.filter(p=>p.owner===v.id&&p.status==='sent').reduce((s,p)=>s+p.amount,0);
  requireRule(l.status===15&&v.id===project.naturalId&&v.amount===total,'موفقیت نهایی یا صاحب و مبلغ گواهی معتبر نیست.');l.certificate={owner:v.id,amount:total,issued:true};break;}
 case 'schedule':
  requireRule(l.status===15&&v.annual===24&&v.interval===3&&v.duration===12&&v.count===4&&v.amount===60,'تنظیمات برنامه سود معتبر نیست.');l.schedule=Array.from({length:4},(_,i)=>({installment:i+1,month:(i+1)*3,amount:60,paid:false}));break;
 case 'payment':{
  const row=l.schedule.find(r=>r.installment===v.installment);requireRule(l.status===15&&row&&!row.paid&&v.success&&v.amount===row.amount,'سند پرداخت با تعهد تطابق ندارد.');row.paid=true;l.interestPayments.push({installment:v.installment,amount:v.amount,trace:'INTEREST-1'});break;}
 default:throw new Error('عملیات ناشناخته است.');
 }
 return l;
}
export function travel(state,id){
 requireRule(!state.ending,'سفر پایان یافته است.');
 const node=nodes[state.nodeId],exit=exitsFor(state).find(e=>e.id===id);requireRule(exit,'مسیر نامعتبر است.');
 requireRule(!missingItems(state,exit).length,'ابتدا مدرک همین مأموریت را از میز بردار.');
 let next={...state,ledger:state.ledger,completed:[...state.completed],lastFeedback:null,time:Math.max(0,state.time-1),events:[...state.events,{kind:'travel',node:state.nodeId,id}]};
 if(node.challenge){
  const index=challenges.findIndex(c=>c.id===node.challenge),c=challenges[index],choice=c.choices[exit.choice];
  requireRule(challenges.slice(0,index).every(c=>state.completed.includes(c.id)),'چالش‌های قبلی هنوز کامل نشده‌اند.');
  requireRule(!state.completed.includes(c.id),'این تصمیم قبلاً ثبت شده است.');
  if(choice.correct){next.ledger=applyDecision(state.ledger,c,choice.value);next.completed.push(c.id);next.trust=Math.min(100,state.trust+1);next.lastFeedback='چالش حل شد: '+c.title;}
  else{next.trust=Math.max(0,state.trust-6);next.flags=[...state.flags,c.id];next.lastFeedback=choice.reason;}
 }
 if(nodes[exit.next]?.chapter>node.chapter)requireRule(challenges.filter(c=>c.chapter===node.chapter).every(c=>next.completed.includes(c.id)),'حداقل یک چالش اجباری این مرحله حل نشده است.');
 const destination=nodes[exit.next];requireRule(destination,'مقصد نامعتبر است.');
 return {...next,nodeId:exit.next,role:destination.role,balance:availableAmount(next.ledger),ending:destination.ending||null};
}
export function officeAct(state,action,value){return applyOfficeAction(state,action,value,{interact,travel});}
export function collide(state){
 if(state.ending)return state;
 return {...state,time:Math.max(0,state.time-3),events:[...state.events,{kind:'collision',node:state.nodeId}]};
}
export function restoreJourney(raw){
 requireRule(raw?.version===VERSION&&typeof raw.id==='string'&&raw.id.length>0&&raw.id.length<=100&&Array.isArray(raw.events)&&raw.events.length<=2000&&typeof raw.startedAt==='string'&&Number.isFinite(Date.parse(raw.startedAt)),'ذخیره این فصل معتبر نیست.');
 let state={...newJourney('manager',raw.id),startedAt:raw.startedAt};
 for(const event of raw.events){
  requireRule(event&&event.node===state.nodeId&&!state.ending,'توالی ذخیره معتبر نیست.');
  if(event.kind==='inspect')state=interact(state,event.id);
  else if(event.kind==='travel')state=travel(state,event.id);
  else if(event.kind==='collision')state=collide(state);
  else if(event.kind==='office')state=officeAct(state,event.action,event.value);
  else throw new Error('رویداد ناشناخته است.');
 }
 return state;
}
export const journeyLog=state=>state.events.flatMap(e=>e.kind==='travel'?[{from:nodes[e.node].title,label:nodes[e.node].exits.find(x=>x.id===e.id).label}]:e.kind==='office'&&['attach','leave'].includes(e.action)?[{from:'دفتر بررسی طرح',label:e.action==='attach'?'پرونده مبنا و تصویر آن ثبت شد':'بازبینی زمان؛ خرید بسته ماند'}]:[]);
export const summary=state=>state.ending?endings[state.ending]:null;
export function chapterProgress(state){
 const node=nodes[state.nodeId],required=challenges.filter(c=>c.chapter===node.chapter);
 return {chapter:chapters[node.chapter-1],done:required.filter(c=>state.completed.includes(c.id)).length,total:required.length,completedChapters:chapters.filter(ch=>challenges.filter(c=>c.chapter===ch.id).every(c=>state.completed.includes(c.id))).length};
}