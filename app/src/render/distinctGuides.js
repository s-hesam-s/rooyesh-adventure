import {workwearMaterial} from './workwear.js';
import * as T from '../../vendor/three.module.js';
import {guideIdentities} from '../content/guideIdentities.js';

export function buildDistinctGuide(root,identity,h){
 const c=guideIdentities[identity];if(!c)throw Error('Unknown guide identity');
 const body=new T.Group();body.name='guide-body-'+c.id;root.add(body);root.scale.setScalar(c.height/5.6);
 const skin=new T.MeshStandardMaterial({color:c.skin,roughness:.64}),hair=new T.MeshStandardMaterial({color:c.hair,roughness:.88}),eyeWhite=new T.MeshStandardMaterial({color:'#eee7dd',roughness:.33}),iris=new T.MeshStandardMaterial({color:c.eyes,roughness:.37}),lip=new T.MeshStandardMaterial({color:c.gender==='man'?'#754b3e':'#a66b62',roughness:.72});
 for(const material of [skin,hair,eyeWhite,iris,lip])material.userData.transient=true;
 const cloth=workwearMaterial(c.jacket,{repeat:5}),shirt=h.mat(c.shirt),trousers=h.mat(c.trousers),shoe=h.mat('#292b2c'),metal=h.mat(c.id==='nika'?'#b49b63':'#68797d');
 cloth.userData.transient=true;cloth.userData.ownedMaps=['map','normalMap','roughnessMap'];
 const sleeve=c.shirtSleeves?shirt:cloth;
 const sphere=h.geo('identity-sphere',()=>new T.SphereGeometry(1,36,28)),unit=h.geo('identity-box',()=>new T.BoxGeometry(1,1,1));
 function mesh(parent,name,geometry,material,x,y,z,sx=1,sy=1,sz=1){const object=new T.Mesh(geometry,material);object.name=name;object.position.set(x,y,z);object.scale.set(sx,sy,sz);object.castShadow=object.receiveShadow=true;parent.add(object);return object;}
 function ellipsoid(parent,name,material,x,y,z,sx,sy,sz){return mesh(parent,name,sphere,material,x,y,z,sx,sy,sz);}
 function box(parent,name,material,x,y,z,w,ht,d){return mesh(parent,name,unit,material,x,y,z,w,ht,d);}
 function capsule(parent,name,a,b,r,material){const start=new T.Vector3(...a),end=new T.Vector3(...b),length=start.distanceTo(end);const geometry=h.geo('identity-capsule-'+r+'-'+length.toFixed(4),()=>new T.CapsuleGeometry(r,Math.max(.001,length-r*2),10,24));const o=mesh(parent,name,geometry,material,0,0,0);o.position.copy(start).lerp(end,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return o;}
 function curve(parent,name,points,r,material){return mesh(parent,name,h.geo(c.id+'-'+name,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false)),material,0,0,0);}
 const torso=h.geo(c.id+'-tailored-torso',()=>new T.LatheGeometry([[c.hemWidth??c.hip*.95,c.hemHeight??2.68],[c.hip,2.8],[c.waist,3.16],[c.chest,3.65],[c.shoulder,3.96],[c.shoulder*.85,4.12],[.19,4.22]].map(p=>new T.Vector2(...p)),64));
 mesh(body,'torso-'+c.id,torso,cloth,0,0,0,1,1,c.depth/c.chest);
 ellipsoid(body,'trouser-hips',trousers,0,2.62,0,c.hip,.34,c.depth*.95);
 for(const side of [-1,1]){
  const x=side*c.hip*.48;
  const leg=h.geo(c.id+'-trouser-leg',()=>new T.LatheGeometry([[.135+c.limb*.25,.36],[.14+c.limb*.3,.8],[c.limb*1.05,1.6],[c.hip*.47,2.65]].map(p=>new T.Vector2(...p)),40));
  mesh(body,'leg-'+side,leg,trousers,x,0,0,1,1,1.1);
  ellipsoid(body,'shoe-'+side,shoe,x,.18,.12,.21+c.limb*.12,.17,.37);
  box(body,'sole-'+side,shoe,x,.065,.13,.42+c.limb*.2,.055,.66);
  const shoulder=[side*c.shoulder,3.95,0],elbow=[side*(c.shoulder+.16),3.28,.025],wrist=[side*(c.shoulder+.18),2.67,.08];
  if(c.continuousSleeves){
   const path=new T.CatmullRomCurve3([new T.Vector3(...shoulder),new T.Vector3(...elbow),new T.Vector3(...wrist)]);
   const geometry=h.geo(c.id+'-continuous-sleeve-'+side,()=>new T.TubeGeometry(path,24,c.limb*1.12,24,false));
   mesh(body,'continuous-sleeve-'+side,geometry,sleeve,0,0,0);ellipsoid(body,'sleeve-shoulder-'+side,sleeve,...shoulder,c.limb*1.13,c.limb*1.12,c.limb*1.12);
  }else{
  ellipsoid(body,'shoulder-'+side,sleeve,...shoulder,c.limb*1.3,c.limb*1.35,c.limb*1.25);
  ellipsoid(body,'elbow-'+side,sleeve,...elbow,c.limb*1.03,c.limb*1.03,c.limb*1.03);
  capsule(body,'upper-sleeve-'+side,shoulder,elbow,c.limb*1.12,sleeve);capsule(body,'lower-sleeve-'+side,elbow,wrist,c.limb,sleeve);
  }
  capsule(body,'shirt-cuff-'+side,[wrist[0],2.77,wrist[2]],[wrist[0],2.62,wrist[2]],c.limb*.94,shirt);
  const hand=new T.Group();hand.name='hand-'+side;hand.position.set(wrist[0],2.58,.08);hand.rotation.z=side*.055;body.add(hand);
  ellipsoid(hand,'palm',skin,0,-.10,0,.11+c.limb*.1,.17,.065);
  for(let finger=0;finger<4;finger++){
   const fx=(finger-1.5)*.055,length=[.22,.27,.25,.2][finger];
   capsule(hand,'finger-'+finger,[fx,-.2,.015],[fx,-.2-length*.58,.028],.024,skin);
   capsule(hand,'fingertip-'+finger,[fx,-.2-length*.55,.028],[fx,-.2-length,.055],.023,skin);
  }
  capsule(hand,'thumb',[side*.10,-.04,.02],[side*.18,-.19,.1],.035,skin);
 }
 capsule(body,'neck',[0,4.05,0],[0,c.neckTop??4.46,0],c.gender==='man'?.19:.15,skin);
 // Collar and lapels follow each independently shaped torso rather than stretching a shared outfit.
 box(body,'shirt-front',shirt,0,3.91,c.depth*.91,.25,.5,.045);
 for(const side of [-1,1]){
  const shape=new T.Shape();shape.moveTo(side*.02,3.64);shape.lineTo(side*(c.shoulder*.58),4.03);shape.lineTo(side*.18,4.2);shape.lineTo(side*.015,4.03);shape.closePath();
  const lapel=h.geo(c.id+'-lapel-'+side,()=>new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:2}));mesh(body,'lapel-'+side,lapel,cloth,0,0,c.depth*.87);
 }
 for(const y of [3.05,3.34,3.6])ellipsoid(body,'jacket-button-'+y,metal,.055,y,c.depth*.9,.025,.025,.015);
 box(body,'identity-card',shirt,-c.chest*.48,3.62,c.depth+.04,.17,.24,.025);box(body,'card-mark',metal,-c.chest*.48,3.67,c.depth+.06,.1,.045,.008);
 if(c.workwear){for(const side of [-1,1]){box(body,'work-pocket-'+side,cloth,side*c.chest*.5,3.63,c.depth+.025,.32,.28,.035);box(body,'work-pocket-flap-'+side,shirt,side*c.chest*.5,3.78,c.depth+.05,.34,.045,.025);}box(body,'work-belt',shoe,0,2.8,c.depth+.03,c.hip*1.8,.09,.04);}
 const head=new T.Bone();head.name='mixamorigHead';head.position.set(0,4.32,0);body.add(head);
 const faceGeometry=h.geo(c.id+'-face',()=>{const g=new T.SphereGeometry(1,48,40),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<0)p.setX(i,p.getX(i)*(1+(c.jaw-1)*-y));}g.computeVertexNormals();return g;});
 mesh(head,'face-'+c.id,faceGeometry,skin,0,.6,0,c.headWidth,c.headHeight,c.headDepth);
 for(const side of [-1,1]){
  ellipsoid(head,'ear-'+side,skin,side*c.headWidth,.59,-.005,.075,.125,.055);
  ellipsoid(head,'inner-ear-'+side,lip,side*(c.headWidth+.018),.59,.04,.025,.065,.017);
  const eyeX=side*c.headWidth*.43,eyeY=c.id==='arzu'?.66:.68,eyeZ=c.headDepth*.94;
  ellipsoid(head,'eye-white-'+side,eyeWhite,eyeX,eyeY,eyeZ,.081,c.id==='arzu'?.043:.05,.031);
  ellipsoid(head,'iris-'+side,iris,eyeX,eyeY,eyeZ+.029,.031,.036,.009);ellipsoid(head,'pupil-'+side,h.mat('#1d2425'),eyeX,eyeY,eyeZ+.037,.013,.023,.005);
  ellipsoid(head,'eye-glint-'+side,eyeWhite,eyeX-.009,eyeY+.012,eyeZ+.043,.007,.008,.003);
  curve(head,'eyebrow-'+side,[[eyeX-side*.085,.79,eyeZ-.018],[eyeX,.81,eyeZ+.005],[eyeX+side*.085,.785,eyeZ-.018]],c.gender==='man'?.021:.012,hair);
  curve(head,'eyelid-'+side,[[eyeX-.078,eyeY+.005,eyeZ+.012],[eyeX,eyeY+.05,eyeZ+.015],[eyeX+.078,eyeY+.005,eyeZ+.012]],.007,skin);
 }
 ellipsoid(head,'nose-bridge',skin,0,.61,c.headDepth*.93,.058,.14,.065);
 ellipsoid(head,'nose-tip',skin,0,.51,c.headDepth+c.nose*.42,.077,.06,c.nose);
 for(const side of [-1,1])ellipsoid(head,'nostril-'+side,lip,side*.045,.478,c.headDepth+c.nose*.9,.015,.009,.009);
 curve(head,'mouth',[[-c.mouth/2,.36,c.headDepth*.95],[0,.35,c.headDepth+ .012],[c.mouth/2,.36,c.headDepth*.95]],c.gender==='man'?.009:.014,lip);
 curve(head,'lower-lip',[[-c.mouth*.4,.335,c.headDepth*.96],[0,.328,c.headDepth+.008],[c.mouth*.4,.335,c.headDepth*.96]],.008,lip);
 if(c.beard===true){const beard=h.geo('afshin-beard',()=>new T.SphereGeometry(1,48,24,0,Math.PI*2,Math.PI*.55,Math.PI*.45));mesh(head,'beard',beard,hair,0,.6,-.006,c.headWidth*1.015,c.headHeight*1.015,c.headDepth*1.025);}
 if(c.beard==='short'){
  ellipsoid(head,'short-beard-chin',hair,0,.23,.19,c.headWidth*.74,.15,c.headDepth*.51);
  for(const side of [-1,1])curve(head,'short-beard-jaw-'+side,[[side*c.headWidth*.91,.56,.08],[side*c.headWidth*.83,.37,.23],[side*c.headWidth*.45,.23,.35]],.04,hair);
 }
 const cap=h.geo(c.id+'-hair-cap',()=>new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI*.37));mesh(head,'hair-cap',cap,hair,0,.62,-.02,c.headWidth*1.06,c.headHeight*1.08,c.headDepth*1.07);
 if(c.hairStyle==='shoulder')for(const side of [-1,1]){
  ellipsoid(head,'side-hair-'+side,hair,side*c.headWidth*.98,.32,-.07,.13,.49,.23);
  for(let j=0;j<4;j++)curve(head,'hair-strand-'+side+'-'+j,[[side*(c.headWidth+.02),.8,-.02+j*.06],[side*(c.headWidth+.055),.3,-.03+j*.055],[side*(c.headWidth-.015),-.1,.01+j*.04]],.012,h.mat('#4c3830'));
 }
 if(c.hairStyle==='curly-bob')for(let ring=0;ring<3;ring++)for(let i=0;i<13;i++){
  const angle=i*Math.PI*2/13,x=Math.cos(angle)*c.headWidth,z=Math.sin(angle)*c.headDepth;
  if(z>.15&&Math.abs(x)<.28)continue;
  ellipsoid(head,'curl-'+ring+'-'+i,hair,x,.2+ring*.24,z-.045,.11,.15,.115);
 }
 if(c.hairStyle==='short')for(let i=0;i<7;i++)ellipsoid(head,'hair-sweep-'+i,hair,(i-3)*.075,1.08+Math.sin(i*.6)*.025,-.025,.12,.07,.2);
 if(c.hairStyle==='bun'||c.hairStyle==='tied-back'){
  for(const side of [-1,1])ellipsoid(head,'temple-hair-'+side,hair,side*c.headWidth*.94,.82,-.055,.08,.21,.22);
  ellipsoid(head,'tied-hair',hair,0,c.hairStyle==='bun'?.86:.35,-c.headDepth*.9,c.hairStyle==='bun'?.24:.15,c.hairStyle==='bun'?.23:.43,.2);
 }
 if(c.hairStyle==='side-part')for(let i=0;i<8;i++){const tuft=ellipsoid(head,'parted-hair-'+i,hair,(i-3.5)*.075,1.08-Math.abs(i-3)*.008,-.025,.10,.065,.21);tuft.rotation.z=-.2;}
 if(c.glasses){
  const glasses=new T.Group();glasses.name='identity-head-fitted-glasses';head.add(glasses);glasses.position.set(0,.68,c.headDepth+.045);
  const rim=c.glasses==='round'?h.geo('identity-round-rim',()=>new T.TorusGeometry(.1,.008,10,40)):h.geo('identity-square-rim',()=>{const s=new T.Shape();s.moveTo(-.105,-.07);s.lineTo(.105,-.07);s.lineTo(.105,.07);s.lineTo(-.105,.07);s.closePath();const hole=new T.Path();hole.moveTo(-.096,-.06);hole.lineTo(-.096,.06);hole.lineTo(.096,.06);hole.lineTo(.096,-.06);hole.closePath();s.holes.push(hole);return new T.ExtrudeGeometry(s,{depth:.008,bevelEnabled:false});});
  for(const side of [-1,1]){mesh(glasses,'rim-'+side,rim,metal,side*c.headWidth*.43,0,0);capsule(glasses,'temple-'+side,[side*.25,0,0],[side*(c.headWidth-.02),0,-c.headDepth*.85],.008,metal);}
  box(glasses,'bridge',metal,0,.015,0,.07,.014,.016);
 }
 if(c.age>40)for(const side of [-1,1])curve(head,'smile-line-'+side,[[side*.1,.49,c.headDepth*.96],[side*.14,.41,c.headDepth*.94],[side*.135,.36,c.headDepth*.91]],.004,lip);
 if(c.id==='officeNima')head.traverse(o=>{if(o.isMesh&&/^(eye-white|iris|pupil|eye-glint|ear-|inner-ear)/.test(o.name))o.scale.multiplyScalar(.82);});
 body.userData.identity={id:c.id,gender:c.gender,skin:c.skin,shoulder:c.shoulder,waist:c.waist,headWidth:c.headWidth};
 return {root,body,head,headRest:head.rotation.clone(),baseScale:1};
}
