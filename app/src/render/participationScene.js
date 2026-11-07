import {documentCarryPose} from './documentCarry.js';
import * as T from '../../vendor/three.module.js';
import {paymentTools} from './paymentTools.js';
import {participationFixtures} from '../game/participationRoom.js';
import {participationDurations} from '../game/participationWorkflow.js';
import {exchangePose,roleExchanges,handoffPaperPoint} from '../game/roleExchange.js';
import {buildOfficeExit} from './officeExit.js';
export function buildParticipationScene(root,node,layout,h){
 const m=h.participationMaterials||Object.fromEntries(['floor','brick','wall','ceiling','metal','wood','steel','dark','black','body','paper','folder','accent','screen','glass','doorGlass','glow','scan','fabric','felt','asphalt','leaf','soil','red'].map(k=>[k,h.mat('#7b8982')])),t=paymentTools(root,h,m);
 const group=(name,x=0,y=0,z=0,parent=root)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;},dynamic=g=>{g.traverse(o=>{if(o.isMesh)o.userData.dynamic=true;});return g;};
 const pipe=(parent,name,points,r,material=m.black)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),mesh=new T.Mesh(h.geo(name+JSON.stringify(points),()=>new T.TubeGeometry(curve,32,r,8,false)),material);mesh.name=name;parent.add(mesh);return mesh;};
 const shape=new T.Shape();[[-26,-24],[6,-24],[6,-14],[26,-14],[26,25],[-26,25]].forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const floor=new T.Mesh(h.geo('participation-L-floor',()=>new T.ShapeGeometry(shape)),m.floor);floor.name='participation-terrazzo-floor';floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;root.add(floor);const ceiling=floor.clone();ceiling.name='participation-L-ceiling';ceiling.material=m.ceiling;ceiling.position.y=11;ceiling.rotation.x=-Math.PI/2;ceiling.material=m.ceiling.clone();ceiling.material.side=T.DoubleSide;ceiling.material.userData.transient=true;root.add(ceiling);
 function wall(x,z,w,d){let brick=m.brick;if(brick.map){brick=brick.clone();brick.map=brick.map.clone();brick.map.repeat.set(Math.max(w,d)/8,.4);brick.userData.transient=true;brick.userData.ownedMap=true;}t.box('participation-brick-plinth',x,1.2,z,w,2.4,d,brick);t.box('participation-plaster-wall',x,6.7,z,w,8.6,d,m.wall);t.box('participation-skirting',x,.18,z,w+.03,.3,d+.03,m.dark);t.box('participation-ceiling-cornice',x,10.55,z,w+.08,.25,d+.08,m.body);}
 wall(-26,.5,.5,49);wall(-10,-24,32,.5);wall(6,-19,.5,10);wall(16,-14,20,.5);wall(26,-12.4,.5,3.2);wall(26,11.8,.5,26.4);
 // The street facade has a masonry base, continuous head and supported glazing.
 t.box('participation-facade-base',0,.5,25,52,1,.6,m.brick);t.box('participation-facade-head',0,9.9,25,52,2.2,.6,m.brick);
 for(let x=-25;x<=25;x+=5){t.box('participation-storefront-mullion',x,4.9,25,.16,8,.3,m.metal);if(x<25&&x!==-20)t.box('participation-street-glass',x+2.5,4.9,25,4.84,7.8,.07,m.glass);}
 t.box('participation-street-entry-door',-17.5,4.9,25,4.8,7.8,.07,m.glass);for(const x of [-19.85,-15.15])t.box('participation-entry-door-stile',x,4.9,24.9,.12,7.8,.16,m.metal);t.box('participation-entry-door-bottom',-17.5,1.3,24.9,4.7,.5,.16,m.metal);for(const y of [3.9,5])t.box('participation-entry-handle-mount',-15.8,y,24.75,.16,.18,.3,m.steel);t.box('participation-entry-door-pull',-15.8,4.45,24.55,.12,1.25,.12,m.steel);for(const y of [2,5,8])t.box('participation-entry-door-hinge',-19.8,y,24.88,.22,.4,.22,m.steel);
 for(const y of [1,8.8])t.box('participation-storefront-rail',0,y,25,52,.17,.3,m.metal);
 t.box('participation-entry-mat',-18,.025,22.8,5,.05,2.8,m.dark);t.box('participation-street-sidewalk',0,-.22,32,180,.35,14,m.body);t.box('participation-road',0,-.47,47,220,.2,16,m.asphalt);t.box('participation-kerb',0,-.05,38.8,180,.4,.35,m.steel);
 for(let x=-80;x<=80;x+=8){t.box('participation-paving-joint',x,-.034,32,.025,.012,13.5,m.dark);t.box('participation-road-dash',x,-.355,47,3,.012,.12,m.paper);}for(let x=-24;x<26;x+=.4)t.box('participation-tactile-paving',x,-.02,36,.09,.025,.8,m.accent);
 t.box('participation-store-awning',0,10.2,28,53,.3,6,m.metal);for(const x of [-25,-10,8,25]){t.beam('participation-awning-brace',[x,8.4,25.3],[x,10,30],.13,m.steel);t.box('participation-awning-wall-anchor',x,8.4,25.35,.4,.4,.15,m.steel);}
 const sign=group('participation-facade-sign',0,9.7,28.1);const st=paymentTools(sign,h,m);st.screen('participation-branch-sign',0,0,0,10,1.1,['خانه مشارکت آفتاب']);sign.rotation.y=Math.PI;
 for(const [x,z,w,ht,col]of [[-37,69,22,25,'brick'],[-9,75,25,33,'wall'],[23,68,25,22,'brick'],[53,78,25,35,'wall'],[-65,75,24,32,'wall']]){t.box('participation-neighbour-building',x,ht/2,z,w,ht,10,m[col]);for(let yy=4;yy<ht-2;yy+=5)for(let xx=x-w/2+3;xx<x+w/2-1;xx+=4){t.box('participation-neighbour-window-frame',xx,yy,z-5.1,2.6,3,.2,m.dark);t.box('participation-neighbour-window',xx,yy,z-5.22,2.3,2.7,.03,m.steel);}}
 for(const x of [-34,35]){t.cylinder('participation-streetlamp-base',x,.2,34,.5,.5,m.dark);t.cylinder('participation-streetlamp-post',x,5.2,34,.12,10,m.metal);t.box('participation-streetlamp-head',x,10.2,34,2,.25,1,m.dark);t.box('participation-streetlamp-light',x,10.05,34,1.5,.04,.7,m.glow);}
 for(const x of [-31,31]){t.box('participation-street-planter',x,.8,29,3.5,1.6,3,m.brick);t.box('participation-street-planter-soil',x,1.61,29,3.1,.05,2.6,m.soil);for(let k=0;k<14;k++){const a=k*2.4;t.beam('participation-planter-stem',[x,1.7,29],[x+Math.cos(a),3+Math.sin(k)*.3,29+Math.sin(a)],.045,m.leaf);const leaf=t.box('participation-planter-leaf',x+Math.cos(a),2.8,29+Math.sin(a),.6,.06,.28,m.leaf,true);leaf.rotation.z=a;}}
 const bike=group('participation-street-bicycle',12,0,33);const bt=paymentTools(bike,h,m);for(const x of [-1.5,1.5]){bt.ring('participation-bicycle-tyre',x,1,0,1,.09,m.black);bt.ring('participation-bicycle-rim',x,1,0,.9,.035,m.steel);for(let k=0;k<12;k++)bt.beam('participation-bicycle-spoke',[x,1,0],[x+Math.cos(k*Math.PI/6)*.88,1+Math.sin(k*Math.PI/6)*.88,0],.017,m.steel);}for(const [a,b]of [[[-1.5,1,0],[-.4,2.6,0]],[[-1.5,1,0],[.3,1,0]],[[-.4,2.6,0],[.3,1,0]],[[-.4,2.6,0],[1,2.5,0]],[[.3,1,0],[1,2.5,0]],[[1,2.5,0],[1.5,1,0]]])bt.beam('participation-bicycle-frame',a,b,.08,m.red);bt.box('participation-bicycle-saddle',-.4,2.8,0,.65,.18,.5,m.black,true);bt.beam('participation-bicycle-handlebar',[1,2.7,-.5],[1,2.7,.5],.07,m.steel);t.ring('participation-bike-rack',12,1,32,1,.08,m.steel);
 // Lighting and services are mechanically attached to the ceiling or wall.
 for(const [x,z]of [[-17,-12],[-3,-17],[-12,5],[12,-6],[18,14],[-5,18]]){for(const dx of [-1.6,1.6])t.cylinder('participation-lamp-suspension',x+dx,10.3,z,.035,1.2,m.steel);t.box('participation-pendant-housing',x,9.65,z,4,.18,1.3,m.dark,true);t.box('participation-pendant-diffuser',x,9.54,z,3.7,.04,1,m.glow);}
 for(const x of [-21,-11,-1]){t.box('participation-ceiling-acoustic-panel',x,10.8,-5,5,.15,4,m.felt);}
 t.box('participation-air-conditioning',-25.55,8,-10,.5,1.6,5,m.body,true);for(let k=0;k<8;k++)t.box('participation-air-vent',-25.26,7.7+k*.1,-10,.025,.03,4.4,m.dark);
 const desks={};function desk(kind){const f=participationFixtures.find(f=>f.kind===kind),g=group('participation-fixture-'+kind,f.x,0,f.z),s=paymentTools(g,h,m);desks[kind]={g,s,f};s.box('participation-worktop',0,2.6,0,f.w,.2,f.d,m.body,true);if(['wallet','printer'].includes(kind)){s.box('participation-storage-cabinet',0,1.35,0,f.w-.35,2.3,f.d-.3,m.metal,true);for(const x of [-f.w/4,f.w/4]){s.box('participation-cabinet-door',x,1.4,f.d/2-.08,f.w/2-.3,2.05,.08,m.body,true);s.box('participation-cabinet-handle',x,2.04,f.d/2,.65,.09,.14,m.steel);}if(kind==='printer')for(const x of [-f.w/2+.5,f.w/2-.5])for(const z of [-f.d/2+.4,f.d/2-.4]){s.box('participation-printer-caster-fork',x,.25,z,.22,.3,.3,m.steel);s.cylinder('participation-printer-caster',x,.13,z,.16,.16,m.black).rotation.z=Math.PI/2;}return desks[kind];}if(kind==='identity'){s.box('participation-terminal-pedestal',0,1.3,-.2,1.6,2.4,1.6,m.metal,true);s.box('participation-terminal-plinth',0,.12,-.2,3,.24,2.5,m.dark,true);return desks[kind];}for(const x of [-f.w/2+.45,f.w/2-.45]){s.box('participation-desk-pedestal',x,1.3,0,.4,2.4,f.d-.4,m.metal,true);s.box('participation-desk-foot',x,.1,0,.8,.2,f.d-.2,m.dark,true);}return desks[kind];}
 for(const kind of ['wallet','guide-desk','scanner','identity','order','gateway','printer','handoff'])desk(kind);
 // A rounded reception fascia gives this branch its own architectural identity.
 const ct=desks['guide-desk'].s;ct.box('participation-reception-fascia',0,1.5,1.25,9.5,2.2,.35,m.metal,true);for(let x=-4.4;x<4.5;x+=.4)ct.box('participation-reception-flute',x,1.5,1.47,.07,2,.06,m.accent);for(const x of [-4.65,4.65])ct.cylinder('participation-rounded-counter-end',x,1.5,.85,.6,2.2,m.metal);ct.screen('participation-guide-workstation',1.5,3.6,-.35,2.4,1.4,['پذیرش']);ct.paper('participation-guide-notepad',-2,2.72,.2,1.6,1.5,['نوبت پذیرش']);ct.cylinder('participation-guide-pen-cup',-3.4,3,-.5,.25,.6,m.dark);for(const x of [-3.5,-3.35])ct.cylinder('participation-guide-pen',x,3.35,-.5,.025,.7,m.accent);
 function screenAt(kind,title){const {g,s}=desks[kind];s.box('participation-monitor-foot',0,2.76,-.25,1.6,.12,.8,m.dark,true);s.box('participation-monitor-neck',0,3.15,-.4,.22,.8,.2,m.steel);s.screen('participation-'+kind+'-monitor',0,4.05,-.5,3.5,2,[title]);s.box('participation-keyboard-base',-.25,2.77,.7,2.9,.15,.8,m.dark,true);for(let row=0;row<4;row++)for(let col=0;col<12;col++)s.box('participation-keyboard-key',-1.5+col*.23,2.88,.43+row*.18,.19,.045,.13,m.body,true);s.box('participation-mouse-pad',1.8,2.72,.65,.7,.025,1,m.felt);s.box('participation-mouse',1.8,2.83,.65,.4,.2,.65,m.black,true);pipe(g,'participation-workstation-cable',[[0,3.5,-.7],[.4,2.7,-1],[.4,1.2,-1],[.4,.14,-1]],.035);s.box('participation-floor-socket',.4,.1,-1,.5,.15,.4,m.steel);return g;}
 screenAt('identity','پذیرش هویت');screenAt('gateway','درگاه');
 const displays={};function display(name,parent,x,y,z,w,ht){if(!h.archiveText)return null;const c=document.createElement('canvas');c.width=1280;c.height=768;const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;const material=new T.MeshBasicMaterial({map:texture});material.userData.transient=true;material.userData.ownedMap=true;const mesh=new T.Mesh(h.geo('participation-display',()=>new T.PlaneGeometry(1,1)),material);mesh.name=name;mesh.scale.set(w,ht,1);mesh.position.set(x,y,z);parent.add(mesh);displays[name]={mesh,q:c.getContext('2d'),texture};return mesh;}
 display('participation-identity-live-screen',desks.identity.g,0,4.05,-.3,3.5,2);display('participation-gateway-live-screen',desks.gateway.g,0,4.05,-.3,3.5,2);
 for(const x of [14.5,21.5]){t.box('participation-privacy-panel-frame',x,3.5,3.8,.16,7,6.8,m.metal);t.box('participation-privacy-felt-panel',x,3.5,3.8,.18,6.6,6.4,m.felt);for(const z of [.5,7.1])t.box('participation-privacy-panel-foot',x,.12,z,.8,.24,.5,m.dark);}t.box('participation-booth-back',18,3.5,.4,7.2,7,.16,m.felt);
 // Personal bag with hinged lid; its documents have recognizable content and proportions.
 const bag=group('participation-personal-bag',-20,2.71,12),bagT=paymentTools(bag,h,m);bagT.box('participation-bag-shell',0,.09,0,3.7,.18,2,m.fabric,true);
 for(const side of [-1,1]){
  bagT.box('participation-bag-side',side*1.76,.46,0,.18,.74,2,m.fabric,true);
  const front=side===1;
  bagT.box('participation-bag-wall',0,front?.21:.46,side*.91,3.55,front?.24:.74,.18,m.fabric,true);
 }
 bagT.box('participation-bag-lining',0,.187,0,3.47,.024,1.64,m.dark,true);const bagLid=group('participation-bag-lid',0,.8,-1,bag),bl=paymentTools(bagLid,h,m);bl.box('participation-bag-top',0,0,1,3.7,.13,2,m.fabric,true);bl.beam('participation-bag-handle',[-.7,.1,.8],[-.7,.4,.8],.09,m.dark);bl.beam('participation-bag-handle',[-.7,.4,.8],[.7,.4,.8],.09,m.dark);bl.beam('participation-bag-handle',[.7,.4,.8],[.7,.1,.8],.09,m.dark);for(let x=-1.7;x<1.8;x+=.12)bagT.box('participation-bag-zipper',x,.335,1.01,.05,.04,.04,m.steel);dynamic(bagLid);
 function documentProp(name,kind){const g=group(name),s=paymentTools(g,h,m),card=kind==='id'||kind==='bankcard',w=card?1.55:2.2,d=card?.95:2.8;s.box(name+'-sheet',0,.025,0,w,.05,d,kind==='bankcard'?m.metal:m.paper,true);if(kind==='id'){s.box('participation-id-photo',-.46,.058,0,.4,.01,.58,m.felt);s.cylinder('participation-id-portrait-head',-.46,.069,-.07,.1,.008,m.accent);s.box('participation-id-portrait-shoulders',-.46,.069,.12,.27,.008,.19,m.body,true);s.print('مانی',.25,.06,-.17,.7,.22,'#234149',true);s.print('کارت هویت',.2,.06,.17,.85,.18,'#234149',true);}else if(kind==='bankcard'){s.box('participation-card-chip',-.4,.06,-.12,.28,.02,.23,m.accent);s.print('1111 2222 3333 4444',0,.06,.18,1.35,.16,'#eef0df',true);s.print('09/09 · 123',.2,.06,-.25,.95,.14,'#eef0df',true);}else{s.print(kind==='slip'?'N-200 · پرداخت‌شده':'N-80 · درخواست',0,.06,-.7,1.95,.26,'#234149',true);s.print(kind==='slip'?'۲۰۰ میلیون تومان':'۸۰ میلیون تومان',0,.06,-.22,1.9,.25,'#234149',true);s.print(kind==='slip'?'مانی':'در انتظار بانک',0,.06,.22,1.9,.22,'#234149',true);for(let k=0;k<15;k++)s.box('participation-receipt-barcode',-.7+k*.1,.06,.8,.03,.01,.3,m.dark);}return dynamic(g);}
 const fingerprint=desks.identity.s;
 fingerprint.box('participation-fingerprint-body',0,2.83,1.08,1.13,.27,.72,m.dark,true);
 fingerprint.box('participation-fingerprint-glass',0,2.98,1.08,.51,.026,.46,m.glass,true);
 const greenScan=new T.MeshBasicMaterial({color:'#45ff75'});
 greenScan.userData.transient=true;
 const fingerLight=fingerprint.box('participation-fingerprint-sweep',0,3.001,1.08,.49,.018,.055,greenScan);
 const sensorGlow=new T.PointLight('#49ff70',0,1.25,2);
 sensorGlow.position.set(0,3.11,1.08);
 desks.identity.g.add(sensorGlow);
 fingerLight.userData.dynamic=true;
 const fingerLed=fingerprint.box('participation-fingerprint-led',.43,3.002,1.08,.08,.018,.08,m.scan);
 fingerLed.userData.dynamic=true;
 const mobile=dynamic(group('participation-iphone-14-pro'));
 const mobileParts=paymentTools(mobile,h,m);
 function phoneLayer(name,width,height,radius,depth,z,material){
  const x=width/2,y=height/2,outline=new T.Shape();
  outline.moveTo(-x+radius,-y);outline.lineTo(x-radius,-y);
  outline.quadraticCurveTo(x,-y,x,-y+radius);outline.lineTo(x,y-radius);
  outline.quadraticCurveTo(x,y,x-radius,y);outline.lineTo(-x+radius,y);
  outline.quadraticCurveTo(-x,y,-x,y-radius);outline.lineTo(-x,-y+radius);
  outline.quadraticCurveTo(-x,-y,-x+radius,-y);
  const geometry=h.geo(name,()=>new T.ExtrudeGeometry(outline,{depth,bevelEnabled:false,curveSegments:12}));
  const layer=new T.Mesh(geometry,material);
  layer.name=name;layer.position.z=z;mobile.add(layer);
 }
 phoneLayer('iphone-steel-frame',.35,.70,.062,.039,-.0195,m.steel);
 phoneLayer('iphone-glass-front',.336,.685,.057,.006,.0195,m.black);
 phoneLayer('iphone-matte-back',.336,.685,.057,.004,-.0235,m.metal);
 mobileParts.box('iphone-camera-island',-.093,.226,-.026,.138,.145,.018,m.metal,true);
 for(const [x,y] of [[-.127,.258],[-.061,.222],[-.126,.19]]){
  const ring=mobileParts.cylinder('iphone-camera-ring',x,y,-.041,.033,.015,m.steel);
  ring.rotation.x=Math.PI/2;
  const lens=mobileParts.cylinder('iphone-camera-lens',x,y,-.050,.026,.011,m.black);
  lens.rotation.x=Math.PI/2;
 }
 mobileParts.box('iphone-side-button',.177,.13,0,.014,.11,.018,m.steel,true);
 mobileParts.box('iphone-volume-up',-.177,.15,0,.012,.074,.018,m.steel,true);
 mobileParts.box('iphone-volume-down',-.177,.055,0,.012,.074,.018,m.steel,true);
 const personalBox=dynamic(group('participation-personal-box',0,.49,.04,bag));
 personalBox.rotation.x=.22;
 bagT.box('participation-box-support',0,.305,0,2.66,.21,1.14,m.dark,true);
 const boxTools=paymentTools(personalBox,h,m);
 boxTools.box('personal-box-base',0,.05,0,2.87,.1,1.48,m.paper,true);
 boxTools.box('personal-box-insert',0,.11,0,2.7,.035,1.32,m.dark,true);
 for(const side of [-1,1]){
  boxTools.box('personal-box-side',side*1.38,.13,0,.09,.23,1.48,m.paper);
  boxTools.box('personal-box-edge',0,.13,side*.697,2.69,.23,.08,m.paper);
 }
 const personalLid=dynamic(group('participation-personal-box-lid',0,.25,-.74,personalBox));
 const lidTools=paymentTools(personalLid,h,m);
 lidTools.box('personal-box-cover',0,0,.74,2.87,.09,1.48,m.paper,true);
 lidTools.print('iPhone',0,.05,.74,1.17,.26,'#26343d',true);
 const bagPhone=dynamic(mobile.clone(true));
 bagPhone.name='participation-iphone-in-bag';
 personalBox.add(bagPhone);
 bagPhone.position.set(.66,.163,.08);
 bagPhone.rotation.set(Math.PI/2,0,-.16);
 bagPhone.scale.setScalar(1.48);
 const boxCard=dynamic(documentProp('participation-box-bankcard','bankcard'));
 personalBox.add(boxCard);
 boxCard.scale.setScalar(.77);
 boxCard.rotation.y=.10;
 const mobileScreen=display('participation-iphone-screen',mobile,0,0,.026,.318,.661);
 if(mobileScreen){mobileScreen.material.transparent=true;mobileScreen.material.alphaTest=.5;const canvas=displays[mobileScreen.name].q.canvas;canvas.width=480;canvas.height=1000;}
 const paymentConsole=dynamic(group('participation-in-person-payment',24,0,8));
 const pay=paymentTools(paymentConsole,h,m);
 pay.box('participation-payment-pedestal',0,1.3,0,1.05,2.6,.95,m.metal,true);
 pay.box('participation-payment-console',0,2.87,-.15,1.26,.55,.9,m.body,true);
 pay.box('participation-payment-screen',0,3.16,-.29,.91,.045,.45,m.screen,true);
 pay.print('پرداخت حضوری',0,3.189,-.29,.85,.17,'#e6f4df',true);
 pay.box('participation-payment-slot',0,2.95,.31,.98,.10,.03,m.black);
 pay.box('participation-payment-tray',0,2.77,.52,1.06,.06,.65,m.steel);
 const payLed=pay.box('participation-payment-led',.48,3.164,-.28,.08,.016,.08,m.scan);
 const paymentSlip=dynamic(documentProp('participation-issued-first-slip','slip'));
 paymentConsole.add(paymentSlip);paymentSlip.scale.setScalar(.36);
 const filedSlip=dynamic(documentProp('participation-filed-first-slip','slip'));
 filedSlip.position.set(-11,2.73,1);filedSlip.scale.setScalar(.53);
 let phoneLift=0,previousHeld=null,slipLift=1,lastPhoneFrame=null;
 let previousPhoneOwned=null,bagPickup=1;
 const bagPhoneRest=new T.Vector3(.66,.163,.08);
 const slipOrigin=new T.Vector3();
 const originals={};for(const [i,kind]of ['id','slip','bankcard'].entries()){const g=documentProp('participation-original-'+kind,kind);g.position.set(-21+i,3.54,12);g.scale.setScalar(.65);originals[kind]=g;}
 const scanner=group('participation-flatbed-scanner',-3,2.71,-17),sc=paymentTools(scanner,h,m);sc.box('participation-scanner-base',0,.25,0,4.9,.5,2.7,m.body,true);sc.box('participation-scanner-glass',0,.515,0,4.3,.025,2.1,m.glass);for(const x of [-2.35,2.35])sc.box('participation-scanner-glass-bezel',x,.52,0,.25,.1,2.6,m.dark);const lid=group('participation-scanner-lid',0,.56,-1.35,scanner),lt=paymentTools(lid,h,m);lt.box('participation-scanner-lid-shell',0,.08,1.35,4.9,.16,2.7,m.body,true);lt.box('participation-scanner-lid-pad',0,-.03,1.35,4.4,.04,2.2,m.felt);for(const x of [-1.8,1.8])sc.cylinder('participation-scanner-hinge',x,.55,-1.35,.14,.45,m.steel).rotation.z=Math.PI/2;dynamic(lid);const lamp=sc.box('participation-scan-carriage',0,.47,-.95,4.1,.05,.09,m.scan);lamp.userData.dynamic=true;sc.box('participation-scanner-status-window',0,.31,1.36,2.8,.12,.025,m.dark);const scanStatus=sc.box('participation-scanner-progress-light',-1.3,.31,1.38,.16,.07,.03,m.scan);scanStatus.userData.dynamic=true;const scanDocs={};for(const kind of ['id','slip']){const g=documentProp('participation-scanned-'+kind,kind);scanner.attach(g);g.position.set(0,.55,0);g.scale.setScalar(kind==='id'?1:.7);scanDocs[kind]=g;}sc.box('participation-scanner-button',2.1,.55,1.1,.3,.07,.2,m.accent);pipe(scanner,'participation-scanner-power',[[2,.1,-1],[2.5,-.5,-1.4],[2.5,-2.55,-1.4]],.035);sc.box('participation-scanner-socket',2.5,-2.6,-1.4,.45,.15,.4,m.steel);
 // Order desk: real forms, fastening supplies and copy trays instead of wall explanations.
 const ot=desks.order.s;ot.box('participation-order-blotter',0,2.72,0,5.8,.025,3.6,m.felt,true);ot.paper('participation-first-purchase-form',-1.3,2.75,-.3,2.1,2.8,['درخواست مشارکت','قیمت واحد: ۱۰ میلیون']);ot.paper('participation-purchase-terms',1.4,2.75,-.3,2,2.5,['بودجه: ۲۰۰ میلیون','حداقل ۵۰ · سقف ۳۰۰']);ot.box('participation-stapler-base',2.5,2.83,1.8,.5,.2,.7,m.dark,true);ot.box('participation-stapler-top',2.5,3,1.7,.4,.17,.8,m.steel,true);ot.beam('participation-order-pen',[-2.6,2.8,1.8],[-.8,2.8,1.8],.055,m.dark);ot.box('participation-pen-tip',-.7,2.8,1.8,.15,.05,.05,m.steel);
 const cardStand=group('participation-card-reference-holder',19.9,2.71,5.22);
 const cs=paymentTools(cardStand,h,m);
 cs.box('participation-card-holder-base',0,.14,0,1.78,.28,1.29,m.dark,true);
 const cardBed=group('participation-reader-bed',0,.35,-.035,cardStand);
 cardBed.rotation.x=.23;
 const bed=paymentTools(cardBed,h,m);
 bed.box('participation-card-reader-face',0,0,0,1.72,.12,1.22,m.metal,true);
 bed.box('participation-card-reader-pad',0,.069,-.09,1.52,.024,.89,m.black,true);
 bed.box('participation-card-reader-guide',0,.087,.355,1.56,.05,.05,m.accent,true);
 bed.print('کارت‌خوان',0,.084,.50,1.08,.16,'#f7ecd0',true);
 const readerLed=bed.box('participation-card-reader-led',.67,.083,.48,.09,.027,.055,m.scan);
 readerLed.userData.dynamic=true;
 const standCard=documentProp('participation-card-on-holder','bankcard');
 cardBed.add(standCard);
 standCard.position.set(0,.084,-.09);
 standCard.scale.setScalar(.91);
 const phone=group('participation-demo-phone',24,0,8),pt=paymentTools(phone,h,m);pt.box('participation-phone-pedestal',0,1.25,0,.7,2.5,.65,m.metal,true);pt.box('participation-phone-shelf',0,2.55,0,1.3,.1,1.2,m.body,true);pt.box('participation-phone-charge-cradle',0,2.7,0,.9,.2,.6,m.dark,true);const handset=group('participation-phone-handset',0,3.3,0,phone),pht=paymentTools(handset,h,m);pht.screen('participation-phone',0,0,0,.72,1.1,['تلفن']);display('participation-phone-live-screen',handset,0,0,.2,.7,1.1);pipe(phone,'participation-phone-charge-cable',[[0,2.8,0],[.5,2.6,-.2],[.4,.1,-.3]],.025);pt.box('participation-phone-socket',.4,.1,-.3,.4,.13,.4,m.steel);dynamic(handset);
 const printer=group('participation-receipt-printer',17,2.71,17),pr=paymentTools(printer,h,m);pr.box('participation-printer-body',0,.7,-.25,3.5,1.4,2.4,m.body,true);pr.box('participation-printer-paper-input',0,1.5,-.7,2.7,.2,1.2,m.dark);for(let k=0;k<4;k++)pr.box('participation-printer-input-sheet',0,1.61+k*.015,-.7,2.3,.015,1,m.paper);pr.box('participation-printer-output-slot',0,.45,.97,2.6,.16,.06,m.black);pr.box('participation-printer-output-tray',0,.2,1.5,2.8,.1,1.4,m.metal);const roller=pr.cylinder('participation-printer-output-roller',0,.45,1,.08,2.4,m.dark);roller.rotation.z=Math.PI/2;roller.userData.dynamic=true;const printed=documentProp('participation-printed-receipt','gateway-receipt');printer.attach(printed);printed.scale.setScalar(.75);pipe(printer,'participation-printer-power',[[1.6,0,-.8],[2,-1,-1],[2,-2.55,-1]],.04);pr.box('participation-printer-floor-socket',2,-2.6,-1,.45,.15,.4,m.steel);
 const hand=desks.handoff.s;hand.box('participation-handoff-counter-front',0,1.4,1.25,7.6,2.2,.3,m.metal,true);for(let x=-3.4;x<=3.4;x+=.4)hand.box('participation-handoff-counter-rib',x,1.4,1.43,.06,1.9,.04,m.accent);hand.box('participation-handoff-tray',0,2.74,-.9,3.2,.08,1.8,m.dark);for(const x of [-1.6,1.6])hand.box('participation-handoff-tray-rim',x,2.88,-.9,.08,.25,1.8,m.steel);hand.screen('participation-sara-desk-name',2.7,3.1,-.5,1.7,.55,['شبنم · مدیر مالی']);hand.paper('participation-sara-ledger',-2.7,2.72,0,1.8,2,['تطبیق مالی']);
 const dossier=group('participation-purchase-dossier',-11,2.82,1),dt=paymentTools(dossier,h,m);dt.box('participation-dossier-cover',0,0,0,2.5,.1,3.2,m.folder,true);dt.paper('participation-dossier-first-copy',0,.055,-.3,2.2,2.3,['N-200 · ۲۰۰ میلیون']);dt.paper('participation-dossier-second-copy',.15,.12,.4,2.1,2.3,['N-80 · در انتظار بانک']);dt.box('participation-dossier-clip',-.8,.2,-1.3,.22,.15,.4,m.steel);dynamic(dossier);
 const carry={};for(const kind of ['id','slip','bankcard','gateway-receipt'])carry[kind]=documentProp('participation-held-'+kind,kind);
 // Waiting area stays in its reserved footprint; several object types have different silhouettes.
 const seats=group('participation-waiting-seats',-21,0,-4),wt=paymentTools(seats,h,m);for(const z of [-2.4,0,2.4]){wt.box('participation-seat-cushion',0,1.45,z,2.8,.35,1.8,m.fabric,true);wt.box('participation-seat-back',-1.2,2.35,z,.3,1.9,1.8,m.fabric,true);for(const xx of [-1,1])for(const zz of [-.6,.6])wt.box('participation-seat-leg',xx,.7,z+zz,.12,1.3,.12,m.steel);for(const zz of [-1,1])wt.box('participation-seat-arm',0,2.15,z+zz,2.4,.15,.12,m.dark,true);}
 const model=group('participation-project-display',-6,0,-21),mt=paymentTools(model,h,m);mt.box('participation-display-pedestal',0,1.4,0,2.7,2.8,1.8,m.metal,true);mt.box('participation-project-model-base',0,2.85,0,2.8,.1,1.9,m.body);mt.box('participation-project-model-glass',0,3.35,0,2.3,.9,1.5,m.glass);for(const x of [-1,0,1])mt.box('participation-model-greenhouse-rib',x,3.4,0,.04,.9,1.5,m.steel);mt.paper('participation-project-model-caption',0,2.94,.6,2.5,.5,['گلخانه آفتاب']);
 for(const [x,z]of [[-24,-21],[3,-21]]){t.cylinder('participation-waste-bin',x,.7,z,.5,1.4,m.dark);t.ring('participation-bin-rim',x,1.4,z,.5,.04,m.steel,true);}
 const fire=group('participation-fire-extinguisher',-25.45,0,5),ft=paymentTools(fire,h,m);ft.box('participation-extinguisher-bracket',-.25,1.9,0,.2,1.5,.65,m.steel);ft.cylinder('participation-extinguisher-tank',0,1.7,0,.34,1.7,m.red);ft.cylinder('participation-extinguisher-neck',0,2.65,0,.1,.2,m.steel);ft.box('participation-extinguisher-handle',0,2.83,0,.7,.12,.15,m.dark);pipe(fire,'participation-extinguisher-hose',[[0,2.7,0],[.5,2.6,0],[.45,1.4,0]],.045);
 buildOfficeExit(root,node,layout,h,m);
 let revision=-1;const local=new T.Vector3(.18,-.47,-1),orientation=new T.Quaternion().setFromEuler(new T.Euler(1.05,0,-.1)),tmp=new T.Vector3();
 root.userData.participationUpdate=(state,dt,camera,paused,options={})=>{const o=state.participation;if(!o)return false;const kind=o.held,card=kind==='id'||kind==='bankcard',carrying=documentCarryPose(camera,kind==='dossier'?2.5:card?1.55:2.2,kind==='dossier'?3.2:card?.95:2.8,kind==='dossier'?.28:.05,{...options.carry,surfaceY:kind==='dossier'?.09:.025,gripType:card?'card':'document'});local.copy(carrying.position);orientation.copy(carrying.rotation);const reduced=Boolean(options.reduced),elapsed=options.jobElapsed||0,job=o.job,p=job?Math.min(1,elapsed/participationDurations[job.kind]):0,ease=reduced?1:1-Math.exp(-Math.min(.1,dt)*12);bagLid.rotation.x=T.MathUtils.lerp(bagLid.rotation.x,o.wallet?-1.8:0,ease);lid.rotation.x=T.MathUtils.lerp(lid.rotation.x,o.lid?-1.6:0,ease);for(const kind of Object.keys(originals))originals[kind].visible=o.wallet&&(o.version===1||kind==='bankcard'&&!o.cardOwned)&&o.held!==kind&&o.loaded!==kind&&!(kind==='bankcard'&&o.cardOnStand);for(const kind of ['id','slip'])scanDocs[kind].visible=o.loaded===kind;lamp.visible=job?.kind==='scan';lamp.position.z=reduced?0:-.95+p*1.9;scanStatus.visible=job?.kind==='scan';scanStatus.position.x=reduced?0:-1.3+p*2.6;standCard.visible=o.cardOnStand;readerLed.visible=o.cardOnStand;handset.rotation.z=job?.kind==='otp'&&!reduced?Math.sin(elapsed*45)*.025:0;
  const modern=o.version===2;
  phone.visible=!modern;
  paymentConsole.visible=modern;
  const paying=job?.kind==='pay-first';
  payLed.visible=!paying||reduced||Math.floor(elapsed*7)%2===0;
  paymentSlip.visible=modern&&(paying&&p>.25||o.firstPaid&&!o.slipScanned&&o.held!=='slip'&&o.loaded!=='slip');
  paymentSlip.position.set(0,paying?2.94-.12*p:2.82,paying?.21+.34*p:.55);
  filedSlip.visible=modern&&o.slipFiled&&!o.assembled;
  if(previousPhoneOwned===false&&o.phoneOwned)bagPickup=reduced?1:0;
  previousPhoneOwned=o.phoneOwned;
  bagPickup=Math.min(1,bagPickup+dt/.65);
  personalBox.visible=modern&&o.wallet&&(!o.phoneOwned||bagPickup<1);
  personalLid.rotation.x=T.MathUtils.lerp(personalLid.rotation.x,o.personalBoxOpen?-1.94:0,ease);
  bagPhone.visible=personalBox.visible;
  bagPhone.position.copy(bagPhoneRest);
  if(bagPickup<1){
   const lift=T.MathUtils.smoothstep(bagPickup,0,.65);
   bagPhone.position.y+=.93*lift;
   bagPhone.position.z+=T.MathUtils.smoothstep(bagPickup,.38,1)*.88;
  }
  if(modern){
   originals.bankcard.visible=false;
   boxCard.position.set(-.62,.14,.08);
   if(bagPickup<1){boxCard.position.y+=.88*T.MathUtils.smoothstep(bagPickup,0,.65);boxCard.position.z+=.86*T.MathUtils.smoothstep(bagPickup,.38,1);}
  }
  const readingFingerprint=modern&&job?.kind==='fingerprint'&&p>=.26&&p<=.81;
  fingerLight.visible=readingFingerprint;
  const sweep=reduced?.5:T.MathUtils.clamp((p-.26)/.55,0,1);
  fingerLight.position.z=.875+sweep*.41;
  sensorGlow.intensity=readingFingerprint?2.3:0;
  fingerLed.visible=modern&&(o.identity||job?.kind==='fingerprint');
  const phoneTarget=modern&&o.phoneRaised&&!paused&&!o.held&&!job&&!o.handed?1:0;
  phoneLift=reduced?phoneTarget:T.MathUtils.lerp(phoneLift,phoneTarget,ease);
  mobile.visible=phoneLift>.02;
  const phoneLocal=new T.Vector3(.18,-.83+.69*phoneLift,-1.04);
  mobile.position.copy(phoneLocal).applyQuaternion(camera.quaternion).add(camera.position);
  mobile.quaternion.copy(camera.quaternion).multiply(new T.Quaternion().setFromEuler(new T.Euler(.6*(1-phoneLift),-.06,.04)));
  if(previousHeld!==kind){
   if(modern&&kind==='slip'){
    const source=o.slipScanned?scanDocs.slip:paymentSlip;
    slipOrigin.copy(source.getWorldPosition(new T.Vector3()));
    slipLift=reduced?1:0;
   }
   previousHeld=kind;
  }
  printed.visible=Boolean((o.printed||job?.kind==='print'||job?.kind==='pickup')&&!o.receiptCollected);printed.position.set(0,.29,job?.kind==='print'?(reduced?1.6:.3+p*1.3):1.6);printed.quaternion.identity();printed.scale.setScalar(.75);if(job?.kind==='pickup'){const blend=reduced?1:p,start=new T.Vector3(17,3,18.6),end=local.clone().applyQuaternion(camera.quaternion).add(camera.position);printer.updateWorldMatrix(true,false);printed.position.copy(printer.worldToLocal(start.lerp(end,blend)));printed.quaternion.slerp(camera.quaternion.clone().multiply(orientation),blend);printed.scale.setScalar(T.MathUtils.lerp(.75,carrying.scale,blend));}roller.rotation.x=job?.kind==='print'&&!reduced?-elapsed*8:0;
  for(const [kind,g]of Object.entries(carry)){g.visible=o.held===kind&&!paused;if(g.visible){g.scale.setScalar(carrying.scale);g.position.copy(local).applyQuaternion(camera.quaternion).add(camera.position);g.quaternion.copy(camera.quaternion).multiply(orientation);if(modern&&kind==='slip'&&slipLift<1){slipLift=Math.min(1,slipLift+dt/.42);g.position.lerp(slipOrigin,1-T.MathUtils.smoothstep(slipLift,0,1));}}}
  dossier.visible=o.assembled;if(o.held==='dossier'){dossier.scale.setScalar(carrying.scale);if(job?.kind==='handoff'){const pose=exchangePose('participation',elapsed,o.handoffOrigin,reduced),origin=o.handoffOrigin||roleExchanges.participation.source;tmp.copy(carrying.position).applyEuler(new T.Euler(-.08,origin.yaw,0,'YXZ')).add(new T.Vector3(origin.x,4.8,origin.z));tmp.lerp(handoffPaperPoint('participation',origin,pose,3.4),pose.transfer);dossier.position.copy(tmp);dossier.quaternion.setFromEuler(new T.Euler(-.08,origin.yaw,0,'YXZ')).multiply(carrying.rotation).slerp(new T.Quaternion(),pose.transfer);dossier.scale.setScalar(T.MathUtils.lerp(carrying.scale,.55,pose.transfer));}else{dossier.visible=!paused;dossier.position.copy(local).applyQuaternion(camera.quaternion).add(camera.position);dossier.quaternion.copy(camera.quaternion).multiply(orientation);}}else{dossier.position.set(o.handed?-1:-11,o.handed?2.86:2.82,o.handed?13.1:1);dossier.quaternion.identity();dossier.scale.setScalar(o.handed?.55:1);}
  if(revision!==o.revision){revision=o.revision;const lines={'participation-identity-live-screen':['پذیرش مانی',modern?(job?.kind==='fingerprint'?'در حال اسکن اثر انگشت':'حسگر آماده است'):o.idScanned?'تصویر هویت آماده':'تصویر لازم است',o.identity?'هویت تأیید شد':'در انتظار بررسی'],'participation-gateway-live-screen':['درگاه پرداخت',o.requested?'درخواست ثبت شد':'خرید دوم · ۸۰ میلیون',o.requested?'در انتظار تطبیق بانک':job?.kind==='gateway'?'در حال ثبت درخواست':'کارت و رمز'],'participation-phone-live-screen':[o.otpReady?'246810':'—',o.otpReady?'رمز':'تلفن']};for(const [name,d]of Object.entries(displays)){const q=d.q;
   if(name==='participation-iphone-screen')continue;
   q.fillStyle='#16383c';q.fillRect(0,0,1280,768);q.direction='rtl';q.textAlign='center';q.fillStyle='#f1e7cd';q.font='600 78px Vazirmatn';lines[name].forEach((line,i)=>q.fillText(line,640,180+i*190,1170));d.texture.needsUpdate=true;}}
  const phoneFrame=state.startedAt+String(o.otpReady?o.otpCode:null);
  if(mobileScreen&&mobile.visible&&lastPhoneFrame!==phoneFrame){
   lastPhoneFrame=phoneFrame;
   const {q,texture}=displays[mobileScreen.name];
   const gradient=q.createLinearGradient(0,0,480,1000);
   gradient.addColorStop(0,'#24204e');gradient.addColorStop(.55,'#7253a6');gradient.addColorStop(1,'#251d58');
   q.clearRect(0,0,480,1000);
   q.save();q.beginPath();q.roundRect(0,0,480,1000,76);q.clip();
   q.fillStyle=gradient;q.fillRect(0,0,480,1000);
   q.fillStyle='#08080e';q.beginPath();q.roundRect(165,25,150,38,19);q.fill();
   q.fillStyle='#fff';q.direction='ltr';q.textAlign='left';q.font='600 23px sans-serif';q.fillText('●●●  5G  ▰',327,51,142);
   const date=new Date(state.startedAt);
   q.textAlign='center';q.font='500 30px sans-serif';
   q.fillText(new Intl.DateTimeFormat('fa-IR',{weekday:'long',day:'numeric',month:'long'}).format(date),240,150);
   q.font='700 116px sans-serif';q.fillText(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tehran'}).format(date),240,263);
   q.fillStyle='#ffffff';q.beginPath();q.roundRect(22,567,436,255,32);q.fill();
   q.fillStyle='#36b85b';q.beginPath();q.roundRect(42,632,49,49,12);q.fill();
   q.fillStyle='#fff';q.beginPath();q.ellipse(66,656,15,10,0,0,Math.PI*2);q.fill();
   q.textAlign='left';q.fillStyle='#23232b';q.font='700 34px sans-serif';q.fillText('Messages',108,653);
   q.direction='rtl';q.textAlign='right';q.font='600 28px sans-serif';q.fillText('بانک',429,703);
   if(o.otpReady){
    q.font='800 32px sans-serif';q.fillText('رمز دوم',429,753);
    q.direction='ltr';q.textAlign='left';q.fillStyle='#101321';q.font='800 58px monospace';q.fillText(o.otpCode,45,785);
   }else{q.font='700 36px sans-serif';q.fillText('پیام تازه‌ای نداری',429,772);}
   q.fillStyle='#fff';q.beginPath();q.roundRect(151,966,178,8,4);q.fill();q.restore();texture.needsUpdate=true;
  }
  if(mobile.visible&&!paused)return {hands:{left:{visible:false},right:{position:[.32,phoneLocal.y-.31,phoneLocal.z+.06],rotation:[.16,0,-.18],grip:.56},bag:{visible:false}}};
  if(modern&&job?.kind==='fingerprint'&&!paused){
   camera.updateMatrixWorld(true);
   const touch=camera.worldToLocal(new T.Vector3(5,3.028,-5.92));
   const press=reduced?1:T.MathUtils.smoothstep(p,.05,.26)*(1-T.MathUtils.smoothstep(p,.81,1));
   const hand=new T.Vector3(.35,-.73,-.64).lerp(touch,press);
   return {hands:{left:{visible:false},right:{position:hand.toArray(),rotation:[-.55,0,0],grip:.54,grasp:'fingerprint',alignTip:press},bag:{visible:false}}};
  }
  return o.held&&!paused||job?.kind==='pickup'?carrying:false;
 };
 const fill=new T.PointLight('#fff2d7',140,65,2);fill.position.set(-1,8,3);root.add(fill);return root;
}
