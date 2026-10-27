import test from 'node:test';
import assert from 'node:assert/strict';
import {roadHalfWidth,roadRibbonGeometry} from '../app/src/render/roadSurface.js';
test('irregular road edges preserve the full walkable corridor',()=>{for(let x=-64;x<64;x+=.7)for(let z=-45;z<45;z+=1.1)assert.ok(roadHalfWidth(x,z)>4.4);});
test('road ribbons face upward and use finite world aligned UVs in every direction',()=>{for(const end of [{x:20,z:0},{x:-20,z:0},{x:0,z:20},{x:0,z:-20},{x:12,z:17}]){const g=roadRibbonGeometry({x:0,z:0},end);for(let i=0;i<g.attributes.normal.count;i++)assert.ok(g.attributes.normal.getY(i)>.99);for(const v of g.attributes.uv.array)assert.ok(Number.isFinite(v));g.dispose();}});
import {nodes} from '../app/src/content/story.js';
import {layoutFor,walkable} from '../app/src/game/world.js';
import {roadSegments,roadSample,createRoadGeometry,roadGravel} from '../app/src/render/roadSurface.js';
test('continuous road leaves the entire walkable corridor opaque',()=>{
 for(const node of Object.values(nodes)){const layout=layoutFor(node),segments=roadSegments(layout);for(let x=100;x<1200;x+=13)for(let y=100;y<850;y+=13){if(!walkable({x,y},layout,10))continue;const p=roadSample(x*.1-64,y*.1-45,segments);assert.ok(p.alpha>.99);assert.ok(p.height>0&&p.height<.12);}}
});
test('continuous road uses compact upward geometry and bounded vertex material channels',()=>{
 for(const id of ['c-entrance','c-allocation','m-entrance']){const g=createRoadGeometry(layoutFor(nodes[id]));assert.ok(g.index.count/3<40000);for(let i=0;i<g.attributes.position.count;i++){assert.ok(g.attributes.normal.getY(i)>.95);assert.ok(g.attributes.roadDamp.getX(i)>=0&&g.attributes.roadDamp.getX(i)<=1);for(let c=0;c<4;c++)assert.ok(g.attributes.color.array[i*4+c]>=0&&g.attributes.color.array[i*4+c]<=1);}for(const index of g.index.array)assert.ok(index<g.attributes.position.count);g.dispose();}
});
test('gravel is deterministic, bounded and follows the raised road surface',()=>{
 const layout=layoutFor(nodes['c-allocation']),segments=roadSegments(layout),points=roadGravel(layout);assert.deepEqual(points,roadGravel(layout));assert.ok(points.length>400&&points.length<=800);for(const p of points){const road=roadSample(p.x,p.z,segments);assert.ok(road.alpha>=.04);assert.ok(Math.abs(p.y-road.height-.018)<1e-8);assert.ok(p.scale>=.035&&p.scale<.15);}
});