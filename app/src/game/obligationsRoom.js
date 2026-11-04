const point=(x,z)=>({x:640+x*10,y:450+z*10});
export const obligationsFixtures=[
 {id:'archive',name:'کمد قرارداد',x:-19,z:9,w:5,d:2},
 {id:'desk',name:'میز محاسبه',x:-10,z:2,w:7,d:3},
 {id:'schedule',name:'رایانه تقویم',x:-3,z:-12,w:5.2,d:4.8,front:true},
 {id:'printer',name:'چاپگر برنامه',x:1.8,z:-12,w:4.4,d:4.8,front:true},
 {id:'clock',name:'کارتابل زمان',x:19,z:-5,w:4,d:3,front:true},
 {id:'inbox',name:'دستگاه دریافت مکاتبات',x:19,z:6,w:4,d:3},
 {id:'scanner',name:'اسکنر تخت',x:14,z:19,w:5,d:3,front:'north'},
 {id:'payment',name:'رایانه ثبت پرداخت',x:3,z:19,w:6,d:3,front:'north'},
 {id:'guide',name:'گفت‌وگو با یونس',x:-11,z:-8,w:1.6,d:1.3}
];
export const obligationsNode={id:'obligations',title:'دفتر مدیریت سررسید و تسویه آفتاب',area:'تعهدات پس از تأمین',role:'manager',chapter:10,scene:{id:'obligations',obligationsRoom:true,index:5,sky:'#cbd9d9',guide:{id:'obligations-younes',identity:'obligationsYounes',name:'یونس',role:'کارشناس تعهدات',height:5.8,width:1,color:'#3f5968'}},objects:[],exits:[]};
export const obligationsBoundary=[[-25,-14],[-8,-14],[-8,-19],[19,-19],[25,-12],[25,23],[-7,23],[-7,16],[-8,16],[-8,30],[-24,30],[-24,16],[-25,16]];
export const ceremony={x:-15.8,doorZ:16,ribbonZ:25,ribbonY:3.48,width:4.8};
export const partyStage={z:27.85,top:8.6,drop:2.55};
export function discoDescent(elapsed){
 const t=Math.max(0,Math.min(1,elapsed/2.25));
 return t*t*(3-2*t);
}
export function obligationsLayout(state){
 const o=state?.obligations;

 const rect=f=>({minX:640+(f.x-f.w/2)*10,maxX:640+(f.x+f.w/2)*10,minY:450+(f.z-f.d/2)*10,maxY:450+(f.z+f.d/2)*10});
 const boundary=obligationsBoundary.map(([x,z])=>point(x,z));
 const objects=obligationsFixtures.map(f=>({...point(f.id==='guide'?f.x-2.8:f.x,f.z+(f.id==='guide'?0:f.id==='archive'||f.front==='north'?-f.d/2-2.1:f.d/2+2.1)),object:{id:f.id,name:f.name,kind:'obligations',office:true,access:{...rect(f),lookX:point(f.x,f.z).x,lookY:point(f.x,f.z).y,reach:47,front:f.front}}}));
 const ceremonyPoint=(id,name,z)=>{
  const p=point(ceremony.x,z),ribbon=id==='ceremony-ribbon';
  return {...p,object:{id,name,kind:'obligations',office:true,...(ribbon?{access:{minX:p.x-4,maxX:p.x+4,minY:p.y,maxY:p.y+5,lookX:p.x,lookY:p.y+10,reach:7,front:'north'}}:{})}};
 };
 if(o?.wrapUp)objects.push(ceremonyPoint('ceremony-door','درِ حیاط گلخانه',15));
 if(o?.doorOpen)objects.push(ceremonyPoint('ceremony-ribbon','روبان افتتاح گلخانه',23.65));
 const half=ceremony.width/2,left=ceremony.x-half,right=ceremony.x+half;
 const walls=[rect({x:(-24+left)/2,z:16,w:left+24,d:.5}),rect({x:(right-8)/2,z:16,w:-8-right,d:.5})];
 if(!o?.doorOpen)walls.push(rect({x:ceremony.x,z:16,w:ceremony.width,d:.55}));
 return {sceneId:'obligations',objects,gates:[],fixtures:obligationsFixtures,spawn:point(-19,3),entryYaw:Math.PI,hub:point(0,1),roads:[],boundary,floorPlan:{kind:'open-room',boundary,boundaryMargin:4,areas:[{minX:390,maxX:890,minY:260,maxY:750}],reserved:[...obligationsFixtures.map(rect),rect({x:-11,z:-5,w:4.2,d:1.3}),rect({x:-6,z:-13,w:2.3,d:1.6}),rect({x:17,z:12,w:2,d:2.5})],barriers:[],solids:walls}};
}
