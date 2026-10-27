import * as T from '../../vendor/three.module.js';
export function createDoorDestinationView(parent,gate,h,{direction=-1,targetCenter={x:0,z:40},targetDoorId='retry'}={}){
 const material=new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide,fog:false});material.userData.transient=true;
 const view=new T.Mesh(h.geo('archive-destination-window',()=>new T.PlaneGeometry(1,1)),material),x=(gate.x-640)*.1,z=(gate.y-450)*.1;
 view.name='archive-room-view-'+gate.exit.next;view.position.set(x,10,z+direction*4.6);view.scale.set(140,60,1);view.visible=false;view.userData.dynamic=true;view.userData.destinationId=gate.exit.next;
 if(h.portalTexture){material.map=h.portalTexture;material.onBeforeCompile=shader=>{shader.uniforms.portalResolution=h.portalResolution;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec2 portalResolution;').replace('#include <map_fragment>','#ifdef USE_MAP\ndiffuseColor *= texture2D(map,gl_FragCoord.xy/portalResolution);\n#endif');};material.customProgramCacheKey=()=> 'archive-destination-window-v1';}
 parent.add(view);gate.destinationView=view;gate.destinationLink={sourceCenter:{x,z},targetCenter,targetDoorId};return view;
}
export function buildArchiveRoomViews(parent,layout,h){for(const gate of layout.gates){if(/^repair-project-(0|2)$/.test(gate.exit.next))createDoorDestinationView(parent,gate,h);else if(gate.exit.next==='window'&&h.previewDestination)createDoorDestinationView(parent,gate,h,h.previewDestination(gate.exit.next));}}
