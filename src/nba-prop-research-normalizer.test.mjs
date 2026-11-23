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
