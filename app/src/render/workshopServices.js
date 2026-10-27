import * as T from '../../vendor/three.module.js';

export function buildWorkshopServices(parent,h,m,{repair=false}={}){
 const wallX=repair?-31.5:-62.5,x=wallX+.3,level=repair?15:16,start=repair?37:43,end=-20,branches=[start,repair?18:6,end];
 const group=new T.Group();group.name='workshop-electrical-services';parent.add(group);
 const unit=h.geo('workshop-service-box',()=>new T.BoxGeometry(1,1,1));
 function box(name,px,y,z,w,ht,d,material=m.steel){const o=new T.Mesh(unit,material);o.name=name;o.position.set(px,y,z);o.scale.set(w,ht,d);o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 function pipe(name,a,b,r=.10){const path=new T.LineCurve3(new T.Vector3(...a),new T.Vector3(...b)),o=new T.Mesh(h.geo(name+':'+JSON.stringify([a,b]),()=>new T.TubeGeometry(path,1,r,20,false)),m.silver);o.name=name;group.add(o);o.castShadow=true;return o;}
 function clamp(y,z,vertical=false){
  box('service-wall-bracket',wallX+.07,y,z,.14,.55,.55,m.steel);box('service-clamp-standoff',wallX+.18,y,z,.26,.15,.15,m.silver);
  const o=new T.Mesh(h.geo('service-clamp-ring',()=>new T.TorusGeometry(.14,.032,10,28)),m.steel);o.name='service-pipe-clamp';o.position.set(x,y,z);if(vertical)o.rotation.x=Math.PI/2;group.add(o);
 }
 pipe('service-trunk',[x,level,start-.45],[x,level,end+.45]);
 for(const z of branches){
  box('service-junction-'+z,x,level,z,.6,.9,.9,m.steel);
  const cabinet=box('service-cabinet-'+z,x,5.8,z,.6,2.6,2.2,m.panel);
  box('service-cabinet-mount-'+z,wallX+.045,5.8,z,.09,2.85,2.45,m.steel);
  box('service-cabinet-handle',wallX+.67,5.35,z,.16,.5,.09,m.dark);
  pipe('service-branch-'+z,[x,7.1,z],[x,level-.45,z]);
  for(const y of [9,12,14])if(y<level-.6)clamp(y,z,true);
  if(h.archiveText){const label=new T.Mesh(h.geo('workshop-service-label',()=>new T.PlaneGeometry(1.8,.55)),h.archiveText('توزیع برق'));label.name='service-cabinet-label';label.position.set(wallX+.608,6.2,z);label.rotation.y=Math.PI/2;group.add(label);}
  cabinet.userData.service='electrical-distribution';
 }
 for(let z=end+4;z<start-2;z+=9)clamp(level,z);
 return group;
}
