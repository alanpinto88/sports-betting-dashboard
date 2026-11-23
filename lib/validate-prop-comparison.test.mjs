import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePropComparison } from './validate-prop-comparison.mjs';

const now = Date.parse('2026-11-22T20:00:00Z');
const base = {
  eventId:'nba-123', playerId:'nba-player-456', market:'points',
  period:'full-game', side:'over', line:24.5,
  capturedAt:'2026-11-22T19:59:30Z', source:'book-a', quoteId:'q1'
};
const pair = () => [{...base},{...base,source:'book-b',quoteId:'q2'}];
test('accepts identical fresh independent quotes',()=>{
  const [a,b]=pair();
  assert.deepEqual(validatePropComparison(a,b,{now}),{verified:true,errors:[]});
});
for (const field of ['eventId','playerId','market','period','side','line']) {
  test('rejects mismatch: '+field,()=>{
    const [a,b]=pair(); b[field]=field==='line'?25.5:'different';
    assert.equal(validatePropComparison(a,b,{now}).verified,false);
  });
}
test('rejects stale timestamps',()=>{
  const [a,b]=pair();b.capturedAt='2026-11-22T19:50:00Z';
  assert.equal(validatePropComparison(a,b,{now}).verified,false);
});
test('rejects future timestamps',()=>{
  const [a,b]=pair();b.capturedAt='2026-11-22T20:00:01Z';
  assert.equal(validatePropComparison(a,b,{now}).verified,false);
});
test('rejects absent quote ID',()=>{
  const [a,b]=pair();delete b.quoteId;
  assert.equal(validatePropComparison(a,b,{now}).verified,false);
});
test('rejects same source',()=>{
  const [a,b]=pair();b.source=a.source;
  assert.equal(validatePropComparison(a,b,{now}).verified,false);
});
test('rejects missing quotes',()=>{
  assert.equal(validatePropComparison(null,null,{now}).verified,false);
});

test('rejects invalid validation clock',()=>{
  const [a,b]=pair();
  assert.equal(validatePropComparison(a,b,{now:NaN}).verified,false);
});
test('rejects noncanonical timestamps',()=>{
  const [a,b]=pair();b.capturedAt='2026-11-22T19:59:30+00:00';
  assert.equal(validatePropComparison(a,b,{now}).verified,false);
});
test('rejects invalid maximum age',()=>{
  const [a,b]=pair();
  assert.equal(validatePropComparison(a,b,{now,maxAgeMs:0}).verified,false);
});
