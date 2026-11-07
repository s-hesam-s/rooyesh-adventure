export function carriedItem(state){
 const held=state.obligations?.held;
 if(held)return {key:'obligations-'+held,label:({bank:'سند بانکی نوبت اول',plan:'برنامه سررسیدها',contract:'قرارداد طرح آفتاب'})[held]};
 const c=state.completion;if(c&&!c.done&&c.held&&c.job?.kind!=='handoff')return {key:'completion-'+c.held,label:({plan:'پرونده طرح آفتاب',company:'مدارک شرکت بهار',receipt:'فیش پرداخت‌شده L-600','legal-package':'بسته درخواست حقوقی',certificate:'گواهی مشارکت مانی',ack:'تأیید دریافت گواهی'})[c.held]};
 const op=state.operations;if(op&&!op.done&&op.held)return {key:'operations-'+op.held,label:({dossier:'بسته دو خرید مانی',report:'گزارش تطبیق دو خرید','completed-case':'پرونده طرح آفتاب',original:'اصل فیش N-200',copy:'کپی فیش N-200',future:'فیش روز ۳۱'})[op.held]};
 const p=state.participation;if(p&&!p.done&&p.held&&p.job?.kind!=='handoff')return {key:'participation-'+p.held,label:({id:'کارت هویت مانی',slip:'فیش N-200',bankcard:'کارت','gateway-receipt':'رسید درخواست N-80',dossier:'بسته دو خرید'})[p.held]};
 const i=state.issuer;if(i&&!i.done&&!i.handed&&i.job?.kind!=='handoff'){if(i.heldSlip)return {key:'issuer-slip-'+i.heldSlip,label:'اصل فیش تعهد مجری'};if(i.caseCarried)return {key:'issuer-case',label:'بسته فیش‌های تعهد'};if(i.document&&!i.onDesk)return {key:'issuer-'+i.document,label:i.document==='sun'?'پوشه آفتاب':'پوشه مهتاب'};}
 const o=state.office;if(!o?.done&&['hand','scanned-hand'].includes(o?.paper))return {key:'office-summary',label:'خلاصهٔ تطبیق آفتاب'};
 if(o&&!o.done&&!o.handed&&!o.handoffPending&&o.folder&&(!o.onDesk||o.caseCarried))return {key:'office-'+o.folder,label:'پوشه بررسی طرح'};
 return null;
}
