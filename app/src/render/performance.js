// Resolution changes only after sustained load; isolated stalls and paused frames do not count.
export function createRenderBudget(){
 let scale=1,seconds=0,frames=0,recovery=0;
 function reset(){scale=1;seconds=frames=recovery=0;return scale;}
 function sample(dt,active=true){
  if(!active||!Number.isFinite(dt)||dt<=0||dt>.25)return scale;
  seconds+=dt;frames++;if(seconds<3||frames<30)return scale;
  const average=seconds/frames;seconds=frames=0;
  if(average>1/45){scale=Math.max(.7,Math.round((scale-.1)*10)/10);recovery=0;}
  else if(average<1/58){if(++recovery>=3){scale=Math.min(1,Math.round((scale+.1)*10)/10);recovery=0;}}
  else recovery=0;
  return scale;
 }
 return {sample,reset};
}