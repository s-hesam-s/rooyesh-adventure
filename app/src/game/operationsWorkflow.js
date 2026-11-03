import {challenges,nodes} from '../content/campaign.js';
const requireOperations=(ok,message)=>{if(!ok)throw Error(message);};
export const operationsDurations={bank:2.2,scan:2.6,query:2.4,send:3,print:2.3};
export const operationsFields=['amount','date','tracking','image','bank','duplicate'];
export const operationsReceipts={original:{title:'اصل فیش آرمان',tracking:'N-200',amount:200,date:10,bank:true,file:true,duplicate:false},copy:{title:'نسخه کپی فیش',tracking:'N-200',amount:200,date:10,bank:true,file:true,duplicate:true},future:{title:'فیش دارای تاریخ متفاوت',tracking:'N-231',amount:200,date:31,bank:true,file:true,duplicate:false}};
export const inOperations=s=>Boolean(s.operations&&!s.operations.done&&['verifyBank','receiptCheck','investorSend','legalIdentity'].includes(s.nodeId));
export function operationsObjective(s){const o=s.operations;return !o.intake?'بسته آرمان را در سینی ورودی بگذار.':!o.bankVerified?'پاسخ بانک را با درخواست N-80 تطبیق بده.':!o.receiptVerified?'فیش کاغذی را اسکن و اعتبار آن را بررسی کن.':!o.onlineTrace?'وضعیت ثبت قبلی پرداخت آنلاین را استعلام کن.':!o.slipTrace?'فقط فیش تأییدشده را به فرابورس ارسال کن.':!o.reportCollected?'گزارش نتیجه دو خرید را چاپ کن و بردار.':!o.assembled?'گزارش را روی میز تکمیل به پرونده اضافه کن.':!o.held?'پرونده تکمیل‌شده را بردار.':'پرونده را به مرکز قراردادها ببر.';}
export function operationsGuidance(s){const o=s.operations;if(o.issue)return ({bank:'در پاسخ بانک، شناسه درخواست، مبلغ ۸۰ میلیون و موفقیت پرداخت را با هم تطبیق بده. نتیجه بانک به‌تنهایی تأیید فرابورس نیست.',receipt:'کپی N-200 پرداخت دیگری نیست. فیش روز ۳۱ نیز هم در آینده و هم بیرون مهلت روز ۳۰ است. اصل فیش روز دهم را با اطلاعات بانکی و تصویر خوانا بررسی کن.'})[o.issue];return operationsObjective(s)+' کارت و فیش‌های قبلی دوباره پرداخت نمی‌شوند. اصل فیش، کپی هم‌کد و برگه دارای تاریخ متفاوت روی میز نور قابل مقایسه‌اند. استعلام آنلاین، ارسال فیش و چاپ گزارش ابزارهای جدا دارند. اگر ترتیب کار را می‌دانی، بدون گفت‌وگو ادامه بده.';}
export function operationsAction(state,action,value,core){
 requireOperations(!state.ending,'سفر پایان یافته است.');const events=state.events,node=state.nodeId;
 if(action==='begin'){
  requireOperations(!state.operations&&(!state.participation||state.participation.done)&&node==='verifyBank'&&state.role==='manager'&&state.ledger.payments.some(p=>p.id==='N-80'&&p.status==='pending')&&state.ledger.payments.some(p=>p.id==='N-200'&&p.status==='submitted'),'بسته دو خرید هنوز برای تطبیق آماده نیست.');
  return {...state,operations:{version:1,intake:false,held:'dossier',bankResponse:false,bankRecord:null,bankVerified:false,selected:null,lid:false,loaded:null,scanned:[],lamp:false,magnifier:false,checks:[],receiptVerified:false,onlineTrace:null,slipTrace:null,printed:false,reportCollected:false,assembled:false,job:null,issue:null,done:false,revision:0},events:[...events,{kind:'operations',node,action}]};
 }
 requireOperations(inOperations(state),'مرکز عملیات فعال نیست.');const o={...state.operations,checks:[...state.operations.checks],scanned:[...state.operations.scanned],revision:state.operations.revision+1};let next={...state,operations:o};
 const idle=()=>requireOperations(!o.job,'عملیات دستگاه هنوز تمام نشده است.');
 const commit=id=>{requireOperations(next.nodeId===id,'ترتیب تطبیق معتبر نیست.');const challenge=challenges.find(c=>c.id===id);next=core.travel(core.interact(next,'evidence'),'route-'+challenge.choices.findIndex(c=>c.correct));next.operations=o;next.role='manager';};
 const finish=id=>requireOperations(o.job?.kind===id,'این عملیات شروع نشده است.');
 switch(action){
 case 'intake':idle();requireOperations(!o.intake&&o.held==='dossier','بسته ورودی در دست نیست.');o.intake=true;o.held=null;break;
 case 'bank':idle();requireOperations(o.intake&&!o.bankVerified,'ابتدا بسته را تحویل سینی بده.');o.job={kind:'bank'};break;
 case 'bank-finish':finish('bank');o.bankResponse=true;o.job=null;break;
 case 'bank-record':idle();requireOperations(o.bankResponse&&!o.bankVerified&&['exact','mismatch','pending'].includes(value),'ابتدا پاسخ بانک را بازیابی کن.');o.bankRecord=value;o.issue=null;break;
 case 'verify-bank':idle();requireOperations(o.bankResponse&&o.bankRecord&&!o.bankVerified,'پاسخ بانک انتخاب نشده است.');if(o.bankRecord!=='exact'){o.issue='bank';break;}commit('verifyBank');o.bankVerified=true;o.issue=null;break;
 case 'take':idle();requireOperations(o.intake&&!o.held&&!o.receiptVerified&&Object.hasOwn(operationsReceipts,value)&&o.loaded!==value,'برگه در دسترس نیست یا دست پر است.');o.selected=value;o.checks=[];o.held=value;o.issue=null;break;
 case 'return':idle();requireOperations(Object.hasOwn(operationsReceipts,o.held),'فیشی در دست نیست.');o.held=null;break;
 case 'lamp':idle();o.lamp=!o.lamp;break;
 case 'magnifier':idle();o.magnifier=!o.magnifier;break;
 case 'lid':idle();o.lid=!o.lid;break;
 case 'load':idle();requireOperations(o.lid&&!o.loaded&&Object.hasOwn(operationsReceipts,o.held),'در اسکنر را باز و فیش را در دست بگیر.');o.loaded=o.held;o.held=null;break;
 case 'unload':idle();requireOperations(o.lid&&o.loaded&&!o.held,'در را باز کن و دستت را خالی کن.');o.held=o.loaded;o.loaded=null;break;
 case 'scan':idle();requireOperations(o.loaded&&!o.lid,'فیش روی شیشه و در بسته لازم است.');o.job={kind:'scan',document:o.loaded};break;
 case 'scan-finish':finish('scan');requireOperations(o.loaded===o.job.document,'فیش اسکنر تغییر کرده است.');o.scanned=[...new Set([...o.scanned,o.loaded])];o.job=null;break;
 case 'check':idle();requireOperations(o.selected&&operationsFields.includes(value)&&!o.receiptVerified,'ابتدا فیش را انتخاب کن.');o.checks=o.checks.includes(value)?o.checks.filter(k=>k!==value):[...o.checks,value];break;
 case 'verify-receipt':idle();requireOperations(o.bankVerified&&o.selected&&operationsFields.every(k=>o.checks.includes(k))&&o.scanned.includes(o.selected)&&!o.receiptVerified,'پاسخ بانک، تصویر و بررسی همه مشخصات لازم‌اند.');if(o.selected!=='original'){o.issue='receipt';break;}commit('receiptCheck');o.receiptVerified=true;o.issue=null;break;
 case 'query':idle();requireOperations(o.bankVerified&&o.receiptVerified&&!o.onlineTrace,'تطبیق بانک و فیش را کامل کن.');o.job={kind:'query'};break;
 case 'query-finish':finish('query');o.onlineTrace='FB-80';o.job=null;break;
 case 'send':idle();requireOperations(value==='N-200'&&o.receiptVerified&&o.onlineTrace&&!o.slipTrace,'پرداخت آنلاین قبلاً ثبت شده؛ فقط فیش تأییدشده قابل ارسال است.');o.job={kind:'send'};break;
 case 'send-finish':finish('send');requireOperations(o.onlineTrace==='FB-80'&&!o.slipTrace,'وضعیت ارسال معتبر نیست.');commit('investorSend');o.slipTrace='FB-200';o.job=null;break;
 case 'print':idle();requireOperations(o.slipTrace&&o.onlineTrace&&!o.printed,'نتیجه هر دو خرید باید مشخص باشد.');o.job={kind:'print'};break;
 case 'print-finish':finish('print');o.printed=true;o.job=null;break;
 case 'collect-report':idle();requireOperations(o.printed&&!o.reportCollected&&!o.held,'گزارش باید چاپ شده و دست خالی باشد.');o.reportCollected=true;o.held='report';break;
 case 'assemble':idle();requireOperations(o.held==='report'&&o.slipTrace&&o.onlineTrace&&!o.assembled,'گزارش چاپ‌شده را به میز تکمیل بیاور.');o.assembled=true;o.held=null;break;
 case 'collect-case':idle();requireOperations(o.assembled&&!o.held,'پرونده تکمیل‌شده آماده نیست.');o.held='completed-case';break;
 case 'leave':idle();requireOperations(o.held==='completed-case'&&o.assembled&&next.nodeId==='legalIdentity','پرونده تکمیل‌شده را همراه ببر.');o.done=true;o.held=null;next.role=nodes[next.nodeId].role;break;
 default:throw Error('عملیات مرکز مالی نامعتبر است.');
 }
 return {...next,operations:o,events:[...events,{kind:'operations',node,action,...(value!==undefined?{value}:{})}]};
}
