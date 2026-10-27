import {pickupSound} from './pickup.js';
export function createSoundscape(){
 let context,master,water,wind,enabled=false,lastStep=0;
 function noise(duration){const b=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;return b;}
 function bed(frequency,gain){const source=context.createBufferSource(),filter=context.createBiquadFilter(),volume=context.createGain();source.buffer=noise(3);source.loop=true;filter.type='lowpass';filter.frequency.value=frequency;volume.gain.value=gain;source.connect(filter).connect(volume).connect(master);source.start();return volume;}
 async function enable(value){
  enabled=value;
  if(!value){if(master)master.gain.setTargetAtTime(0,context.currentTime,.08);return;}
  try{if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=0;master.connect(context.destination);water=bed(1700,0);wind=bed(370,.035);}await context.resume();master.gain.setTargetAtTime(.7,context.currentTime,.15);}catch{enabled=false;}
 }
 function step(wood=false){if(!enabled||context?.state!=='running')return;const t=context.currentTime;if(t-lastStep<.28)return;lastStep=t;const s=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain();s.buffer=noise(.13);f.type='lowpass';f.frequency.value=wood?580:2300;g.gain.setValueAtTime(wood?.26:.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);s.connect(f).connect(g).connect(master);s.start();s.stop(t+.14);}
 function pickup(phase,kind){
  if(!enabled||context?.state!=='running')return;
  const plan=pickupSound(phase,kind),t=context.currentTime,g=context.createGain(),pan=context.createStereoPanner();pan.pan.value=plan.pan;
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(plan.gain,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+plan.duration);
  let source;if(plan.type==='noise'){source=context.createBufferSource();source.buffer=noise(plan.duration);const f=context.createBiquadFilter();f.type='bandpass';f.Q.value=phase==='zip'?1.8:.6;f.frequency.setValueAtTime(plan.frequency,t);f.frequency.exponentialRampToValueAtTime(plan.endFrequency,t+plan.duration);source.connect(f).connect(g);}else{source=context.createOscillator();source.type='sine';source.frequency.setValueAtTime(plan.frequency,t);source.frequency.exponentialRampToValueAtTime(plan.endFrequency,t+plan.duration);source.connect(g);}
  g.connect(pan).connect(master);source.start(t);source.stop(t+plan.duration+.02);
 }
 function door(phase){
  if(!enabled||context?.state!=='running')return;const duration=phase==='latch'?.16:.85,t=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noise(duration);filter.type='bandpass';filter.frequency.setValueAtTime(phase==='latch'?1800:180,t);filter.frequency.exponentialRampToValueAtTime(phase==='latch'?750:260,t+duration);filter.Q.value=phase==='latch'?2:4;gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(phase==='latch'?.08:.045,t+.035);gain.gain.exponentialRampToValueAtTime(.001,t+duration);source.connect(filter).connect(gain).connect(master);source.start();source.stop(t+duration+.02);
 }
 function update(theme,active,y){if(!context)return;master.gain.setTargetAtTime(enabled&&active?.7:0,context.currentTime,.2);water.gain.setTargetAtTime(theme==='water'?.05+.19*Math.max(0,1-Math.abs(y-690)/450):0,context.currentTime,.4);}
 return {enable,step,pickup,door,update};
}