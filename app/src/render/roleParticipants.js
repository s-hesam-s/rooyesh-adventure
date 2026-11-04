import * as T from '../../vendor/three.module.js';
import {roleExchanges,exchangePose,receivingYaw} from '../game/roleExchange.js';
export function buildRoleParticipants(root,environment,actors,h){
 const config=roleExchanges[environment],people={};
 for(const role of new Set([config.from,config.to])){const identity={manager:'playerSara',owner:'playerNader',client:'playerArman'}[role],actor=actors.guide(root,0,0,{id:environment+'-participant-'+role,identity},h),arms=[];actor.root.name=environment+'-participant-'+role;actor.root.userData.roleParticipant=true;for(const side of [-1,1]){const arm=new T.Group();arm.name='exchange-arm-'+side;arm.position.set(side*actor.body.userData.identity.shoulder,3.95,0);actor.body.add(arm);actor.root.updateMatrixWorld(true);for(const part of [...actor.body.children])if(part!==arm&&['continuous-sleeve-'+side,'sleeve-shoulder-'+side,'shirt-cuff-'+side,'hand-'+side].includes(part.name))arm.attach(part);arms.push(arm);}people[role]={...actor,arms};}
 people[config.to].root.position.set(config.target.x,-.07,config.target.z);people[config.to].root.rotation.y=config.target.yaw+Math.PI;people[config.from].root.position.set(config.source.x,-.07,config.source.z);people[config.from].root.visible=false;
 return {people,update(state,elapsed,camera,reduced=false){const o=state[environment];if(!o)return;const pending=environment==='office'?o.handoffPending:o.job?.kind==='handoff',origin=o.handoffOrigin||config.source,pose=pending?exchangePose(environment,elapsed,origin,reduced):null,changed=Boolean(o.handed&&state.role===config.to),source=people[config.from],target=people[config.to];
  target.root.position.set(config.target.x,-.07,config.target.z);target.root.rotation.y=pose?receivingYaw(config.target.yaw+Math.PI,config.target,origin,pose.progress,reduced):config.target.yaw+Math.PI;target.root.visible=!changed&&(!pose||pose.targetVisible);
  source.root.position.set(origin.x,-.07,origin.z);source.root.rotation.y=origin.yaw+Math.PI;source.root.visible=changed||Boolean(pose?.sourceVisible);
  for(const actor of [source,target]){actor.head.rotation.y=actor.headRest.y;actor.head.rotation.x=actor.headRest.x+(pose&&!reduced?.06*pose.receive:0);actor.arms.forEach((arm,i)=>{const receive=actor===target?(pose?.receive??0):0;arm.rotation.x=-1.05*receive;arm.rotation.z=(i?-.1:.1)*receive;});}
 }};
}
