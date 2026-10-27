import {dialogControls,focusToken,focusDialog,dialogKey} from './ui/dialogKeyboard.js';
import {interactionDistance} from './game/interactionAccess.js';
import {inOffice} from './game/officeWorkflow.js';
import {officeNode,officeLayout} from './game/officeRoom.js';
import {officePanel,sixEnvironments} from './ui/officeUI.js';
import {testEnvironments,createEnvironmentTestSession} from './game/environmentTest.js';
import {setRouteSeed} from './game/routePlacement.js';
import {archiveArrival} from './game/archiveArrival.js';
import {doorJourneyTiming,doorJourneyPose,doorJourneyPosition,doorJourneyCues} from './game/doorJourney.js';
import {pickupDuration,pickupCuesBetween} from './game/pickup.js';
import {advanceFirstPerson} from './game/firstPerson.js';
import {createSoundscape} from './game/soundscape.js';
import {nodes,endings,endingScenes} from './content/campaign.js';
import {characters} from './content/characters.js';
import {newJourney,interact,travel,officeAct,collide,exitsFor,missingItems,itemLabel,journeyLog,chapterProgress} from './game/campaignState.js';
import {START,layoutFor,distance,movePlayer,findPath,walkable,cartAt,pushAway} from './game/world.js';
import {readSave,writeSave} from './game/campaignStorage.js';
import {createRenderer} from './render/scene3d.js';

const $=id=>document.getElementById(id),canvas=$('world'),dialog=$('dialog');
const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
const loaded=readSave(storage),testSession=createEnvironmentTestSession();
let savedPosition=loaded.position;
let saved=loaded.state,state=newJourney();
setRouteSeed(saved?.id||state.id);
let player={...START,facing:'up',moving:false},mode='menu',path=[],pendingObject=null,transition=null,hold=null;
let time=0,lastTime=0,lastSave=0,lastStep=0,bumpCooldown=0,toastUntil=0,lockedGate=null;
let keys=new Set(),soundEnabled=false,audio=null,previousFocus=null,discovered=[];
try{const raw=JSON.parse(storage.getItem('rooyesh.campaign.endings.v3')||'[]');if(Array.isArray(raw))discovered=raw.filter(id=>Object.hasOwn(endings,id));}catch{}
let frameSamples=[],measuredFps=0;
let renderer;
try{renderer=await createRenderer(canvas);$('asset-loading').remove();}catch(error){$('asset-loading').textContent='بارگذاری محیط کامل نشد. صفحه را تازه کن؛ اگر مشکل ادامه داشت، فایل‌های محلی بازی را بررسی کن.';throw error;}
const soundscape=createSoundscape();
let officeDevice=null,officeScanClock=0;
let collection=null,highQuality=false,inspectedEntry=null,roleCardUntil=0;
const fa=n=>new Intl.NumberFormat('fa-IR').format(n);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function documentBody(text){return String(text).split(/\n\s*\n/).map(paragraph=>'<p>'+esc(paragraph)+'</p>').join('');}
function currentNode(){if(mode==='menu'||inOffice(state))return officeNode;return state.ending?endingScenes[state.ending]:nodes[state.nodeId];}
function currentLayout(){return inOffice(state)?officeLayout(state.office):layoutFor(currentNode());}
function save(){testSession.persist(()=>{
 saved=state;savedPosition={x:player.x,y:player.y};
 if(!writeSave(storage,state,player)){show('storage-warning',true);$('storage-warning').textContent='ذخیره مرورگر در دسترس نیست؛ سفر فعلی فقط تا بستن صفحه باقی می‌ماند.';}else show('storage-warning',false);
});}
function show(id,visible){$(id).classList.toggle('hidden',!visible);}
function tone(frequency=440,duration=.12){
 if(!soundEnabled)return;
 try{
  audio||=new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type='sine';oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration);
 }catch{soundEnabled=false;$('sound').classList.remove('active');}
}
function toast(message){$('toast').textContent=message;toastUntil=time+3.5;show('toast',true);}
function openDialog(title,body,actions=[{label:'ادامه مسیر',action:'close',primary:true}]){
 const token=dialog.open?focusToken(document.activeElement,dialogControls(dialog)):null;
 renderer.releaseMouse?.();if(!dialog.open)previousFocus=document.activeElement;keys.clear();player.moving=false;
 dialog.innerHTML='<div class="dialog-head"><h2 id="dialog-title">'+title+'</h2><button data-dialog="close" aria-label="بستن">×</button></div><div class="dialog-body">'+body+'</div><div class="dialog-actions">'+actions.map(a=>'<button data-dialog="'+a.action+'" class="'+(a.primary?'primary':'secondary')+'">'+a.label+'</button>').join('')+'</div>';
 if(!dialog.open)dialog.showModal();focusDialog(dialog,token);
}
function closeDialog(){officeDevice=null;dialog.classList.remove('office-device','office-guide');dialog.close();keys.clear();lastTime=performance.now();if(mode==='play')canvas.focus({preventScroll:true});else previousFocus?.focus();}
function updateHUD(){
 const node=currentNode();$('game').classList.toggle('office-mode',inOffice(state)||mode==='menu');
 $('chapter-title').textContent=mode==='menu'?'هر راه، یک داستان.':node.title;
 $('chapter-kicker').textContent=mode==='menu'?'یک ماجراجویی در دنیای تأمین مالی':(node.scene?.name||node.area)+' / '+characters[state.role].name+' · '+characters[state.role].role;
 document.querySelector('.chapter').classList.toggle('menu-chapter',mode==='menu');
 $('objective').textContent=node.objective||'';
 $('trust').textContent=fa(state.trust);$('time').textContent=fa(state.time);$('balance').textContent=fa(state.balance);
 $('trust-bar').style.width=state.trust+'%';$('time-bar').style.width=state.time+'%';
 $('balance-label').textContent='ظرفیت آزاد طرح';
 const progress=chapterProgress(state),actor=characters[state.role];
 $('actor-portrait').src=actor.portrait;$('actor-portrait').alt=actor.name;$('actor-name').textContent=actor.name+' · '+actor.role;
 $('challenge-progress').textContent='مرحله '+fa(progress.chapter.id)+' از ۱۰ · چالش‌های حل‌شده '+fa(progress.done)+' از '+fa(progress.total);
 $('chapter-progress').style.width=(progress.completedChapters/10*100)+'%';
 if(inOffice(state))$('challenge-progress').textContent='محیط ۱ از ۶ · دفتر طرح';
 $('inventory').innerHTML=state.inventory.filter(key=>(node.objects||[]).some(o=>o.grant===key)).map(key=>'<span>✓ '+itemLabel(key)+'</span>').join('');
 for(const id of ['mission','metrics','controls'])show(id,mode==='play');
 show('start-screen',mode==='menu');show('ending-screen',mode==='ending');
 if(mode!=='play'){show('route-hint',false);show('interact',false);}
 show('environment-test-badge',testSession.active&&mode!=='menu');
 show('continue',Boolean(saved));$('continue').textContent=saved?.ending?'مرور پایان سفر قبلی':'ادامه سفر ذخیره‌شده';
}
let entering=false;
async function enterJourney(resume=false,environmentId=null){
 if(entering)return;entering=true;
 if(dialog.open)closeDialog();
 if(!environmentId)testSession.leave();
 const officeMigrated=resume&&saved&&!saved.office&&['project','window'].includes(saved.nodeId);
 state=environmentId?testSession.enter(environmentId==='office'?'project':environmentId):(resume&&saved?saved:newJourney());
 if(environmentId==='office'||(!resume&&!environmentId)||officeMigrated)state=officeAct(state,'begin');
 officeDevice=null;officeScanClock=0;
 mode='menu';collection=null;transition=null;keys.clear();setRouteSeed(state.id);renderer.invalidateLayout();
 document.querySelectorAll('[data-test-environment]').forEach(button=>button.disabled=true);
 const startLabel=$('start').innerHTML;$('start').disabled=$('continue').disabled=true;$('start').textContent='آماده‌سازی اتاق‌ها…';
 try{await renderer.prepareLocationFamily(currentNode());}catch(error){console.error(error);menu();toast('آماده‌سازی محیط کامل نشد؛ دوباره تلاش کن.');return;}
 finally{document.querySelectorAll('[data-test-environment]').forEach(button=>button.disabled=false);$('start').innerHTML=startLabel;$('start').disabled=$('continue').disabled=false;entering=false;lastTime=performance.now();}
 const arrival=archiveArrival(state,currentLayout());player={...(arrival.position||START),facing:'up',moving:false};
 if(resume&&!officeMigrated&&savedPosition&&Number.isFinite(savedPosition.x)&&Number.isFinite(savedPosition.y)&&walkable(savedPosition,currentLayout(),10))player={...player,...savedPosition};
 collection=null;path=[];pendingObject=null;hold=null;transition=null;mode=state.ending?'ending':'play';
 renderer.resetCamera({yaw:arrival.yaw});bumpCooldown=time+2;save();updateHUD();
 if(state.ending)finish();
 else if(!resume&&!environmentId&&!inOffice(state))openDialog('یک طرح، چهار شخصیت، ده مرحله','<p>از پرونده فرابورس تا اولین پرداخت سود پیش می‌روی. نقش تو با پیشرفت داستان خودکار تغییر می‌کند.</p><p>در هر مأموریت، مدرک روی میز را با E بردار؛ سپس با W A S D و نگاه با موس از ورودی تصمیم عبور کن. هر مرحله چالش اجباری دارد. مسیر اشتباه به بازبینی و اصلاح برمی‌گردد.</p><p>مبالغ، پرداخت‌ها و پاسخ‌ها ساختگی و محلی‌اند. اعداد مالی میلیون تومان‌اند.</p>');
 else canvas.focus({preventScroll:true});
}
function paintOfficePanel(){
 if(!officeDevice||!inOffice(state))return;const panel=officePanel(state,officeDevice);dialog.dataset.officeStation=officeDevice;dialog.classList.toggle('office-guide',Boolean(panel.guide));dialog.classList.toggle('office-device',!panel.guide);openDialog(panel.title,panel.body,[{label:panel.guide?'پایان گفت‌وگو':'پایان کار با وسیله',action:'close'}]);
}
function performOffice(action,value){
 try{
  if(action==='drawer'&&!state.office.drawer&&!walkable(player,officeLayout({...state.office,drawer:true}),10))throw Error('فضای حرکت کشو کافی نیست.');
  state=officeAct(state,action,value);if(action==='scan-start')officeScanClock=0;save();updateHUD();tone(action==='scan-finish'?659:440,.1);if(dialog.open)paintOfficePanel();
 }catch(error){const body=dialog.querySelector('.dialog-body');if(body){let status=body.querySelector('.office-error');if(!status){status=document.createElement('p');status.className='office-status office-error';body.append(status);}status.textContent=error.message;}else toast(error.message);}
}
function inspectOffice(entry){
 if(mode!=='play'||dialog.open||transition)return;const id=entry.object.id;
 if(id==='exit'&&state.office.handed){startTravel('office-leave');return;}
 officeDevice=id;if(id==='calendar')performOffice('calendar');if(id==='terminal')performOffice('terminal');paintOfficePanel();
}
function beginCollection(entry,review=false){
 show('interact',false);show('route-hint',false);
 path=[];keys.clear();player.moving=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const style=(currentNode().scene?.officeRoom||currentNode().scene?.archiveRoom||currentNode().scene?.calendarRoom||currentNode().scene?.workshopRoom||currentNode().scene?.canalRoom||currentNode().scene?.postalRoom||currentNode().scene?.atriumRoom||currentNode().scene?.receptionRoom||currentNode().scene?.auditRoom||currentNode().scene?.bankRoom||currentNode().scene?.paymentRoom||currentNode().scene?.orchardRoom)?'archive':'legacy';renderer.collect(entry,{reduced,review,style});collection={entry,elapsed:0,reduced,review,style};
}
function inspectObject(entry){
 if(inOffice(state)){inspectOffice(entry);return;}
 inspectedEntry=entry;
 if(mode!=='play'||state.ending||dialog.open||collection)return;
  const fresh=entry.object.grant&&!state.inventory.includes(entry.object.grant);
 state=interact(state,entry.object.id);save();
 if(fresh){
  beginCollection(entry);return;
 }
 updateHUD();
 tone(587,.18);
 openDialog(entry.object.name,documentBody(entry.object.text)+(entry.object.grant?'<div class="collected">✦ '+itemLabel(entry.object.grant)+' در کوله‌پشتی توست.</div>':''),entry.object.grant?[{label:'در دست بگیر',action:'held-inspect',primary:true},{label:'ادامه مسیر',action:'close'}]:[{label:'ادامه مسیر',action:'close',primary:true}]);
}
function nearestObject(){
 return currentLayout().objects.filter(o=>renderer.isFirstPerson?renderer.canInspect(player,o):distance(player,o)<92).sort((a,b)=>interactionDistance(player,a)-interactionDistance(player,b))[0];
}
function prepareAdjacentRooms(){
 if(!['window','ownerIdentity','ownerAmount','ownerSend','publish','naturalIdentity','naturalSlip','gateway','verifyBank','receiptCheck'].includes(currentNode().id))return;entering=true;keys.clear();player.moving=false;
 renderer.prepareLocationFamily(currentNode()).catch(error=>{console.error(error);toast('آماده‌سازی محیط کامل نشد؛ صفحه را تازه کن.');}).finally(()=>{entering=false;lastTime=performance.now();});
}
function startTravel(id){
 if(entering||transition||dialog.open||mode!=='play')return;
 try{
  const next=inOffice(state)?officeAct(state,'leave'):travel(state,id);
  tone(659,.2);transition={elapsed:0,next,previousRole:state.role,swapped:false,door:(currentNode().scene?.officeRoom||currentNode().scene?.archiveRoom||currentNode().scene?.calendarRoom||currentNode().scene?.workshopRoom||currentNode().scene?.canalRoom||currentNode().scene?.postalRoom||currentNode().scene?.atriumRoom||currentNode().scene?.receptionRoom||currentNode().scene?.auditRoom||currentNode().scene?.bankRoom||currentNode().scene?.paymentRoom||currentNode().scene?.orchardRoom)?{gate:currentLayout().gates.find(g=>g.exit.id===id),start:{...player},reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}:null};path=[];pendingObject=null;hold=null;player.moving=false;keys.clear();
  show('route-hint',false);show('interact',false);
 }catch(error){toast(error.message);}
}
function finish(){
 mode='ending';path=[];keys.clear();hold=null;
 if(!testSession.active&&!discovered.includes(state.ending)){discovered.push(state.ending);try{storage.setItem('rooyesh.campaign.endings.v3',JSON.stringify(discovered));}catch{}}
 const ending=endings[state.ending],steps=journeyLog(state).length;
 $('ending-screen').innerHTML='<article class="ending-panel '+ending.kind+'"><div class="ending-symbol">'+(ending.kind==='good'?'❀':ending.kind==='warm'?'✦':'☾')+'</div><span class="eyebrow">'+ending.subtitle+'</span><h2>'+ending.title+'</h2><p>'+ending.text+'</p><div class="ending-stats"><div><strong>'+fa(steps)+'</strong><span>تصمیم و بازبینی</span></div><div><strong>'+fa(state.inventory.length)+'</strong><span>مدرک همراه</span></div><div><strong>'+fa(discovered.length)+' / ۱</strong><span>پایان کشف‌شده</span></div></div><div class="ending-buttons"><button class="primary" data-end="new">یک مسیر تازه ←</button><button class="secondary" data-end="journal">مرور ردّ قدم‌ها</button></div><small>داستان، شخصیت‌ها و مبالغ ساختگی‌اند. این تجربه آموزشی است.</small></article>';
 save();updateHUD();$('ending-screen').querySelector('button').focus({preventScroll:true});tone(523,.3);
}
function menu(){
 testSession.leave();show('storage-warning',false);renderer.releaseMouse?.();
 transition=null;hold=null;collection=null;mode='menu';$('game').classList.remove('immersive-view');keys.clear();path=[];show('toast',false);show('ending-screen',false);
 state=newJourney();player={...(currentLayout().spawn||START),facing:'up',moving:false};renderer.resetCamera({x:640,y:450});updateHUD();
}
function casebook(){
 const ledger=state.ledger,status=ledger.status===15?'موفقیت نهایی':ledger.status===5?'آغاز جمع‌آوری':ledger.status==='awaiting-approval'?'در انتظار تأیید نهایی':'پرونده اولیه';
 const labels={submitted:'فیش ثبت‌شده؛ ارسال نشده',pending:'در انتظار بانک',paid:'بانک موفق؛ ارسال فرابورس نامعلوم',sent:'ارسال فرابورس تأییدشده'};
 return '<div class="casebook"><h3>دفتر همین طرح</h3><p>وضعیت فرابورس: '+status+' · ورود سرمایه‌گذار: '+(ledger.published&&ledger.ownerSent?'باز':'بسته')+' · تعهد مجری: '+(ledger.ownerSent?'ارسال موفق':ledger.ownerReceipts.length?'ثبت فیش؛ ارسال نشده':'ثبت نشده')+'</p><p>گواهی: '+(ledger.certificate?'صادرشده به نام آرمان':'هنوز صادر نشده')+' · سود پرداخت‌شده: '+fa(ledger.interestPayments.reduce((s,p)=>s+p.amount,0))+' میلیون تومان</p><ul>'+ledger.payments.map(p=>'<li><strong>'+esc(p.id)+' · '+fa(p.amount)+' میلیون</strong><br>'+labels[p.status]+(p.trace?' · پیگیری '+esc(p.trace):'')+'</li>').join('')+'</ul><p>در تقویم: '+fa(ledger.schedule.length)+' سررسید؛ پرداخت واقعی: '+fa(ledger.schedule.filter(r=>r.paid).length)+' سررسید.</p></div>';
}
function journal(mapOnly=false){
 if(inOffice(state)){openDialog('دفتر پرونده','<p>گلخانه آفتاب · شرکت آفتاب</p><ul>'+[['نامه ارجاع',state.office.referral],['تطبیق اطلاعات',state.office.matched],['پیوست تصویر',state.office.attached],['بازبینی زمان',state.office.reviewed],['تحویل نتیجه',state.office.handed]].map(([label,done])=>'<li>'+esc(label)+' · '+(done?'ثبت‌شده':'—')+'</li>').join('')+'</ul>');return;}
 const log=journeyLog(state);
 openDialog(mapOnly?'نقشه سفر تو':'کوله‌پشتی و دفتر سفر','<p>'+currentNode().title+' · '+fa(log.length)+' مسیر طی‌شده</p>'+(mapOnly?'':'<div class="journal-items">'+(state.inventory.length?state.inventory.map(key=>'<span>✓ '+itemLabel(key)+'</span>').join(''):'هنوز مدرکی برنداشته‌ای.')+'</div>')+(mapOnly?'':casebook())+'<ol class="travel-list">'+(log.length?log.map((e,i)=>'<li><strong>'+fa(i+1)+' · '+e.from+'</strong>'+e.label+'</li>').join(''):'<li>سفر از پرونده طرح آغاز می‌شود؛ نقش‌ها خودکار تغییر می‌کنند.</li>')+'</ol><p>ده مرحله به ترتیب کسب‌وکار پیش می‌روند. هر چالش باید حل شود؛ مدرک‌خوانی به تنهایی مرحله را کامل نمی‌کند.</p>');
}
function pause(){
 if(mode==='menu'){help();return;}
 openDialog('کمی در سایه استراحت کن',(testSession.active?'<p>حالت تست محیط؛ سفر اصلی تغییری نمی‌کند.</p>':'<p>سفر ذخیره شده است.</p>')+'<p>تا بازگشت تو، کاراکتر و چرخ‌دستی‌ها متوقف می‌مانند.</p><p>روانی فعلی: '+(measuredFps?fa(measuredFps)+' فریم در ثانیه':'در حال اندازه‌گیری')+'</p><p>وضوح صحنه: '+fa(Math.round(renderer.getRenderScale()*100))+'٪؛ در حالت روان، خودکار با توان دستگاه هماهنگ می‌شود.</p>',[{label:'ادامه سفر',action:'close',primary:true},{label:'بازگشت به منو',action:'menu'},{label:highQuality?'کیفیت بالا؛ تغییر به اجرای روان‌تر':'اجرای روان‌تر؛ تغییر به کیفیت بالا',action:'quality'},{label:'تمام‌صفحه',action:'fullscreen'}]);save();
}
function help(){
 if(inOffice(state)||mode==='menu'){openDialog('کنترل‌ها','<p>W A S D: حرکت · چپ و راست: چرخش · PageUp و PageDown: نگاه بالا و پایین · E: کار یا گفت‌وگو</p><p>داخل پنل: Tab یا جهت‌ها برای انتخاب؛ E، Enter یا فاصله برای اجرا و تیک‌زدن؛ Escape برای بستن. استفاده از موس اختیاری است.</p>');return;}
 openDialog('کنترل مسیر، دست توست','<ul><li>حرکت: کلیدهای جهت یا W A S D.</li><li>نگاه با موس: روی محیط کلیک کن. اگر قفل موس در دسترس نبود، دکمه چپ را نگه دار و موس را حرکت بده.</li><li>بررسی: به شیء نزدیک شو، به سمت آن نگاه کن و E یا فاصله را بزن.</li><li>انتخاب مسیر: وارد دروازه شو. نزدیک مرکز دروازه برو؛ تصمیم هنگام عبور ثبت می‌شود.</li><li>درِ بسته: مدرک لازم را از میزهای همین داستان پیدا کن.</li><li>چرخ‌دستی: برخورد سه واحد از فرصت روز کم می‌کند؛ می‌توانی کنار جاده صبر کنی.</li><li>چرخش با کیبورد: جهت چپ و راست. حرکت: W A S D.</li><li>نمای محیط بدون رابط: H. دفتر سفر: M. توقف: Escape.</li></ul><p>زمان خواندن مدارک، فرصت روز را کم نمی‌کند. فقط انتخاب راه و برخورد اثر دارد. این نسخه برای کیبورد و موس طراحی شده؛ دید اول‌شخص است. با Escape موس آزاد می‌شود.</p>');
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||mode!=='play'||dialog.open||transition||collection)return;
 canvas.focus({preventScroll:true});keys.clear();
 if(renderer.isFirstPerson){renderer.captureMouse();return;}
 const rect=canvas.getBoundingClientRect(),p=renderer.toWorld(event.clientX-rect.left,event.clientY-rect.top);
 const layout=currentLayout();
 const object=!p.minimap&&layout.objects.find(o=>Math.abs(p.x-o.x)<65&&p.y>o.y-95&&p.y<o.y+60);
 const gate=layout.gates.find(g=>distance(p,g)<65||(!p.minimap&&Math.abs(p.x-g.x)<114&&p.y>g.y+28&&p.y<g.y+100));
 let target=object?{x:object.x,y:object.y+35}:gate?{x:gate.x,y:gate.y}:p;
 path=findPath(player,target,layout);pendingObject=object?object.object.id:null;
 if(!path.length){if(object&&distance(player,object)<92)inspectObject(object);else toast('روی جاده کلیک کن؛ باغچه مسیر عبور نیست.');}
 else tone(330,.055);
});
document.addEventListener('keydown',event=>{
 if(event.ctrlKey||event.metaKey||event.altKey)return;
 if(dialog.open){dialogKey(event,dialog);return;}
 if(event.code==='Escape'){event.preventDefault();pause();return;}
 if(mode!=='play'||transition||collection)return;
 if(event.target.closest?.('button,input,textarea,select'))return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','PageUp','PageDown'].includes(event.code)){
  event.preventDefault();keys.add(event.code);path=[];pendingObject=null;canvas.focus({preventScroll:true});
 }else if(['KeyE','Space'].includes(event.code)){
  event.preventDefault();const object=nearestObject();if(object)inspectObject(object);else toast('به میز یا شخصیت نزدیک‌تر شو.');
 }else if(event.code==='KeyH'){event.preventDefault();$('game').classList.toggle('immersive-view');}else if(event.code==='KeyM'){event.preventDefault();journal(true);}
});
document.addEventListener('pointerlockchange',()=>{keys.clear();player.moving=false;});
 document.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>{keys.clear();player.moving=false;});
document.addEventListener('visibilitychange',()=>{keys.clear();if(mode==='play'){save();if(document.hidden&&!dialog.open)pause();}});
window.addEventListener('resize',()=>renderer.resize());
$('start').onclick=()=>{
 if(saved&&!saved.ending)openDialog('یک داستان تازه؟','<p>سفر جاری با سفر تازه جایگزین می‌شود. پایان‌های کشف‌شده باقی می‌مانند.</p>',[{label:'شروع تازه',action:'new',primary:true},{label:'برگشت',action:'close'}]);
 else enterJourney(false);
};
$('continue').onclick=()=>enterJourney(true);
$('sound').onclick=()=>{
 soundEnabled=!soundEnabled;soundscape.enable(soundEnabled);$('sound').classList.toggle('active',soundEnabled);
 $('sound').setAttribute('aria-label',soundEnabled?'خاموش کردن صدای بازی':'روشن کردن صدای بازی');tone(523,.15);
};
$('pause').onclick=pause;$('brand').onclick=pause;$('help').onclick=help;$('map').onclick=()=>journal(true);$('journal').onclick=()=>journal();$('interact').onclick=()=>{const object=nearestObject();if(object)inspectObject(object);};
dialog.addEventListener('change',event=>{const key=event.target.dataset.officeCheck;if(key&&inOffice(state))performOffice(key==='public'?'public':'check',key==='public'?undefined:key);});
dialog.addEventListener('click',event=>{
 const operation=event.target.closest('[data-office]');if(operation&&inOffice(state)){performOffice(operation.dataset.office,operation.dataset.officeValue);return;}
 const action=event.target.closest('[data-dialog]')?.dataset.dialog;
 if(action==='close')closeDialog();
 else if(action==='held-inspect'&&inspectedEntry&&state.inventory.includes(inspectedEntry.object.grant)){closeDialog();beginCollection(inspectedEntry,true);}
 else if(action==='new'){closeDialog();enterJourney(false);}
 else if(action==='menu'){closeDialog();menu();}
 else if(action==='quality'){highQuality=!highQuality;renderer.setQuality(highQuality);event.target.textContent=highQuality?'کیفیت بالا؛ تغییر به اجرای روان‌تر':'اجرای روان‌تر؛ تغییر به کیفیت بالا';}else if(action==='fullscreen'){
  const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
  Promise.resolve(p).catch(()=>toast('این مرورگر تمام‌صفحه را فعال نکرد؛ F11 را امتحان کن.'));
 }
});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
$('ending-screen').addEventListener('click',event=>{const action=event.target.closest('[data-end]')?.dataset.end;if(action==='new')menu();else if(action==='journal')journal();});
function update(dt){
 if(inOffice(state)&&mode==='play'&&state.office.scanning&&!document.hidden){officeScanClock+=dt;const progress=dialog.querySelector('.office-scan-progress');if(progress)progress.value=officeScanClock;if(officeScanClock>=2){officeScanClock=0;performOffice('scan-finish');}}
 if(entering){player.moving=false;return;}
 if(collection){
  player.moving=false;
  if(dialog.open||document.hidden)return;
  const previous=collection.elapsed;collection.elapsed+=dt;for(const phase of pickupCuesBetween(previous,collection.elapsed,collection.reduced,collection.style))soundscape.pickup(phase,collection.entry.object.kind);
  if(collection.elapsed>=pickupDuration(collection.reduced,collection.style)){const {entry,review}=collection;collection=null;updateHUD();if(!review){$('inventory').classList.remove('inventory-arrival');void $('inventory').offsetWidth;$('inventory').classList.add('inventory-arrival');toast('✦ '+itemLabel(entry.object.grant)+' به کوله‌پشتی اضافه شد.');}openDialog(entry.object.name,documentBody(entry.object.text)+'<div class="collected">✦ '+itemLabel(entry.object.grant)+' در کوله‌پشتی توست.</div>');}
  return;
 }
 if(dialog.open||mode!=='play'){player.moving=false;return;}
 if(transition){
  if(document.hidden)return;const before=transition.elapsed;transition.elapsed+=dt;
  const timing=transition.door?doorJourneyTiming(transition.door.reduced):{swap:.4,end:.85};
  if(transition.door&&!transition.swapped){const d=transition.door;player=doorJourneyPosition(d.start,d.gate,transition.elapsed,d.reduced);for(const cue of doorJourneyCues(before,transition.elapsed,d.reduced))cue==='step'?soundscape.step(false):soundscape.door(cue);}
  if(transition.elapsed>=timing.swap&&!transition.swapped){
   state=transition.next;const arrival=archiveArrival(state,currentLayout());player={...(arrival.position||START),facing:arrival.yaw===Math.PI?'down':'up',moving:false};renderer.resetCamera({yaw:arrival.yaw});transition.swapped=true;lockedGate=null;bumpCooldown=time+2;save();updateHUD();
  }
  if(transition.elapsed>=timing.end){const changed=transition.previousRole!==state.role;transition=null;prepareAdjacentRooms();if(state.ending)finish();else if(changed){const actor=characters[state.role];$('role-card-image').src=actor.portrait;$('role-card-title').textContent='حالا '+actor.name+' هستی';$('role-card-detail').textContent=actor.role+' · '+currentNode().area;roleCardUntil=time+5;show('role-card',true);toast(currentNode().objective);}else toast(state.lastFeedback||currentNode().title+' · '+currentNode().objective);}
  return;
 }
 const layout=currentLayout();
 let dx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));
 let dy=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));
 if(!dx&&!dy&&path.length){
  while(path.length&&distance(player,path[0])<9)path.shift();
  if(path.length){dx=path[0].x-player.x;dy=path[0].y-player.y;}
 }
 if(renderer.isFirstPerson){renderer.turn((Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight')))*dt*1.6);renderer.lookVertical?.((Number(keys.has('PageUp'))-Number(keys.has('PageDown')))*dt); const move=renderer.movement(Number(keys.has('KeyD'))-Number(keys.has('KeyA')),dy);dx=move.dx;dy=move.dy;}
 player=renderer.isFirstPerson?advanceFirstPerson(player,dx,dy,dt,layout):movePlayer(player,dx,dy,dt,layout,235);
 if(player.moving&&time-lastStep>.35){soundscape.step(currentNode().theme==='water'&&player.y>650&&player.y<755);lastStep=time;}
 if(pendingObject&&(!path.length||distance(player,layout.objects.find(o=>o.object.id===pendingObject))<62)){
  const object=layout.objects.find(o=>o.object.id===pendingObject);pendingObject=null;path=[];if(object&&distance(player,object)<92){inspectObject(object);return;}
 }
 const cart=cartAt(currentNode(),time);
 if(cart&&distance(player,cart)<32&&time>bumpCooldown){
  bumpCooldown=time+3;state=collide(state);path=[];player=pushAway(player,cart,layout);save();updateHUD();tone(160,.2);toast('به چرخ‌دستی برخورد کردی؛ ۳ واحد از فرصت روز کم شد.');if(state.ending){finish();return;}
 }
 const object=nearestObject();show('interact',Boolean(object));
 if(object)$('interact').querySelector('span').textContent=object.object.name;
 if(inOffice(state)){show('route-hint',false);hold=null;if(time-lastSave>2){save();lastSave=time;}return;}
 const gate=layout.gates.filter(g=>distance(player,g)<152).sort((a,b)=>distance(player,a)-distance(player,b))[0];
 show('route-hint',Boolean(gate));
 if(gate){
  const exit=exitsFor(state).find(e=>e.id===gate.exit.id),missing=missingItems(state,exit);
  $('route-hint').innerHTML='<strong>'+exit.label+'</strong>'+(missing.length?'مدرک لازم: '+missing.map(itemLabel).join('، '):exit.detail);
  if(distance(player,gate)<29){
   if(missing.length){hold=null;path=[];if(lockedGate!==exit.id){lockedGate=exit.id;toast('در بسته است؛ '+missing.map(itemLabel).join('، ')+' را پیدا کن.');}}
   else{if(hold?.id!==exit.id)hold={id:exit.id,progress:0};hold.progress+=dt/.18;if(hold.progress>=1)startTravel(exit.id);}
  }else hold=null;
 }else{hold=null;lockedGate=null;}
 if(time-lastSave>2){save();lastSave=time;}
}
function frame(){const now=performance.now();
 const rawDt=(now-lastTime)/1000||0;
 if(mode==='play'&&!dialog.open&&!document.hidden&&rawDt>0&&rawDt<.5){frameSamples.push(rawDt);if(frameSamples.length>120)frameSamples.shift();const total=frameSamples.reduce((a,b)=>a+b,0);if(total>1)measuredFps=Math.round(frameSamples.length/total);}
 renderer.sampleFrame(rawDt,mode==='play'&&!entering&&!dialog.open&&!document.hidden&&!transition&&!collection);
 const dt=Math.min(rawDt,.15);lastTime=now;
 if(!dialog.open&&!document.hidden)time+=dt;
 update(dt);
 show('role-card',mode==='play'&&time<roleCardUntil);
 show('reticle',mode==='play'&&!dialog.open&&!collection);
 soundscape.update(currentNode().theme,mode==='play'&&!dialog.open&&!document.hidden,player.y);
 if(time>toastUntil)show('toast',false);
 const fade=transition?(transition.door?doorJourneyPose(transition.elapsed,transition.door.reduced).fade:(transition.elapsed<.4?transition.elapsed/.4:Math.max(0,1-(transition.elapsed-.4)/.45))):0;
 $('travel-fade').style.opacity=String(fade);
 renderer.render({officeScanElapsed:officeScanClock,node:currentNode(),state,player,palette:characters[state.role],time,dt,target:path.at(-1),hold,mode:mode==='play'?'play':mode==='menu'?'menu':'ending',fade,paused:dialog.open||document.hidden,pickupElapsed:collection?.elapsed??null,doorTransit:transition?.door&&!transition.swapped?{id:transition.door.gate.exit.id,elapsed:transition.elapsed,reduced:transition.door.reduced}:null});
 requestAnimationFrame(frame);
}
if(loaded.error){show('storage-warning',true);$('storage-warning').textContent=loaded.error;}
await document.fonts.ready;
updateHUD();requestAnimationFrame(frame);

$('environment-test-options').innerHTML=sixEnvironments.map(e=>e.ready?'<button type="button" data-test-environment="'+esc(e.id)+'">'+esc(e.name)+'</button>':'<div class="environment-pending">'+esc(e.name)+'<small>در انتظار بازطراحی</small></div>').join('');
$('environment-test-options').addEventListener('click',event=>{const id=event.target.closest('[data-test-environment]')?.dataset.testEnvironment;if(id)enterJourney(false,id);});
$('environment-test-badge').onclick=()=>{if(dialog.open)closeDialog();menu();};
