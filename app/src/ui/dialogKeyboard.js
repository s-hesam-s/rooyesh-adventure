const selector='button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
export function dialogControls(dialog){return [...dialog.querySelectorAll(selector)].filter(e=>!e.hidden&&e.getClientRects().length);}
export function focusToken(element,controls){return {action:element?.dataset.office,check:element?.dataset.officeCheck,value:element?.dataset.officeValue,dialog:element?.dataset.dialog,dialogIndex:controls.filter(e=>e.dataset.dialog===element?.dataset.dialog).indexOf(element),index:controls.indexOf(element)};}
export function focusDialog(dialog,token=null){const controls=dialogControls(dialog),same=token&&controls.find(e=>token.check?e.dataset.officeCheck===token.check:token.action?e.dataset.office===token.action&&e.dataset.officeValue===token.value:token.dialog?e===controls.filter(c=>c.dataset.dialog===token.dialog)[token.dialogIndex]:false),fallback=controls.filter(e=>e.dataset.dialog!=='close')[0]||controls.at(-1);(same||fallback)?.focus({preventScroll:true});}
export function dialogKey(event,dialog){
 if(event.ctrlKey||event.metaKey||event.altKey)return false;
 const controls=dialogControls(dialog),current=controls.indexOf(dialog.ownerDocument.activeElement);
 if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.code)){
  event.preventDefault();const delta=['ArrowUp','ArrowLeft'].includes(event.code)?-1:1,index=event.code==='Home'?0:event.code==='End'?controls.length-1:(Math.max(0,current)+delta+controls.length)%controls.length;controls[index]?.focus();return true;
 }
 if(['KeyE','Enter','Space'].includes(event.code)){
  event.preventDefault();if(event.repeat)return true;const target=controls[current];if(target)target.click();else focusDialog(dialog);return true;
 }
 return false;
}
