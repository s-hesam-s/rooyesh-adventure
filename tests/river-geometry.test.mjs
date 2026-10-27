import test from 'node:test';
import assert from 'node:assert/strict';
import {stripGeometry,riverCenter,riverHalfWidth} from '../app/src/render/riverScene.js';
test('river shore surfaces face upward on both sides of the channel',()=>{for(const side of [-1,1]){const g=stripGeometry(16,4,(t,u)=>[t*180-90,-.7+u*.6,riverCenter(t*180-90)+side*(riverHalfWidth(t*180-90)+u*3)]);const normals=g.attributes.normal;for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>.8);g.dispose();}});
test('the channel stays beneath the bridge deck at the crossing',()=>{for(let x=-5.5;x<=5.5;x+=.5){assert.ok(riverCenter(x)-riverHalfWidth(x)>18.7);assert.ok(riverCenter(x)+riverHalfWidth(x)<27.8);}});