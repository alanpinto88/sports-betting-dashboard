import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeNbaMovement,auditNbaHistory} from '../lib/nba-odds-movement.mjs';
const now=Date.parse('2026-11-22T02:00:00Z');
const q=(captured_at,american_odds,extra={})=>({
 verified:true,player_id:'p1',event_id:'e1',market:'Points',period:'Full game',
 side:'over',line:24.5,american_odds,sportsbook:'bookA',
 source_id:'source-'+captured_at,captured_at,event_starts_at:'2026-11-22T00:00:00Z',...extra
});
test('reports same-book historical movement in probability points',()=>{
 const results=summarizeNbaMovement([q('2026-11-21T20:00:00Z',-110),q('2026-11-21T21:00:00Z',-140)],{now});
 assert.equal(results.length,1);
 assert.equal(results[0].openingOdds,-110);
 assert.equal(results[0].latestOdds,-140);
 assert.equal(results[0].significant,true);
});
test('never compares different lines, books, games or sides',()=>{
 const base=q('2026-11-21T20:00:00Z',-110);
 const variations=[{line:25.5},{sportsbook:'bookB'},{event_id:'e2'},{side:'under'}];
 for(const variation of variations){
  assert.equal(summarizeNbaMovement([base,q('2026-11-21T21:00:00Z',-140,variation)],{now}).length,0);
 }
});
test('rejects unverified, future, invalid and single-point movement',()=>{
 const base=q('2026-11-21T20:00:00Z',-110);
 for(const variation of [{verified:false},{source_id:null},{american_odds:-90},{captured_at:'2026-11-23T20:00:00Z'}]){
  assert.equal(summarizeNbaMovement([base,q('2026-11-21T21:00:00Z',-140,variation)],{now}).length,0);
 }
 assert.equal(summarizeNbaMovement([base],{now}).length,0);
});

test('rejects conflicting odds at identical capture timestamps',()=>{
 const a=q('2026-11-21T20:00:00Z',-110);
 const b=q('2026-11-21T20:00:00Z',-130,{source_id:'different'});
 const c=q('2026-11-21T21:00:00Z',-140);
 assert.equal(summarizeNbaMovement([a,b,c],{now}).length,0);
});

test('excludes quotes at or after provided event start',()=>{
 const a=q('2026-11-21T20:00:00Z',-110,{event_starts_at:'2026-11-21T20:30:00Z'});
 const b=q('2026-11-21T21:00:00Z',-140,{event_starts_at:'2026-11-21T20:30:00Z'});
 assert.equal(summarizeNbaMovement([a,b],{now}).length,0);
});

test('rejects missing, malformed, and post-start event timestamps',()=>{
 const a=q('2026-11-21T20:00:00Z',-110);
 for(const event_starts_at of [undefined,'not-a-date','2026-11-21T20:00:00Z']){
  const b=q('2026-11-21T21:00:00Z',-140,{event_starts_at});
  assert.equal(summarizeNbaMovement([a,b],{now}).length,0);
 }
});

test('rejects contradictory game start times within the same market',()=>{
 const a=q('2026-11-21T20:00:00Z',-110,{event_starts_at:'2026-11-22T00:00:00Z'});
 const b=q('2026-11-21T21:00:00Z',-140,{event_starts_at:'2026-11-22T01:00:00Z'});
 assert.equal(summarizeNbaMovement([a,b],{now}).length,0);
});

test('rejects reused source IDs across different historical captures',()=>{
 const a=q('2026-11-21T20:00:00Z',-110,{source_id:'same-source'});
 const b=q('2026-11-21T21:00:00Z',-140,{source_id:'same-source'});
 assert.equal(summarizeNbaMovement([a,b],{now}).length,0);
});

test('audits eligible and rejected NBA historical quote records',()=>{
 const records=[
  q('2026-11-21T20:00:00Z',-110),
  q('2026-11-21T20:00:00Z',-110,{verified:false}),
  q('2026-11-21T20:00:00Z',-110,{event_starts_at:undefined}),
  q('2026-11-21T20:00:00Z',-110,{event_starts_at:'2026-11-21T19:00:00Z'}),
  q('2026-11-21T20:00:00Z',-90),
  q('2026-11-23T20:00:00Z',-110)
 ];
 assert.deepEqual(auditNbaHistory(records,{now}),{
  total:6,eligible:1,unverified:1,invalidCapture:1,
  missingEventStart:1,notPregame:1,invalidQuote:1
 });
});
