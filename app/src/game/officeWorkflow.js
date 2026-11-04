import {exchangeOrigin} from './roleExchange.js';
import {project} from '../content/campaign.js';
export const officeFiles={
 working:{label:'آفتاب · پوشه ۲',title:'گلخانه آفتاب',owner:'شرکت آفتاب',total:1000,unit:10},
 previous:{label:'آفتاب · پوشه ۱',title:'گلخانه آفتاب',owner:'شرکت آفتاب',total:1000,unit:5},
 other:{label:'مهتاب',title:'گلخانه مهتاب',owner:'شرکت مهتاب',total:1000,unit:10}
};
export const officeFields=['title','owner','total','unit'];
const requireOffice=(value,message)=>{if(!value)throw Error(message);};
export const inOffice=state=>Boolean(state.office&&!state.office.done&&(['project','window'].includes(state.nodeId)||(state.nodeId==='ownerIdentity'&&state.office.reviewed)));
export function officeAction(state,action,value,core){
 requireOffice(!state.ending,'سفر پایان یافته است.');
 const node=state.nodeId,events=state.events;
 if(action==='begin'){
  requireOffice(!state.office&&['project','window'].includes(node),'این پرونده قابل شروع نیست.');
  return {...state,office:{version:1,referral:false,drawer:false,folder:null,onDesk:false,open:false,checks:[],matched:false,lid:false,sheet:false,scanning:false,scanned:false,attached:false,calendar:false,statusRead:false,publicRequested:false,reviewed:false,handed:false,done:false,issue:null,revision:0},events:[...events,{kind:'office',node,action}]};
 }
 requireOffice(inOffice(state),'دفتر فعال نیست.');
 const o={...state.office,checks:[...state.office.checks],revision:state.office.revision+1};let next={...state,office:o};
 requireOffice(!o.handoffPending||action==='handoff-finish','تحویل پرونده در حال انجام است.');
 switch(action){
 case 'refer':requireOffice(!o.referral,'نامه قبلاً تحویل شده است.');o.referral=true;break;
 case 'drawer':o.drawer=!o.drawer;break;
 case 'take':requireOffice(o.drawer&&!o.folder&&Object.hasOwn(officeFiles,value),'پوشه قابل برداشت نیست.');o.folder=value;o.onDesk=false;o.open=false;o.issue=null;break;
 case 'return':requireOffice(o.drawer&&o.folder&&!o.onDesk&&!o.attached&&!o.scanning,'پوشه باید در دست باشد.');Object.assign(o,{folder:null,open:false,checks:[],matched:false,sheet:false,scanned:false,issue:null});break;
 case 'place':requireOffice(o.folder&&!o.onDesk,'پوشه در دست نیست.');o.onDesk=true;break;
 case 'lift':requireOffice(o.onDesk&&!o.matched,'بررسی این پوشه در جریان است.');o.onDesk=false;o.open=false;break;
 case 'open':requireOffice(o.onDesk,'پوشه روی میز نیست.');o.open=!o.open;break;
 case 'check':requireOffice(o.onDesk&&o.open&&!o.matched&&officeFields.includes(value),'ردیف قابل بررسی نیست.');o.checks=o.checks.includes(value)?o.checks.filter(x=>x!==value):[...o.checks,value];break;
 case 'match':{
  requireOffice(o.onDesk&&o.open&&o.checks.length===4&&!o.matched,'چهار ردیف باید بررسی شوند.');
  if(o.folder!=='working'){o.issue='mismatch';break;}o.matched=true;o.printing=true;o.issue=null;break;
 }
 case 'lid':requireOffice(!o.scanning,'اسکن در حال انجام است.');o.lid=!o.lid;break;
 case 'print-finish':
  requireOffice(o.printing,'چاپ شروع نشده است.');
  o.printing=false;
  o.paper='tray';
  break;
 case 'take-print':
  requireOffice(o.paper==='tray','برگه هنوز در سینی چاپگر نیست.');
  o.paper='hand';
  break;
 case 'sheet': {
  const legacy=core.replay&&o.paper===undefined;
  requireOffice(o.matched&&o.lid&&!o.sheet&&(o.paper==='hand'||legacy),'برگهٔ چاپ‌شده را از چاپگر بردار و در اسکنر را باز کن.');
  if(legacy){delete o.printing;}
  else o.paper='glass';
  o.sheet=true;
  break;
 }
 case 'take-scanned':
  requireOffice(o.sheet&&o.scanned&&o.lid,'اسکن باید تمام شود و در اسکنر باز باشد.');
  o.paper='scanned-hand';
  o.sheet=false;
  break;
 case 'scan-start':requireOffice(o.sheet&&!o.lid&&!o.scanning&&!o.scanned,'اسکنر آماده نیست.');o.scanning=true;break;
 case 'scan-finish':requireOffice(o.scanning&&!o.lid&&o.sheet,'اسکن شروع نشده است.');o.scanning=false;o.scanned=true;break;
 case 'attach':{
  requireOffice(o.scanned&&!o.attached&&o.matched&&(o.paper==='scanned-hand'||core.replay&&o.paper===undefined),'تصویر آماده پیوست نیست.');
  if(next.nodeId==='project')next=core.travel(core.interact(next,'evidence'),'route-1');
  requireOffice(next.nodeId==='window'&&next.completed.includes('project'),'پرونده مبنا معتبر نیست.');
  o.attached=true;if(o.paper)o.paper='filed';o.statusRead=true;next.office=o;break;
 }
 case 'calendar':
  if(!o.attached&&!core.replay)return state;
  o.calendar=true;
  break;
 case 'terminal':if(o.attached)o.statusRead=true;break;
 case 'public':requireOffice(o.attached&&!o.handed&&!o.reviewed,'این تنظیم در دسترس نیست.');o.publicRequested=!o.publicRequested;o.reviewed=false;break;
 case 'review':
  requireOffice(o.attached&&o.statusRead&&o.calendar&&!o.handed,'بررسی کامل نشده است.');
  if(o.publicRequested){o.issue='premature';break;}if(next.nodeId==='window')next=core.travel(core.interact(next,'evidence'),'route-0');requireOffice(next.completed.includes('window'),'ثبت بازبینی معتبر نیست.');o.reviewed=true;o.issue=null;next.office=o;next.role='manager';break;
 case 'collect-case':requireOffice(o.reviewed&&!o.handed&&!o.caseCarried,'بسته نتیجه آماده برداشت نیست.');o.caseCarried=true;o.open=false;break;
 case 'handoff-start':requireOffice(o.caseCarried&&o.reviewed&&!o.publicRequested&&!o.handed&&!o.scanning,'نتیجه برای تحویل آماده نیست.');o.handoffOrigin=exchangeOrigin(value,'office');o.handoffPending=true;break;
 case 'handoff-finish':requireOffice(o.handoffPending,'تحویل شروع نشده است.');o.handoffPending=false;o.handed=true;o.caseCarried=false;next.role='owner';break;
 case 'handoff':requireOffice(o.reviewed&&!o.publicRequested&&!o.handed,'بررسی کامل نشده است.');o.handed=true;break;
 case 'leave':
  requireOffice(o.handed&&o.reviewed&&!o.publicRequested,'نتیجه هنوز تحویل نشده است.');
  requireOffice(next.nodeId==='ownerIdentity'&&next.completed.includes('window'),'مقصد دفتر معتبر نیست.');o.done=true;next.office=o;next.role='owner';break;
 default:throw Error('عملیات دفتر نامعتبر است.');
 }
 return {...next,office:o,events:[...events,{kind:'office',node,action,...(value!==undefined?{value}: {})}]};
}
export function officeObjective(state){
 const o=state.office;
 if(o.handed)return 'به پایگاه گلخانه برو تا در نقش نادر تعهد شرکت را آماده کنی.';
 if(o.caseCarried)return 'بسته را به نادر بده تا نتیجهٔ بررسی به مجری طرح برسد.';
 if(o.reviewed)return 'بستهٔ نتیجه را از میز بردار تا آن را به نمایندهٔ شرکت تحویل بدهی.';
 if(o.calendar)return 'وضعیت طرح را در رایانه ثبت کن. تا تعهد مجری ارسال شود، خرید عمومی بسته می‌ماند.';
 if(o.attached)return 'در تقویم، امروز را با مهلت همین پرونده مقایسه و نتیجه را ثبت کن.';
 if(o.scanned&&o.sheet)return 'در اسکنر را باز کن و اصل برگه را بردار تا در پرونده بماند.';
 if(o.scanned)return 'تصویر را در رایانه پیوست کن تا مدرکِ تطبیق‌داده‌شده در پرونده بماند.';
 if(o.printing)return 'چاپگر خلاصهٔ تطبیق را برای پرونده چاپ می‌کند.';
 if(o.paper==='tray')return 'خلاصهٔ تطبیق را از سینی چاپگر بردار و به اسکنر ببر.';
 if(o.matched)return 'برگهٔ تأییدشده را اسکن کن تا نسخهٔ دیجیتال آن آماده شود.';
 if(o.issue==='mismatch')return 'مغایرت رایانه را بخوان و پوشه‌ای را بیاور که با سابقهٔ فرابورس مطابق است.';
 if(o.open)return 'اطلاعات پوشه را در رایانه با سابقهٔ فرابورس تطبیق بده تا نسخهٔ معتبر مشخص شود.';
 if(o.onDesk)return 'پوشه را باز کن تا مشخصات سند برای تطبیق در دسترس باشد.';
 if(o.folder)return 'پوشه را روی میز بررسی بگذار تا محتوای آن را با سابقه تطبیق بدهی.';
 return 'ارجاع کار و برچسب پوشه‌ها را در کشوی بایگانی مقایسه کن تا نسخهٔ درست را برداری.';
}
export function officeGuidance(state){
 const o=state.office;
 if(o.issue==='mismatch')return {text:officeFiles[o.folder]?.unit!==10?'قیمت واحد این پوشه ۵ میلیون است. پوشه را برگردان و نسخه آفتاب با قیمت واحد ۱۰ میلیون را بیاور.':'این پوشه برای مهتاب است. آن را به کشو برگردان و پوشه گلخانه آفتاب را بیاور.'};
 if(!o.folder)return {text:'پوشه گلخانه آفتاب را از کشوی بایگانی بردار.'};
 if(o.handed)return {text:'از در خروج به پایگاه گلخانه برو.'};
 if(!o.onDesk)return {text:'پوشه را روی میز بررسی بگذار و باز کن.'};
 if(!o.open&&!o.matched)return {text:'پوشه را روی میز باز کن.'};
 if(!o.matched)return {text:'نام طرح، مجری، مبلغ کل و قیمت واحد را در رایانه تطبیق بده.'};
 if(o.printing||o.paper==='tray'||o.scanned&&o.sheet)return {text:officeObjective(state)};
 if(!o.scanned)return {text:'برگه خلاصه را روی شیشه اسکنر بگذار، در را ببند و اسکن کن.'};
 if(!o.attached)return {text:'تصویر اسکن‌شده را در رایانه به پرونده پیوست کن.'};
 if(!o.calendar)return {text:'حالا مهلت همین پرونده را در تقویم بررسی کن.'};
 if(!o.reviewed)return {text:'مهلت را در تقویم بررسی کن و تا ارسال تعهد مجری، خرید عمومی را بسته نگه دار.'};
 if(o.caseCarried)return {text:'بسته را به نادر کنار در خروج بده.'};
 return {text:'بستهٔ نتیجه را از میز بررسی بردار.'};
}
