import {restoreJourney} from './state.js';
const KEY='rooyesh.adventure.v2';
export function readSave(storage){
 try{const raw=storage.getItem(KEY);if(!raw)return {state:null,position:null};const parsed=JSON.parse(raw);return {state:restoreJourney(parsed.state),position:parsed.position};}
 catch{return {state:null,position:null,error:'ذخیره قبلی قابل خواندن نیست. می‌توانی سفر تازه‌ای شروع کنی.'};}
}
export function writeSave(storage,state,position){
 try{storage.setItem(KEY,JSON.stringify({state,position:{x:position.x,y:position.y}}));return true;}catch{return false;}
}
