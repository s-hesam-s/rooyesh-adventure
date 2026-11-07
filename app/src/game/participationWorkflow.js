import {challenges} from '../content/campaign.js';
import {exchangeOrigin,roleExchanges} from './roleExchange.js';
const requireParticipation=(ok,message)=>{if(!ok)throw Error(message);};
export const trainingCard={number:'1111222233334444',expiry:'09/09',cvv:'123',otp:'246810'};
export const participationDurations={scan:2.8,fingerprint:2.6,'pay-first':2.3,otp:1.2,gateway:3.2,print:2.5,pickup:1.2,handoff:roleExchanges.participation.duration};
export const inParticipation=s=>Boolean(s.participation&&!s.participation.done&&['naturalIdentity','naturalSlip','gateway','verifyBank'].includes(s.nodeId));
export const canPlaceParticipationCard=o=>!o.job&&!o.cardOnStand&&!o.requested&&(o.held==='bankcard'||o.version===2&&o.cardOwned&&!o.held);
export const normalizeDigits=text=>String(text).replace(/[۰-۹٠-٩]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.includes(c)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(c):'٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[٬,\s]/g,'');
export function participationAction(state,action,value,core){
 requireParticipation(!state.ending,'سفر پایان یافته است.');const events=state.events,node=state.nodeId;
 if(action==='begin'){
  requireParticipation(!state.participation&&(!state.issuer||state.issuer.done)&&node==='naturalIdentity'&&state.ledger.published&&state.ledger.ownerSent,'طرح هنوز آماده مشارکت نیست.');
  return {...state,role:'client',participation:{version:value===1||core.replay&&value===undefined?1:2,wallet:false,personalBoxOpen:false,phoneOwned:false,cardOwned:false,phoneRaised:false,cardRead:false,otpCode:null,firstPaid:false,slipFiled:false,held:null,lid:false,loaded:null,idScanned:false,slipScanned:false,idRecord:null,identity:false,units:'',firstRegistered:false,onlineUnits:'',cardOnStand:false,fields:{number:'',expiry:'',cvv:'',otp:''},otpReady:false,requested:false,printed:false,receiptCollected:false,assembled:false,handed:false,job:null,done:false,issue:null,revision:0},events:[...events,{kind:'participation',node,action,value:value===1||core.replay&&value===undefined?1:2}]};
 }
 requireParticipation(inParticipation(state),'خانه مشارکت فعال نیست.');
 const o={...state.participation,fields:{...state.participation.fields},revision:state.participation.revision+1};let next={...state,participation:o};
 if(action!=='phone-toggle')o.phoneRaised=false;
 const idle=()=>requireParticipation(!o.job,'وسیله هنوز در حال کار است.');
 const commit=id=>{requireParticipation(next.nodeId===id,'ترتیب تصمیم معتبر نیست.');const c=challenges.find(c=>c.id===id);next=core.travel(core.interact(next,'evidence'),'route-'+c.choices.findIndex(c=>c.correct));next.participation=o;next.role='client';};
 switch(action){
 case 'wallet':idle();o.wallet=!o.wallet;break;
 case 'open-personal-box':
  idle();requireParticipation(o.wallet&&!o.phoneOwned&&!o.personalBoxOpen,'جعبه در دسترس نیست.');
  o.personalBoxOpen=true;break;
 case 'take-personal':
  idle();requireParticipation(o.wallet&&(o.personalBoxOpen||core.replay)&&!o.phoneOwned&&!o.held,'ابتدا جعبهٔ داخل کیف را باز کن.');
  o.phoneOwned=true;o.cardOwned=true;break;
 case 'fingerprint':
  idle();requireParticipation(o.phoneOwned&&o.cardOwned&&!o.identity&&!o.held,'ابتدا کارت و گوشی را از کیف بردار.');
  o.job={kind:'fingerprint'};break;
 case 'fingerprint-finish':
  requireParticipation(o.job?.kind==='fingerprint','اسکن اثر انگشت شروع نشده است.');
  commit('naturalIdentity');o.identity=true;o.job=null;break;
 case 'pay-first':
  idle();requireParticipation(o.identity&&!o.firstPaid&&!o.held,'پرداخت حضوری آماده نیست.');
  requireParticipation(normalizeDigits(value)==='200','مبلغ خرید اول ۲۰۰ میلیون تومان است.');
  o.job={kind:'pay-first'};break;
 case 'pay-first-finish':
  requireParticipation(o.job?.kind==='pay-first','پرداخت شروع نشده است.');
  o.firstPaid=true;o.job=null;break;
 case 'take-first-slip':
  idle();requireParticipation(o.firstPaid&&!o.slipScanned&&!o.held&&!o.loaded,'فیش در خروجی دستگاه نیست.');
  o.held='slip';break;
 case 'file-first-slip':
  idle();requireParticipation(o.firstRegistered&&o.held==='slip'&&!o.slipFiled,'اصل فیش خرید اول را به میز بیاور.');
  o.slipFiled=true;o.held=null;break;
 case 'phone-toggle':
  idle();requireParticipation(o.phoneOwned&&!o.held&&!o.handed,'برای دیدن گوشی دستت را خالی کن.');
  o.phoneRaised=!o.phoneRaised;break;
 case 'take':idle();requireParticipation(o.wallet&&!o.held&&['id','slip','bankcard'].includes(value)&&(o.version===1||value==='bankcard'&&o.cardOwned)&&o.loaded!==value&&!(value==='bankcard'&&o.cardOnStand),'مدرک در کیف در دسترس نیست.');o.held=value;break;
 case 'store':idle();requireParticipation(o.wallet&&['id','slip','bankcard'].includes(o.held),'مدرکی برای قرار دادن در کیف نیست.');o.held=null;break;
 case 'lid':idle();o.lid=!o.lid;break;
 case 'load':idle();requireParticipation(o.lid&&!o.loaded&&['id','slip'].includes(o.held),'مدرک را در دست بگیر و در اسکنر را باز کن.');o.loaded=o.held;o.held=null;break;
 case 'unload':idle();requireParticipation(o.lid&&o.loaded&&!o.held,'ابتدا در اسکنر را باز کن.');o.held=o.loaded;o.loaded=null;break;
 case 'scan':idle();requireParticipation(o.loaded&&!o.lid,'برگه روی شیشه و در بسته لازم است.');o.job={kind:'scan',document:o.loaded};break;
 case 'scan-finish':requireParticipation(o.job?.kind==='scan'&&o.loaded===o.job.document,'اسکن شروع نشده است.');if(o.loaded==='id')o.idScanned=true;else o.slipScanned=true;o.job=null;break;
 case 'record':idle();requireParticipation(o.idScanned&&!o.identity&&['arman','friend','unverified'].includes(value),'تصویر کارت و پرونده هویتی را بررسی کن.');o.idRecord=value;o.issue=null;break;
 case 'identity':idle();requireParticipation(o.idScanned&&o.idRecord&&!o.identity,'تصویر و پرونده هویتی انتخاب نشده‌اند.');if(o.idRecord!=='arman'){o.issue='identity';break;}commit('naturalIdentity');o.identity=true;o.issue=null;break;
 case 'field':idle();requireParticipation(value&&['units','onlineUnits','number','expiry','cvv','otp'].includes(value.name)&&typeof value.value==='string'&&value.value.length<=24,'ورودی معتبر نیست.');
  requireParticipation(!(['units'].includes(value.name)&&o.firstRegistered)&&!(value.name!=='units'&&o.requested),'این درخواست قبلاً ثبت شده است.');
  {const text=normalizeDigits(value.value);requireParticipation((value.name==='expiry'?/^[0-9/]*$/:/^[0-9.]*$/).test(text),'فقط عدد وارد کن.');if(['units','onlineUnits'].includes(value.name))o[value.name]=text;else o.fields[value.name]=text;o.issue=null;}break;
 case 'register-first':idle();requireParticipation(o.identity&&o.slipScanned&&(o.version===1||o.held==='slip')&&!o.firstRegistered,'هویت و تصویر فیش لازم است.');if(!/^\d+$/.test(o.units)||Number(o.units)!==20){o.issue='first-amount';break;}commit('naturalSlip');o.firstRegistered=true;o.issue=null;break;
 case 'place-card':idle();requireParticipation(canPlaceParticipationCard(o),'کارت باید همراهت باشد و کارت‌خوان خالی باشد.');o.held=null;o.cardOnStand=true;break;
 case 'take-card':idle();requireParticipation(o.cardOnStand&&!o.held&&!o.requested,'کارت قابل برداشت نیست.');o.cardOnStand=false;o.held='bankcard';break;
 case 'read-card':idle();requireParticipation(o.cardOnStand&&!o.requested,'کارت را روی نگهدارنده قرار بده.');Object.assign(o.fields,{number:trainingCard.number,expiry:trainingCard.expiry,cvv:trainingCard.cvv});o.cardRead=true;break;
 case 'otp':idle();requireParticipation(o.firstRegistered&&o.cardOnStand&&!o.requested&&(o.version===1||o.phoneOwned&&o.cardRead&&o.slipFiled),'ابتدا فیش اول را در بسته بگذار و کارت را بخوان.');o.otpReady=false;o.fields.otp='';o.job={kind:'otp'};break;
 case 'otp-finish':requireParticipation(o.job?.kind==='otp','درخواست رمز شروع نشده است.');if(o.version===2){requireParticipation(typeof value==='string'&&/^\d{6}$/.test(value),'رمز پیامک معتبر نیست.');o.otpCode=value;}o.otpReady=true;o.job=null;break;
 case 'gateway':idle();requireParticipation(o.firstRegistered&&o.cardOnStand&&o.otpReady&&!o.requested,'خرید اول، کارت و رمز لازم‌اند.');
  if(!/^\d+$/.test(o.onlineUnits)||Number(o.onlineUnits)!==8){o.issue='online-amount';break;}
  if(Object.entries(trainingCard).some(([key,text])=>o.fields[key]!==(key==='otp'&&o.version===2?o.otpCode:text))){o.issue='card';break;}o.job={kind:'gateway'};o.issue=null;break;
 case 'gateway-finish':requireParticipation(o.job?.kind==='gateway','درخواست درگاه شروع نشده است.');commit('gateway');o.requested=true;o.job=null;break;
 case 'print':idle();requireParticipation(o.requested&&!o.printed,'رسید درخواست آماده چاپ نیست.');o.job={kind:'print'};break;
 case 'print-finish':requireParticipation(o.job?.kind==='print','چاپ شروع نشده است.');o.printed=true;o.job=null;break;
 case 'pickup':idle();requireParticipation(o.printed&&!o.receiptCollected&&!o.held,'ابتدا دستت را خالی کن؛ رسید باید روی سینی باشد.');o.job={kind:'pickup'};break;
 case 'pickup-finish':requireParticipation(o.job?.kind==='pickup','برداشت رسید شروع نشده است.');o.receiptCollected=true;o.held='gateway-receipt';o.job=null;break;
 case 'assemble':idle();requireParticipation(o.firstRegistered&&o.receiptCollected&&(o.version===1||o.slipFiled)&&o.held==='gateway-receipt'&&!o.assembled,'رسید چاپ‌شده را به میز خرید بیاور.');o.assembled=true;o.held=null;break;
 case 'collect-case':idle();requireParticipation(o.assembled&&!o.held&&!o.handed,'بسته مدارک آماده برداشت نیست.');o.held='dossier';break;
 case 'handoff':idle();requireParticipation(o.requested&&o.held==='dossier'&&!o.handed,'بسته دو خرید را از میز بردار.');o.handoffOrigin=exchangeOrigin(value,'participation');o.job={kind:'handoff'};break;
 case 'handoff-finish':requireParticipation(o.job?.kind==='handoff','تحویل شروع نشده است.');o.handed=true;o.held=null;o.job=null;next.role='manager';break;
 case 'leave':idle();requireParticipation(o.handed&&next.nodeId==='verifyBank'&&next.role==='manager','ابتدا بسته را به شبنم تحویل بده.');o.done=true;break;
 default:throw Error('عملیات خانه مشارکت نامعتبر است.');
 }
 return {...next,participation:o,events:[...events,{kind:'participation',node,action,...(value!==undefined?{value}:{})}]};
}
export function participationGuidance(state){
 const o=state.participation;
 if(o.version===2){
  if(!o.phoneOwned)return o.personalBoxOpen?'آیفون و کارت بانکی را از جعبه بردار.':'کیف و سپس جعبهٔ داخل آن را باز کن.';
  if(!o.identity)return 'انگشت را روی حسگر پذیرش بگذار تا هویت مانی تأیید شود.';
  if(!o.firstPaid)return 'در دستگاه حضوری مبلغ ۲۰۰ میلیون تومان را پرداخت کن.';
  if(!o.slipScanned)return o.held||o.loaded?'فیش را روی شیشه بگذار و اسکن کن.':'فیش را از دستگاه بگیر و به اسکنر ببر.';
  if(!o.firstRegistered)return 'اصل فیش را از شیشه بردار و ۲۰ واحد را پشت میز ثبت کن.';
  if(!o.slipFiled)return 'اصل فیش اول را در محل بسته روی میز بگذار.';
  if(!o.requested){
   if(!o.cardOnStand)return 'به درگاه پرداخت آنلاین برو و با E کارت را روی کارت‌خوان بگذار.';
   if(!o.cardRead)return 'در پنل درگاه، «خواندن اطلاعات کارت» را بزن.';
   if(!o.otpReady)return 'از درگاه رمز دوم درخواست کن.';
   return 'با کلید P گوشی را بالا بیاور، پیامک را بخوان و خرید ۸ واحد را ثبت کن.';
  }
 }
 if(o.version===1&&!o.idScanned)return 'کارت هویت مانی را از کیف بردار و اسکن کن.';
 if(!o.identity)return 'صاحب کارت و وضعیت سجام را در رایانه پذیرش تطبیق بده.';
 if(!o.firstRegistered)return 'فیش N-200 را اسکن کن و تعداد واحد خرید اول را در میز خرید ثبت کن.';
 if(!o.requested)return 'کارت بانکی را روی نگهدارنده بگذار و خرید دوم را با رمز تلفن ثبت کن.';
 if(!o.receiptCollected)return 'رسید N-80 را چاپ کن و از سینی بردار.';
 if(!o.assembled)return 'رسید چاپ‌شده را روی میز خرید کنار فیش اول بگذار.';
 if(!o.handed)return 'بسته دو خرید را از میز بردار و به شبنم بده.';
 return 'از در کنار کانتر به مرکز عملیات مالی برو.';
}
