let journeySeed=null;
export function setRouteSeed(seed){const next=seed===null?null:String(seed);const changed=next!==journeySeed;journeySeed=next;return changed;}
function hash(value){let n=2166136261;for(const c of value){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function routeSlots(node,seed=journeySeed){
 const count=node.exits.length;if(seed===null||!node.challenge||count!==3)return Array.from({length:count},(_,i)=>i);
 const correct=node.exits.findIndex(e=>!e.next.startsWith('repair-'));
 if(correct<0)return [0,1,2];
 let slot=hash(seed+'/start')%3;
 for(let i=0;i<=node.scene.index;i++){const draw=hash(seed+'/stage/'+i);slot=i===0?draw%3:(slot+1+draw%2)%3;}
 const wrong=[0,1,2].filter(i=>i!==slot);if(hash(seed+'/'+node.id+'/order')%2)wrong.reverse();
 return node.exits.map((_,i)=>i===correct?slot:wrong.shift());
}
