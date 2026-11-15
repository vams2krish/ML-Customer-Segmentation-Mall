import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {fit,parseCustomers,fields} from '../src/model.js';

const csv=readFileSync(new URL('../archive/Mall_Customers.csv',import.meta.url),'utf8');
const rows=parseCustomers(csv);
test('every supported fit partitions the dataset and reports actual group means',()=>{
  assert.equal(rows.length,200);
  for(let k=2;k<=8;k++){
    const m=fit(rows,k);
    assert.equal(m.segments.length,k);
    assert.equal(m.segments.reduce((s,g)=>s+g.count,0),200);
    for(const g of m.segments){
      const group=m.customers.filter(r=>r.segment===g.i);
      assert.ok(group.length>0);
      for(const f of fields) assert.ok(Math.abs(group.reduce((s,r)=>s+r[f],0)/g.count-g.center[f])<1e-8);
    }
    for(const r of m.customers) assert.equal(m.predict(r).i,r.segment);
  }
});
test('fit is repeatable and insensitive to identifier changes',()=>{
  const m=fit(rows,5);
  assert.deepEqual(m.segments,fit(rows.map((r,i)=>({...r,id:'new-'+i})),5).segments);
  assert.equal(m.predict(m.segments[0].center).i,0);
});
test('rejects missing features, invalid counts, and nonfinite predictions',()=>{
  assert.throws(()=>parseCustomers(csv.split(/\r?\n/)[0]+'\n1,Female,,30,50'));
  assert.throws(()=>fit(rows,1));
  assert.throws(()=>fit(rows,2.5));
  assert.throws(()=>fit(rows,5).predict({age:NaN,income:10,score:20}));
});
