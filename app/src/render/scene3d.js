import {createOfficeMaterials} from './officeMaterials.js';
import {officeNode} from '../game/officeRoom.js';
import {createAuditMaterials} from './auditMaterials.js';
import {createBankMaterials} from './bankMaterials.js';
import {createPaymentMaterials} from './paymentMaterials.js';
import {createOrchardMaterials} from './orchardMaterials.js';
import {createReceptionMaterials} from './receptionMaterials.js';
import {createAtriumMaterials} from './atriumMaterials.js';
import {createPostalMaterials} from './postalMaterials.js';
import {createCanalMaterials} from './canalMaterials.js';
import {createWorkshopMaterials} from './workshopMaterials.js';
import {createCalendarMaterials} from './calendarScene.js';
import {nodes} from '../content/campaign.js';
import {doorJourneyPose} from '../game/doorJourney.js';
import {createArchiveHands} from './archiveHands.js';
import {roadSegments,roadSample} from './roadSurface.js';
import {createArchiveMaterials} from './archiveMaterials.js';
import {batchArchitecture} from './missionBatches.js';
import {buildMissionScene} from './missionScene.js';
import {createRenderBudget} from './performance.js';
import {batchStaticPlants} from './staticPlants.js';
import {loadWaterMaps,createRiverWater} from './riverWater.js';
import {pickupPose} from '../game/pickup.js';
import {createFirstPersonHands} from './firstPersonHands.js';
import {loadActors} from './actors.js';
import {createStationFactory} from './stations.js';
import {createLandscape} from './landscape.js';
import {createGreenhouse} from './greenhouse.js';
import {createRoadGeometry,createRoadMaterial,roadGravel} from './roadSurface.js';
import {EffectComposer} from '../../vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from '../../vendor/addons/postprocessing/RenderPass.js';
import {SSAOPass} from '../../vendor/addons/postprocessing/SSAOPass.js';
import {OutputPass} from '../../vendor/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {createRiverScene} from './riverScene.js';
import {loadRealism} from './realism.js';
import {relativeMovement,clampPitch,canInspectFrom} from '../game/firstPerson.js';
import {createDetails} from './detail3d.js';
import * as T from '../../vendor/three.module.js';
import {layoutFor,walkable,cartAt} from '../game/world.js';
import {missingItems} from '../game/campaignState.js';
const S=.1;
export async function createRenderer(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 renderer.localClippingEnabled=true;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 const budget=createRenderBudget();let renderScale=1,lastShadow=-Infinity;
 const scene=new T.Scene();scene.background=new T.Color('#b9d4df');scene.fog=new T.FogExp2('#c0d4cf',.0026);
 const camera=new T.PerspectiveCamera(72,1,.08,650),ray=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0);
 scene.add(camera);const hands=createFirstPersonHands(camera);
 scene.add(new T.HemisphereLight('#d8efff','#5e6940',.6));
 const sun=new T.DirectionalLight('#fff0ca',2);sun.position.set(-65,115,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:260});sun.shadow.bias=-.0004;sun.shadow.normalBias=.12;scene.add(sun);
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:2}),composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));const contact=new SSAOPass(scene,camera,1,1,16);contact.kernelRadius=1.8;contact.minDistance=.002;contact.maxDistance=.08;contact.enabled=false;composer.addPass(contact);composer.addPass(new OutputPass());
 const details=createDetails(renderer,scene,{externalEnvironment:true});const [realism,actors,waterMaps]=await Promise.all([loadRealism(renderer,scene),loadActors(),loadWaterMaps()]);const landscape=createLandscape(realism.materials,{plant:realism.plant});const archiveHands=createArchiveHands(camera,actors.handSource);archiveHands.root.visible=false;
 let world=new T.Group();scene.add(world);let layout,nodeRef,water,pickup,elapsed=0,waterQuality=false;const wind=[],gateModels=[],objectModels=[],guides=[];
 const materials=new Map(),geometries=new Map();
 function mat(color,roughness=.85,metalness=0){if(color==='#5c6059'){roughness=.54;metalness=.65;}const key=color+roughness+metalness;if(!materials.has(key))materials.set(key,realism.assign(color)||details.assign(color)||new T.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);}
 function geo(key,fn){if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key);}
 function box(parent,x,y,z,w,h,d,color){const key='roundbox:'+w+','+h+','+d;const m=new T.Mesh(geo(key,()=>new RoundedBoxGeometry(w,h,d,2,Math.min(.045,w*.1,h*.1,d*.1))),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function sphere(parent,x,y,z,rx,ry,rz,color){const m=new T.Mesh(geo('sphere',()=>new T.SphereGeometry(1,12,10)),mat(color));m.position.set(x,y,z);m.scale.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function cylinder(parent,x,y,z,r,h,color,top=r){const key='c'+top/r;const m=new T.Mesh(geo(key,()=>new T.CylinderGeometry(top/r,1,1,12)),mat(color));m.position.set(x,y,z);m.scale.set(r,h,r);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function beam(parent,a,b,width,color){const v=new T.Vector3(...a),end=new T.Vector3(...b),m=box(parent,0,0,0,width,v.distanceTo(end),width,color);m.position.copy(v.clone().add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(v).normalize());return m;}
 function label(text,x,y,z,width=8){const c=document.createElement('canvas');c.width=768;c.height=144;const q=c.getContext('2d');q.fillStyle='#f7f2de';q.beginPath();q.roundRect(4,4,760,136,22);q.fill();q.strokeStyle='#a69870';q.lineWidth=5;q.stroke();q.font='650 52px Vazirmatn';q.direction='rtl';q.textAlign='center';q.fillStyle='#294635';q.fillText(text,384,88,730);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:true}));m.position.set(x,y,z);m.scale.set(width,width*144/768,1);world.add(m);return m;}
 let archiveMaterials=null,calendarMaterials=null,workshopMaterials=null,canalMaterials=null,postalMaterials=null,atriumMaterials=null,receptionMaterials=null,orchardMaterials=null,paymentMaterials=null,bankMaterials=null,auditMaterials=null,officeMaterials=null;
 const detailed=node=>Boolean(node.scene?.officeRoom||node.scene?.archiveRoom||node.scene?.calendarRoom||node.scene?.workshopRoom||node.scene?.canalRoom||node.scene?.postalRoom||node.scene?.atriumRoom||node.scene?.receptionRoom||node.scene?.auditRoom||node.scene?.bankRoom||node.scene?.paymentRoom||node.scene?.orchardRoom);
 function setLighting(node){if(node.scene?.officeRoom){scene.background.set('#cbd6cf');scene.fog.color.set('#cbd6cf');scene.environmentIntensity=.8;renderer.toneMappingExposure=1.06;sun.position.set(45,60,25);sun.intensity=2;return;}if(node.scene?.auditRoom){scene.background.set('#c7d8dc');scene.fog.color.set('#c7d8dc');scene.environmentIntensity=.85;renderer.toneMappingExposure=1.07;sun.position.set(-25,55,-85);sun.intensity=2.1;return;}if(node.scene?.bankRoom){scene.background.set('#becbd2');scene.fog.color.set('#becbd2');scene.environmentIntensity=.8;renderer.toneMappingExposure=1.08;sun.position.set(-30,75,30);sun.intensity=2.2;return;}if(node.scene?.paymentRoom){scene.background.set('#c6d7db');scene.fog.color.set('#c6d7db');scene.environmentIntensity=.8;renderer.toneMappingExposure=1.08;sun.position.set(20,75,25);sun.intensity=2;return;}if(node.scene?.orchardRoom){scene.background.set('#d5dfe9');scene.fog.color.set('#d5dfe9');scene.environmentIntensity=.72;renderer.toneMappingExposure=1.03;sun.position.set(-42,85,32);sun.intensity=2;return;}if(node.scene?.receptionRoom){scene.background.set('#c4d4d8');scene.fog.color.set('#c4d4d8');scene.environmentIntensity=.68;renderer.toneMappingExposure=1.02;sun.position.set(-40,85,35);sun.intensity=1.8;return;}if(node.scene?.atriumRoom){scene.background.set('#d0d9d0');scene.fog.color.set('#d0d9d0');scene.environmentIntensity=.8;renderer.toneMappingExposure=1.1;sun.position.set(-36,85,32);sun.intensity=2;return;}if(node.scene?.postalRoom){scene.background.set('#c2cdd0');scene.fog.color.set('#c2cdd0');scene.environmentIntensity=.62;renderer.toneMappingExposure=1.07;sun.position.set(-42,85,32);sun.intensity=1.8;return;}const canal=node.scene?.canalRoom,calendar=node.scene?.calendarRoom,archive=node.scene?.archiveRoom;scene.background.set(node.scene.sky);scene.fog.color.set(node.scene.sky);scene.environmentIntensity=canal?.72:calendar?.65:archive?.38:.8;renderer.toneMappingExposure=canal?1.04:calendar?1.08:archive?1.05:.95;sun.position.set(...(canal?[-42,85,32]:calendar?[-40,90,25]:archive?[-35,65,20]:[-65,115,40]));sun.intensity=canal?2:calendar?2.1:1.8+(node.scene.index%4)*.16;}
 function archiveText(text){const c=document.createElement('canvas');c.width=1024;c.height=192;const q=c.getContext('2d');q.fillStyle='#22353a';q.fillRect(0,0,1024,192);q.strokeStyle='#bba270';q.lineWidth=4;q.strokeRect(12,12,1000,168);q.fillStyle='#e2d8bd';q.font='500 48px Vazirmatn';q.direction='rtl';q.textAlign='center';q.fillText(text,512,116,950);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;const material=new T.MeshStandardMaterial({map,roughness:.82});material.userData.transient=true;material.userData.ownedMap=true;return material;}
 const portalTarget=new T.WebGLRenderTarget(4,4,{samples:Math.min(2,renderer.capabilities.maxSamples)}),portalResolution={value:new T.Vector2(1,1)};
 const stations=createStationFactory({box,cylinder,sphere,geo,mat});
 function random(i){return ((Math.sin(i*127.1+47.7)*43758.5453)%1+1)%1;}
 function plant(x,z,i){realism.plant(world,x,z,i,2.1+random(i)*.7);} function tree(x,z,i){realism.tree(world,x,z,i,15+random(i)*5);}
 function clear(){delete world.userData.officeUpdate;delete world.userData.canalTime;water?.userData.riverWater.dispose();const disposed=new Set();function disposeOnce(resource){if(!disposed.has(resource)){resource.dispose();disposed.add(resource);}}world.traverse(o=>{if(o.material?.userData.ownedMap)disposeOnce(o.material.map);for(const key of o.material?.userData.ownedMaps||[])if(o.material[key])disposeOnce(o.material[key]);if(o.userData.glass||o.material?.userData.transient)disposeOnce(o.material);if(o.isInstancedMesh)o.dispose();if(o.isSkinnedMesh)disposeOnce(o.skeleton);if(o.geometry?.userData.transient)disposeOnce(o.geometry);if(o.isSprite){o.material.map?.dispose();o.material.dispose();}});world.clear();wind.length=gateModels.length=objectModels.length=guides.length=0;water=null;}
 function buildFresh(node){clear();nodeRef=node;layout=layoutFor(node);
  if(node.scene){const opening=detailed(node);if(opening)archiveMaterials||=createArchiveMaterials(renderer);scene.environmentIntensity=opening?0.38:0.8;renderer.toneMappingExposure=opening?1.05:.95;sun.position.set(...(opening?[-35,65,20]:[-65,115,40]));scene.background=new T.Color(node.scene.sky);scene.fog.color.set(node.scene.sky);sun.intensity=1.8+(node.scene.index%4)*.16;if(node.scene.officeRoom){officeMaterials||=createOfficeMaterials(renderer);setLighting(node);}if(node.scene.auditRoom){auditMaterials||=createAuditMaterials(renderer);setLighting(node);}if(node.scene.bankRoom){bankMaterials||=createBankMaterials(renderer);setLighting(node);}if(node.scene.paymentRoom){paymentMaterials||=createPaymentMaterials(renderer);setLighting(node);}if(node.scene.orchardRoom){orchardMaterials||=createOrchardMaterials(archiveMaterials,renderer);setLighting(node);}if(node.scene.receptionRoom){receptionMaterials||=createReceptionMaterials(archiveMaterials,renderer);setLighting(node);}if(node.scene.atriumRoom){atriumMaterials||=createAtriumMaterials(archiveMaterials,renderer);setLighting(node);}if(node.scene.postalRoom){postalMaterials||=createPostalMaterials(archiveMaterials,renderer);setLighting(node);}if(node.scene.canalRoom){canalMaterials||=createCanalMaterials(archiveMaterials,renderer);setLighting(node);}if(node.scene.workshopRoom){workshopMaterials||=createWorkshopMaterials(archiveMaterials,renderer);setLighting(node);}if(node.scene.calendarRoom){calendarMaterials||=createCalendarMaterials(archiveMaterials);setLighting(node);}
   const architecture=new T.Group();world.add(architecture);buildMissionScene(architecture,node,layout,{box,cylinder,sphere,beam,label,geo,mat,plant:realism.plant,tree:realism.tree,materials:realism.materials,archiveMaterials:opening?archiveMaterials:null,archiveText:opening?archiveText:null,portalTexture:portalTarget.texture,portalResolution,previewDestination:id=>{const destination=layoutFor(nodes[id]);return {targetCenter:{x:(destination.spawn.x-640)*.1,z:(destination.spawn.y-450)*.1+5},targetDoorId:''};},officeMaterials:node.scene.officeRoom?officeMaterials:null,auditMaterials:node.scene.auditRoom?auditMaterials:null,bankMaterials:node.scene.bankRoom?bankMaterials:null,paymentMaterials:node.scene.paymentRoom?paymentMaterials:null,orchardMaterials:node.scene.orchardRoom?orchardMaterials:null,receptionMaterials:node.scene.receptionRoom?receptionMaterials:null,atriumMaterials:node.scene.atriumRoom?atriumMaterials:null,postalMaterials:node.scene.postalRoom?postalMaterials:null,canalMaterials:node.scene.canalRoom?canalMaterials:null,workshopMaterials:node.scene.workshopRoom?workshopMaterials:null,calendarMaterials:node.scene.calendarRoom?calendarMaterials:null});world.userData.officeUpdate=architecture.userData.officeUpdate;world.userData.canalTime=architecture.userData.canalTime;batchArchitecture(architecture);
   if(!opening){const pathSource=[realism.materials.path,realism.materials.concrete,realism.materials.wood][node.scene.index%3],missionRoad=new T.Mesh(createRoadGeometry(layout),createRoadMaterial(pathSource));missionRoad.receiveShadow=true;missionRoad.name='authored-mission-route';world.add(missionRoad);}
   gateModels.push(...layout.gates.map(gate=>({gate,bar:gate.bar})));
   for(const o of layout.objects){if(node.scene.officeRoom){if(o.object.id==='nima')guides.push(actors.guide(world,o.x*S-64,o.y*S-45-6,node.scene.guide,{box,cylinder,sphere,beam,geo,mat,archiveMaterials}));continue;}const station=stations.station(world,o,node.scene,node.scene.auditRoom?auditMaterials:node.scene.bankRoom?bankMaterials:node.scene.orchardRoom?orchardMaterials:node.scene.receptionRoom?receptionMaterials:node.scene.atriumRoom?atriumMaterials:node.scene.postalRoom?postalMaterials:node.scene.canalRoom?canalMaterials:node.scene.workshopRoom?workshopMaterials:node.scene.calendarRoom?calendarMaterials:opening?archiveMaterials:null);objectModels.push(station);if(o.object.kind==='guide'){const actor=actors.guide(world,o.x*S-64,o.y*S-45-3,node.scene.guide,{box,cylinder,sphere,beam,geo,mat,archiveMaterials:opening?archiveMaterials:null});guides.push(actor);if(!opening)label(node.scene.guide.name+' / '+node.scene.guide.role,o.x*S-64,7,o.y*S-45-3,12);}}
   batchStaticPlants(world);renderer.shadowMap.needsUpdate=true;return;
  }
if(node.theme!=='water')box(world,0,-.8,0,185,1.4,155,'#7b9060');
  landscape.build(world,layout,node.theme);
  const roadSurface=new T.Mesh(createRoadGeometry(layout),createRoadMaterial(realism.materials.path));roadSurface.name='continuous-garden-path';roadSurface.receiveShadow=true;world.add(roadSurface);
  const stones=roadGravel(layout),stoneGeometry=geo('road-gravel',()=>{const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=.84+Math.sin(x*13+y*17+z*29)*.13;p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;}),roadStones=new T.InstancedMesh(stoneGeometry,mat('#a3987d'),stones.length),stoneDummy=new T.Object3D(),stoneColor=new T.Color();
  stones.forEach((p,i)=>{stoneDummy.position.set(p.x,p.y,p.z);stoneDummy.rotation.set(0,p.rotation,0);stoneDummy.scale.set(p.scale,p.scale*.38,p.scale*(.65+i%3*.22));stoneDummy.updateMatrix();roadStones.setMatrixAt(i,stoneDummy.matrix);stoneColor.setRGB(p.tint,p.tint*.98,p.tint*.9);roadStones.setColorAt(i,stoneColor);});roadStones.castShadow=roadStones.receiveShadow=true;roadStones.computeBoundingSphere();world.add(roadStones);
  for(let i=0;i<9;i++){const a=i*2.4,r=70+random(i)*12;const tx=Math.cos(a)*r,tz=Math.sin(a)*r*.75;if(!(Math.abs(tx)<36&&tz< -43))tree(tx,tz,i);}
  let index=0;if(node.theme!=='glass'&&node.theme!=='court')for(let x=180;x<1150;x+=155)for(let y=330;y<800;y+=140){if(walkable({x,y},layout,-18))continue;const xx=x*S-64,zz=y*S-45;box(world,xx,.25,zz,8,.5,7,'#8c7350');box(world,xx,.55,zz,7.4,.2,6.4,'#4f5334');for(let j=0;j<3;j++)plant(xx+(j-1)*2.2,zz+(j%2?1:-1),index++);}
  if(node.theme==='water'){const river=createRiverScene(world,realism.materials,{box,beam,cylinder,label,plant:realism.plant,rock:realism.rock,safeDecor:(x,z)=>!walkable({x:(x+64)*10,y:(z+45)*10},layout,-25)});
   const surface=createRiverWater(river.waterGeometry,waterMaps,{excluded:[hands.root,collectible,avatar],high:waterQuality});water=surface.mesh;world.add(water);
   realism.bridge(world);
      for(let i=0;i<16;i++){const x=-75+i*10;if(Math.abs(x)<12)continue;realism.plant(world,x,29.5+Math.sin(i)*1.4,0,1.5+random(i)).position.y=-.11;}
  }
  createGreenhouse(world,{plant:realism.plant,wood:realism.materials.wood,floor:realism.materials.concrete,landmark:node.theme!=='glass'&&node.theme!=='court',safeDecor:(x,z)=>!walkable({x:(x+64)*10,y:(z+45)*10},layout,-30)});
  for(const gate of layout.gates){const x=gate.x*S-64,z=gate.y*S-45;for(const d of [-4.5,4.5])box(world,x+d,4,z,.65,8,.65,'#9c8259');box(world,x,8,z,10,.7,1,'#b6a078');const leaves=new T.InstancedMesh(details.leafGeo,details.leafMat,24),leaf=new T.Object3D();for(let j=0;j<24;j++){leaf.position.set(x-4+(j%12)*.72,8.3+Math.sin(j*.7)*.28,z+Math.sin(j)*.4);leaf.rotation.set(.2,j*2.399,.3);leaf.scale.setScalar(.75);leaf.updateMatrix();leaves.setMatrixAt(j,leaf.matrix);}leaves.castShadow=true;leaves.computeBoundingSphere();world.add(leaves);const bar=box(world,x,2.4,z,8,.35,.4,'#b89750');gateModels.push({gate,bar});label(gate.exit.label,x,7,z,9);}
  for(const o of layout.objects){const station=stations.station(world,o);objectModels.push(station);if(o.object.kind==='guide')guides.push(actors.guide(world,o.x*S-64,o.y*S-45-2.05));}
  batchStaticPlants(world);world.traverse(o=>{if(o.userData.treeLOD)o.levels[1].distance=contact.enabled?65:42;});renderer.shadowMap.needsUpdate=true;
 }
 const locationCache=new Map();let activeLocation=null,preparing=false,buildCount=0,preparedKeys=new Set();
 function sceneKey(node){if(node.scene?.officeRoom)return 'office-v1';const l=layoutFor(node);return node.id+':'+layoutFor(node.scene?.auditRoom?nodes.receiptCheck:node.scene?.bankRoom?nodes.verifyBank:node.scene?.paymentRoom?nodes.gateway:node.scene?.orchardRoom?nodes.naturalSlip:node.scene?.receptionRoom?nodes.naturalIdentity:node.scene?.atriumRoom?nodes.publish:node.scene?.postalRoom?nodes.ownerSend:node.scene?.canalRoom?nodes.ownerAmount:node.scene?.workshopRoom?nodes.ownerIdentity:node.scene?.calendarRoom?nodes.window:nodes.project).gates.map(g=>[g.exit.id,g.x,g.y].join(',')).join(';')+':'+l.gates.map(g=>[g.exit.id,g.x,g.y].join(',')).join(';');}
 function detachLocation(){world.removeFromParent();world=new T.Group();scene.add(world);wind.length=gateModels.length=objectModels.length=guides.length=0;water=null;activeLocation=null;}
 function build(node){
  const key=node.scene?sceneKey(node):null,archive=detailed(node)||preparedKeys.has(key);
  if(activeLocation?.key===key&&archive){nodeRef=node;return;}
  if(activeLocation)detachLocation();else clear();
  const cached=locationCache.get(key);
  if(cached){world.removeFromParent();world=cached.world;scene.add(world);layout=cached.layout;nodeRef=node;gateModels.push(...cached.gates);objectModels.push(...cached.objects);guides.push(...cached.guides);activeLocation=cached;setLighting(node);renderer.shadowMap.needsUpdate=true;return;}
  buildFresh(node);buildCount++;
  if(archive){activeLocation={key,node,world,layout,gates:[...gateModels],objects:[...objectModels],guides:[...guides]};locationCache.set(key,activeLocation);}
 }
 async function prepareLocationFamily(destination=nodes.project){
  if(!detailed(destination))return;
  const auditFamily=[nodes.receiptCheck,nodes['repair-receiptCheck-0'],nodes['repair-receiptCheck-1'],nodes.investorSend],bankFamily=[nodes.verifyBank,nodes['repair-verifyBank-0'],nodes['repair-verifyBank-2'],...auditFamily],paymentFamily=[nodes.gateway,nodes['repair-gateway-1'],nodes['repair-gateway-2'],nodes.verifyBank,nodes['repair-verifyBank-0'],nodes['repair-verifyBank-2'],nodes.receiptCheck],orchardFamily=[nodes.naturalSlip,nodes['repair-naturalSlip-0'],nodes['repair-naturalSlip-1'],nodes.gateway,nodes['repair-gateway-1'],nodes['repair-gateway-2'],nodes.verifyBank],receptionFamily=[nodes.naturalIdentity,nodes['repair-naturalIdentity-1'],nodes['repair-naturalIdentity-2'],nodes.naturalSlip,nodes['repair-naturalSlip-0'],nodes['repair-naturalSlip-1'],nodes.gateway],atriumFamily=[nodes.publish,nodes['repair-publish-0'],nodes['repair-publish-2'],nodes.naturalIdentity,nodes['repair-naturalIdentity-1'],nodes['repair-naturalIdentity-2'],nodes.naturalSlip],postalFamily=[nodes.ownerSend,nodes['repair-ownerSend-1'],nodes['repair-ownerSend-2'],nodes.publish,nodes['repair-publish-0'],nodes['repair-publish-2'],nodes.naturalIdentity],canalFamily=[nodes.ownerAmount,nodes['repair-ownerAmount-0'],nodes['repair-ownerAmount-2'],nodes.ownerSend,nodes['repair-ownerSend-1'],nodes['repair-ownerSend-2'],nodes.publish],workshopFamily=[nodes.ownerIdentity,nodes['repair-ownerIdentity-0'],nodes['repair-ownerIdentity-1'],nodes.ownerAmount,nodes['repair-ownerAmount-0'],nodes['repair-ownerAmount-2'],nodes.ownerSend],calendarFamily=[nodes.window,nodes['repair-window-1'],nodes['repair-window-2'],nodes.ownerIdentity,nodes['repair-ownerIdentity-0'],nodes['repair-ownerIdentity-1'],nodes.ownerAmount],family=destination.scene.officeRoom?[officeNode,nodes.ownerIdentity]:destination.scene.auditRoom?auditFamily:destination.scene.bankRoom?bankFamily:destination.scene.paymentRoom?paymentFamily:destination.scene.orchardRoom?orchardFamily:destination.scene.receptionRoom?receptionFamily:destination.scene.atriumRoom?atriumFamily:destination.scene.postalRoom?postalFamily:destination.scene.canalRoom?canalFamily:destination.scene.workshopRoom?workshopFamily:destination.scene.calendarRoom?calendarFamily:[nodes.project,nodes['repair-project-0'],nodes['repair-project-2'],nodes.window,nodes['repair-window-1'],nodes['repair-window-2'],nodes.ownerIdentity],keys=new Set(family.map(sceneKey));preparedKeys=keys;

  preparing=true;
  const warmCamera=new T.PerspectiveCamera(85,1,.08,650);warmCamera.position.set(0,65,95);warmCamera.lookAt(0,0,0);
  const target=new T.WebGLRenderTarget(4,4),oldTarget=renderer.getRenderTarget(),shadow=renderer.shadowMap.enabled;
  try{
   // A new journey can change door placement. Keep only the current family and its prepared immediate successor.

   for(const [key,bundle]of locationCache)if(!keys.has(key)){
    if(activeLocation)detachLocation();else clear();world.removeFromParent();world=bundle.world;scene.add(world);clear();world.removeFromParent();world=new T.Group();scene.add(world);locationCache.delete(key);
   }
   if(family.every(n=>locationCache.get(sceneKey(n))?.ready)){build(destination);return;}
   renderer.initRenderTarget(portalTarget);renderer.shadowMap.enabled=shadow;
   for(const n of family){
    await new Promise(requestAnimationFrame);build(n);
    // Include hidden door destinations and hand accessories in the GPU warm-up.
    const visibility=[];world.traverse(o=>{visibility.push([o,o.visible,o.frustumCulled]);o.visible=true;o.frustumCulled=false;});
    const handVisibility=[];for(const rig of [hands.root,archiveHands.root])rig.traverse(o=>{handVisibility.push([o,o.visible,o.frustumCulled]);o.visible=true;o.frustumCulled=false;});
    try{await renderer.compileAsync(scene,warmCamera);renderer.setRenderTarget(target);renderer.render(scene,warmCamera);warmCamera.position.set((layout.spawn.x-640)*.1,4.8,(layout.spawn.y-450)*.1);warmCamera.rotation.set(-.08,layout.entryYaw||0,0,'YXZ');warmCamera.updateMatrixWorld(true);renderer.render(scene,warmCamera);warmCamera.position.set(0,65,95);warmCamera.lookAt(0,0,0);activeLocation.ready=true;}
    finally{for(const [o,visible,culled]of visibility){o.visible=visible;o.frustumCulled=culled;}for(const [o,visible,culled]of handVisibility){o.visible=visible;o.frustumCulled=culled;}renderer.setRenderTarget(oldTarget);}
   }
   build(destination);
  }finally{renderer.shadowMap.enabled=shadow;renderer.shadowMap.needsUpdate=true;target.dispose();preparing=false;}
 }
 function renderDestination(bundle,gate,target,dt){
  const source=world,wasVisible=source.visible,position=camera.position.clone(),orientation=camera.quaternion.clone(),previousTarget=renderer.getRenderTarget(),needsShadow=renderer.shadowMap.needsUpdate;
  const link=gate.destinationLink,offset=link?new T.Vector3(link.sourceCenter.x-link.targetCenter.x,0,link.sourceCenter.z-link.targetCenter.z):new T.Vector3((gate.x-640)*.1,0,(gate.y-450)*.1-40),leaves=[];
  const lighting={background:scene.background.clone(),fog:scene.fog.color.clone(),environment:scene.environmentIntensity,exposure:renderer.toneMappingExposure,sun:sun.position.clone(),intensity:sun.intensity};setLighting(bundle.node);
  const handVisibility=[hands.root.visible,archiveHands.root.visible,collectible.visible];if(target)hands.root.visible=archiveHands.root.visible=collectible.visible=false;
  source.visible=false;scene.add(bundle.world);if(link?.rotationYaw){camera.position.sub(new T.Vector3(link.sourceCenter.x,0,link.sourceCenter.z)).applyAxisAngle(new T.Vector3(0,1,0),link.rotationYaw).add(new T.Vector3(link.targetCenter.x,0,link.targetCenter.z));camera.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),link.rotationYaw));}else camera.position.sub(offset);camera.updateMatrixWorld(true);
  for(const {gate:destinationGate}of bundle.gates){if(destinationGate.destinationView){leaves.push([destinationGate.destinationView,destinationGate.destinationView.visible]);destinationGate.destinationView.visible=false;}if(destinationGate.door&&(!link||destinationGate.exit.id===link.targetDoorId))for(const leaf of destinationGate.door.leaves){leaves.push([leaf.pivot,leaf.pivot.visible]);leaf.pivot.visible=false;}}
  try{renderer.setRenderTarget(target);if(target)renderer.shadowMap.needsUpdate=false;if(!target&&contact.enabled)composer.render(dt);else renderer.render(scene,camera);}
  finally{for(const [leaf,visible]of leaves)leaf.visible=visible;[hands.root.visible,archiveHands.root.visible,collectible.visible]=handVisibility;bundle.world.removeFromParent();source.visible=wasVisible;scene.background.copy(lighting.background);scene.fog.color.copy(lighting.fog);scene.environmentIntensity=lighting.environment;renderer.toneMappingExposure=lighting.exposure;sun.position.copy(lighting.sun);sun.intensity=lighting.intensity;camera.position.copy(position);camera.quaternion.copy(orientation);camera.updateMatrixWorld(true);renderer.setRenderTarget(previousTarget);renderer.shadowMap.needsUpdate=needsShadow;}
 }
 const avatar=new T.Group();scene.add(avatar);const legs=[],arms=[];
 for(const x of [-.6,.6]){const leg=box(avatar,x,1.1,0,.65,2,.7,'#384b48');legs.push(leg);box(leg,0,-.45,.13,1,.18,1.25,'#393b34');}
 const torso=new T.Mesh(geo('torso',()=>new T.CapsuleGeometry(.8,1.15,6,14)),mat('#bf9161'));torso.position.set(0,2.9,0);torso.scale.z=.65;torso.castShadow=true;avatar.add(torso);const avatarHead=sphere(avatar,0,4.6,0,.85,1,.8,'#ddb08c'),avatarHair=sphere(avatar,0,5,.1,.88,.75,.8,'#343c32');
 for(const x of [-1.2,1.2]){const arm=cylinder(avatar,x,3,0,.28,1.8,'#bf9161',.85*.28);arms.push(arm);sphere(avatar,x,2,0,.25,.3,.25,'#ddb08c');}
  const avatarBag=box(avatar,0,2.8,.7,1.5,1.6,.65,'#85784b');
 sphere(avatar,0,4.35,-.77,.17,.22,.2,'#d4a17e');for(const x of [-.83,.83])sphere(avatar,x,4.55,0,.17,.27,.17,'#ddb08c');
 const scarf=new T.Mesh(geo('scarf',()=>new T.TorusGeometry(.78,.16,8,24)),mat('#4c615a'));scarf.position.set(0,3.85,0);scarf.rotation.x=Math.PI/2;avatar.add(scarf);
 const eyeMat=mat('#252c28');for(const x of [-.3,.3]){const e=new T.Mesh(geo('eye',()=>new T.SphereGeometry(.09,8,8)),eyeMat);e.position.set(x,4.6,-.75);avatar.add(e);}
  const cartGroup=new T.Group();scene.add(cartGroup);box(cartGroup,0,1,0,4,1.3,2.8,'#a17d4d');for(const x of [-1.6,1.6])for(const z of [-1,1])sphere(cartGroup,x,.45,z,.45,.45,.22,'#384336');for(let i=0;i<3;i++){const plant=realism.plant(cartGroup,(i-1)*1.1,0,i,.85);plant.position.y=1.65;}beam(cartGroup,[2,1,0],[3.2,1.7,0],.15,'#7a633f');
 const collectible=new T.Group();collectible.position.y=-100;scene.add(collectible);const heldRotation=new T.Quaternion(),bookTurn=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();composer.setSize(r.width,r.height);renderer.getDrawingBufferSize(portalResolution.value);portalTarget.setSize(portalResolution.value.x,portalResolution.value.y);}
 let yaw=0,pitch=-.08,dragging=false,active=false,eyeHeight=4.8,lastPointerX=0,lastPointerY=0;
 camera.rotation.order='YXZ';
 function releaseMouse(){dragging=false;if(document.pointerLockElement===canvas)document.exitPointerLock();}
 function captureMouse(){if(!active)return;canvas.focus({preventScroll:true});try{const request=canvas.requestPointerLock?.();request?.catch(()=>{});}catch{}}
 canvas.addEventListener('pointerdown',event=>{if(active&&event.button===0){dragging=true;lastPointerX=event.clientX;lastPointerY=event.clientY;}});
 document.addEventListener('pointerup',()=>{dragging=false;});
 document.addEventListener('mousemove',event=>{if(!active||document.hidden)return;if(document.pointerLockElement!==canvas)return;yaw-=event.movementX*.002;pitch=clampPitch(pitch-event.movementY*.002);});
 window.addEventListener('blur',releaseMouse);
 document.addEventListener('pointerlockerror',()=>{});
 document.addEventListener('pointermove',event=>{if(!active||!dragging||document.pointerLockElement===canvas)return;const dx=event.clientX-lastPointerX,dy=event.clientY-lastPointerY;lastPointerX=event.clientX;lastPointerY=event.clientY;yaw-=dx*.002;pitch=clampPitch(pitch-dy*.002);});
 let lastPortal=null;const portalPosition=new T.Vector3(),portalRotation=new T.Quaternion();
 const eye=new T.Vector3(),aim=new T.Vector3(); function render({officeScanElapsed=0,node,state,player,palette,time,dt=0,mode,paused=false,pickupElapsed=null,doorTransit=null}){
  if(preparing)return;if(node!==nodeRef)build(node);elapsed=time;if(world.userData.canalTime)world.userData.canalTime.value=matchMedia('(prefers-reduced-motion: reduce)').matches?0:time;landscape.update(matchMedia('(prefers-reduced-motion: reduce)').matches?0:time);active=mode==='play'&&!paused;if(!active)releaseMouse();torso.material=mat(palette.shirt);arms.forEach(a=>a.material=mat(palette.shirt));scarf.visible=Boolean(palette.scarf);legs.forEach(l=>l.material=mat(palette.pants));avatarHead.material=mat(palette.skin);avatarHair.material=mat(palette.hair);avatarBag.material=mat(palette.bag);
  const cart=cartAt(node,time);cartGroup.visible=Boolean(cart);if(cart)cartGroup.position.set(cart.x*S-64,.3,cart.y*S-45);
  avatar.position.set(player.x*S-64,.45,player.y*S-45);const facing={up:0,down:Math.PI,left:Math.PI/2,right:-Math.PI/2};avatar.rotation.y=facing[player.facing]||0;
  const stride=player.moving?Math.sin(time*11)*.55:0;legs.forEach((m,i)=>m.rotation.x=stride*(i?1:-1));arms.forEach((m,i)=>m.rotation.x=stride*(i?-1:1));avatar.position.y+=player.moving?Math.abs(Math.sin(time*11))*.12:Math.sin(time*2)*.025;
  for(let i=0;i<wind.length;i++)wind[i].rotation.z=Math.sin(time*1.3+i)*.025;
  water?.userData.riverWater.update(matchMedia('(prefers-reduced-motion: reduce)').matches?0:time);
  gateModels.forEach(({gate,bar})=>{bar.visible=missingItems(state,gate.exit).length>0;if(gate.door){const pose=doorJourneyPose(doorTransit?.id===gate.exit.id?doorTransit.elapsed:0,doorTransit?.reduced);gate.door.apply(pose);if(gate.destinationView)gate.destinationView.visible=pose.open>0;}});objectModels.forEach(({entry,paper})=>{paper.visible=!entry.object.grant||!state.inventory.includes(entry.object.grant);});
  if(pickup&&(pickupElapsed===null||mode!=='play')){pickup=null;collectible.visible=false;}
  avatar.visible=mode!=='play';
  if(mode==='play'){
   if(doorTransit){const gate=layout.gates.find(g=>g.exit.id===doorTransit.id);const target=gate?.travelYaw||0;const difference=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));yaw+=difference*(1-Math.exp(-8*dt));}
   const bridge=!node.scene&&node.theme==='water'&&Math.abs(player.x-640)<54&&player.y>625&&player.y<745?.85:0;
   const bob=player.moving&&!matchMedia('(prefers-reduced-motion: reduce)').matches?Math.sin(time*9)*.045:0;
   eyeHeight=T.MathUtils.damp(eyeHeight,4.8+bridge,10,dt);camera.position.set(avatar.position.x,eyeHeight+bob,avatar.position.z);camera.rotation.set(pitch,yaw,0,'YXZ');
   if(pickup){const pose=pickupPose(pickupElapsed,pickup.reduced,pickup.style);
    if(pickup.style==='archive'){eye.fromArray(pose.document.position);camera.localToWorld(eye);collectible.position.copy(pickup.origin).lerp(eye,pose.lift);const tilt=new T.Quaternion().setFromEuler(new T.Euler(...pose.document.rotation));heldRotation.copy(camera.quaternion).multiply(tilt).multiply(bookTurn);collectible.quaternion.copy(pickup.rotation).slerp(heldRotation,pose.lift);collectible.scale.setScalar(T.MathUtils.lerp(1,pickup.heldScale,pose.lift));collectible.visible=pose.documentVisible;}
    else{const depth=Math.max(1.18,1.1/camera.aspect);eye.set(pose.insert*.28,-.18-pose.insert*.64,-depth+pose.insert*(depth-1.5));camera.localToWorld(eye);collectible.position.copy(pickup.origin).lerp(eye,pose.lift);heldRotation.copy(camera.quaternion).multiply(bookTurn);collectible.quaternion.copy(pickup.rotation).slerp(heldRotation,pose.lift);collectible.scale.setScalar(T.MathUtils.lerp(1,.52,pose.lift));collectible.visible=pose.documentVisible;}
   }
  }else{camera.position.set(65,75,102);camera.lookAt(0,0,0);}
  const officeCarry=world.userData.officeUpdate?.(state,document.hidden?0:dt,camera,paused,{scanElapsed:officeScanElapsed,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
  const officePose=officeCarry?{left:{position:[-.29,-.67,-.66],rotation:[.15,-.12,-.17],grip:.2},right:{position:[.43,-.56,-.76],rotation:[.1,.12,.08],grip:.6},bag:{visible:false,position:[0,-2,-1],open:0,zip:0}}:null;
  hands.update({pose:pickup?pickupPose(pickupElapsed,pickup.reduced):null,time,moving:player.moving,visible:!detailed(node)&&mode==='play'&&!paused,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,aspect:camera.aspect,kind:pickup?.kind,shirt:palette.shirt,gloveColor:palette.glove,bagColor:palette.bag,role:palette.id});
  archiveHands.update({pose:officePose|| (doorTransit?doorJourneyPose(doorTransit.elapsed,doorTransit.reduced).hands:pickup&&pickup.style==='archive'?pickupPose(pickupElapsed,pickup.reduced,'archive'):null),time,moving:player.moving,visible:detailed(node)&&mode==='play'&&!paused,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,aspect:camera.aspect,shirt:palette.shirt,skin:palette.skin,bagColor:palette.bag,role:palette.id});
  for(const actor of guides)actors.update(actor,time,dt,camera.position,paused||matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(time-lastShadow>=.12){renderer.shadowMap.needsUpdate=true;lastShadow=time;}
  const portalGate=doorTransit&&layout.gates.find(g=>g.exit.id===doorTransit.id&&g.destinationView),destination=portalGate&&locationCache.get(sceneKey(nodes[portalGate.exit.next]));
  if(destination&&doorJourneyPose(doorTransit.elapsed,doorTransit.reduced).open>0){
   const threshold=(portalGate.y-450)*.1,direction=portalGate.travelDirection||{x:0,y:-1};
   if((camera.position.x-(portalGate.x-640)*.1)*direction.x+(camera.position.z-threshold)*direction.y>.06){renderDestination(destination,portalGate,null,dt);return;}
   renderer.getDrawingBufferSize(portalResolution.value);const w=portalResolution.value.x,h=portalResolution.value.y;if(portalTarget.width!==w||portalTarget.height!==h)portalTarget.setSize(w,h);
   const portalKey=(activeLocation?.key||node.id)+':'+portalGate.exit.id+':'+portalGate.exit.next;const changed=!lastPortal||lastPortal.id!==portalKey||lastPortal.width!==w||lastPortal.height!==h||portalPosition.distanceToSquared(camera.position)>.000004||portalRotation.angleTo(camera.quaternion)>.0002;
   if(changed){
    renderDestination(destination,portalGate,portalTarget,dt);portalPosition.copy(camera.position);portalRotation.copy(camera.quaternion);lastPortal={id:portalKey,width:w,height:h,time};
   }
  }
  if(!portalGate)lastPortal=null;
  if(contact.enabled)composer.render(dt);else renderer.render(scene,camera);
 }
 function toWorld(x,y){const r=canvas.getBoundingClientRect();pointer.set(x/r.width*2-1,-y/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=new T.Vector3();if(!ray.ray.intersectPlane(plane,hit))return {x:-1000,y:-1000};return {x:(hit.x+64)/S,y:(hit.z+45)/S};}
 function sampleFrame(dt,active){const next=budget.sample(dt,active&&!contact.enabled);if(next!==renderScale){renderScale=next;renderer.setPixelRatio(Math.min(devicePixelRatio,1.25)*renderScale);composer.setPixelRatio(renderer.getPixelRatio());resize();}}
 resize();return {getSceneStats:()=>({buildCount,officeTextureSize:officeMaterials?.floor.map.image.width??null,auditTextureSize:auditMaterials?.floor.map.image.width??null,bankTextureSize:bankMaterials?.floor.map.image.width??null,paymentTextureSize:paymentMaterials?.floor.map.image.width??null,orchardTextureSize:orchardMaterials?.floor.map.image.width??null,receptionTextureSize:receptionMaterials?.floor.map.image.width??null,atriumTextureSize:atriumMaterials?.floor.map.image.width??null,postalTextureSize:postalMaterials?.floor.map.image.width??null,canalTextureSize:canalMaterials?.floor.map.image.width??null,workshopTextureSize:workshopMaterials?.brick.map.image.width??null,portalSize:[portalTarget.width,portalTarget.height],viewportSize:portalResolution.value.toArray(),cachedScenes:locationCache.size,node:nodeRef?.id,ready:[...locationCache.values()].every(b=>b.ready)}),prepareLocationFamily,invalidateLayout:()=>{nodeRef=null;},sampleFrame,getRenderScale:()=>renderScale,setQuality:high=>{contact.enabled=high;landscape.setQuality(high);world.traverse(o=>{if(o.userData.treeLOD)o.levels[1].distance=high?65:42;});waterQuality=high;water?.userData.riverWater.setQuality(high);renderScale=budget.reset();renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));composer.setPixelRatio(renderer.getPixelRatio());resize();},isFirstPerson:true,captureMouse,releaseMouse,turn:delta=>{yaw+=delta;},lookVertical:delta=>{pitch=clampPitch(pitch+delta);},movement:(x,z)=>relativeMovement(x,z,yaw),canInspect:(p,o)=>canInspectFrom(p,o,yaw),resize,render,toWorld,resetCamera:({yaw:entryYaw=0,fov=72}={})=>{yaw=entryYaw;pitch=-.08;camera.fov=fov;camera.updateProjectionMatrix();},collect:(entry,{reduced=false,review=false,style='legacy'}={})=>{collectible.clear();const station=objectModels.find(o=>o.entry.object.id===entry.object.id);if(station){station.paper.updateWorldMatrix(true,false);const prop=station.paper.clone(true);prop.visible=true;prop.position.set(0,0,0);prop.rotation.set(0,0,0);const propWidth=new T.Box3().setFromObject(prop).getSize(new T.Vector3()).x;collectible.add(prop);pickup={origin:station.paper.getWorldPosition(new T.Vector3()),rotation:station.paper.getWorldQuaternion(new T.Quaternion()),kind:entry.object.kind,reduced,style,heldScale:.75/Math.max(.01,propWidth)};if(review){pickup.origin.set(.5,-.9,-1.05);camera.localToWorld(pickup.origin);pickup.rotation.copy(camera.quaternion).multiply(bookTurn);}collectible.visible=true;}},getLayout:()=>layout};
}