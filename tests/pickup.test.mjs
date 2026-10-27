import test from 'node:test';
import assert from 'node:assert/strict';
import {pickupDuration,pickupPose,pickupCuesBetween,pickupSound} from '../app/src/game/pickup.js';
import * as T from '../app/vendor/three.module.js';
import {createFirstPersonHands} from '../app/src/render/firstPersonHands.js';
test('pickup phases reach, hold, stow and finish in order',()=>{
 assert.equal(pickupPose(0).lift,0);assert.equal(pickupPose(1.2).lift,1);assert.equal(pickupPose(1.2).insert,0);assert.equal(pickupPose(1.2).grip,1);assert.ok(pickupPose(1.9).insert>0);assert.equal(pickupPose(2.4).documentVisible,false);assert.equal(pickupPose(pickupDuration(false)).complete,true);assert.equal(pickupPose(2.9).reach,0);assert.equal(pickupPose(2.9).bag,0);
});
test('pickup cues fire exactly once across normal and reduced-motion frames',()=>{
 for(const reduced of [false,true]){const events=[];for(let t=0;t<3.2;t+=.017)events.push(...pickupCuesBetween(t,t+.017,reduced));assert.deepEqual(events,['grab','insert','zip','done']);assert.deepEqual(pickupCuesBetween(.5,.5,reduced),[]);assert.equal(pickupPose(pickupDuration(reduced),reduced).complete,true);}
 for(let t=0;t<1;t+=.03){const p=pickupPose(t,true);assert.equal(p.bag,0);assert.equal(p.reach,0);assert.ok([0,1].includes(p.lift));}
});
test('hands and bag stay finite across viewports and can be hidden for dialogs',()=>{
 const camera=new T.PerspectiveCamera(),hands=createFirstPersonHands(camera);
 for(const aspect of [.65,1,1.78])for(let t=0;t<=3;t+=.05){hands.update({pose:pickupPose(t),time:t,aspect});camera.updateMatrixWorld(true);hands.root.traverse(o=>assert.ok([...o.matrixWorld.elements].every(Number.isFinite)));}
 hands.update({visible:false});assert.equal(hands.root.visible,false);
});
test('pickup sounds use bounded envelopes and distinguish card and paper contact',()=>{
 for(const phase of ['grab','insert','zip','done']){const p=pickupSound(phase,'book');assert.ok(p.gain>0&&p.gain<=.1);assert.ok(p.duration>0&&p.duration<.4);assert.ok(p.pan>=-1&&p.pan<=1);assert.ok(p.frequency>0&&p.endFrequency>0);}
 assert.notEqual(pickupSound('grab','badge').frequency,pickupSound('grab','book').frequency);
});

// Verify generated shading inputs rather than screenshots or implementation strings.
import {workwearPixels,sleeveGeometry} from '../app/src/render/workwear.js';
test('fabric and leather tiles have deterministic bounded PBR channels',()=>{
 for(const leather of [false,true]){const p=workwearPixels(32,leather);assert.deepEqual(p,workwearPixels(32,leather));assert.equal(p.color.length,32*32*4);const values=new Set();for(let i=0;i<p.normal.length;i+=4){const length=Math.hypot((p.normal[i]-128)/127,(p.normal[i+1]-128)/127,(p.normal[i+2]-128)/127);assert.ok(Math.abs(length-1)<.015);assert.equal(p.normal[i+3],255);assert.ok(p.roughness[i]>=160&&p.roughness[i]<=250);values.add(p.color[i]);}assert.ok(values.size>8);}
 assert.notDeepEqual(workwearPixels(32).normal,workwearPixels(32,true).normal);
});
test('folded sleeve has finite normals and no zero-width rings',()=>{
 const g=sleeveGeometry(),p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){assert.ok(Math.hypot(p.getX(i),p.getZ(i))>.09);assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001);assert.ok(p.getY(i)>=-.5&&p.getY(i)<=.5);}g.dispose();
});