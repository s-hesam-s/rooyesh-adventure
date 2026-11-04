const dayMs=86_400_000;
const tehranDate=new Intl.DateTimeFormat('en-GB-u-ca-gregory',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'});
const persianParts=new Intl.DateTimeFormat('en-u-ca-persian',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});
export const displayObligationsDate=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'UTC',weekday:'long',year:'numeric',month:'long',day:'numeric'});
function dateParts(formatter,date){
 const {year,month,day}=Object.fromEntries(formatter.formatToParts(date).map(({type,value})=>[type,Number(value)]));
 return {year,month,day};
}
export function obligationsDates(startedAt){
 const local=dateParts(tehranDate,new Date(startedAt));
 const start=Date.UTC(local.year,local.month-1,local.day);
 const initial=dateParts(persianParts,start);
 const targetMonth=initial.year*12+initial.month+3;
 for(let end=start+dayMs; ;end+=dayMs){
  const date=dateParts(persianParts,end);
  const month=date.year*12+date.month;
  if(month>targetMonth)return {start,end:end-dayMs};
  if(month===targetMonth&&date.day===initial.day)return {start,end};
 }
}
export function obligationsDateAt({start,end},progress){
 return start+Math.floor((end-start)/dayMs*Math.min(1,Math.max(0,progress)))*dayMs;
}
