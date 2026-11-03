import {challenges} from '../content/campaign.js';
import {exchangeOrigin,roleExchanges} from './roleExchange.js';
const requireParticipation=(ok,message)=>{if(!ok)throw Error(message);};
export const trainingCard={number:'1111222233334444',expiry:'09/09',cvv:'123',otp:'246810'};
export const participationDurations={scan:2.8,otp:1.2,gateway:3.2,print:2.5,pickup:1.2,handoff:roleExchanges.participation.duration};
export const inParticipation=s=>Boolean(s.participation&&!s.participation.done&&['naturalIdentity','naturalSlip','gateway','verifyBank'].includes(s.nodeId));
export const normalizeDigits=text=>String(text).replace(/[۰-۹٠-٩]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.includes(c)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(c):'٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[٬,\s]/g,'');
export function participationAction(state,action,value,core){
 requireParticipation(!state.ending,'سفر پایان یافته است.');const events=state.events,node=state.nodeId;
 if(action==='begin'){
  requireParticipation(!state.participation&&(!state.issuer||state.issuer.done)&&node==='naturalIdentity'&&state.ledger.published&&state.ledger.ownerSent,'طرح هنوز آماده مشارکت نیست.');
  return {...state,role:'client',participation:{version:1,wallet:false,held:null,lid:false,loaded:null,idScanned:false,slipScanned:false,idRecord:null,identity:false,units:'',firstRegistered:false,onlineUnits:'',cardOnStand:false,fields:{number:'',expiry:'',cvv:'',otp:''},otpReady:false,requested:false,printed:false,receiptCollected:false,assembled:false,handed:false,job:null,done:false,issue:null,revision:0},events:[...events,{kind:'participation',node,action}]};
 }
 requireParticipation(inParticipation(state),'خانه مشارکت فعال نیست.');
 const o={...state.participation,fields:{...state.participation.fields},revision:state.participation.revision+1};let next={...state,participation:o};
 const idle=()=>requireParticipation(!o.job,'وسیله هنوز در حال کار است.');
 const commit=id=>{requireParticipation(next.nodeId===id,'ترتیب تصمیم معتبر نیست.');const c=challenges.find(c=>c.id===id);next=core.travel(core.interact(next,'evidence'),'route-'+c.choices.findIndex(c=>c.correct));next.participation=o;next.role='client';};
 switch(action){
 case 'wallet':idle();o.wallet=!o.wallet;break;
 case 'take':idle();requireParticipation(o.wallet&&!o.held&&['id','slip','bankcard'].includes(value)&&o.loaded!==value&&!(value==='bankcard'&&o.cardOnStand),'مدرک در کیف در دسترس نیست.');o.held=value;break;
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
  {const text=normalizeDigits(value.value);requireParticipation((value.name==='expiry'?/^[0-9/]*$/:/^[0-9.]*$/).test(text),'فقط اعداد آموزشی را وارد کن.');if(['units','onlineUnits'].includes(value.name))o[value.name]=text;else o.fields[value.name]=text;o.issue=null;}break;
 case 'register-first':idle();requireParticipation(o.identity&&o.slipScanned&&!o.firstRegistered,'هویت و تصویر فیش لازم است.');if(!/^\d+$/.test(o.units)||Number(o.units)!==20){o.issue='first-amount';break;}commit('naturalSlip');o.firstRegistered=true;o.issue=null;break;
 case 'place-card':idle();requireParticipation(o.held==='bankcard'&&!o.cardOnStand,'کارت آموزشی را از کیف بردار.');o.held=null;o.cardOnStand=true;break;
 case 'take-card':idle();requireParticipation(o.cardOnStand&&!o.held&&!o.requested,'کارت قابل برداشت نیست.');o.cardOnStand=false;o.held='bankcard';break;
 case 'read-card':idle();requireParticipation(o.cardOnStand&&!o.requested,'کارت آموزشی را روی نگهدارنده قرار بده.');Object.assign(o.fields,{number:trainingCard.number,expiry:trainingCard.expiry,cvv:trainingCard.cvv});break;
 case 'otp':idle();requireParticipation(o.firstRegistered&&o.cardOnStand&&!o.requested,'درخواست اول و کارت آموزشی لازم‌اند.');o.job={kind:'otp'};break;
 case 'otp-finish':requireParticipation(o.job?.kind==='otp','درخواست رمز شروع نشده است.');o.otpReady=true;o.job=null;break;
 case 'gateway':idle();requireParticipation(o.firstRegistered&&o.cardOnStand&&o.otpReady&&!o.requested,'خرید اول، کارت و رمز آموزشی لازم‌اند.');
  if(!/^\d+$/.test(o.onlineUnits)||Number(o.onlineUnits)!==8){o.issue='online-amount';break;}
  if(Object.entries(trainingCard).some(([key,text])=>o.fields[key]!==text)){o.issue='card';break;}o.job={kind:'gateway'};o.issue=null;break;
 case 'gateway-finish':requireParticipation(o.job?.kind==='gateway','درخواست درگاه شروع نشده است.');commit('gateway');o.requested=true;o.job=null;break;
 case 'print':idle();requireParticipation(o.requested&&!o.printed,'رسید درخواست آماده چاپ نیست.');o.job={kind:'print'};break;
 case 'print-finish':requireParticipation(o.job?.kind==='print','چاپ شروع نشده است.');o.printed=true;o.job=null;break;
 case 'pickup':idle();requireParticipation(o.printed&&!o.receiptCollected&&!o.held,'ابتدا دستت را خالی کن؛ رسید باید روی سینی باشد.');o.job={kind:'pickup'};break;
 case 'pickup-finish':requireParticipation(o.job?.kind==='pickup','برداشت رسید شروع نشده است.');o.receiptCollected=true;o.held='gateway-receipt';o.job=null;break;
 case 'assemble':idle();requireParticipation(o.firstRegistered&&o.receiptCollected&&o.held==='gateway-receipt'&&!o.assembled,'رسید چاپ‌شده را به میز خرید بیاور.');o.assembled=true;o.held=null;break;
 case 'collect-case':idle();requireParticipation(o.assembled&&!o.held&&!o.handed,'بسته مدارک آماده برداشت نیست.');o.held='dossier';break;
 case 'handoff':idle();requireParticipation(o.requested&&o.held==='dossier'&&!o.handed,'بسته دو خرید را از میز بردار.');o.handoffOrigin=exchangeOrigin(value,'participation');o.job={kind:'handoff'};break;
 case 'handoff-finish':requireParticipation(o.job?.kind==='handoff','تحویل شروع نشده است.');o.handed=true;o.held=null;o.job=null;next.role='manager';break;
 case 'leave':idle();requireParticipation(o.handed&&next.nodeId==='verifyBank'&&next.role==='manager','ابتدا بسته را به سارا تحویل بده.');o.done=true;break;
 default:throw Error('عملیات خانه مشارکت نامعتبر است.');
 }
 return {...next,participation:o,events:[...events,{kind:'participation',node,action,...(value!==undefined?{value}:{})}]};
}
export function participationGuidance(state){const o=state.participation;
 if(!o.idScanned)return 'آرمان، طرح آفتاب برای مشارکت باز است. کیف تو روی میز کنار ورودی است. کارت هویت خودت را بردار و روی شیشه اسکنر بگذار؛ در را ببند و تصویر بگیر. اگر ترتیب کار را می‌دانی، بدون مراجعه به من ادامه بده.';
 if(!o.identity)return o.issue==='identity'?'تصویر کارت مربوط به آرمان است. پرونده دوستش یا سجام تأییدنشده، هویت معتبر آرمان نیست؛ در رایانه همان‌جا انتخابت را اصلاح کن.':'در رایانه پذیرش، صاحب کارت، وضعیت سجام، کد بورسی و اطلاعات بانکی را بررسی و هویت خودت را تأیید کن.';
 if(!o.firstRegistered)return 'فیش N-200 داخل کیف قبلاً پرداخت شده؛ وجه تازه دریافت نمی‌کنیم. آن را جدا اسکن کن. روی میز خرید، بیشترین تعداد واحد در بودجه ۲۰۰ میلیون را با قیمت ۱۰ میلیون، حداقل ۵۰ و سقف مجموع ۳۰۰ میلیون ثبت کن. پس از اسکن، مدرک را از شیشه بردار و به کیف برگردان.';
 if(!o.requested)return 'خرید اول ۲۰۰ میلیون ثبت شده است. برای خرید دوم ۸۰ میلیون بودجه داری و مجموع دو خرید باید زیر سقف ۳۰۰ بماند. کارت آموزشی را از کیف بردار و در نگهدارنده غرفه دیجیتال بگذار. اطلاعات کارت قابل خواندن است؛ رمز در تلفن کنار غرفه می‌رسد. همه اطلاعات ساختگی‌اند. این مرحله درخواست درگاه را ثبت می‌کند؛ تأیید بانک در بخش بعد است.';
 if(!o.receiptCollected)return 'رسید درخواست N-80 را از چاپگر چاپ کن و بردار. این برگه تأیید قطعی بانک نیست. اگر دستت پر است، مدرک شخصی را در کیف بگذار.';
 if(!o.assembled)return 'رسید چاپ‌شده را روی میز خرید کنار فیش اول بگذار و بسته دو خرید را آماده کن.';
 if(!o.handed)return 'بسته مدارک را از میز خرید بردار و به خود سارا پشت کانتر تحویل بده. او از همان محل ادامه می‌دهد و تو آرمان را از نگاه سارا می‌بینی.';
 return 'اکنون سارا هستی. آرمان مدارک را تحویل داده؛ از در خروج کنار کانتر به مرکز عملیات مالی برو تا پاسخ بانک، اعتبار فیش و ارسال را جدا بررسی کنی.';
}
