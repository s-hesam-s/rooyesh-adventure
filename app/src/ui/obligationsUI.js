import {obligationsFixtures} from '../game/obligationsRoom.js';
import {obligationsObjective,obligationsState} from '../game/obligationsWorkflow.js';

const actions=content=>'<div class="office-actions">'+content+'</div>';
const submit=label=>actions('<button type="submit">'+label+'</button>');
const button=(action,label)=>actions('<button type="button" data-obligation="'+action+'">'+label+'</button>');
const field=(name,label,inputmode)=>'<label class="participation-field"><span>'+label+'</span><input name="'+name+'"'+(inputmode?' inputmode="'+inputmode+'"':'')+' autocomplete="off"></label>';
const rows=s=>s.ledger.schedule.map(r=>'<li>ماه '+(r.month).toLocaleString('fa-IR')+' · '+r.amount.toLocaleString('fa-IR')+' میلیون تومان · '+(r.paid?'پرداخت‌شده':'پرداخت‌نشده')+'</li>').join('');
export function obligationsPanel(s,station){
 const o=obligationsState(s);
 const title=obligationsFixtures.find(f=>f.id===station)?.name??(station==='ceremony-door'?'درِ حیاط گلخانه':'روبان افتتاح گلخانه');
 let body='';
 if(o.job)return {title,body:'<progress class="obligations-progress" max="1" value="0" aria-label="پیشرفت دستگاه"></progress>'};
 switch(station){
 case 'ceremony-door':body=o.doorOpen?'<p>مسیر حیاط باز است.</p>':button('open-ceremony-door','باز کردن درِ حیاط');break;
 case 'ceremony-ribbon':body=button('cut-ribbon','برداشتن قیچی و بریدن روبان');break;
 case 'guide':body='<p class="office-speech">'+obligationsObjective(s)+'</p>';break;
 case 'archive':body=s.nodeId==='schedule'&&!o.contract&&!o.held?o.cabinetOpen?button('take-contract','برداشتن پوشه قرارداد'):button('open-cabinet','باز کردن کشوی قرارداد'):'<p>قرارداد از کمد برداشته شده است.</p>';break;
 case 'desk':
  body=o.held==='contract'?button('place-contract','گذاشتن قرارداد روی میز'):o.contract&&o.version===2&&!o.contractOpen?button('open-contract','باز کردن قرارداد'):o.contract?'<p>قرارداد آفتاب · اصل سرمایه ۱٬۰۰۰ میلیون تومان · نرخ سالانه ۲۴٪ · مدت ۱۲ ماه · دوره سه‌ماهه</p><form data-obligation-form="calculate">'+field('expression','عبارت ماشین‌حساب')+submit('محاسبه')+'<output class="participation-preview" aria-live="polite"></output></form>':'<p>میز محاسبه آماده است.</p>';
  break;
 case 'schedule':
  body=s.nodeId==='payment'?'<ol>'+rows(s)+'</ol>':o.contract&&(o.version!==2||o.contractOpen)?'<form data-obligation-form="schedule">'+field('annual','نرخ سالانه (درصد)','numeric')+field('duration','مدت (ماه)','numeric')+field('interval','فاصله پرداخت (ماه)','numeric')+field('count','تعداد نوبت','numeric')+field('amount','مبلغ هر نوبت (میلیون تومان)','numeric')+submit('ثبت برنامه')+'</form>':'<p>قرارداد هنوز روی میز کار نیست.</p>';
  break;
 case 'printer':body=o.version===2&&o.printed&&!o.held&&!o.planDocked?button('take-plan','برداشتن برنامه از چاپگر'):o.printed?'<p>نسخه چاپی برنامه در سینی خروجی است.</p>':s.nodeId==='payment'?button('print','چاپ برنامه'):'<p>برنامه ثبت‌شده‌ای برای چاپ وجود ندارد.</p>';break;
 case 'inbox':body=o.month&&!o.held&&!o.loaded&&(o.version!==2||o.bankReady&&!o.scanned)?button('take-bank','برداشتن سند بانکی'):'<p>سند تازه‌ای در سینی نیست.</p>';break;
 case 'scanner':body=o.version===2&&o.scanned&&o.loaded?button('unload','برداشتن اصل سند از شیشه'):o.held==='bank'&&!o.scanned?button('load','گذاشتن سند روی شیشه'):o.scanned?'<p>تصویر سند در رایانه ثبت آماده است.</p>':o.loaded?button('scan','اسکن سند'):'<p>شیشه اسکنر خالی است.</p>';break;
 case 'payment':
  body=o.wrapUp?'<p>ثبت شد · INTEREST-1 · ۶۰ میلیون تومان</p><ol>'+rows(s)+'</ol>'+'<p>برای مراسم افتتاح، از درِ انتهای سالن به حیاط برو.</p>':o.scanned&&(o.version!==2||o.held==='bank')?'<p>تصویر سند بانکی · INTEREST-1 · نوبت ۱ · ۶۰ میلیون تومان · موفق</p><ol>'+rows(s)+'</ol><form data-obligation-form="payment">'+field('installment','شماره نوبت','numeric')+field('amount','مبلغ (میلیون تومان)','numeric')+'<label class="participation-field"><span>نتیجه بانک</span><select name="success"><option value="">انتخاب</option><option value="yes">موفق</option><option value="no">ناموفق</option></select></label>'+submit('ثبت پرداخت همین نوبت')+'</form>':'<p>تصویر سند بانکی دریافت نشده است.</p>';
  break;
 }
 return {title,body,guide:station==='guide'};
}
