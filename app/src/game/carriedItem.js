export function carriedItem(state){
 const p=state.participation;if(p&&!p.done&&p.held&&p.job?.kind!=='handoff')return {key:'participation-'+p.held,label:({id:'کارت هویت آرمان',slip:'فیش N-200',bankcard:'کارت آموزشی','gateway-receipt':'رسید درخواست N-80',dossier:'بسته دو خرید'})[p.held]};
 const i=state.issuer;if(i&&!i.done&&!i.handed&&i.job?.kind!=='handoff'){if(i.caseCarried)return {key:'issuer-case',label:'بسته فیش‌های تعهد'};if(i.document&&!i.onDesk)return {key:'issuer-'+i.document,label:i.document==='sun'?'پوشه آفتاب':'پوشه مهتاب'};}
 const o=state.office;if(o&&!o.done&&!o.handed&&!o.handoffPending&&o.folder&&(!o.onDesk||o.caseCarried))return {key:'office-'+o.folder,label:'پوشه بررسی طرح'};
 return null;
}
