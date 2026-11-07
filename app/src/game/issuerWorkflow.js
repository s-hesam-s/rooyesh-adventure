import {exchangeOrigin,roleExchanges} from './roleExchange.js';
import {challenges} from '../content/campaign.js';
const requireIssuer=(ok,message)=>{if(!ok)throw Error(message);};
export const issuerReceipts=[{id:'O-0',amount:100,owner:'شرکت آفتاب',date:10,tracking:'O-0'},{id:'O-1',amount:20,owner:'شرکت آفتاب',date:10,tracking:'O-1'},{id:'O-120',amount:120,owner:'شرکت آفتاب',date:10,tracking:'O-120'}];
export const issuerPaidTotal=o=>issuerReceipts.filter(r=>o.issued.includes(r.id)).reduce((total,r)=>total+r.amount,0);
export const issuerScansReady=o=>issuerPaidTotal(o)===120&&o.issued.every(id=>o.selected.includes(id)&&o.scanned.includes(id));
export const issuerOriginalsPacked=o=>o.issued.length>0&&o.issued.every(id=>o.packed.includes(id));
export const issuerJobDurations={scan:2.8,'pay-slip':2.1,handoff:roleExchanges.issuer.duration,send:3,print:2.4,receipt:1.2};
export const inIssuer=state=>Boolean(state.issuer&&!state.issuer.done&&['ownerIdentity','ownerAmount','ownerSend','publish','naturalIdentity'].includes(state.nodeId));
export function calculateCommitment(expression){
 requireIssuer(typeof expression==='string'&&expression.length<=80&&/^[0-9.+\-*/% ]+$/.test(expression),'عبارت محاسبه معتبر نیست.');
 const tokens=expression.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/%]/g)||[];let i=0;requireIssuer(tokens.join('')===expression.replaceAll(' ',''),'عبارت کامل نیست.');
 function number(){const token=tokens[i++];requireIssuer(token!==undefined&&/^(?:\d|\.)/.test(token),'عدد لازم است.');let value=Number(token);if(tokens[i]==='%'){i++;value/=100;}return value;}
 function product(){let value=number();while(['*','/'].includes(tokens[i])){const op=tokens[i++],right=number();requireIssuer(op!=='/'||right!==0,'تقسیم بر صفر مجاز نیست.');value=op==='*'?value*right:value/right;}return value;}
 let value=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],right=product();value=op==='+'?value+right:value-right;}
 requireIssuer(i===tokens.length&&Number.isFinite(value),'عبارت کامل نیست.');return Math.round(value*1e8)/1e8;
}
export function issuerAction(state,action,value,core){
 requireIssuer(!state.ending,'سفر پایان یافته است.');const events=state.events,node=state.nodeId;
 if(action==='begin'){
  requireIssuer(!state.issuer&&(!state.office||state.office.done)&&node==='ownerIdentity'&&state.ledger.imported&&state.completed.includes('window'),'پرونده آماده تعهد نیست.');
  return {...state,role:'owner',issuer:{version:1,intro:false,cabinet:false,document:null,onDesk:false,open:false,route:null,identity:false,expression:'',lastKey:null,result:null,calculated:false,inspected:[],selected:[],issued:[],heldSlip:null,packed:[],loaded:null,scanned:[],registered:false,caseCarried:false,handed:false,sent:false,printed:false,receiptTaken:false,publicationRead:false,published:false,pump:true,job:null,done:false,issue:null,revision:0},events:[...events,{kind:'issuer',node,action}]};
 }
 requireIssuer(inIssuer(state),'پایگاه فعال نیست.');const o={...state.issuer,inspected:[...state.issuer.inspected],selected:[...state.issuer.selected],scanned:[...state.issuer.scanned],revision:state.issuer.revision+1};let next={...state,issuer:o};
 const idle=()=>requireIssuer(!o.job,'وسیله هنوز در حال کار است.');
 const commit=id=>{requireIssuer(next.nodeId===id,'ترتیب مرحله معتبر نیست.');const c=challenges.find(c=>c.id===id),choice=c.choices.findIndex(c=>c.correct);next=core.travel(core.interact(next,'evidence'),'route-'+choice);next.issuer=o;};
 switch(action){
 case 'intro':requireIssuer(!o.intro,'گفت‌وگو قبلاً انجام شده است.');o.intro=true;break;
 case 'cabinet':idle();o.cabinet=!o.cabinet;break;
 case 'take':idle();requireIssuer(o.cabinet&&!o.document&&['sun','moon'].includes(value),'پوشه در دسترس نیست.');o.document=value;o.onDesk=false;o.open=false;o.issue=null;break;
 case 'place':idle();requireIssuer(o.document&&!o.onDesk,'پوشه در دست نیست.');o.onDesk=true;break;
 case 'open':idle();requireIssuer(o.onDesk,'پوشه روی پیشخوان نیست.');o.open=!o.open;break;
 case 'lift':idle();requireIssuer(o.onDesk&&!o.identity,'بررسی این پوشه ثبت شده است.');o.onDesk=false;o.open=false;break;
 case 'return':idle();requireIssuer(o.document&&!o.onDesk&&o.cabinet&&!o.identity,'پوشه قابل بازگرداندن نیست.');o.document=null;o.route=null;o.issue=null;break;
 case 'route':idle();requireIssuer(o.onDesk&&o.open&&!o.identity&&['owner','legal'].includes(value),'مسیر قابل انتخاب نیست.');o.route=value;o.issue=null;break;
 case 'identity':idle();requireIssuer(o.document&&o.onDesk&&o.open&&o.route&&!o.identity,'مدارک و مسیر را بررسی کن.');if(o.document!=='sun'||o.route!=='owner'){o.issue='identity';break;}commit('ownerIdentity');o.identity=true;o.issue=null;next.role='owner';break;
 case 'key':idle();requireIssuer(!o.registered&&typeof value==='string','ماشین‌حساب در دسترس نیست.');o.lastKey=value;if(value==='C'){o.expression='';o.result=null;o.calculated=false;}else if(value==='='){o.result=calculateCommitment(o.expression);o.calculated=false;}else{requireIssuer(/^[0-9.+\-*/%]$/.test(value)&&o.expression.length<80,'کلید نامعتبر است.');o.expression+=value;o.result=null;o.calculated=false;}break;
 case 'calculated':idle();requireIssuer(o.result!==null&&!o.registered,'ابتدا محاسبه را کامل کن.');o.calculated=o.result===120||o.result===120_000_000;o.issue=o.calculated?null:'amount';break;
 case 'pay-slip': {
  idle();
  requireIssuer(o.identity&&o.calculated&&!o.registered&&!o.heldSlip&&!o.loaded,'ابتدا تعهد را محاسبه کن و دستت را خالی نگه دار.');
  const amount=String(value??'').trim().replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)%16));
  const receipt=/^\d+$/.test(amount)&&issuerReceipts.find(r=>r.amount===Number(amount));
  requireIssuer(receipt,'مبلغ را به میلیون تومان وارد کن: یک فیش ۱۲۰ یا دو فیش ۱۰۰ و ۲۰.');
  requireIssuer(!o.issued.includes(receipt.id),'پرداخت این فیش قبلاً ثبت شده است.');
  requireIssuer(issuerPaidTotal(o)+receipt.amount<=120,'این مبلغ از ماندهٔ تعهد بیشتر است.');
  requireIssuer(o.issued.every(id=>o.scanned.includes(id)),'فیش قبلی را از دستگاه بردار و اسکن کن.');
  o.job={kind:'pay-slip',id:receipt.id};
  break;
 }
 case 'pay-slip-finish': {
  requireIssuer(o.job?.kind==='pay-slip','ثبت پرداخت شروع نشده است.');
  const {id}=o.job;
  o.issued=[...o.issued,id];
  o.inspected.push(id);
  o.selected.push(id);
  o.job=null;
  break;
 }
 case 'inspect-slip':idle();requireIssuer(issuerReceipts.some(r=>r.id===value)&&(core.replay||o.issued.includes(value)),'ابتدا پرداخت را در دستگاه ثبت کن.');if(core.replay&&!o.issued.includes(value))o.issued=[...o.issued,value];if(!o.inspected.includes(value))o.inspected.push(value);break;
 case 'select-slip':idle();requireIssuer(o.identity&&!o.registered&&o.inspected.includes(value),'فیش بررسی نشده است.');o.selected=o.selected.includes(value)?o.selected.filter(id=>id!==value):[...o.selected,value];o.issue=null;break;
 case 'take-slip':
  idle();requireIssuer(o.calculated&&!o.heldSlip&&!o.loaded&&o.issued.includes(value)&&o.selected.includes(value)&&!o.scanned.includes(value),'ابتدا پرداخت را در دستگاه ثبت کن.');o.heldSlip=value;break;
 case 'retrieve-slip':
  idle();requireIssuer(!o.heldSlip&&!o.loaded&&o.scanned.includes(value)&&!o.packed.includes(value),'فیش در خروجی اسکنر نیست.');o.heldSlip=value;break;
 case 'pack-slip':
  idle();requireIssuer(o.heldSlip&&o.scanned.includes(o.heldSlip),'اصل فیش اسکن‌شده را بیاور.');o.packed=[...o.packed,o.heldSlip];o.heldSlip=null;break;
 case 'load':idle();requireIssuer(o.calculated&&!o.loaded&&o.selected.includes(value)&&!o.scanned.includes(value)&&(o.heldSlip===value||core.replay&&!o.heldSlip),'فیش را از سینی بردار و به اسکنر بیاور.');o.loaded=value;o.heldSlip=null;break;
 case 'scan':idle();requireIssuer(o.loaded&&!o.scanned.includes(o.loaded),'فیشی در تغذیه‌گر نیست.');o.job={kind:'scan',id:o.loaded};break;
 case 'scan-finish':requireIssuer(o.job?.kind==='scan'&&o.job.id===o.loaded,'اسکن شروع نشده است.');o.scanned.push(o.loaded);o.loaded=null;o.job=null;break;
 case 'register':idle();requireIssuer(o.identity&&o.calculated&&!o.registered,'پرونده آماده ثبت نیست.');if(!issuerScansReady(o)){o.issue='incomplete';break;}commit('ownerAmount');next.ledger.ownerReceipts=issuerReceipts.filter(r=>o.issued.includes(r.id)).map(r=>({id:r.id,amount:r.amount,tracking:r.tracking,date:r.date,file:true,bank:true,sent:false}));o.registered=true;o.issue=null;next.role='owner';break;
 case 'collect-case':idle();requireIssuer(o.registered&&!o.caseCarried&&!o.handed&&(issuerOriginalsPacked(o)||core.replay&&!o.heldSlip),'اصل فیش‌های ثبت‌شده را در پوشه بگذار.');o.caseCarried=true;break;
 case 'handoff':idle();requireIssuer(o.registered&&o.caseCarried&&!o.handed,'پرونده آماده تحویل نیست.');o.handoffOrigin=exchangeOrigin(value,'issuer');o.job={kind:'handoff'};break;
 case 'handoff-finish':requireIssuer(o.job?.kind==='handoff','تحویل شروع نشده است.');o.job=null;o.handed=true;o.caseCarried=false;next.role='manager';break;
 case 'send':idle();requireIssuer(o.handed&&o.registered&&!o.sent&&next.role==='manager','پرونده آماده ارسال نیست.');o.job={kind:'send'};break;
 case 'send-finish':requireIssuer(o.job?.kind==='send','ارسال شروع نشده است.');commit('ownerSend');o.job=null;o.sent=true;o.issue=null;next.role='manager';break;
 case 'print':idle();requireIssuer(o.sent&&!o.printed,'رسید آماده چاپ نیست.');o.job={kind:'print'};break;
 case 'print-finish':requireIssuer(o.job?.kind==='print','چاپ شروع نشده است.');o.job=null;o.printed=true;break;
 case 'take-receipt':idle();requireIssuer(o.printed&&!o.receiptTaken,'رسید آماده برداشت نیست.');o.job={kind:'receipt'};break;
 case 'receipt-finish':requireIssuer(o.job?.kind==='receipt','برداشت رسید شروع نشده است.');o.job=null;o.receiptTaken=true;break;
 case 'publication-read':idle();requireIssuer(o.sent,'پاسخ ارسال هنوز دریافت نشده است.');o.publicationRead=true;break;
 case 'publish':idle();requireIssuer(o.sent&&o.receiptTaken&&o.publicationRead&&!o.published,'پیش‌نیاز بازبینی انتشار کامل نیست.');commit('publish');o.published=true;next.role='manager';break;
 case 'pump':o.pump=!o.pump;break;
 case 'leave':idle();requireIssuer(o.published&&next.ledger.published&&next.nodeId==='naturalIdentity','انتشار هنوز کامل نشده است.');o.done=true;next.role='client';break;
 default:throw Error('عملیات پایگاه نامعتبر است.');
 }
 return {...next,issuer:o,events:[...events,{kind:'issuer',node,action,...(value!==undefined?{value}:{})}]};
}
export function issuerObjective(state){
 const o=state.issuer;
 const task=issuerGuidance(state).text;
 if(!o.identity)return task+' تعهد باید برای مجری همین طرح ثبت شود.';
 if(!o.calculated)return task+' مبلغ لازم را با مجموع پرداخت‌ها مقایسه می‌کنی.';
 if(!o.registered&&issuerScansReady(o)&&!o.heldSlip)return task+' پرداخت‌ها باید در پروندهٔ تعهد ثبت شوند.';
 if(!o.handed&&o.registered&&issuerOriginalsPacked(o))return task+' شبنم مسئول ارسال پرونده است.';
 return task;
}
export function issuerGuidance(state){
 const o=state.issuer;
 if(o.issue==='identity')return {text:'پوشه آفتاب را بررسی کن و در رایانه مسیر سرمایه‌پذیر را انتخاب کن.'};
 if(!o.identity)return {text:'پوشه آفتاب را از کمد بیاور، روی پیشخوان باز کن و هویت مجری را در رایانه تطبیق بده.'};
 if(!o.calculated)return {text:'ده درصد مبلغ کل طرح را به‌علاوهٔ ۲۰ میلیون حساب کن و نتیجه را نگه دار.'};
 if(o.heldSlip)return {text:o.scanned.includes(o.heldSlip)?'اصل فیش را در پوشهٔ پیشخوان بگذار.':'فیش در دستت را در تغذیه‌گر اسکنر بگذار.'};
 if(o.loaded)return {text:'اسکن فیش داخل تغذیه‌گر را شروع کن.'};
 if(!o.registered&&issuerScansReady(o))return {text:'تصویر فیش‌های صادرشده را در رایانه به تعهد پیوست و ثبت کن.'};
 if(o.scanned.some(id=>!o.packed.includes(id)))return {text:'اصل فیش را از خروجی اسکنر بردار.'};
 if(o.job?.kind==='pay-slip')return {text:'دستگاه در حال ثبت پرداخت و صدور فیش است.'};
 if(o.issued.some(id=>!o.scanned.includes(id)))return {text:'فیش صادرشده را از خروجی دستگاه بردار و به اسکنر ببر.'};
 if(!o.registered)return {text:'برای تعهد یک فیش ۱۲۰ میلیونی یا دو فیش ۱۰۰ و ۲۰ میلیونی صادر کن.'};
 if(!o.handed)return {text:'بسته ثبت‌شده را از پیشخوان بردار و به شبنم بده.'};
 if(!o.sent)return {text:'فیش‌های ثبت‌شده را از رایانه به فرابورس ارسال کن.'};
 if(!o.receiptTaken)return {text:'رسید پیگیری را چاپ کن و از سینی بردار.'};
 if(!o.published)return {text:'مهلت و وضعیت طرح را در رایانه بررسی کن و مشارکت عمومی را باز کن.'};
 return {text:'از در خروج به خانه مشارکت برو.'};
}
