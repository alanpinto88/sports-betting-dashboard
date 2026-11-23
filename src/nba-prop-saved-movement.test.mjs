import test from 'node:test';
import assert from 'node:assert/strict';
import {movementsFromSavedNbaSnapshots} from './nba-prop-saved-movement.mjs';
const now=Date.parse('2026-11-22T20:00:00Z');
const record=(capture,updated,price,line=24.5)=>({capture,events:[{id:'event-1',bookmakers:[{key:'book-a',markets:[{key:'player_points',last_update:updated,outcomes:[{name:'Over',description:'Example Player',point:line,price}]}]}]}]});
test('two saved captures with newer source timestamps produce historical movement',()=>{
 const result=movementsFromSavedNbaSnapshots([
  record('2026-11-22T19:05:00Z','2026-11-22T19:04:00Z',-110),
  record('2026-11-22T19:15:00Z','2026-11-22T19:14:00Z',-120)
 ],now);
 assert.equal(result.length,1);assert.equal(result[0].openingRecordedOdds,-110);
 assert.equal(result[0].latestRecordedOdds,-120);assert.equal(result[0].eligibleForEv,false);
});
test('different thresholds cannot be compared',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00Z','2026-11-22T19:04:00Z',-110),
 record('2026-11-22T19:15:00Z','2026-11-22T19:14:00Z',-120,25.5)
],now),[]));
test('quote updated after capture is excluded',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00Z','2026-11-22T19:06:00Z',-110),
 record('2026-11-22T19:15:00Z','2026-11-22T19:14:00Z',-120)
],now),[]));
test('future capture is excluded',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00Z','2026-11-22T19:04:00Z',-110),
 record('2026-11-22T20:05:00Z','2026-11-22T19:14:00Z',-120)
],now),[]));

test('rejects noncanonical UTC capture timestamps',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00+00:00','2026-11-22T19:04:00Z',-110),
 record('2026-11-22T19:15:00Z','2026-11-22T19:14:00Z',-120)
],now),[]));
test('rejects noncanonical UTC quote timestamps',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00Z','2026-11-22T19:04:00+00:00',-110),
 record('2026-11-22T19:15:00Z','2026-11-22T19:14:00Z',-120)
],now),[]));
test('duplicate capture timestamps do not fabricate movement',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:15:00Z','2026-11-22T19:04:00Z',-110),
 record('2026-11-22T19:15:00Z','2026-11-22T19:14:00Z',-120)
],now),[]));

test('rejects impossible calendar dates even if Date.parse normalizes them',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00Z','2026-11-22T19:04:00Z',-110),
 record('2026-11-31T19:15:00Z','2026-11-22T19:14:00Z',-120)
],Date.parse('2026-12-05T20:00:00Z')),[]));

test('repeated snapshots of the same source quote do not fabricate movement',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00Z','2026-11-22T19:04:00Z',-110),
 record('2026-11-22T19:15:00Z','2026-11-22T19:04:00Z',-110)
],now),[]));
test('conflicting prices at the same bookmaker update timestamp are rejected',()=>assert.deepEqual(movementsFromSavedNbaSnapshots([
 record('2026-11-22T19:05:00Z','2026-11-22T19:04:00Z',-110),
 record('2026-11-22T19:15:00Z','2026-11-22T19:04:00Z',-120),
 record('2026-11-22T19:25:00Z','2026-11-22T19:24:00Z',-125)
],now),[]));

test('unsorted history chooses the latest eight valid captures',()=>{
 const captures=Array.from({length:9},(_,i)=>{
  const minute=String(i+1).padStart(2,'0');
  return record('2026-11-22T19:'+minute+':00Z','2026-11-22T19:'+minute+':00Z',i===0?-150:i===8?-120:-110);
 });
 const result=movementsFromSavedNbaSnapshots(captures.reverse(),now);
 assert.equal(result.length,1);
 assert.equal(result[0].openingRecordedOdds,-110);
 assert.equal(result[0].latestRecordedOdds,-120);
 assert.equal(result[0].observations,8);
});
test('malformed late captures cannot displace valid history',()=>{
 const captures=[
  record('2026-11-22T19:05:00Z','2026-11-22T19:04:00Z',-110),
  record('2026-11-22T19:15:00Z','2026-11-22T19:14:00Z',-120),
  ...Array.from({length:9},(_,i)=>record('not-a-date-'+i,'2026-11-22T19:14:00Z',-130))
 ];
 const result=movementsFromSavedNbaSnapshots(captures,now);
 assert.equal(result.length,1);
 assert.equal(result[0].openingRecordedOdds,-110);
 assert.equal(result[0].latestRecordedOdds,-120);
});

test('duplicate captures cannot displace distinct older captures',()=>{
 const original=record('2026-11-22T19:01:00Z','2026-11-22T19:01:00Z',-110);
 const duplicates=Array.from({length:9},()=>record('2026-11-22T19:02:00Z','2026-11-22T19:02:00Z',-120));
 const result=movementsFromSavedNbaSnapshots([original,...duplicates],now);
 assert.equal(result.length,1);
 assert.equal(result[0].openingRecordedOdds,-110);
 assert.equal(result[0].latestRecordedOdds,-120);
});
