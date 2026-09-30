import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRate, fetchRate} from '../exchange.js';
const valid={date:'2026-09-30',base:'USD',quote:'GEL',rate:2.6022};
test('accepts USD/GEL rate with its date',()=>assert.deepEqual(parseRate(valid),{rate:2.6022,date:'2026-09-30'}));
test('rejects wrong pair and malformed responses',()=>{for(const data of [null,{}, {...valid,base:'GEL'}, {...valid,rate:0},{...valid,rate:'2.6'},{...valid,date:'invalid'}])assert.throws(()=>parseRate(data));});
test('handles service errors and valid fetch response',async()=>{await assert.rejects(fetchRate(async()=>({ok:false})));assert.deepEqual(await fetchRate(async()=>({ok:true,json:async()=>valid})),{rate:2.6022,date:'2026-09-30'});});
