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
