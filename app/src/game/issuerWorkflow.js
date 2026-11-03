import {exchangeOrigin,roleExchanges} from './roleExchange.js';
import {challenges} from '../content/campaign.js';
const requireIssuer=(ok,message)=>{if(!ok)throw Error(message);};
export const issuerReceipts=[{id:'O-0',amount:100,owner:'شرکت آفتاب',date:10,tracking:'O-0'},{id:'O-1',amount:20,owner:'شرکت آفتاب',date:10,tracking:'O-1'}];
export const issuerJobDurations={scan:2.8,handoff:roleExchanges.issuer.duration,send:3,print:2.4,receipt:1.2};
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
  return {...state,role:'owner',issuer:{version:1,intro:false,cabinet:false,document:null,onDesk:false,open:false,route:null,identity:false,expression:'',lastKey:null,result:null,calculated:false,inspected:[],selected:[],loaded:null,scanned:[],registered:false,caseCarried:false,handed:false,sent:false,printed:false,receiptTaken:false,publicationRead:false,published:false,pump:true,job:null,done:false,issue:null,revision:0},events:[...events,{kind:'issuer',node,action}]};
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
 case 'inspect-slip':idle();requireIssuer(issuerReceipts.some(r=>r.id===value),'فیش معتبر نیست.');if(!o.inspected.includes(value))o.inspected.push(value);break;
 case 'select-slip':idle();requireIssuer(o.identity&&!o.registered&&o.inspected.includes(value),'فیش بررسی نشده است.');o.selected=o.selected.includes(value)?o.selected.filter(id=>id!==value):[...o.selected,value];o.issue=null;break;
 case 'load':idle();requireIssuer(o.calculated&&o.selected.includes(value)&&!o.scanned.includes(value),'فیش آماده اسکن نیست.');o.loaded=value;break;
 case 'scan':idle();requireIssuer(o.loaded&&!o.scanned.includes(o.loaded),'فیشی در تغذیه‌گر نیست.');o.job={kind:'scan',id:o.loaded};break;
 case 'scan-finish':requireIssuer(o.job?.kind==='scan'&&o.job.id===o.loaded,'اسکن شروع نشده است.');o.scanned.push(o.loaded);o.loaded=null;o.job=null;break;
 case 'register':idle();requireIssuer(o.identity&&o.calculated&&!o.registered,'پرونده آماده ثبت نیست.');if(issuerReceipts.some(r=>!o.selected.includes(r.id)||!o.scanned.includes(r.id))){o.issue='incomplete';break;}commit('ownerAmount');o.registered=true;o.issue=null;next.role='owner';break;
 case 'collect-case':idle();requireIssuer(o.registered&&!o.caseCarried&&!o.handed,'بسته آماده برداشت نیست.');o.caseCarried=true;break;
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
export function issuerGuidance(state){const o=state.issuer;
 if(!o.intro&&!o.document&&!o.identity)return {text:'خوش آمدی نادر. من مینا، مسئول مالی گلخانه آفتاب هستم. سارا بررسی اولیه را انجام داده؛ حالا تعهد همین شرکت مجری را آماده می‌کنیم. پوشه شرکت را از کمد کنار پیشخوان بیاور، روی پیشخوان باز کن و هویت و مسیر ثبتش را بررسی کن.'};
 if(o.issue==='identity')return {text:'شرکت مجری پرونده آفتاب است و تعهدش از مسیر سرمایه‌پذیر ثبت می‌شود. شرکت مهتاب یا مسیر سرمایه‌گذار حقوقی این کار را انجام نمی‌دهد. اگر پوشه دیگری آوردی، آن را به کمد برگردان؛ بعد روی رایانه مسیر درست را انتخاب کن.'};
 if(!o.identity)return {text:'پوشه شرکت آفتاب را از کمد بردار، روی پیشخوان بگذار و باز کن. در رایانه، شرکت و نوع ثبت را با پوشه مقایسه کن. شرکت سرمایه‌پذیر با شرکت سرمایه‌گذار حقوقی فرق دارد.'};
 if(o.issue==='amount'||!o.calculated)return {text:'در این پرونده مبلغ کل طرح هزار میلیون است. تعهد مجری ده درصد آن، به‌اضافه بیست میلیون است. با ماشین‌حساب کنار پنجره، همه مبالغ را با یک واحد، تومان یا میلیون تومان، محاسبه کن و نتیجه را نگه دار. فیش‌های روی سینی قبلاً پرداخت شده‌اند؛ قرار نیست وجه را دوباره پرداخت کنیم.'};
 if(!o.registered)return {text:o.issue==='incomplete'?'برای ثبت تعهد، هر دو فیش صد و بیست میلیونی لازم‌اند. در سینی فیش‌ها هرکدام را بررسی و انتخاب کن، از تغذیه‌گر اسکنر عبور بده و بعد بسته را روی رایانه ثبت کن.':'دو فیش صد و بیست میلیونی روی سینی هستند. نام شرکت، مبلغ، تاریخ و رهگیری هرکدام را بررسی و انتخاب کن. هر فیش را جداگانه در تغذیه‌گر اسکنر بگذار و اسکن کن؛ بعد بسته کامل را روی رایانه ثبت کن.'};
 if(!o.handed)return {text:'تعهد شرکت ثبت شده؛ هنوز به فرابورس ارسال نشده است. بسته ثبت‌شده را از پیشخوان بردار و به سارا پشت میز تحویل بخش مالی، نزدیک رایانه، بده. او پرونده را می‌گیرد و از دید سارا ادامه می‌دهی.'};
 if(!o.sent)return {text:'حالا سارا هستی. دو تصویر ثبت‌شده و مبلغ کل تعهد را در رایانه ببین و ارسال کن. تا پاسخ موفق همراه شماره پیگیری نرسیده، ارسال کامل نیست و طرح منتشر نمی‌شود.'};
 if(!o.receiptTaken)return {text:'پاسخ ارسال موفق است و شماره پیگیری ثبت شده. رسید پیگیری را از چاپگر چاپ کن و بردار؛ این رسید دریافت وجه تازه نیست.'};
 if(!o.published)return {text:'اکنون در رایانه وضعیت ۵ و مهلت روز اول تا سی‌ام را با روز دهم مقایسه کن. تعهد مجری ارسال شده و می‌توانی مشارکت عمومی را باز کنی. این فقط آغاز جمع‌آوری است، نه موفقیت نهایی کل طرح.'};
 return {text:'طرح برای مشارکت منتشر شد. از در خروج در انتهای مسیر خشک برو؛ بخش بعد را در نقش آرمان، سرمایه‌گذار حقیقی، ادامه می‌دهی.'};
}
