import * as T from '../../vendor/three.module.js';
import {paymentTools} from './paymentTools.js';
export function buildPaymentProp(root,f,h,m){
 const t=paymentTools(root,h,m),{box:b,cylinder:c,beam,ring,screen,paper,feet,shell,keypad,reader,receipt}=t,{w,d}=f;
 if(f.kind==='seat'){
  b('payment-seat-base',0,.12,0,w*.8,.24,d,m.metal,true);for(const x of [-w*.3,w*.3]){b('payment-seat-leg',x,1.3,0,.18,2.4,.2,m.steel);b('payment-seat-hinge',x,2.4,-d*.3,.3,.3,.3,m.accent);}b('payment-folding-seat',0,2.4,0,w,.24,d*.85,m.accent,true);for(const x of [-w*.3,w*.3])beam('payment-seat-back-support',[x,.24,-d*.3],[x,4,-d*.3],.17,m.steel);b('payment-seat-back',0,3.5,-d*.3,w,1.4,.25,m.body,true);
 }else if(f.kind==='cart'){
  for(const x of [-w*.4,w*.4])for(const z of [-d*.35,d*.35]){const wheel=c('payment-cart-wheel',x,.32,z,.32,.2,m.dark);wheel.rotation.z=Math.PI/2;b('payment-cart-fork',x,.66,z,.1,.4,.2,m.steel);b('payment-cart-post',x,1.7,z,.12,2.1,.12,m.steel);}for(const y of [.85,2.7]){b('payment-cart-shelf',0,y,0,w,.12,d,m.metal);for(const x of [-w/2,w/2])b('payment-cart-edge',x,y+.15,0,.1,.3,d,m.steel);}for(let i=0;i<4;i++){const roll=c('payment-cart-paper-roll',-w*.3+i*w*.2,1.35,0,.35,.9,m.paper);ring('payment-roll-core',roll.position.x,1.81,0,.12,.055,m.dark,true);}b('payment-cart-handle',0,3.2,-d*.35,w*.85,.16,.18,m.accent);for(const x of [-w*.4,w*.4])b('payment-cart-handle-post',x,2.95,-d*.35,.12,.55,.12,m.steel);
 }else if(f.kind==='bin'){
  feet(w,d);b('payment-paper-bin',0,1.55,0,w,2.9,d,m.body,true);b('payment-bin-lid',0,3.1,0,w+.1,.18,d+.1,m.metal,true);b('payment-bin-slot',0,3.2,0,w*.65,.025,.25,m.black);
 }else if(f.kind==='capacity'||f.kind==='units'||f.kind==='budget'){
  shell(w,d,3);for(const x of [-w*.32,w*.32])b('payment-display-mount',x,5,-d*.18,.24,4.2,.24,m.steel);const rows=f.kind==='capacity'?['خرید قبلی: ۲۰۰','درخواست: ۱۱۰ · مجموع: ۳۱۰','سقف مجموع: ۳۰۰']:f.kind==='budget'?['بودجه خرید دوم','۸۰ میلیون تومان']:['مبلغ: ۷۵ میلیون','قیمت واحد: ۱۰ میلیون','تعداد واحد: ۷٫۵'];screen('payment-review-display',0,6,-d*.18+.25,w*.9,4.4,rows);
  if(f.kind==='capacity'){const total=310,segments=[{value:200,material:m.steel},{value:100,material:m.glow},{value:10,material:m.accent}];let x=-w*.42;for(const s of segments){const length=w*.84*s.value/total;b('payment-capacity-segment',x+length/2,8.15,-d*.18+.48,length-.025,.22,.08,s.material);x+=length;}b('payment-limit-tick',w*.42-w*.84*10/total,8.15,-d*.18+.55,.08,.5,.08,m.paper);}
 }else if(f.kind==='keypad'){
  shell(w,d,3.5);b('payment-console-hood',0,4.5,-d*.24,w*.8,2,.4,m.body,true);screen('payment-amount-console',0,4.8,-d*.24+.25,w*.68,1.45,['۷۵ میلیون · ۷٫۵ واحد']);keypad(-1.4,3.64,.6,true);reader(w*.3,4.2,0);receipt(w*.2,3.7,d*.28);
 }else if(f.kind==='intercom'){
  shell(w,d,3.5);b('payment-intercom-neck',0,4.4,0,.28,1.8,.28,m.steel);b('payment-intercom-head',0,5.5,0,w*.8,1.2,.55,m.dark,true);for(let i=0;i<7;i++)b('payment-speaker-grille',-.6+i*.2,5.65,.29,.06,.5,.04,m.steel);c('payment-call-button',0,5.1,.33,.18,.08,m.accent).rotation.x=Math.PI/2;
 }else if(f.kind==='qr'){
  shell(w,d,3.5);b('payment-qr-neck',0,4,0,.3,1,.3,m.steel);b('payment-qr-body',0,4.8,0,w*.8,1.4,1,m.dark,true);b('payment-qr-lens',0,4.8,.52,w*.58,.8,.06,m.screen);for(const x of [-w*.2,w*.2])b('payment-qr-corner',x,4.8,.56,.08,.6,.03,m.glow);
 }else if(f.kind==='network'){
  shell(w,d,3.5);b('payment-status-pole',0,4.25,0,.24,1.5,.24,m.steel);screen('payment-bank-state',0,5.5,.2,w*.9,2.5,['درخواست پرداخت','نتیجه بانک هنوز دریافت نشده']);
 }else if(f.kind==='receipt'){
  shell(w,d,3.4);b('payment-receipt-glass-case',0,3.65,0,w*.82,.45,d*.75,m.glass,true);paper('payment-previous-slip',0,3.42,0,w*.7,d*.62,['N-200 · خرید اول','۲۰۰ میلیون · ثبت‌شده']);for(const x of [-w*.36,w*.36])b('payment-case-clamp',x,3.52,0,.16,.24,d*.8,m.steel);
 }else if(f.kind==='supply'||f.kind==='rolls'){
  shell(w,d,3);for(const x of [-w*.43,w*.43])b('payment-supply-side',x,4.6,0,.18,3.3,d,m.body);for(const y of [3.1,4.6,6.1]){b('payment-supply-shelf',0,y,0,w,.16,d,m.steel);for(let i=0;i<3;i++){const x=-w*.28+i*w*.28,ht=.8+i*.1;c('payment-receipt-roll',x,y+.08+ht/2,0,w*.1,ht,m.paper);ring('payment-receipt-core',x,y+.08+ht+.012,0,w*.035,.035,m.dark,true);}}
 }else{
  shell(w,d,f.kind==='battery'?3:4.2);for(let i=0;i<4;i++){b('payment-module-socket',-w*.3+i*w*.2,2,d*.51,.24,.35,.08,m.dark);b('payment-module-indicator',-w*.3+i*w*.2,2.5,d*.51,.08,.08,.04,m.glow);}if(f.kind==='secure'){b('payment-secure-slot',0,3.7,d*.51,w*.5,.15,.05,m.black);b('payment-secure-lip',0,3.53,d*.55,w*.6,.1,.2,m.steel);}
 }
 return root;
}
