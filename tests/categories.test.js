import test from 'node:test';
import assert from 'node:assert/strict';
import {categoryGroups,packagePreset,subcategories} from '../categories.js';
test('all presets are complete, positive and independent copies',()=>{for(const g of categoryGroups){const items=subcategories(g.id);assert.equal(new Set(items.map(i=>i.id)).size,items.length);for(const i of items){const p=packagePreset(g.id,i.id);if(i.id==='custom'){assert.equal(p,null);continue;}assert.equal(p.length,4);assert.ok(p.every(v=>Number.isFinite(v)&&v>0));p[0]=999;assert.notEqual(packagePreset(g.id,i.id)[0],999);}}});
test('group switch cannot reuse another group subcategory',()=>{assert.throws(()=>packagePreset('tech','sneakers'));assert.deepEqual(packagePreset('sport','sneakers'),[1.2,35,25,15]);assert.deepEqual(packagePreset('outdoor','tent'),[3,55,20,20]);});
