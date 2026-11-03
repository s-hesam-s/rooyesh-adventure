const selector='button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
export function dialogControls(dialog){return [...dialog.querySelectorAll(selector)].filter(e=>!e.hidden&&e.getClientRects().length);}
export function focusToken(element,controls){return {field:element?.dataset.completionField??element?.dataset.participationField,action:element?.dataset.completion??element?.dataset.operations??element?.dataset.participation??element?.dataset.issuer??element?.dataset.office,check:element?.dataset.completionCheck??element?.dataset.completionApproval??element?.dataset.operationsCheck??element?.dataset.issuerCheck??element?.dataset.officeCheck,value:element?.dataset.completionValue??element?.dataset.operationsValue??element?.dataset.participationValue??element?.dataset.issuerValue??element?.dataset.officeValue,dialog:element?.dataset.dialog,dialogIndex:controls.filter(e=>e.dataset.dialog===element?.dataset.dialog).indexOf(element),index:controls.indexOf(element)};}
export function focusDialog(dialog,token=null){const controls=dialogControls(dialog),same=token&&controls.find(e=>token.field?(e.dataset.completionField??e.dataset.participationField)===token.field:token.check?(e.dataset.completionCheck??e.dataset.completionApproval??e.dataset.operationsCheck??e.dataset.issuerCheck??e.dataset.officeCheck)===token.check:token.action?(e.dataset.completion??e.dataset.operations??e.dataset.participation??e.dataset.issuer??e.dataset.office)===token.action&&(e.dataset.completionValue??e.dataset.operationsValue??e.dataset.participationValue??e.dataset.issuerValue??e.dataset.officeValue)===token.value:token.dialog?e===controls.filter(c=>c.dataset.dialog===token.dialog)[token.dialogIndex]:false),fallback=controls.find(e=>e.closest?.('.dialog-body'))||controls.find(e=>e.closest?.('.dialog-actions'))||controls.filter(e=>e.dataset.dialog!=='close')[0]||controls.at(-1);(same||fallback)?.focus({preventScroll:true});}
export function dialogKey(event,dialog){
 if(event.ctrlKey||event.metaKey||event.altKey)return false;
 const controls=dialogControls(dialog),current=controls.indexOf(dialog.ownerDocument.activeElement);
 const active=dialog.ownerDocument.activeElement,editable=active&&(['TEXTAREA'].includes(active.tagName)||active.tagName==='INPUT'&&!['checkbox','radio','button','submit'].includes(active.type));
 if(editable){if(event.code==='Enter'){event.preventDefault();if(!event.repeat)controls[(current+1)%controls.length]?.focus();return true;}return false;}
 if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.code)){
  event.preventDefault();const delta=['ArrowUp','ArrowLeft'].includes(event.code)?-1:1,index=event.code==='Home'?0:event.code==='End'?controls.length-1:(Math.max(0,current)+delta+controls.length)%controls.length;controls[index]?.focus();return true;
 }
 if(['KeyE','Enter','Space'].includes(event.code)){
  event.preventDefault();if(event.repeat)return true;const target=controls[current];if(target)target.click();else focusDialog(dialog);return true;
 }
 return false;
}
