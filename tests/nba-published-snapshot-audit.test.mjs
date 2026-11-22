import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSnapshot} from '../scripts/audit-nba-snapshot.mjs';

const fixture=()=>({
 source:'The Odds API',sport:'basketball_nba',captured_at:'2026-11-21T20:00:00Z',
 events:[{id:'event-1',bookmakers:[{key:'book-a',markets:[{
  key:'player_points',last_update:'2026-11-21T19:59:00Z',
  outcomes:[
   {name:'Over',description:'Example Player',price:-110,point:20.5},
   {name:'Under',description:'Example Player',price:-110,point:20.5}
  ]
 }]}]}]
});
test('research snapshot never claims verified player quotes or EV picks',()=>{
 const result=auditSnapshot(fixture());
 assert.equal(result.status,'research_only');
 assert.equal(result.verifiedPlayerQuotes,0);
 assert.equal(result.verifiedEVPicks,0);
 assert.equal(result.identityUnverified,2);
 assert.equal(result.pairedMarkets,1);
});
test('detects player names repeated across distinct events without resolving identity',()=>{
 const sample=fixture();
 sample.events.push({...structuredClone(sample.events[0]),id:'event-2'});
 const result=auditSnapshot(sample);
 assert.equal(result.playersAcrossMultipleEvents,1);
 assert.equal(result.identityUnverified,4);
});
test('reports invalid odds and thresholds',()=>{
 const sample=fixture();
 sample.events[0].bookmakers[0].markets[0].outcomes[0].price=0;
 sample.events[0].bookmakers[0].markets[0].outcomes[1].point=-2;
 const result=auditSnapshot(sample);
 assert.equal(result.invalidPrices,1);
 assert.equal(result.invalidThresholds,1);
});
test('reports outdated market quotes',()=>{
 const sample=fixture();
 sample.events[0].bookmakers[0].markets[0].last_update='2026-11-21T19:00:00Z';
 assert.equal(auditSnapshot(sample).staleOrUndatedMarkets,1);
});
test('rejects unrelated provider schema',()=>{
 const sample=fixture();
 sample.source='unknown';
 assert.throws(()=>auditSnapshot(sample),/Unexpected snapshot schema/);
});
