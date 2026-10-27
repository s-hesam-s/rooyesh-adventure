import {officeFiles,officeFields,officeGuidance} from '../game/officeWorkflow.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>new Intl.NumberFormat('fa-IR').format(n);
const button=(action,label,value=null,disabled=false)=>'<button type="button" data-office="'+action+'"'+(value!==null?' data-office-value="'+esc(value)+'"':'')+(disabled?' disabled':'')+'>'+esc(label)+'</button>';
const labels={title:'نام طرح',owner:'شرکت مجری',total:'مبلغ کل · میلیون تومان',unit:'قیمت واحد · میلیون تومان'};
const values={title:'گلخانه آفتاب',owner:'شرکت آفتاب',total:1000,unit:10};
const value=x=>typeof x==='number'?fa(x):esc(x);
function fileRows(f){return '<dl class="office-data">'+officeFields.map(k=>'<div><dt>'+labels[k]+'</dt><dd>'+value(f[k])+'</dd></div>').join('')+'</dl>';}
export function officePanel(state,station){
 const o=state.office,f=officeFiles[o.folder],controls=x=>'<div class="office-actions">'+x+'</div>';let body='',title='';
 if(station==='nima'){const g=officeGuidance(state);return {title:'نیما · مسئول بایگانی',guide:true,body:'<p class="office-speech">'+esc(g.text)+'</p>'+controls(g.action?button(g.action,g.label):'')};}
 if(station==='drawer'){title='کشوی پرونده‌ها';body=controls(button('drawer',o.drawer?'بستن کشو':'بازکردن کشو'));if(o.drawer){if(o.folder&&!o.onDesk)body+=controls(button('return','قرار دادن پوشه در کشو',null,o.attached||o.scanning));else if(!o.folder)body+=controls(Object.entries(officeFiles).map(([id,f])=>button('take',f.label,id,!o.referral)).join(''));else body+='<p class="office-status">پوشه روی میز بررسی است.</p>';}}
 else if(station==='desk'){title='میز بررسی';if(!f)body='<p class="office-status">سطح کار خالی</p>';else if(!o.onDesk)body=controls(button('place','گذاشتن پوشه روی میز'));else{body=controls(button('open',o.open?'بستن جلد پوشه':'بازکردن جلد پوشه'));if(o.open)body+=fileRows(f);if(!o.matched)body+=controls(button('lift','برداشتن پوشه'));}}
 else if(station==='terminal'){
  title='سامانه پرونده طرح';
  if(!o.matched){body='<table class="office-compare"><thead><tr><th>مشخصه</th><th>سابقه ثبت‌شده</th><th>برگه پوشه</th><th>تطبیق</th></tr></thead><tbody>'+officeFields.map(k=>'<tr><th>'+labels[k]+'</th><td>'+value(values[k])+'</td><td>'+(f&&o.open?value(f[k]):'—')+'</td><td><label><input type="checkbox" aria-label="تطبیق '+labels[k]+'" data-office-check="'+k+'" '+(o.checks.includes(k)?'checked ':'')+(!o.onDesk||!o.open?'disabled':'')+'></label></td></tr>').join('')+'</tbody></table>'+controls(button('match','ثبت تطبیق',null,o.checks.length!==4));if(o.issue==='mismatch')body+='<p class="office-status">تطابق ندارد</p>';}
  else{body='<p class="office-status">پرونده آفتاب · اطلاعات مطابق</p><dl class="office-data"><div><dt>پیوست تصویر</dt><dd>'+(o.attached?'ثبت‌شده':o.scanned?'تصویر آماده':'بدون تصویر')+'</dd></div></dl>';if(!o.attached)body+=controls(button('attach','پیوست تصویر اسکن',null,!o.scanned));}
  if(o.attached){body+='<dl class="office-data"><div><dt>وضعیت رسمی طرح</dt><dd>۵ · آغاز جمع‌آوری وجوه</dd></div><div><dt>مهلت</dt><dd>روز ۱ تا ۳۰</dd></div><div><dt>تعهد مجری</dt><dd>تکمیل نشده</dd></div><div><dt>خرید عمومی</dt><dd>بسته</dd></div></dl><label class="office-setting"><input type="checkbox" data-office-check="public" '+(o.publicRequested?'checked ':'')+(o.handed||o.reviewed?'disabled':'')+'>درخواست بازکردن خرید عمومی</label>'+controls(button('review','ثبت بازبینی زمان و وضعیت',null,!o.calendar||o.handed||o.reviewed));if(o.reviewed)body+='<p class="office-status">بازبینی ثبت شد</p>';if(o.issue==='premature')body+='<p class="office-status">پیش‌نیاز انتشار کامل نیست</p>';}
 }
 else if(station==='scanner'){title='اسکنر';body='<dl class="office-data"><div><dt>در اسکنر</dt><dd>'+(o.lid?'باز':'بسته')+'</dd></div><div><dt>برگه</dt><dd>'+(o.sheet?'روی شیشه':'—')+'</dd></div><div><dt>وضعیت</dt><dd>'+(o.scanning?'در حال اسکن…':o.scanned?'تصویر آماده':'آماده')+'</dd></div></dl>'+controls(button('lid',o.lid?'بستن در اسکنر':'بازکردن در اسکنر',null,o.scanning)+button('sheet','گذاشتن برگه روی شیشه',null,!o.matched||!o.lid||o.sheet)+button('scan-start','شروع اسکن',null,!o.sheet||o.lid||o.scanning||o.scanned));}
 else if(station==='calendar'){title='تقویم دفتر';body='<dl class="office-data"><div><dt>امروز</dt><dd>روز دهم</dd></div><div><dt>شروع مهلت</dt><dd>روز اول</dd></div><div><dt>پایان مهلت</dt><dd>روز سی‌ام</dd></div></dl>';}
 else if(station==='exit'){title='خروج به کارگاه';body='<p class="office-status">نتیجه بررسی هنوز تحویل نشده است.</p>';}
 if(station==='scanner'&&o.scanning)body+='<progress class="office-scan-progress" max="2" aria-label="اسکن در حال انجام"></progress>';
 body+='<p class="office-key-help">Tab یا جهت‌ها: انتخاب · E / Enter / فاصله: اجرا · Escape: بستن</p>';
 return {title,body};
}
export const sixEnvironments=[{id:'office',name:'دفتر بررسی و بایگانی طرح',ready:true},{id:'owner',name:'کارگاه شرکت آفتاب'},{id:'natural',name:'مرکز مشارکت آرمان'},{id:'operations',name:'مرکز عملیات مالی'},{id:'completion',name:'مرکز قرارداد و تکمیل تأمین'},{id:'obligations',name:'مرکز تعهدات و سررسیدها'}];
