import {challenges,project} from '../content/campaign.js';
import {calculateCommitment} from './issuerWorkflow.js';

export const obligationsDurations={print:2.6,scan:2.8,calendar:4.2,receive:1.7,pickup:1.15,door:1.15,ribbon:5.2};
export const inObligations=s=>!s.ending&&['schedule','payment'].includes(s.nodeId)&&(!s.completion||s.completion.done);
export const obligationsState=s=>s.obligations??{held:null,contract:false,printed:false,month:0,loaded:false,scanned:false,job:null};
const requireStep=(condition,message)=>{if(!condition)throw new Error(message);};
const number=value=>Number(String(value??'').replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)%16)).replace(/[٬,\s]/g,''));
export function obligationsObjective(s){
 const o=obligationsState(s);
 if(o.wrapUp)return o.doorOpen?'به روبان قرمز در حیاط نزدیک شو و آن را ببر.':'پرداخت ثبت شد. از درِ انتهای سالن به حیاط گلخانه برو.';
 if(o.version===2&&o.contract&&!o.contractOpen)return 'قرارداد را روی میز باز کن و شرایط سود را بخوان.';
 if(s.nodeId==='schedule')return o.contract?'برنامه سود را در رایانه تقویم ثبت کن.':'قرارداد را از کمد بردار و روی میز محاسبه بگذار.';
 if(o.job==='print')return 'برنامه ثبت شد؛ برگه از چاپگر بیرون می‌آید.';
 if(!o.printed)return 'برنامه را چاپ کن و به اولین سررسید برو.';
 if(o.version===2&&o.printed&&!o.planDocked)return o.held==='plan'?'برنامه چاپی را کنار دستگاه زمان بگذار.':'برنامه چاپی را از سینی بردار.';
 if(o.job==='receive')return 'دستگاه مکاتبات در حال دریافت سند بانک است.';
 if(o.version===2&&o.scanned)return o.loaded?'اصل سند را از روی شیشه بردار.':'تصویر سند را با نوبت اول تقویم تطبیق بده.';
 if(!o.month)return 'از کارتابل زمان به پایان ماه سوم برو.';
 if(!o.loaded)return 'سند بانکی را از سینی مکاتبات به اسکنر ببر.';
 if(!o.scanned)return 'سند بانکی را اسکن کن.';
 return 'تصویر سند را با نوبت تقویم تطبیق بده و ثبت کن.';
}

export function obligationsAction(state,action,value,core){
 requireStep(inObligations(state),'دفتر تعهدات فعال نیست.');
 const o={...obligationsState(state)};
 const node=state.nodeId;
 let next=state;
 const commit=()=>{
  const challenge=challenges.find(c=>c.id===node);
  next=core.travel(core.interact(state,'evidence'),'route-'+challenge.choices.findIndex(c=>c.correct));
 };
 requireStep(!o.job||action===o.job+'-finish','دستگاه هنوز در حال کار است.');
 switch(action){
 case 'open-cabinet':
  requireStep(node==='schedule'&&!o.held&&!o.contract&&!o.cabinetOpen,'کشوی قرارداد در دسترس نیست.');o.cabinetOpen=true;break;
 case 'take-contract':
  requireStep(node==='schedule'&&!o.held&&!o.contract,'قرارداد روی میز کار است.');
  o.version=core.replay&&value===undefined?1:2;
  if(o.version===2&&value!==3)value=2;
  if(!core.replay||value===3){requireStep(o.cabinetOpen,'اول کشو را باز کن.');value=3;o.job='pickup';}
  else o.held='contract';
  break;
 case 'pickup-finish':
  requireStep(o.job==='pickup','برداشتن قرارداد آغاز نشده است.');o.job=null;o.held='contract';o.cabinetOpen=false;break;
 case 'place-contract':
  requireStep(o.held==='contract','قرارداد را از کمد بردار.');
  o.held=null;
  o.contract=true;
  break;
 case 'open-contract':
  requireStep(o.version===2&&o.contract&&!o.contractOpen,'قرارداد باید روی میز باشد.');o.contractOpen=true;break;
 case 'schedule': {
  requireStep(node==='schedule'&&o.contract&&(o.version!==2||o.contractOpen),'قرارداد باید روی میز باشد.');
  const {annual,interval,duration,count,amount}=value??{};
  requireStep(number(annual)===24&&number(interval)===3&&number(duration)===12&&number(count)===4&&number(amount)===project.total*24/100/4,'نرخ، فاصله، مدت، تعداد و مبلغ هر نوبت را با قرارداد و محاسبه تطبیق بده.');
  commit();
  if(!core.replay||value.autoPrint===true){value={...value,autoPrint:true};o.job='print';}
  break;
 }
 case 'print':
  requireStep(node==='payment'&&!o.printed,'برنامه ثبت‌شده آماده چاپ نیست.');
  o.job='print';
  break;
 case 'print-finish':
  requireStep(o.job==='print','چاپ شروع نشده است.');
  o.job=null;
  o.printed=true;
  break;
 case 'take-plan':
  requireStep(o.version===2&&o.printed&&!o.planDocked&&!o.held,'برنامه چاپی در سینی نیست.');o.held='plan';break;
 case 'dock-plan':
  requireStep(o.held==='plan','برنامه چاپی را بیاور.');o.held=null;o.planDocked=true;break;
 case 'calendar':
  requireStep(node==='payment'&&o.printed&&!o.month&&(o.version!==2||o.planDocked),'ابتدا نسخه برنامه را چاپ کن.');
  o.job='calendar';
  break;
 case 'calendar-finish':
  requireStep(o.job==='calendar','ورق زدن تقویم آغاز نشده است.');
  o.job=null;
  o.month=3;
  if(o.version===2)o.job='receive';
  break;
 case 'receive-finish':
  requireStep(o.job==='receive','دریافت سند آغاز نشده است.');o.job=null;o.bankReady=true;break;
 case 'advance':
  requireStep(o.version!==2&&node==='payment'&&o.printed&&!o.month,'ابتدا نسخه برنامه را چاپ کن.');
  o.month=3;
  break;
 case 'take-bank':
  requireStep(o.month===3&&!o.held&&!o.loaded&&(o.version!==2||o.bankReady&&!o.scanned),'سند جدید در سینی نیست.');
  o.held='bank';
  break;
 case 'load':
  requireStep(o.held==='bank'&&!o.loaded,'سند بانکی را در دست بگیر.');
  o.held=null;
  o.loaded=true;
  break;
 case 'scan':
  requireStep(o.loaded&&!o.scanned,'سند باید روی شیشه اسکنر باشد.');
  o.job='scan';
  break;
 case 'scan-finish':
  requireStep(o.job==='scan','اسکن شروع نشده است.');
  o.job=null;
  o.scanned=true;
  break;
 case 'unload':
  requireStep(o.version===2&&o.loaded&&o.scanned&&!o.held,'اسکن را کامل کن.');o.loaded=false;o.held='bank';break;
 case 'open-ceremony-door':
  requireStep(o.wrapUp&&!o.doorOpen,'درِ مراسم هنوز در دسترس نیست.');o.job='door';break;
 case 'door-finish':
  requireStep(o.job==='door','در هنوز فعال نشده است.');o.job=null;o.doorOpen=true;break;
 case 'cut-ribbon':
  requireStep(o.doorOpen&&o.wrapUp,'از در وارد حیاط شو.');o.held=null;o.job='ribbon';break;
 case 'ribbon-finish':
  requireStep(o.job==='ribbon','مراسم آغاز نشده است.');o.job=null;o.ribbonCut=true;
  next={...state,...o.wrapUp};o.closed=true;break;
 case 'close-file':
  requireStep(core.replay&&o.wrapUp,'برای پایان به حیاط برو.');next={...state,...o.wrapUp};o.closed=true;break;
 case 'payment':
  requireStep(node==='payment'&&o.scanned&&!o.wrapUp&&(o.version!==2||o.held==='bank'),'تصویر سند بانکی لازم است.');
  requireStep(number(value?.installment)===1&&number(value?.amount)===state.ledger.schedule[0]?.amount&&value?.success==='yes','شماره نوبت، مبلغ و نتیجه را با سند بانکی تطبیق بده.');
  commit();
  if(!core.replay||value.review===true){value={...value,review:true};o.bankFiled=true;o.held=null;o.wrapUp={nodeId:next.nodeId,ending:next.ending,role:next.role};next={...next,nodeId:node,ending:null,role:state.role};}
  break;
 default: throw new Error('عملیات تعهدات نامعتبر است.');
 }
 return {...next,obligations:o,events:[...state.events,{kind:'obligations',node,action,...(value===undefined?{}:{value})}]};
}
export const calculateObligations=expression=>calculateCommitment(String(expression).replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)%16)));
