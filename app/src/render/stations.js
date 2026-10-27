import {buildAuditFurniture} from './auditProps.js';
import {buildBankFurniture} from './bankProps.js';
import {buildPaymentFurniture} from './paymentScene.js';
import {buildOrchardFurniture} from './orchardScene.js';
import {buildReceptionFurniture} from './receptionScene.js';
import {buildAtriumFurniture} from './atriumScene.js';
import {buildPostalFurniture} from './postalScene.js';
import {buildCanalFurniture} from './canalScene.js';
import {buildWorkshopFurniture} from './workshopScene.js';
import {buildCalendarFurniture} from './calendarScene.js';
import {buildArchiveReviewFurniture} from './archiveReviewScene.js';
import {createArchiveDirectory} from './archiveWayfinding.js';
import {buildArchiveFurniture} from './archiveScene.js';
import * as T from '../../vendor/three.module.js';

export const stationStyle=kind=>kind==='guide'?'guide':kind==='badge'?'badge':kind==='seal'?'seal':kind==='book'?'book':'clipboard';
export function createStationFactory({box,cylinder,sphere,geo,mat}){
 const plane=new T.PlaneGeometry(1,1);
 function printed(parent,text,{width=2.1,depth=1.5,y=.08,cover=false,badge=false,vertical=false,archive=false,calendar=false,workshop=false,canal=false,postal=false,atrium=false,reception=false,orchard=false,audit=false,bank=false,payment=false,receiptAmount=null}={}){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=768;const q=canvas.getContext('2d');
  q.fillStyle=cover?(archive?'#253d46':'#244c46'):'#eee6cc';q.fillRect(0,0,1024,768);q.strokeStyle=cover?'#c2b17b':'#c9bea5';q.lineWidth=4;q.strokeRect(30,30,964,708);
  q.fillStyle=cover?'#d7ca98':'#315349';q.direction='rtl';q.textAlign='center';q.font='600 64px Vazirmatn';q.fillText(text+(receiptAmount!==null?' · '+new Intl.NumberFormat('fa-IR').format(receiptAmount)+' میلیون':''),512,195,880);q.font='34px Vazirmatn';q.fillText('گلخانه آفتاب',512,270);
  if(receiptAmount!==null){q.strokeStyle='#8e916d';q.lineWidth=3;q.strokeRect(100,320,824,350);q.font='600 76px Vazirmatn';q.fillStyle='#315349';q.fillText(new Intl.NumberFormat('fa-IR').format(receiptAmount)+' میلیون تومان',512,470,850);q.font='42px Vazirmatn';q.fillText('شرکت آفتاب · روز دهم',512,570);q.font='32px Vazirmatn';q.fillText('فیش آموزشی · اطلاعات بانکی در پرونده',512,640);}
  else if(audit){q.fillStyle='#294251';q.font='42px Vazirmatn';const rows=text.includes('گزارش')?['اصل و کپی با کد یکسان: یک پرداخت','تاریخ پرداخت باید معتبر و داخل مهلت باشد','بررسی فیش با ارسال آن متفاوت است']:['N-200 · آرمان · ۲۰۰ میلیون تومان','اصل روز دهم · کپی همان فیش · برگه روز ۳۱','تصویر خوانا و اطلاعات بانکی معتبر'];rows.forEach((row,i)=>q.fillText(row,512,390+i*95,870));}
  else if(bank){q.fillStyle='#294b55';q.font='42px Vazirmatn';const rows=text.includes('گزارش')?['درخواست و پاسخ بانک را تطبیق بده','پرداخت موفق دوباره دریافت نمی‌شود','نتیجه فرابورس مستقل پیگیری می‌شود']:['N-80 · درخواست: ۸۰ میلیون تومان','بانک: ۸۰ میلیون تومان · موفق','فرابورس: پاسخ قطعی نرسیده'];rows.forEach((row,i)=>q.fillText(row,512,390+i*95,870));}
  else if(payment){q.fillStyle='#294b55';q.font='42px Vazirmatn';const rows=text.includes('گزارش')?['بودجه و سقف مجموع را مستقل بررسی کن','مبلغ باید مضرب واحد ۱۰ میلیونی باشد','بازگشت از همان در ورود']:['خرید قبلی: ۲۰۰ · بودجه دوم: ۸۰','قیمت واحد: ۱۰ · سقف مجموع: ۳۰۰','درخواست هنوز ثبت نشده'];rows.forEach((row,i)=>q.fillText(row,512,390+i*95,870));}
  else if(orchard){q.fillStyle=cover?'#d7ca98':'#315349';q.font='42px Vazirmatn';const lines=text.includes('گزارش')?['بودجه، حداقل و واحد را جدا بررسی کن','مبلغ نادرست هیچ فیشی ثبت نمی‌کند','بازگشت از همان در ورود']:['آرمان · بودجه خرید اول: ۲۰۰ میلیون','حداقل: ۵۰ · واحد: ۱۰ · سقف: ۳۰۰','برگه بررسی · فیش هنوز ثبت نشده'];lines.forEach((s,i)=>q.fillText(s,512,390+i*95,870));}
  else if(reception){q.fillStyle=cover?'#d7ca98':'#315349';if(text.includes('گزارش')){q.font='44px Vazirmatn';['تطبیق صاحب پرونده و وضعیت سجام','هویت معتبر باید متعلق به خود فرد باشد','بازگشت از همان در ورود'].forEach((s,i)=>q.fillText(s,512,390+i*95,870));}else{q.fillStyle='#9eb5b8';q.fillRect(120,330,230,300);q.fillStyle='#425d67';q.beginPath();q.arc(235,420,54,0,Math.PI*2);q.fill();q.beginPath();q.ellipse(235,565,85,75,0,0,Math.PI*2);q.fill();q.fillStyle='#315349';q.textAlign='right';q.font='600 50px Vazirmatn';q.fillText('آرمان · هویت حقیقی',900,390,520);q.font='42px Vazirmatn';['سجام: تأییدشده','کد بورسی و بانک: کامل','بدون ثبت خرید یا پرداخت'].forEach((s,i)=>q.fillText(s,900,475+i*80,520));q.textAlign='center';}}
  else if(atrium){q.fillStyle=cover?'#d7ca98':'#315349';q.font='44px Vazirmatn';const lines=text.includes('گزارش')?['گزارش بازبینی شرایط انتشار','انتشار با تأیید نهایی متفاوت است','بازگشت از همان در ورود']:['ارسال تعهد: موفق · OWNER-OK','روز ۱۰ · بازه ۱ تا ۳۰ · وضعیت ۵','برگه بررسی · پیش از تصمیم انتشار'];lines.forEach((s,i)=>q.fillText(s,512,390+i*95,870));}
  else if(postal){q.fillStyle=cover?'#d7ca98':'#315349';q.font='44px Vazirmatn';const lines=text.includes('گزارش')?['گزارش علت توقف ارسال','کنترل بسته و نتیجه پاسخ','بازگشت از همان در ورود']:['شرکت آفتاب · دو فیش تعهد','۱۰۰ + ۲۰ میلیون تومان','پیش از ارسال · فاقد نتیجه'];lines.forEach((s,i)=>q.fillText(s,512,390+i*95,870));}
  else if(canal){q.fillStyle=cover?'#d7ca98':'#315349';q.font='42px Vazirmatn';['بازبینی مبلغ و تعداد فیش‌ها','محاسبه و تطبیق تعهد شرکت','بازگشت از همان در ورود'].forEach((s,i)=>q.fillText(s,512,390+i*95,870));}
  else if(workshop){q.fillStyle=cover?'#d7ca98':'#315349';q.font='44px Vazirmatn';const lines=text.includes('گزارش')?['بازبینی هویت و نوع عملیات شرکت','تطبیق اطلاعات با پرونده طرح','گزارش اصلاح مسیر انتخاب‌شده']:['نام شرکت: آفتاب','نقش شرکت: مجری طرح گلخانه','نماینده شرکت: نادر'];lines.forEach((line,i)=>q.fillText(line,512,390+i*95,850));q.strokeStyle='#9c8d62';q.lineWidth=3;q.strokeRect(110,315,804,335);}
  else if(calendar){q.strokeStyle='#a7986b';q.lineWidth=2;for(let day=1;day<=30;day++){const x=150+(day-1)%6*122,y=330+Math.floor((day-1)/6)*62;q.strokeRect(x,y,110,55);q.fillStyle=cover?'#d7ca98':'#294d43';q.font='30px Vazirmatn';q.fillText(new Intl.NumberFormat('fa-IR').format(day),x+55,y+37);}q.font='30px Vazirmatn';q.fillText('زمان مجازی پرونده · روز دهم',512,700);}
  else if(archive){q.strokeStyle='#c2b17b';q.strokeRect(160,350,704,250);q.font='48px Vazirmatn';q.fillStyle='#d7ca98';q.fillText(text.includes('گزارش')?'گزارش بازبینی پرونده':'پرونده طرح آفتاب',512,440);q.font='36px Vazirmatn';q.fillText('مبلغ کل و قیمت واحد مشارکت',512,520);}else if(cover){q.strokeStyle='#c2b17b';q.lineWidth=5;for(let i=0;i<3;i++){q.beginPath();q.ellipse(512+(i-1)*65,470,40,95,(i-1)*.55,0,Math.PI*2);q.stroke();}}
  else if(badge){q.fillStyle='#839c8b';q.beginPath();q.arc(512,424,88,0,Math.PI*2);q.fill();q.fillStyle='#e1ddc7';q.beginPath();q.arc(512,402,29,0,Math.PI*2);q.fill();q.beginPath();q.ellipse(512,466,50,32,0,0,Math.PI*2);q.fill();}
  else{q.fillStyle='#acaa94';for(let i=0;i<9;i++)q.fillRect(125+(i%3)*20,340+i*30,760-(i%4)*75,4);q.strokeStyle='#658477';q.lineWidth=10;q.beginPath();q.arc(260,640,43,0,Math.PI*2);q.stroke();q.font='30px Vazirmatn';q.fillStyle='#5a7563';q.fillText('نسخه آموزشی',700,650);}
  // Fine paper fibres remain subtle at close range.
  for(let i=0;i<6500;i++){const x=(i*137.51)%1024,z=(i*67.73)%768;q.fillStyle=i%2?'#ffffff0b':'#00000008';q.fillRect(x,z,1,2);}
  if(vertical){canvas.height=192;q.fillStyle='#ede5cc';q.fillRect(0,0,1024,192);q.strokeStyle='#b7aa83';q.lineWidth=5;q.strokeRect(8,8,1008,176);q.font='600 66px Vazirmatn';q.direction='rtl';q.textAlign='center';q.fillStyle='#294d43';q.fillText(text,512,120,940);}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const material=new T.MeshStandardMaterial({map:texture,roughness:cover?.78:.92,metalness:0});material.userData.transient=true;material.userData.ownedMap=true;
  const mesh=new T.Mesh(plane,material);mesh.scale.set(width,depth,1);if(!vertical)mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function documentProp(object){
  const prop=new T.Group(),style=stationStyle(object.kind);prop.name='document-'+style;
  if(object.orchard&&object.id==='evidence'){
   prop.name='document-first-purchase-plan';box(prop,0,0,0,2.6,.075,1.85,'#786243');box(prop,0,.062,0,2.4,.055,1.65,'#e8dfc7');printed(prop,'برگه بررسی خرید اول',{width:2.28,depth:1.55,y:.093,orchard:true});box(prop,-1.23,.06,0,.1,.12,1.85,'#ab9367');
  }else if(object.reception&&object.id==='evidence'){
   prop.name='document-identity-card';box(prop,0,0,0,2.65,.065,1.85,'#a4bfc4');printed(prop,'کارت آموزشی آرمان',{width:2.52,depth:1.72,y:.035,reception:true});
  }else if(object.atrium&&object.id==='evidence'){
   prop.name='document-publication-dossier';box(prop,0,0,0,2.55,.08,1.85,'#5c7768');box(prop,0,.07,0,2.35,.065,1.65,'#e6deca');printed(prop,'پرونده بررسی انتشار',{width:2.24,depth:1.55,y:.108,atrium:true});box(prop,-1.19,.07,0,.1,.13,1.85,'#a18b5d');for(const x of [-.6,.6])box(prop,x,.13,-.8,.18,.04,.12,'#a18b5d');
  }else if(object.postal&&object.id==='evidence'){
   prop.name='document-postal-envelope';box(prop,0,0,0,2.55,.085,1.8,'#c8b18b');box(prop,0,.052,-.65,2.55,.025,.5,'#b59d77');box(prop,0,.072,-.76,.45,.014,.16,'#a65a47');printed(prop,object.name,{width:2.25,depth:1.28,y:.065,postal:true});
  }else if(object.canal&&object.id==='evidence'){
   prop.name='document-receipts';box(prop,0,0,0,2.75,.065,1.4,'#47625b');
   for(const [i,amount]of [100,20].entries()){const x=(i-.5)*1.31;box(prop,x,.055,0,1.23,.035,1.15,'#e5ddc8');const sheet=printed(prop,i?'فیش دوم':'فیش اول',{width:1.2,depth:1.12,y:.08,receiptAmount:amount});sheet.position.x=x;box(prop,x,.105,-.52,.3,.08,.15,'#a68d60');}
  }else if(style==='book'){
   box(prop,0,0,0,2.25,.06,1.65,'#31514a');box(prop,.03,.065,0,2.08,.085,1.49,'#ded5b8');box(prop,0,.125,0,2.25,.035,1.65,'#31514a');
   printed(prop,object.name,{cover:true,y:.147,archive:object.archive,calendar:object.calendar,workshop:object.workshop,canal:object.canal,postal:object.postal,atrium:object.atrium,reception:object.reception,audit:object.audit,bank:object.bank,payment:object.payment,orchard:object.orchard});box(prop,-1.06,.07,0,.09,.16,1.65,'#a8996a');
   for(let j=0;j<5;j++)box(prop,.04,.035+j*.016,.75,2.02,.004,.008,'#b9ae90');box(prop,.63,.04,.88,.15,.014,.35,'#a75440');
  }else if(style==='badge'){
   box(prop,0,0,0,1.6,.06,1.13,'#42675b');printed(prop,object.name,{width:1.47,depth:1.02,y:.034,badge:true,calendar:object.calendar,workshop:object.workshop,canal:object.canal,postal:object.postal,atrium:object.atrium,reception:object.reception,audit:object.audit,bank:object.bank,payment:object.payment,orchard:object.orchard});box(prop,0,.06,-.58,.4,.1,.14,'#5c6059');
  }else if(style==='seal'){
   box(prop,0,-.01,0,2.2,.025,1.6,'#e9dfbd');printed(prop,object.name,{y:.006,workshop:object.workshop,canal:object.canal,postal:object.postal,atrium:object.atrium,reception:object.reception,audit:object.audit,bank:object.bank,payment:object.payment,orchard:object.orchard});cylinder(prop,.57,.1,.25,.25,.12,'#a69255');cylinder(prop,.57,.31,.25,.12,.36,'#705239',.16);sphere(prop,.57,.53,.25,.22,.12,.22,'#705239');
  }else{
   box(prop,0,0,0,2.3,.07,1.7,'#856c4b');printed(prop,object.name,{y:.04,workshop:object.workshop,canal:object.canal,postal:object.postal,atrium:object.atrium,reception:object.reception,audit:object.audit,bank:object.bank,payment:object.payment,orchard:object.orchard});box(prop,0,.11,-.68,.65,.11,.2,'#5c6059');
  }
  return prop;
 }
 function missionFurniture(root,p,guide,archiveMaterials){
 if(p.auditRoom)return buildAuditFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.bankRoom)return buildBankFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.paymentRoom)return buildPaymentFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.orchardRoom)return buildOrchardFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.receptionRoom)return buildReceptionFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.atriumRoom)return buildAtriumFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.postalRoom)return buildPostalFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.canalRoom)return buildCanalFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.workshopRoom)return buildWorkshopFurniture(root,guide,{geo,mat},archiveMaterials);
 if(p.calendarRoom)return buildCalendarFurniture(root,guide,{geo,mat},archiveMaterials||{},p.calendarVariant??null);
 if(p.archiveRoom){if(p.repair)return buildArchiveReviewFurniture(root,guide,{geo,mat},archiveMaterials||{},p.archiveVariant);return buildArchiveFurniture(root,guide,{geo,mat},archiveMaterials||{});}
 if(p.id==='project')return buildArchiveFurniture(root,guide,{geo,mat},archiveMaterials||{});
 const a=p.accent,n=p.index,metal='#5c6059',paper='#d8d3c1';
 if(guide){cylinder(root,0,1,0,1.7,2,a);box(root,0,2,0,4,.5,2.5,paper);return;}
 const shape=n%5;
 if(shape===0){box(root,0,1,0,5,2,3,a);for(const x of [-1.5,0,1.5])box(root,x,1.1,1.55,1.25,1.5,.15,paper);}
 if(shape===1){cylinder(root,0,1,0,1.1,2,metal);cylinder(root,0,2.03,0,2.5,.35,a);}
 if(shape===2){for(const x of [-2,2]){box(root,x,1,0,.5,2,2.8,metal);box(root,x,1,0,.8,.2,3,paper);}box(root,0,2,0,5,.5,3,a);}
 if(shape===3){for(const x of [-1.8,1.8])cylinder(root,x,1,0,.3,2,a);box(root,0,2,0,5,.5,3,paper);box(root,0,.4,0,4.8,.3,2.8,metal);}
 if(shape===4){box(root,0,1,0,3,2,2.7,metal);box(root,0,2,0,5,.5,3,a);box(root,0,.1,0,5,.2,3,a);}
 // Each location has a different working instrument behind the reachable document.
 if(['terminal','counter','radio','scanner'].includes(p.station)){box(root,0,3.9,-1.3,3,2.3,.35,metal);box(root,0,3.9,-1.08,2.6,1.9,.04,a);box(root,1.85,2.35,-.5,.3,.25,1,paper);}
 else if(['scale','valve','dial','calendar'].includes(p.station)){cylinder(root,1.8,2.65,-.65,.65,.8,a);sphere(root,1.8,3.2,-.65,.65,.65,.18,paper);}
 else if(['display','seal','registry'].includes(p.station)){box(root,0,3.7,-1.1,4,2.8,.25,paper);for(const x of [-2,2])box(root,x,3.7,-1.05,.15,3,.3,a);}
 else if(['parcel','crate','receipt'].includes(p.station)){box(root,1.8,2.65,-.65,1.1,.8,1.1,a);box(root,-1.8,2.6,-.65,.8,.65,.8,paper);}
 else{for(let i=0;i<3;i++)box(root,-1.8,2.3+i*.12,-.65,.8,.1,.9,[paper,a,metal][i]);}
}
function station(parent,entry,profile=null,archiveMaterials=null){
  if(entry.object.kind==='wayfinding'){const station=createArchiveDirectory(entry,{geo,mat},archiveMaterials||{});parent.add(station.root);return station;}
  const root=new T.Group();root.position.set(entry.x*.1-64,0,entry.y*.1-45);parent.add(root);
  if(profile){missionFurniture(root,profile,entry.object.kind==='guide',archiveMaterials);}else{box(root,0,2,0,5,.5,3,'#ab8559');for(const x of [-2,2])for(const z of [-1,1])box(root,x,1,z,.25,2,.25,'#73573a');
  box(root,0,.6,-.9,4.3,.16,.18,'#73573a');}
  const prop=documentProp({...entry.object,archive:Boolean(profile?.archiveRoom),calendar:Boolean(profile?.calendarRoom),workshop:Boolean(profile?.workshopRoom),canal:Boolean(profile?.canalRoom),postal:Boolean(profile?.postalRoom),atrium:Boolean(profile?.atriumRoom),reception:Boolean(profile?.receptionRoom),audit:Boolean(profile?.auditRoom),bank:Boolean(profile?.bankRoom),payment:Boolean(profile?.paymentRoom),orchard:Boolean(profile?.orchardRoom)});prop.position.set(-.25,profile?.workshopRoom?2.52:2.28,.15);prop.rotation.y=-.12;root.add(prop);
  if(profile?.workshopRoom||profile?.canalRoom||profile?.postalRoom||profile?.atriumRoom||profile?.receptionRoom||profile?.auditRoom||profile?.bankRoom||profile?.paymentRoom||profile?.orchardRoom)for(const x of [-1,1])box(root,x,(profile?.canalRoom||profile?.postalRoom||profile?.atriumRoom||profile?.receptionRoom||profile?.auditRoom||profile?.bankRoom||profile?.paymentRoom||profile?.orchardRoom)?2.36:2.55,1.27,.12,(profile?.canalRoom||profile?.postalRoom||profile?.atriumRoom||profile?.receptionRoom||profile?.auditRoom||profile?.bankRoom||profile?.paymentRoom||profile?.orchardRoom)?.24:.3,.12,'#3b4b4c');
  const plaque=new T.Group();plaque.position.set(0,profile?.workshopRoom?2.86:2.62,1.27);root.add(plaque);box(plaque,0,0,0,2.85,.54,.09,'#31514a');
  const name=printed(plaque,entry.object.name,{width:2.73,depth:.48,y:0,vertical:true});name.position.z=.052;
  // A pen, seed envelope and small tray give each work station a practical context.
  const pen=cylinder(root,1.45,profile?.workshopRoom?2.55:2.31,.45,.026,.85,'#31514a');pen.rotation.z=Math.PI/2;pen.rotation.y=.3;
  box(root,1.57,profile?.workshopRoom?2.52:2.28,-.53,.86,.045,.72,'#a98b60');box(root,-1.65,profile?.workshopRoom?2.54:2.3,-.63,.65,.09,.65,'#5c6059');
  return {entry,root,paper:prop};
 }
 return {station,document:documentProp};
}
