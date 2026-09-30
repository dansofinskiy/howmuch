import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate, operationalFee} from '../calculator.js';
const input={price:100,currency:'USD',weight:1,exchange:2.7};
test('converts currencies and compares base shipping',()=>{const r=calculate(input);assert.equal(r[0].total,297);assert.equal(r[1].shipping,26.19);assert.equal(r[2].shipping,26.865);});
test('volume changes USA2Georgia only',()=>{const r=calculate({...input,dimensions:[60,40,30]});assert.equal(r[0].billedWeight,1);assert.equal(r[1].billedWeight,1);assert.equal(r[2].billedWeight,12);});
test('GEL price and extra expenses are not converted',()=>{assert.equal(calculate({...input,currency:'GEL',extra:10})[0].total,137);});
test('rejects invalid values and partial dimensions',()=>{for(const change of [{weight:0},{exchange:0},{price:NaN},{dimensions:[10]},{dimensions:[-1,2,3]},{rates:[0,1,2]}])assert.throws(()=>calculate({...input,...change}));});
test('$150 sneakers include VAT on full product plus shipping',()=>{const r=calculate({...input,price:150})[0];assert.equal(r.taxBase,432);assert.equal(r.vat,77.76);assert.equal(r.total,544.76);});
test('300 GEL and 30 kg are inclusive exemption limits',()=>{assert.equal(calculate({...input,price:300,currency:'GEL',weight:30})[0].vat,0);assert.ok(calculate({...input,price:300.01,currency:'GEL'})[0].vat>0);assert.ok(calculate({...input,weight:30.001})[0].vat>0);});
test('volumetric weight does not trigger actual weight threshold',()=>{assert.equal(calculate({...input,dimensions:[100,100,100]})[2].vat,0);});
test('tax uses customs exchange separately from payment exchange',()=>{const r=calculate({...input,customsExchange:3.1})[0];assert.equal(r.product,270);assert.equal(r.taxBase,337);assert.equal(r.vat,60.66);});
test('origin delivery is taxable, miscellaneous expenses are not',()=>{const r=calculate({...input,price:150,originShipping:10,extra:20})[0];assert.equal(r.taxBase,442);assert.equal(r.vat,79.56);assert.equal(r.total,576.56);});
test('forced VAT and invalid tax inputs',()=>{assert.equal(calculate({...input,taxMode:'taxable'})[0].vat,53.46);for(const change of [{customsExchange:0},{originShipping:-1},{taxMode:'invalid'}])assert.throws(()=>calculate({...input,...change}));});

test('clearance charges apply only when taxable, outside VAT base',()=>{const free=calculate(input);assert.ok(free.every(r=>r.customsCharge===0 && r.clearanceCharge===0 && !r.clearanceUnknown));const rows=calculate({...input,price:150});assert.equal(rows[0].customsCharge,20);assert.equal(rows[0].clearanceCharge,15);assert.equal(rows[0].vat,77.76);assert.equal(rows[1].clearanceCharge,10);assert.equal(rows[2].clearanceCharge,16);assert.ok(rows.every(r=>!r.clearanceUnknown));});
test('custom fees including explicit zero are respected',()=>{const rows=calculate({...input,price:150,customsFee:25,clearanceFees:[0,10,12]});assert.equal(rows[0].total,534.76);assert.equal(rows[1].clearanceCharge,10);assert.equal(rows[2].clearanceCharge,12);assert.ok(rows.every(r=>!r.clearanceUnknown));});
test('invalid fees are rejected',()=>{for(const change of [{customsFee:-1},{customsFee:NaN},{clearanceFees:[1,-1,0]},{clearanceFees:[1,2]},{clearanceFees:[1,Infinity,0]}])assert.throws(()=>calculate({...input,...change}));});

test("cleared fee input remains unknown rather than free",()=>{const rows=calculate({...input,price:150,clearanceFees:[15,null,null]});assert.equal(rows[1].clearanceUnknown,true);assert.equal(rows[2].clearanceUnknown,true);});

test('operational fee covers all bands and shared boundaries',()=>{
 for(const [value,fee] of [[0,1],[99.99,1],[100,2],[199.99,2],[200,3],[299.99,3],[300,6],[405,8.1],[2999.99,60],[3000,120],[9999.99,400],[10000,800],[19999.99,1600],[20000,2400]]) assert.equal(operationalFee(value),fee);
});
test('operational fee applies only to U2G even below customs threshold',()=>{
 const rows=calculate(input);assert.equal(rows[0].operationalCharge,0);assert.equal(rows[1].operationalCharge,0);assert.equal(rows[2].operationalCharge,3);assert.equal(rows[2].vat,0);assert.ok(Math.abs(rows[2].total-299.865)<1e-9);
 const taxed=calculate({...input,price:150})[2];assert.equal(taxed.operationalCharge,8.1);assert.equal(taxed.vat,77.74);assert.ok(Math.abs(taxed.total-553.705)<1e-9);
});
test('operational fee uses product value, excluding shipping and extra expenses',()=>{
 const row=calculate({...input,price:150,customsExchange:3,extra:100,originShipping:50})[2];assert.equal(row.operationalCharge,8.1);
 assert.equal(calculate({...input,price:405,currency:'GEL'})[2].operationalCharge,8.1);
});
test('payment stages sum to total and place all fees in later payment',()=>{for(const row of calculate({...input,price:150,originShipping:12,extra:7})){assert.equal(row.payNow,417);assert.equal(row.payLater,row.shipping+row.vat+row.customsCharge+row.clearanceCharge+row.operationalCharge+7);assert.equal(row.total,row.payNow+row.payLater);}});
