import {setRouteSeed} from './game/routePlacement.js';
setRouteSeed('atlas-preview-v2');
import {doorJourneyPosition,doorJourneyTiming} from './game/doorJourney.js';
import {pickupDuration} from './game/pickup.js';
import {createRenderer} from './render/scene3d.js';
import {nodes,challenges} from './content/campaign.js';
import {characters} from './content/characters.js';
import {layoutFor} from './game/world.js';
import {advanceFirstPerson} from './game/firstPerson.js';
await document.fonts.ready;
const $=id=>document.getElementById(id),canvas=$('world'),selector=$('location'),keys=new Set();
let index=0,node,player,state,firstPerson=false,previous=performance.now(),time=0,frameCount=0,frameSeconds=0;
let previewRole=null;
const locations=challenges.flatMap(c=>[nodes[c.id],...(c.id==='project'?[nodes['repair-project-0'],nodes['repair-project-2']]:c.id==='window'?[nodes['repair-window-1'],nodes['repair-window-2']]:c.id==='ownerIdentity'?[nodes['repair-ownerIdentity-0'],nodes['repair-ownerIdentity-1']]:c.id==='ownerAmount'?[nodes['repair-ownerAmount-0'],nodes['repair-ownerAmount-2']]:c.id==='ownerSend'?[nodes['repair-ownerSend-1'],nodes['repair-ownerSend-2']]:c.id==='publish'?[nodes['repair-publish-0'],nodes['repair-publish-2']]:c.id==='naturalIdentity'?[nodes['repair-naturalIdentity-1'],nodes['repair-naturalIdentity-2']]:c.id==='naturalSlip'?[nodes['repair-naturalSlip-0'],nodes['repair-naturalSlip-1']]:c.id==='gateway'?[nodes['repair-gateway-1'],nodes['repair-gateway-2']]:[])]);
for(const [i,c] of locations.entries()){const option=document.createElement('option');option.value=i;option.textContent=(i+1)+' — '+c.scene.name;selector.append(option);}
let renderer,demo=null,doorDemo=null;
try{renderer=await createRenderer(canvas);}catch(error){$('location-status').textContent='بارگذاری محیط ناموفق بود.';throw error;}
let selecting=false;
async function selectScene(value){
 if(selecting)return;selecting=true;
 const requested=locations[(Number(value)+locations.length)%locations.length];selector.disabled=true;$("previous").disabled=$("next").disabled=true;$('location-status').textContent='در حال آماده‌سازی محیط…';try{await renderer.prepareLocationFamily(requested);}finally{selector.disabled=false;$("previous").disabled=$("next").disabled=false;selecting=false;}
 demo=null;doorDemo=null;index=(Number(value)+locations.length)%locations.length;selector.value=index;node=locations[index];
 const layout=layoutFor(node);$('door-choice').innerHTML=layout.gates.map((g,i)=>'<option value="'+i+'">'+g.exit.label+'</option>').join('');player={...layout.spawn,moving:false,facing:'up'};state={inventory:[],role:node.role};
 renderer.resetCamera({yaw:layout.entryYaw});keys.clear();
 $('handling-preview').hidden=!(node.scene.archiveRoom||node.scene.calendarRoom||node.scene.workshopRoom||node.scene.canalRoom||node.scene.postalRoom||node.scene.atriumRoom||node.scene.receptionRoom||node.scene.paymentRoom||node.scene.orchardRoom);$('door-preview').hidden=!(node.scene.archiveRoom||node.scene.calendarRoom||node.scene.workshopRoom||node.scene.canalRoom||node.scene.postalRoom||node.scene.atriumRoom||node.scene.receptionRoom||node.scene.paymentRoom||node.scene.orchardRoom);$('location-name').textContent=node.scene.name;$('guide-name').textContent='راهنما: '+node.scene.guide.name+'؛ '+node.scene.guide.role;
 $('location-task').textContent=node.objective;$('location-status').textContent='محیط '+(index+1)+' از '+locations.length+' آماده است.';
}
selector.onchange=()=>selectScene(selector.value);$('next').onclick=()=>selectScene(index+1);$('previous').onclick=()=>selectScene(index-1);
$('view').onclick=()=>{firstPerson=!firstPerson;$('view').textContent=firstPerson?'نمای کلی':'دید اول‌شخص';$('view-help').textContent=firstPerson?'W A S D: حرکت؛ جهت‌ها: چرخش؛ کشیدن موس: نگاه. این پیش‌نمایش، پرداخت یا پیشرفت مرحله ندارد.':'نمای کلی محیط؛ با «دید اول‌شخص» وارد صحنه شو.';canvas.focus();};
function previewHandling(){doorDemo=null;firstPerson=true;$('view').textContent='نمای کلی';const entry=layoutFor(node).objects.find(e=>e.object.id==='evidence'||e.object.id==='review');if(!entry)return;renderer.collect(entry,{review:true,style:'archive'});demo={elapsed:0};keys.clear();}
$('preview-role').onchange=()=>{previewRole=$('preview-role').value||null;};
$('handling-play').onclick=()=>{$('handling-phase').value='';previewHandling();};$('handling-phase').onchange=()=>{previewHandling();demo.elapsed=Number($('handling-phase').value)||0;};
function previewDoor(){demo=null;firstPerson=true;$('view').textContent='نمای کلی';const gate=layoutFor(node).gates[Number($('door-choice').value)],start=gate.approach||{x:gate.x,y:gate.y+28};player={...start,moving:false};renderer.resetCamera({yaw:gate.travelYaw||0});doorDemo={gate,start,elapsed:Number($('door-phase').value)||0};keys.clear();}
$('door-play').onclick=()=>{$('door-phase').value='';previewDoor();};$('door-phase').onchange=previewDoor;$('door-choice').onchange=()=>{if(doorDemo)previewDoor();};
$('guide-view').onclick=()=>{demo=null;doorDemo=null;firstPerson=true;$('view').textContent='نمای کلی';const guide=layoutFor(node).objects.find(o=>o.object.kind==='guide');player={x:guide.x,y:guide.y+43,moving:false};renderer.resetCamera({yaw:0,fov:40});keys.clear();canvas.focus();};
document.addEventListener('keydown',e=>{if(e.target.closest('select,button'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
window.addEventListener('resize',()=>renderer.resize());canvas.onpointerdown=()=>canvas.focus();
await renderer.prepareLocationFamily(nodes.project);selectScene(0);
function frame(){const now=performance.now();
 const elapsed=(now-previous)/1000,dt=Math.min(.15,elapsed);previous=now;frameCount++;frameSeconds+=elapsed;if(frameSeconds>=1){$('location-performance').textContent='روانی پیش‌نمایش: '+Math.round(frameCount/frameSeconds)+' فریم در ثانیه · وضوح '+Math.round(renderer.getRenderScale()*100)+'٪';frameSeconds=0;frameCount=0;}time+=dt;renderer.sampleFrame(dt,firstPerson);
 if(demo){if($('handling-phase').value==='')demo.elapsed+=dt;if(demo.elapsed>pickupDuration(false,'archive'))demo=null;}
 if(doorDemo){if($('door-phase').value==='')doorDemo.elapsed+=dt;player=doorJourneyPosition(doorDemo.start,doorDemo.gate,Math.min(doorDemo.elapsed,doorJourneyTiming().fade-.01));}
 if(firstPerson&&!demo&&!doorDemo){renderer.turn((Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight')))*dt*1.6);const move=renderer.movement(Number(keys.has('KeyD'))-Number(keys.has('KeyA')),Number(keys.has('KeyS'))-Number(keys.has('KeyW')));player=advanceFirstPerson(player,move.dx,move.dy,dt,layoutFor(node));}
 renderer.render({node,state,player,palette:characters[previewRole||node.role],time,dt,mode:firstPerson?'play':'menu',paused:false,pickupElapsed:demo?.elapsed??null,doorTransit:doorDemo?{id:doorDemo.gate.exit.id,elapsed:Math.min(doorDemo.elapsed,doorJourneyTiming().fade-.01),reduced:false}:null});requestAnimationFrame(frame);
}
requestAnimationFrame(frame);