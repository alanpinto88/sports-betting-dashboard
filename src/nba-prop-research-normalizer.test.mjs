import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNbaPropOutcomes} from './nba-prop-research-normalizer.mjs';
const snapshot={events:[{id:'event-1',bookmakers:[{key:'book-a',last_update:'2026-11-22T20:00:00Z',markets:[{key:'player_points',outcomes:[
{name:'Over',description:'Example Player',point:24.5,price:-110,source_record_id:'r1'},
{name:'Under',description:'Example Player',point:24.5,price:-110,source_record_id:'r2'}
]}]}]}]};
test('normalizes two research-only sides without granting trust',()=>{
 const rows=normalizeNbaPropOutcomes(snapshot);
 assert.equal(rows.length,2);
 assert.equal(rows[0].playerId,null);
 assert.equal(rows[0].providerVerified,false);
 assert.equal(rows[0].eligibleForEv,false);
 assert.equal(rows[0].status,'RESEARCH_ONLY');
 assert.equal(rows[0].market,'player_points');
 assert.equal(rows[1].side,'under');
});
test('ignores invalid input',()=>assert.deepEqual(normalizeNbaPropOutcomes({events:null}),[]));
test('rejects invalid odds and missing player label',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].outcomes[0].price=-90;
 altered.events[0].bookmakers[0].markets[0].outcomes[1].description='';
 assert.deepEqual(normalizeNbaPropOutcomes(altered),[]);
});
test('does not mutate source snapshot',()=>{
 const original=JSON.stringify(snapshot);
 normalizeNbaPropOutcomes(snapshot);
 assert.equal(JSON.stringify(snapshot),original);
});

test('rejects object-valued player identity instead of inventing object string',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].outcomes[0].description={name:'Example Player'};
 altered.events[0].bookmakers[0].markets[0].outcomes[1].description=['Example Player'];
 assert.deepEqual(normalizeNbaPropOutcomes(altered),[]);
});

test('rejects non-string event, sportsbook and market identifiers',()=>{
 for(const field of ['event','book','market']){
  const altered=structuredClone(snapshot);
  if(field==='event')altered.events[0].id={id:'event-1'};
  if(field==='book')altered.events[0].bookmakers[0].key=['book-a'];
  if(field==='market')altered.events[0].bookmakers[0].markets[0].key={name:'player_points'};
  assert.deepEqual(normalizeNbaPropOutcomes(altered),[],field);
 }
});

test('accepts trimmed case-insensitive over and under labels',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].outcomes[0].name=' OVER ';
 altered.events[0].bookmakers[0].markets[0].outcomes[1].name=' under ';
 assert.deepEqual(normalizeNbaPropOutcomes(altered).map(q=>q.side),['over','under']);
});
test('rejects non-string betting side labels',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].outcomes[0].name=['Over'];
 altered.events[0].bookmakers[0].markets[0].outcomes[1].name={value:'Under'};
 assert.deepEqual(normalizeNbaPropOutcomes(altered),[]);
});
test('blank source record identifiers are not treated as verified IDs',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].outcomes[0].source_record_id='   ';
 const rows=normalizeNbaPropOutcomes(altered);
 assert.equal(rows[0].sourceRecordId,null);
 assert.equal(rows[0].providerVerified,false);
});

test('blank explicit player description cannot silently fall back to another identity',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].outcomes[0].description=' ';
 altered.events[0].bookmakers[0].markets[0].outcomes[0].player='Different Player';
 const rows=normalizeNbaPropOutcomes(altered);
 assert.equal(rows.length,1);
 assert.equal(rows[0].side,'under');
});

test('normalizes whitespace around event, sportsbook and market identifiers',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].id=' event-1 ';
 altered.events[0].bookmakers[0].key=' book-a ';
 altered.events[0].bookmakers[0].markets[0].key='player_points ';
 const [row]=normalizeNbaPropOutcomes(altered);
 assert.equal(row.eventId,'event-1');
 assert.equal(row.provider,'book-a');
 assert.equal(row.market,'player_points');
 assert.equal(row.eligibleForEv,false);
});

test('leading and trailing market whitespace is normalized before player market filtering',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].key='  player_points  ';
 const rows=normalizeNbaPropOutcomes(altered);
 assert.equal(rows.length,2);
 assert.equal(rows[0].market,'player_points');
 assert.equal(rows[0].eligibleForEv,false);
});
test('non-player markets stay excluded after whitespace normalization',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].key='  totals  ';
 assert.deepEqual(normalizeNbaPropOutcomes(altered),[]);
});

test('incomplete and malformed player market keys are excluded',()=>{
 for(const key of ['player_','player_ ','player_points extra','player_points/other','player_points_','player__points','player_🏀']){
  const altered=structuredClone(snapshot);
  altered.events[0].bookmakers[0].markets[0].key=key;
  assert.deepEqual(normalizeNbaPropOutcomes(altered),[],key);
 }
});
test('valid underscore-separated player market key remains research-only',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].key=' player_threes_made ';
 const rows=normalizeNbaPropOutcomes(altered);
 assert.equal(rows.length,2);
 assert.equal(rows[0].market,'player_threes_made');
 assert.equal(rows[0].eligibleForEv,false);
});

test('missing market timestamp uses the bookmaker timestamp without verification',()=>{
 const [row]=normalizeNbaPropOutcomes(snapshot);
 assert.equal(row.capturedAt,'2026-11-22T20:00:00Z');
 assert.equal(row.eligibleForEv,false);
});
test('explicit malformed market timestamp cannot fall back to a valid bookmaker time',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].last_update='not-a-date';
 const [row]=normalizeNbaPropOutcomes(altered);
 assert.equal(row.capturedAt,'not-a-date');
 assert.equal(row.eligibleForEv,false);
});
test('blank or non-string market timestamp stays missing rather than borrowing bookmaker time',()=>{
 for(const value of ['', '   ', {time:'2026-11-22T20:00:00Z'}]){
  const altered=structuredClone(snapshot);
  altered.events[0].bookmakers[0].markets[0].last_update=value;
  const [row]=normalizeNbaPropOutcomes(altered);
  assert.equal(row.capturedAt,null);
 }
});
test('market timestamp whitespace is trimmed without altering its source',()=>{
 const altered=structuredClone(snapshot);
 altered.events[0].bookmakers[0].markets[0].last_update=' 2026-11-22T20:01:00Z ';
 const [row]=normalizeNbaPropOutcomes(altered);
 assert.equal(row.capturedAt,'2026-11-22T20:01:00Z');
});

test('research quotes label timestamp provenance without treating it as provider verification',()=>{
 const [fallback]=normalizeNbaPropOutcomes(snapshot);
 assert.equal(fallback.timestampSource,'bookmaker');
 const market=structuredClone(snapshot);
 market.events[0].bookmakers[0].markets[0].last_update='2026-11-22T19:58:00Z';
 const [direct]=normalizeNbaPropOutcomes(market);
 assert.equal(direct.timestampSource,'market');
 const absent=structuredClone(snapshot);
 delete absent.events[0].bookmakers[0].last_update;
 const [missing]=normalizeNbaPropOutcomes(absent);
 assert.equal(missing.timestampSource,'missing');
 assert.equal(missing.capturedAt,null);
 for(const row of [fallback,direct,missing]){
  assert.equal(row.providerVerified,false);
  assert.equal(row.eligibleForEv,false);
 }
});
