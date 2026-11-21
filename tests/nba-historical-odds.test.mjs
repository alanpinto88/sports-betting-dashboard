import assert from 'node:assert/strict';
import {historicalQuoteSeries,historicalQuoteAudit} from '../lib/nba-historical-odds.mjs';
const selection={eventId:'e1',playerName:'Fixture Player',book:'book-a',market:'player_points',side:'Over',line:20.5};
const snapshot=(time,price,point=20.5)=>({source:'The Odds API',captured_at:time,events:[{id:'e1',bookmakers:[{key:'book-a',markets:[{key:'player_points',last_update:'2026-11-21T15:00:00Z',outcomes:[{description:'Fixture Player',name:'Over',point,price}]}]}]}]});
const result=historicalQuoteSeries([snapshot('2026-11-21T16:00:00Z',-110),snapshot('2026-11-21T17:00:00Z',-120),snapshot('2026-11-21T17:00:00Z',-120),snapshot('2026-11-21T18:00:00Z',-130,21.5)],selection);
assert.equal(result.length,2);
assert.deepEqual(result.map(x=>x.americanOdds),[-110,-120]);
assert.ok(result.every(x=>x.status==='unverified_player_identity'));
assert.deepEqual(historicalQuoteSeries([],selection),[]);
assert.throws(()=>historicalQuoteSeries([],{}),/Missing selection/);
const conflict=historicalQuoteSeries([
  snapshot('2026-11-21T16:00:00Z',-110),
  snapshot('2026-11-21T16:00:00Z',-125),
  snapshot('2026-11-21T17:00:00Z',-120)
],selection);
assert.deepEqual(conflict.map(x=>x.americanOdds),[-120],
  'conflicting odds for the same capture time must be excluded');
const audit=historicalQuoteAudit([snapshot('2026-11-21T16:00:00Z',-110),snapshot('2026-11-21T16:00:00Z',-125)],selection);
assert.deepEqual(audit.conflictingCaptureTimes,['2026-11-21T16:00:00.000Z']);
assert.equal(audit.records.length,0);
const duplicateAudit=historicalQuoteAudit([snapshot('2026-11-21T16:00:00Z',-110),snapshot('2026-11-21T16:00:00Z',-110)],selection);
assert.equal(duplicateAudit.duplicateRecordsCollapsed,1);
assert.equal(duplicateAudit.records.length,1);
console.log('NBA recorded-only odds movement and conflict fixtures passed');

const staleAudit=historicalQuoteAudit([snapshot('2026-11-21T16:00:00Z',-110),snapshot('2026-11-21T17:00:00Z',-120)],selection);
assert.equal(staleAudit.staleSourceQuotes,1,'source updates older than one hour must be flagged');
assert.equal(historicalQuoteAudit([snapshot('2026-11-21T16:00:00Z',-110)],selection).staleSourceQuotes,0,'exactly one hour is not older than one hour');
