import test from 'node:test';
import assert from 'node:assert/strict';
import {researchQuoteTimeStatus} from './nba-prop-research-freshness.mjs';
const now=Date.parse('2026-11-22T20:00:00Z'),snap='2026-11-22T19:59:30Z';
test('historical quote remains ineligible for EV',()=>{const result=researchQuoteTimeStatus('2026-11-22T19:59:00Z',snap,now);assert.equal(result.status,'HISTORICAL_RESEARCH');assert.equal(result.eligibleForEv,false);assert.equal(result.ageMinutes,1)});
for(const [name,quote,snapshot,expected] of [
 ['missing',null,snap,'MISSING_OR_INVALID_TIME'],
 ['malformed','2026-11-22T19:59:00+01:00',snap,'MISSING_OR_INVALID_TIME'],
 ['future','2026-11-22T20:01:00Z',snap,'FUTURE_QUOTE_TIME'],
 ['missing snapshot','2026-11-22T19:59:00Z',null,'SNAPSHOT_TIME_UNVERIFIED'],
 ['after snapshot','2026-11-22T19:59:45Z',snap,'AFTER_SNAPSHOT_CAPTURE'],
 ['future snapshot','2026-11-22T19:59:00Z','2026-11-22T20:01:00Z','FUTURE_SNAPSHOT_TIME']
])test(name,()=>assert.equal(researchQuoteTimeStatus(quote,snapshot,now).status,expected));
test('invalid clock rejected',()=>assert.equal(researchQuoteTimeStatus(snap,snap,NaN).status,'INVALID_CLOCK'));

test('impossible calendar date is not accepted as quote time',()=>{
 assert.equal(researchQuoteTimeStatus('2026-11-31T19:59:00Z',snap,now).status,'MISSING_OR_INVALID_TIME');
});
test('impossible snapshot date is not accepted as capture time',()=>{
 assert.equal(researchQuoteTimeStatus('2026-11-22T19:59:00Z','2026-11-31T19:59:30Z',now).status,'SNAPSHOT_TIME_UNVERIFIED');
});
test('millisecond UTC quote time is accepted',()=>{
 assert.equal(researchQuoteTimeStatus('2026-11-22T19:59:00.000Z',snap,now).status,'HISTORICAL_RESEARCH');
});

test('provider UTC offset and microseconds accepted',()=>{
 const result=researchQuoteTimeStatus('2026-11-22T19:59:00Z','2026-11-22T19:59:30.090695+00:00',now);
 assert.equal(result.status,'HISTORICAL_RESEARCH');
 assert.equal(result.eligibleForEv,false);
});
test('microsecond ordering preserved',()=>{
 assert.equal(researchQuoteTimeStatus('2026-11-22T19:59:30.000002Z','2026-11-22T19:59:30.000001+00:00',now).status,'AFTER_SNAPSHOT_CAPTURE');
});
