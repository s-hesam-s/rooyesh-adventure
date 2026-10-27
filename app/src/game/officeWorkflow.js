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
 switch(action){
 case 'refer':requireOffice(!o.referral,'نامه قبلاً تحویل شده است.');o.referral=true;break;
 case 'drawer':o.drawer=!o.drawer;break;
 case 'take':requireOffice(o.referral&&o.drawer&&!o.folder&&Object.hasOwn(officeFiles,value),'پوشه قابل برداشت نیست.');o.folder=value;o.onDesk=false;o.open=false;o.issue=null;break;
 case 'return':requireOffice(o.drawer&&o.folder&&!o.onDesk&&!o.attached&&!o.scanning,'پوشه باید در دست باشد.');Object.assign(o,{folder:null,open:false,checks:[],matched:false,sheet:false,scanned:false,issue:null});break;
 case 'place':requireOffice(o.folder&&!o.onDesk,'پوشه در دست نیست.');o.onDesk=true;break;
 case 'lift':requireOffice(o.onDesk&&!o.matched,'بررسی این پوشه در جریان است.');o.onDesk=false;o.open=false;break;
 case 'open':requireOffice(o.onDesk,'پوشه روی میز نیست.');o.open=!o.open;break;
 case 'check':requireOffice(o.onDesk&&o.open&&!o.matched&&officeFields.includes(value),'ردیف قابل بررسی نیست.');o.checks=o.checks.includes(value)?o.checks.filter(x=>x!==value):[...o.checks,value];break;
 case 'match':{
  requireOffice(o.onDesk&&o.open&&o.checks.length===4&&!o.matched,'چهار ردیف باید بررسی شوند.');
  if(o.folder!=='working'){o.issue='mismatch';break;}o.matched=true;o.issue=null;break;
 }
 case 'lid':requireOffice(!o.scanning,'اسکن در حال انجام است.');o.lid=!o.lid;break;
 case 'sheet':requireOffice(o.matched&&o.lid&&!o.sheet,'برگه آماده نیست.');o.sheet=true;break;
 case 'scan-start':requireOffice(o.sheet&&!o.lid&&!o.scanning&&!o.scanned,'اسکنر آماده نیست.');o.scanning=true;break;
 case 'scan-finish':requireOffice(o.scanning&&!o.lid&&o.sheet,'اسکن شروع نشده است.');o.scanning=false;o.scanned=true;break;
 case 'attach':{
  requireOffice(o.scanned&&!o.attached&&o.matched,'تصویر آماده پیوست نیست.');
  if(next.nodeId==='project')next=core.travel(core.interact(next,'evidence'),'route-1');
  requireOffice(next.nodeId==='window'&&next.completed.includes('project'),'پرونده مبنا معتبر نیست.');
  o.attached=true;o.statusRead=true;next.office=o;break;
 }
 case 'calendar':o.calendar=true;break;
 case 'terminal':if(o.attached)o.statusRead=true;break;
 case 'public':requireOffice(o.attached&&!o.handed&&!o.reviewed,'این تنظیم در دسترس نیست.');o.publicRequested=!o.publicRequested;o.reviewed=false;break;
 case 'review':
  requireOffice(o.attached&&o.statusRead&&o.calendar&&!o.handed,'بررسی کامل نشده است.');
  if(o.publicRequested){o.issue='premature';break;}if(next.nodeId==='window')next=core.travel(core.interact(next,'evidence'),'route-0');requireOffice(next.completed.includes('window'),'ثبت بازبینی معتبر نیست.');o.reviewed=true;o.issue=null;next.office=o;next.role='manager';break;
 case 'handoff':requireOffice(o.reviewed&&!o.publicRequested&&!o.handed,'بررسی کامل نشده است.');o.handed=true;break;
 case 'leave':
  requireOffice(o.handed&&o.reviewed&&!o.publicRequested,'نتیجه هنوز تحویل نشده است.');
  requireOffice(next.nodeId==='ownerIdentity'&&next.completed.includes('window'),'مقصد دفتر معتبر نیست.');o.done=true;next.office=o;next.role='owner';break;
 default:throw Error('عملیات دفتر نامعتبر است.');
 }
 return {...next,office:o,events:[...events,{kind:'office',node,action,...(value!==undefined?{value}: {})}]};
}
export function officeGuidance(state){
 const o=state.office;
 if(!o.referral)return {text:'سلام سارا. پرونده گلخانه آفتاب را برای شروع کار بررسی می‌کنیم. این نامه ارجاع را بگیر؛ شرکت مجری آفتاب است. پوشه‌ها در کشوی بایگانی‌اند. پرونده را روی میز بررسی وسط دفتر باز کن و با سابقه رایانه تطبیق بده.',action:'refer',label:'دریافت نامه ارجاع'};
 if(o.issue==='mismatch'){const f=officeFiles[o.folder];return {text:f?.unit!==10?'در پوشه‌ای که آوردی، قیمت واحد ۵ میلیون است؛ سابقه ثبت‌شده ۱۰ میلیون را نشان می‌دهد. این نسخه مبنای کار نیست. پوشه را از میز بردار، به کشو برگردان و نسخه دیگر آفتاب را بررسی کن.':'این پرونده متعلق به مهتاب است. مبلغ یکسان کافی نیست؛ نام طرح و شرکت مجری باید آفتاب باشند. پوشه را به کشو برگردان و پرونده آفتاب را بیاور.'};}
 if(!o.folder)return {text:'کشوی بایگانی را باز کن و پوشه آفتاب را بیاور. نام طرح و شرکت روی نامه ارجاع است. نسخه‌ها را روی میز بررسی باز کن؛ سابقه معتبر روی رایانه است.'};
 if(!o.onDesk)return {text:'پوشه را روی میز بررسی بگذار. جلدش را باز کن تا اطلاعات برگه دیده شود. بعد پشت رایانه، چهار مشخصه را با سابقه ثبت‌شده مقایسه کن.'};
 if(!o.matched)return {text:'نام طرح، شرکت مجری، مبلغ کل و قیمت واحد را با هم بررسی کن. روی رایانه، برگه پوشه کنار سابقه ثبت‌شده دیده می‌شود. فقط ردیف‌هایی را که تطبیق داده‌ای تأیید کن و نتیجه را ثبت کن.'};
 if(!o.scanned)return {text:'اطلاعات پوشه مطابق است. در اسکنر را باز کن و برگه خلاصه را روی شیشه بگذار. در را ببند و اسکن را شروع کن؛ پس از پایان، تصویر را از رایانه به پرونده پیوست کن.'};
 if(!o.attached)return {text:'تصویر آماده است. از رایانه، اسکن را به پرونده کاری پیوست کن. بعد روز امروز را با مهلت روی پرونده مقایسه می‌کنیم.'};
 if(o.issue==='premature')return {text:'امروز داخل مهلت است، اما تعهد شرکت هنوز ثبت و ارسال نشده. خرید عمومی باید بسته بماند. در رایانه دسترسی خرید را خاموش نگه دار و بازبینی را ثبت کن؛ انتشار بعد از تکمیل تعهد انجام می‌شود.'};
 if(!o.reviewed)return {text:'تقویم روی میز کناری را ببین: امروز روز دهم است. مهلت از روز اول تا سی‌ام و وضعیت رسمی شماره ۵، آغاز جمع‌آوری، است. این وضعیت به معنی موفقیت نهایی نیست. چون تعهد مجری هنوز انجام نشده، دسترسی خرید عمومی را بسته نگه دار و بازبینی را در رایانه ثبت کن.'};
 if(!o.handed)return {text:'بررسی کامل است: پرونده آفتاب مبناست، زمان معتبر است و خرید عمومی هنوز بسته می‌ماند. نتیجه را تحویل بده تا با نادر در کارگاه شرکت، تعهد مجری را آماده کنیم.',action:'handoff',label:'تحویل نتیجه بررسی'};
 return {text:'نتیجه ثبت شد. از در خروج کنار میز من به کارگاه شرکت آفتاب برو؛ آنجا در نقش نادر، تعهد مجری را آماده می‌کنی.'};
}
