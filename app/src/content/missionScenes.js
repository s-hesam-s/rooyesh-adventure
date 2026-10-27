import {auditLayout} from '../game/auditRoom.js';
import {bankLayout} from '../game/bankRoom.js';
import {paymentLayout} from '../game/paymentRoom.js';
import {orchardLayout} from '../game/orchardRoom.js';
import {receptionLayout} from '../game/receptionRoom.js';
import {atriumLayout} from '../game/atriumRoom.js';
import {postalLayout} from '../game/postalRoom.js';
import {canalLayout} from '../game/canalRoom.js';
import {workshopLayout} from '../game/workshopRoom.js';
import {calendarLayout} from '../game/calendarRoom.js';
import {routeSlots} from '../game/routePlacement.js';
import {archiveReviewLayout} from '../game/archiveReviewRoom.js';
import {archiveFloorPlan} from '../game/openFloor.js';
/* Authored locations for each campaign decision. Coordinates use the existing world grid. */
const specs=[
 ['project','بایگانی فرابورس','archive','نیما','مسئول بایگانی','#425e79','#d7c5a0','visor',300,520,380,'desk','arch'],
 ['window','حیاط ساعت و تقویم','clock','رعنا','کارشناس زمان‌بندی','#ad7540','#d6c2ae','glasses',970,760,430,'dial','round'],
 ['ownerIdentity','کارگاه شرکت آفتاب','workshop','بهرام','مسئول شرکت مجری','#7e5338','#b8b5a1','helmet',460,340,410,'workbench','timber'],
 ['ownerAmount','باغ آبراه تعهد','canal','مینا','کارشناس تعهد مجری','#477d79','#aebfba','scarf',820,920,450,'scale','bridge'],
 ['ownerSend','مرکز پست اسناد','courier','شهاب','مسئول ارسال اسناد','#9b5743','#b6c0c8','cap',240,490,430,'parcel','cargo'],
 ['publish','سرسرای انتشار طرح','atrium','آوا','مسئول انتشار','#628159','#d1dfd3','headset',1030,820,380,'podium','glass'],
 ['naturalIdentity','پذیرش هویت حقیقی','reception','کاوه','کارشناس هویت','#385b7b','#c5c8d0','glasses',600,430,460,'scanner','turnstile'],
 ['naturalSlip','دفتر ثبت سفارش مشارکت','orchard','سیمین','راهنمای خرید با فیش','#8c6e94','#c2b4a8','hat',350,670,410,'ledger','trellis'],
 ['gateway','مرکز پرداخت دیجیتال','datacenter','سامان','کارشناس درگاه','#3d7b89','#8598a7','headset',900,640,390,'terminal','signal'],
 ['verifyBank','سالن تطبیق بانک','bank','پریسا','کارشناس تطبیق بانک','#78705b','#c4c0b4','scarf',480,780,430,'counter','vault'],
 ['receiptCheck','آزمایشگاه اسناد مالی','audit','فرهاد','کارشناس بررسی فیش','#a6b9c0','#b4c7cc','magnifier',1040,890,470,'lightbox','frame'],
 ['investorSend','برج ارتباطات و ارسال','dispatch','ترانه','کارشناس پیگیری ارسال','#70558b','#98abb7','cap',260,400,390,'radio','antenna'],
 ['legalIdentity','حیاط شرکت بهار','pavilion','امیر','مسئول پذیرش حقوقی','#4d7957','#c6bda8','visor',720,950,440,'registry','lattice'],
 ['legalAmount','تراس ظرفیت سرمایه','terrace','نگار','تحلیلگر ظرفیت','#9a6a68','#c3c3c8','glasses',390,580,370,'model','steel'],
 ['legalSend','انبار امن اسناد حقوقی','warehouse','داریوش','مسئول محموله اسناد','#88774e','#b1a68e','helmet',960,730,480,'crate','loading'],
 ['close','محوطه مخازن سرمایه','reservoir','هستی','ناظر تکمیل منابع','#496e86','#a9babb','cap',200,470,440,'valve','pipe'],
 ['final','تالار شورای تأیید','council','رامین','دبیر شورای بررسی','#796448','#bcb3c6','scarf',840,610,400,'seal','marble'],
 ['certificate','گالری گواهی مشارکت','gallery','مهتاب','مسئول گواهی‌ها','#8c6380','#dbd3c2','hat',570,850,450,'display','ribbon'],
 ['schedule','رصدخانه سررسیدها','observatory','یونس','کارشناس برنامه سود','#4b648b','#9ca5bc','magnifier',1080,800,410,'calendar','orbit'],
 ['payment','اسکله تعهدات و پرداخت','lakeside','روژین','کارشناس پرداخت سود','#a1744e','#a9c8c4','headset',310,620,470,'receipt','dock']
];
export const missionScenes=Object.fromEntries(specs.map((s,i)=>{
 const [id,name,environment,guideName,guideRole,accent,floor,accessory,sx,hx,hy,station,portal]=s;
 const side=i%2?1:-1,entry={x:sx,y:800},approach={x:sx+side*30,y:660},hub={x:hx,y:hy};
 const targets=[
  {x:260+(i*47)%190,y:180+(i%4)*45},
  {x:530+(i*29)%210,y:130+(i%5)*32},
  {x:840+(i*31)%150,y:200+(i%3)*55}
 ];
 return [id,{id,name,environment,accent,floor,station,portal,index:i,entry,approach,hub,targets,
  entryYaw:Math.atan2(entry.x-approach.x,entry.y-approach.y),
  sky:['#c7d7df','#e2cfae','#afc5cc','#c5cadd'][i%4],
  guide:{id:'guide-'+id,name:guideName,role:guideRole,color:accent,accessory,height:5.1+(i%5)*.21,width:.88+(i%4)*.08},
  evidenceName:['پرونده بایگانی','تقویم طرح','کارت شرکت مجری','بسته فیش تعهد','پاکت ارسال مجری','مجوز انتشار','کارت هویت حقیقی','دفتر خرید اول','درخواست درگاه','گزارش پاسخ بانک','اصل فیش و برگه‌های مقایسه','گزارش استعلام ارسال','پرونده شرکت بهار','نقشه ظرفیت طرح','محموله فیش حقوقی','صورت تکمیل منابع','صورت‌جلسه تأیید','گواهی آرمان','جدول سررسیدهای سود','سند پرداخت نوبت اول'][i]
 }];
}));
Object.assign(missionScenes.project,{archiveRoom:true,entry:{x:640,y:800},approach:{x:640,y:680},hub:{x:640,y:430},targets:[{x:330,y:190},{x:640,y:160},{x:950,y:190}],stations:[{x:420,y:630},{x:860,y:630}],entryYaw:0});
Object.assign(missionScenes.project.guide,{identity:'nika',name:'نیکا',color:'#3b515c',role:'کارشناس ارشد بایگانی',accessory:'archive',height:5.6,width:.94});
Object.assign(missionScenes.window,{calendarRoom:true,entry:{x:640,y:800},hub:{x:640,y:560},stations:[{x:420,y:630},{x:860,y:630}],targets:[{x:330,y:190},{x:640,y:190},{x:950,y:190}],entryYaw:0});
Object.assign(missionScenes.window.guide,{identity:'rana',accessory:'calendar',color:'#365d62'});
Object.assign(missionScenes.ownerIdentity,{workshopRoom:true,entry:{x:640,y:810},hub:{x:640,y:600},stations:[{x:410,y:670},{x:870,y:650}],targets:[{x:300,y:190},{x:640,y:190},{x:980,y:190}],entryYaw:0});
Object.assign(missionScenes.ownerIdentity.guide,{identity:'bahram',accessory:'workshop',role:'سرپرست مونتاژ شرکت آفتاب'});
Object.assign(missionScenes.ownerAmount,{canalRoom:true,entry:{x:640,y:820},hub:{x:640,y:550},stations:[{x:220,y:680},{x:1060,y:660}],targets:[{x:300,y:190},{x:640,y:190},{x:980,y:190}],entryYaw:0});
Object.assign(missionScenes.ownerAmount.guide,{identity:'mina',accessory:'canal',role:'کارشناس تعهد و مدارک شرکت'});
Object.assign(missionScenes.ownerSend,{postalRoom:true,entry:{x:640,y:835},hub:{x:640,y:535},stations:[{x:540,y:690},{x:740,y:690}],targets:[{x:300,y:190},{x:640,y:190},{x:980,y:190}],entryYaw:0});
Object.assign(missionScenes.ownerSend.guide,{identity:'shahab',accessory:'postal',role:'مسئول پذیرش و ارسال اسناد'});
Object.assign(missionScenes.publish,{atriumRoom:true,entry:{x:640,y:840},hub:{x:640,y:555},stations:[{x:530,y:695},{x:750,y:695}],targets:[{x:300,y:190},{x:640,y:190},{x:980,y:190}],entryYaw:0,evidenceName:'پرونده بررسی انتشار'});
Object.assign(missionScenes.publish.guide,{identity:'ava',accessory:'atrium',role:'کارشناس معرفی و انتشار طرح'});
Object.assign(missionScenes.naturalIdentity,{receptionRoom:true,entry:{x:640,y:820},hub:{x:640,y:560},stations:[{x:560,y:710},{x:790,y:690}],targets:[{x:280,y:190},{x:640,y:190},{x:1000,y:190}],entryYaw:0});
Object.assign(missionScenes.naturalIdentity.guide,{identity:'kaveh',accessory:'reception',role:'کارشناس پذیرش و تطبیق مدارک'});
Object.assign(missionScenes.naturalSlip,{orchardRoom:true,entry:{x:640,y:840},hub:{x:640,y:600},stations:[{x:460,y:740},{x:170,y:690}],targets:[{x:290,y:270},{x:640,y:150},{x:990,y:390}],entryYaw:0,evidenceName:'برگه بررسی خرید اول'});
Object.assign(missionScenes.naturalSlip.guide,{identity:'simin',accessory:'orchard',role:'راهنمای واحد و بودجه خرید'});
Object.assign(missionScenes.gateway,{paymentRoom:true,name:'ایستگاه خودکار پرداخت',entry:{x:640,y:840},hub:{x:640,y:600},stations:[{x:520,y:710},{x:860,y:620}],targets:[{x:340,y:250},{x:640,y:130},{x:940,y:250}],entryYaw:0,evidenceName:'برگه خرید دوم آرمان'});
Object.assign(missionScenes.gateway.guide,{identity:'paymentSaman',name:'سامان',accessory:'headset',role:'پشتیبان پرداخت دیجیتال'});
Object.assign(missionScenes.verifyBank,{bankRoom:true,name:'اتاق پایاپای بانک',entry:{x:640,y:800},hub:{x:640,y:590},stations:[{x:500,y:670},{x:780,y:710}],targets:[{x:220,y:450},{x:500,y:130},{x:1060,y:530}],entryYaw:0,evidenceName:'پرونده تطبیق پرداخت N-80'});
Object.assign(missionScenes.verifyBank.guide,{identity:'bankParisa',name:'پریسا',accessory:'glasses',role:'کارشناس تطبیق بانک'});
Object.assign(missionScenes.receiptCheck,{auditRoom:true,name:'کارگاه تصویربرداری و بررسی اسناد',entry:{x:640,y:800},hub:{x:640,y:630},stations:[{x:410,y:700},{x:860,y:730}],targets:[{x:160,y:415},{x:480,y:110},{x:880,y:390}],entryYaw:0,evidenceName:'پرونده بررسی فیش N-200'});
Object.assign(missionScenes.receiptCheck.guide,{identity:'auditFarhad',name:'فرهاد',accessory:'magnifier',role:'کارشناس بررسی اسناد'});
export function missionLayout(node){
 if(node.scene.auditRoom)return auditLayout(node);
 if(node.scene.bankRoom)return bankLayout(node);
 if(node.scene.paymentRoom)return paymentLayout(node);
 if(node.scene.orchardRoom)return orchardLayout(node);
 if(node.scene.receptionRoom)return receptionLayout(node);
 if(node.scene.atriumRoom)return atriumLayout(node);
 if(node.scene.postalRoom)return postalLayout(node);
 if(node.scene.canalRoom)return canalLayout(node);
 if(node.scene.workshopRoom)return workshopLayout(node);
 if(node.scene.calendarRoom)return calendarLayout(node);
 if(node.repairFor==='project')return archiveReviewLayout(node);
 const p=node.scene,entry=p.entry,approach=p.approach,hub=p.hub,repair=Boolean(node.repairFor);
 const spine=[entry,approach,{x:(approach.x+hub.x)/2+(p.index%2?55:-55),y:555},hub];
 const roads=[spine],positions=[{x:approach.x+(p.index%2?-145:145),y:approach.y-12},{x:approach.x+(p.index%2?145:-145),y:approach.y-60}];
 const objects=(node.objects||[]).map((object,i)=>{const q=object.position||(p.stations||positions)[i];roads.push([approach,{x:q.x,y:approach.y},q]);return {...q,object};});
 const slots=routeSlots(node);
 const gates=(node.exits||[]).map((exit,i)=>{
  const q=p.targets[repair?i*2:slots[i]];
  roads.push([hub,{x:q.x,y:Math.max(hub.y-55-(i*12),q.y+100)},q]);return {...q,exit,...(node.id==='project'?{approach:{x:q.x,y:q.y+24}}:{})};
 });
 for(const o of objects)if(o.object.kind==='wayfinding'){
  const routes=[...gates].sort((a,b)=>a.x-b.x).map(g=>({id:g.exit.id,label:g.exit.label}));
  o.object={...o.object,routes,text:'هر سه ورودی را از همین تابلو مقایسه کن.\n\n'+routes.map((r,i)=>['سمت چپ','روبه‌رو','سمت راست'][i]+': '+r.label).join('\n\n')+'\n\nتابلو فقط راهنماست؛ برای ثبت انتخاب به درِ مربوط نزدیک شو.'};
 }
 // The profile's entry is the only spawn; legacy layouts keep their original entry.
 return {roads,gates,objects,hub,spawn:entry,entryYaw:p.entryYaw,sceneId:p.id,...(node.id==='project'?{floorPlan:archiveFloorPlan(objects,gates)}:{})};
}
const reviewers=["آرزو","افشین","الناز","احسان","آزاده","اشکان","باران","بابک","بهناز","بهنام","پانیذ","پدرام","پریا","پوریا","تارا","حامد","تینا","حمید","دریا","داوود","دنیا","رضا","رؤیا","سعید","سحر","سهراب","سمیرا","سیامک","شادی","شاهین","شقایق","شروین","شیما","علی","غزل","فرید","فریبا","مجید","مریم","وحید"];
export function reviewScene(profile,choice,rank){
 const mirror=q=>({x:1280-q.x,y:q.y}),index=20+profile.index*2+rank,accent=rank?'#74668b':'#997158';
 const result={...profile,id:profile.id+'-repair-'+choice,repair:true,index,accent,name:profile.name+'؛ بازبینی '+(rank+1),entry:profile.id==='project'?{x:640,y:820}:mirror(profile.entry),approach:mirror(profile.approach),hub:mirror(profile.hub),targets:profile.targets.map(mirror),entryYaw:-profile.entryYaw,guide:{...profile.guide,id:'reviewer-'+profile.id+'-'+rank,name:reviewers[profile.index*2+rank],role:'بازبین '+profile.evidenceName,color:accent,accessory:['glasses','cap','headset','scarf'][index%4],height:5.2+(index%4)*.18}};
 if(profile.id==='project')Object.assign(result,{
  archiveVariant:choice,name:choice===0?'بایگانی فرابورس · اتاق تطبیق قیمت واحد':'بایگانی فرابورس · اتاق پرونده‌های مهتاب',
  entry:{x:640,y:790},approach:{x:640,y:720},hub:{x:640,y:700},entryYaw:0,
  stations:choice===0?[{x:460,y:510},{x:820,y:540}]:[{x:800,y:560},{x:460,y:490}],
  evidenceName:choice===0?'گزارش اختلاف قیمت واحد':'گزارش مغایرت نام طرح',
  guide:{...result.guide,identity:choice===0?'arzu':'afshin',archive:true,archiveVariant:choice,color:choice===0?'#645442':'#485d62',accessory:'archive',height:choice===0?5.42:5.7,width:choice===0?.9:1.02}
 });
 if(profile.id==='window')Object.assign(result,{calendarRoom:true,calendarVariant:choice,guide:{...result.guide,identity:choice===1?'elnaz':'ehsan',accessory:'calendar',role:choice===1?'کارشناس مجوز انتشار':'کارشناس وضعیت پرونده'},name:choice===1?'حیاط ساعت · دفتر بازبینی مجوز انتشار':'حیاط ساعت · دفتر بازبینی وضعیت طرح',entry:{x:640,y:790},entryYaw:0,stations:choice===1?[{x:460,y:510},{x:820,y:540}]:[{x:800,y:560},{x:460,y:490}]});
 if(profile.id==='ownerIdentity')Object.assign(result,{workshopRoom:true,workshopVariant:choice,name:choice===0?'کارگاه آفتاب · دفتر نوع عملیات':'کارگاه آفتاب · اتاق تطبیق اسناد شرکت',entry:{x:640,y:790},entryYaw:0,stations:choice===0?[{x:470,y:600},{x:820,y:590}]:[{x:810,y:610},{x:450,y:570}],guide:{...result.guide,identity:choice===0?'azadeh':'ashkan',accessory:'workshop',role:choice===0?'کارشناس نقش شرکت':'کارشناس اسناد ثبتی'}});
 if(profile.id==='ownerAmount')Object.assign(result,{canalRoom:true,canalVariant:choice,name:choice===0?'باغ آبراه · پاویون محاسبه تعهد':'باغ آبراه · دفتر تطبیق بسته فیش',entry:{x:640,y:790},entryYaw:0,stations:choice===0?[{x:470,y:610},{x:820,y:610}]:[{x:820,y:650},{x:460,y:590}],guide:{...result.guide,identity:choice===0?'baran':'babak',accessory:'canal',role:choice===0?'راهنمای محاسبه تعهد':'کارشناس تطبیق فیش‌ها'}});
 if(profile.id==='ownerSend')Object.assign(result,{postalRoom:true,postalVariant:choice,name:choice===1?'مرکز پست · اتاق تکمیل محتویات':'مرکز پست · دفتر پاسخ و پیگیری',entry:{x:640,y:790},hub:{x:640,y:720},entryYaw:0,stations:choice===1?[{x:460,y:610},{x:810,y:610}]:[{x:810,y:650},{x:460,y:600}],guide:{...result.guide,identity:choice===1?'behnaz':'behnam',accessory:'postal',role:choice===1?'کارشناس کنترل بسته اسناد':'کارشناس پاسخ و پیگیری'}});
 if(profile.id==='publish')Object.assign(result,{atriumRoom:true,atriumVariant:choice,name:choice===0?'سرسرای انتشار · اتاق توالی تأمین و تأیید':'سرسرای انتشار · دفتر کنترل وضعیت و مهلت',entry:{x:640,y:790},hub:{x:640,y:725},entryYaw:0,stations:choice===0?[{x:460,y:615},{x:810,y:615}]:[{x:810,y:655},{x:460,y:605}],guide:{...result.guide,identity:choice===0?'paniz':'pedram',accessory:'atrium',role:choice===0?'کارشناس توالی تأمین سرمایه':'کارشناس شرایط انتشار'}});
 if(profile.id==='naturalIdentity')Object.assign(result,{receptionRoom:true,receptionVariant:choice,name:choice===1?'پذیرش هویت · اتاق تطبیق صاحب پرونده':'پذیرش هویت · دفتر تکمیل سجام',entry:{x:640,y:790},hub:{x:640,y:720},entryYaw:0,stations:choice===1?[{x:470,y:615},{x:810,y:615}]:[{x:810,y:650},{x:470,y:605}],guide:{...result.guide,identity:choice===1?'paria':'pouria',accessory:'reception',role:choice===1?'کارشناس تعلق مدارک به سرمایه‌گذار':'کارشناس تکمیل پیش‌نیازهای هویت'}});
 if(profile.id==='gateway')Object.assign(result,{paymentRoom:true,paymentVariant:choice,name:choice===1?'پرداخت · کابین کنترل سقف':'پرداخت · کابین اصلاح مبلغ',entry:{x:640,y:670},hub:{x:640,y:590},entryYaw:0,stations:choice===1?[{x:520,y:560},{x:760,y:520}]:[{x:760,y:600},{x:520,y:570}],guide:{...result.guide,identity:choice===1?'paymentRaha':'paymentMaziar',name:choice===1?'رها':'مازیار',accessory:'headset',role:choice===1?'کارشناس سقف مشارکت':'پشتیبان مبلغ و واحد'}});
 if(profile.id==='naturalSlip')Object.assign(result,{orchardRoom:true,orchardVariant:choice,name:choice===0?'دفتر سفارش · اتاق محاسبات':'دفتر سفارش · بررسی اولین سفارش',entry:{x:640,y:790},hub:{x:640,y:720},entryYaw:0,stations:choice===0?[{x:470,y:615},{x:810,y:615}]:[{x:810,y:650},{x:370,y:540}],guide:{...result.guide,identity:choice===0?'tara':'hamed',accessory:'orchard',role:choice===0?'کارشناس مبلغ و واحد کامل':'راهنمای حداقل خرید اول'}});
 if(profile.id==='verifyBank')Object.assign(result,{bankRoom:true,bankVariant:choice,name:choice===0?'پایاپای · اتاق جلوگیری از دریافت تکراری':'پایاپای · اتاق مغایرت مبلغ',entry:{x:640,y:670},hub:{x:640,y:605},entryYaw:0,stations:choice===0?[{x:535,y:580},{x:760,y:590}]:[{x:520,y:595},{x:800,y:660}],guide:{...result.guide,identity:choice===0?'bankNavid':'bankShiva',name:choice===0?'نوید':'شیوا',accessory:choice===0?'glasses':'scarf',role:choice===0?'کارشناس کنترل پرداخت تکراری':'کارشناس مغایرت مبلغ'}});
 if(profile.id==='receiptCheck')Object.assign(result,{auditRoom:true,auditVariant:choice,name:choice===0?'کارگاه اسناد · اتاق کنترل نسخه تکراری':'کارگاه اسناد · اتاق کنترل تاریخ',entry:{x:640,y:670},hub:{x:640,y:610},entryYaw:0,stations:choice===0?[{x:520,y:600},{x:760,y:630}]:[{x:540,y:590},{x:740,y:650}],guide:{...result.guide,identity:choice===0?'auditLadan':'auditKaveh',name:choice===0?'لادن':'کاوه',accessory:choice===0?'glasses':'magnifier',role:choice===0?'کارشناس کنترل نسخه‌ها':'کارشناس تاریخ و مهلت'}});
 return result;
}
