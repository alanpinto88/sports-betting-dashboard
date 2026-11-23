import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalNbaPriceMovements,historicalNbaMovementsFromSnapshot,americanImpliedProbability} from './nba-prop-historical-movement.mjs';
const base={eventId:'e1',playerLabel:'Example Player',market:'player_points',period:'unverified',provider:'book-a',side:'over',line:24.5,americanOdds:-110,capturedAt:'2026-11-22T19:00:00Z',timestampSource:'market',status:'RESEARCH_ONLY',eligibleForEv:false};
const q=(change={})=>({...base,...change});
test('probability conversion handles positive and negative prices',()=>{assert.equal(americanImpliedProbability(100),.5);assert.equal(americanImpliedProbability(-100),.5);assert.equal(americanImpliedProbability(-90),null)});
test('two ordered records produce historical change only',()=>{
 const result=historicalNbaPriceMovements([q({capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120}),q()]);
 assert.equal(result.length,1);assert.equal(result[0].openingRecordedOdds,-110);assert.equal(result[0].latestRecordedOdds,-120);
 assert.equal(result[0].eligibleForEv,false);assert.equal(result[0].sharpMoneyVerified,false);
});
for(const [name,change] of [['line',{line:25.5}],['event',{eventId:'e2'}],['player',{playerLabel:'Other'}],['market',{market:'player_assists'}],['period',{period:'first-half'}],['book',{provider:'book-b'}],['side',{side:'under'}]]){
 test('never merges different '+name,()=>assert.deepEqual(historicalNbaPriceMovements([q(),q({...change,capturedAt:'2026-11-22T19:05:00Z'})]),[]));
}
test('same-time conflicting prices are excluded',()=>assert.deepEqual(historicalNbaPriceMovements([q(),q({americanOdds:-120}),q({capturedAt:'2026-11-22T19:05:00Z'})]),[]));
test('rejects noncanonical time',()=>assert.deepEqual(historicalNbaPriceMovements([q(),q({capturedAt:'2026-11-22T19:05:00+00:00'})]),[]));
test('rejects EV eligible quotes',()=>assert.deepEqual(historicalNbaPriceMovements([q(),q({capturedAt:'2026-11-22T19:05:00Z',eligibleForEv:true})]),[]));

test('unchanged recorded odds are not reported as price movement',()=>{
 assert.deepEqual(historicalNbaPriceMovements([q(),q({capturedAt:'2026-11-22T19:05:00Z'})]),[]);
});
test('round-trip price returning to original is not an endpoint movement',()=>{
 assert.deepEqual(historicalNbaPriceMovements([q(),q({capturedAt:'2026-11-22T19:03:00Z',americanOdds:-120}),q({capturedAt:'2026-11-22T19:05:00Z'})]),[]);
});

test('snapshot chronology gate accepts valid historical quotes only',()=>{
 const rows=[q(),q({capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})];
 const result=historicalNbaMovementsFromSnapshot(rows,'2026-11-22T19:06:00Z',Date.parse('2026-11-22T20:00:00Z'));
 assert.equal(result.length,1);
 assert.equal(result[0].latestRecordedOdds,-120);
 assert.equal(result[0].eligibleForEv,false);
});
test('snapshot chronology gate rejects missing or future snapshot time',()=>{
 const rows=[q(),q({capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})];
 const now=Date.parse('2026-11-22T20:00:00Z');
 assert.deepEqual(historicalNbaMovementsFromSnapshot(rows,null,now),[]);
 assert.deepEqual(historicalNbaMovementsFromSnapshot(rows,'2026-11-22T20:01:00Z',now),[]);
});
test('snapshot chronology gate rejects quotes updated after snapshot capture',()=>{
 const rows=[q(),q({capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})];
 assert.deepEqual(historicalNbaMovementsFromSnapshot(rows,'2026-11-22T19:02:00Z',Date.parse('2026-11-22T20:00:00Z')),[]);
});
test('snapshot chronology gate rejects future source updates',()=>{
 const rows=[q(),q({capturedAt:'2026-11-22T20:01:00Z',americanOdds:-120})];
 assert.deepEqual(historicalNbaMovementsFromSnapshot(rows,'2026-11-22T20:02:00Z',Date.parse('2026-11-22T20:00:00Z')),[]);
});

test('historical price movement reports signed implied probability points',()=>{
 const result=historicalNbaPriceMovements([
  q({americanOdds:-110,capturedAt:'2026-11-22T19:00:00Z'}),
  q({americanOdds:-120,capturedAt:'2026-11-22T19:05:00Z'})
 ]);
 assert.equal(result.length,1);
 assert.equal(result[0].impliedProbabilityChangePoints,2.16);
 assert.equal(result[0].firstCapturedAt,'2026-11-22T19:00:00Z');
 assert.equal(result[0].lastCapturedAt,'2026-11-22T19:05:00Z');
});
test('reverse price movement retains negative sign',()=>{
 const result=historicalNbaPriceMovements([
  q({americanOdds:-120,capturedAt:'2026-11-22T19:00:00Z'}),
  q({americanOdds:-110,capturedAt:'2026-11-22T19:05:00Z'})
 ]);
 assert.equal(result[0].impliedProbabilityChangePoints,-2.16);
});
test('invalid quote dates cannot create historical movement',()=>{
 const result=historicalNbaPriceMovements([
  q(),
  q({capturedAt:'2026-11-31T19:05:00Z',americanOdds:-120})
 ]);
 assert.deepEqual(result,[]);
});

test('movement series preserves its exact period and does not authenticate sharp money',()=>{
 const result=historicalNbaPriceMovements([
  q({period:'first-half'}),
  q({period:'first-half',capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})
 ]);
 assert.equal(result.length,1);
 assert.equal(result[0].period,'first-half');
 assert.equal(result[0].sharpMoneyVerified,false);
 assert.equal(result[0].status,'HISTORICAL_RESEARCH');
});

test('historical movement matches whitespace-normalized source identifiers',()=>{
 const result=historicalNbaPriceMovements([
  q({eventId:' e1 ',market:' player_points ',period:' unverified ',provider:' book-a '}),
  q({capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})
 ]);
 assert.equal(result.length,1);
 assert.equal(result[0].openingRecordedOdds,-110);
 assert.equal(result[0].latestRecordedOdds,-120);
 assert.equal(result[0].eligibleForEv,false);
 assert.equal(result[0].eventId,'e1');
 assert.equal(result[0].market,'player_points');
 assert.equal(result[0].period,'unverified');
 assert.equal(result[0].provider,'book-a');
});

test('loaded snapshot movement rejects bookmaker-wide timestamp fallbacks',()=>{
 const rows=[
  q({timestampSource:'bookmaker'}),
  q({capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120,timestampSource:'bookmaker'})
 ];
 assert.deepEqual(historicalNbaMovementsFromSnapshot(rows,'2026-11-22T19:06:00Z',Date.parse('2026-11-22T20:00:00Z')),[]);
});
test('loaded snapshot movement requires market provenance for both endpoints',()=>{
 const rows=[
  q({timestampSource:'market'}),
  q({capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120,timestampSource:'bookmaker'})
 ];
 assert.deepEqual(historicalNbaMovementsFromSnapshot(rows,'2026-11-22T19:06:00Z',Date.parse('2026-11-22T20:00:00Z')),[]);
});

test('core historical calculator rejects bookmaker-wide timestamp provenance',()=>{
 const rows=[q({timestampSource:'bookmaker'}),q({timestampSource:'bookmaker',capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})];
 assert.deepEqual(historicalNbaPriceMovements(rows),[]);
});
test('core historical calculator cannot mix market and bookmaker timestamps into movement',()=>{
 const rows=[q(),q({timestampSource:'bookmaker',capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})];
 assert.deepEqual(historicalNbaPriceMovements(rows),[]);
});
test('core historical calculator rejects absent timestamp provenance',()=>{
 const rows=[q({timestampSource:undefined}),q({timestampSource:undefined,capturedAt:'2026-11-22T19:05:00Z',americanOdds:-120})];
 assert.deepEqual(historicalNbaPriceMovements(rows),[]);
});
