import test from 'node:test';
import assert from 'node:assert/strict';
import {groupNbaResearchQuotes} from './nba-prop-research-groups.mjs';
const q=(overrides={})=>({eventId:'event-1',playerLabel:'Example Player',market:'player_points',period:'unverified',line:24.5,side:'over',provider:'book-a',americanOdds:-110,status:'RESEARCH_ONLY',eligibleForEv:false,...overrides});
test('same threshold and event groups books',()=>{
 const groups=groupNbaResearchQuotes([q(),q({provider:'book-b',side:'under'})]);
 assert.equal(groups.length,1);assert.equal(groups[0].bookCount,2);assert.equal(groups[0].hasBothSides,true);assert.equal(groups[0].eligibleForEv,false);
});
test('different thresholds never merge',()=>assert.equal(groupNbaResearchQuotes([q(),q({line:25.5})]).length,2));
test('different events never merge',()=>assert.equal(groupNbaResearchQuotes([q(),q({eventId:'event-2'})]).length,2));
test('different players never merge',()=>assert.equal(groupNbaResearchQuotes([q(),q({playerLabel:'Other Player'})]).length,2));
test('rejects trusted or EV-eligible rows in research-only grouping',()=>assert.deepEqual(groupNbaResearchQuotes([q({eligibleForEv:true}),q({status:'VERIFIED'})]),[]));
test('invalid input fails closed',()=>assert.deepEqual(groupNbaResearchQuotes(null),[]));

test('different betting periods never merge',()=>{
 const groups=groupNbaResearchQuotes([q({period:'full-game'}),q({period:'first-half'})]);
 assert.equal(groups.length,2);
 assert.deepEqual(new Set(groups.map(g=>g.period)),new Set(['full-game','first-half']));
});
test('missing betting period cannot enter comparison group',()=>{
 assert.deepEqual(groupNbaResearchQuotes([q({period:null})]),[]);
});

test('over and under from different sportsbooks do not imply a two-sided book',()=>{
 const [g]=groupNbaResearchQuotes([q({provider:'book-a',side:'over'}),q({provider:'book-b',side:'under'})]);
 assert.equal(g.hasBothSides,true);
 assert.equal(g.sameBookTwoSided,false);
});
test('two sides from the same sportsbook are identified separately',()=>{
 const [g]=groupNbaResearchQuotes([q({side:'over'}),q({side:'under'})]);
 assert.equal(g.bookCount,1);
 assert.equal(g.sameBookTwoSided,true);
});
test('invalid odds never enter research groups',()=>{
 assert.deepEqual(groupNbaResearchQuotes([q({americanOdds:-90}),q({americanOdds:NaN})]),[]);
});

test('different prices on same sportsbook and side require chronology review',()=>{
 const [g]=groupNbaResearchQuotes([q({americanOdds:-110}),q({americanOdds:-120})]);
 assert.equal(g.conflictingSameSidePrices,true);
 assert.equal(g.eligibleForEv,false);
});
test('duplicate identical same-side prices do not trigger conflict',()=>{
 const [g]=groupNbaResearchQuotes([q(),q()]);
 assert.equal(g.conflictingSameSidePrices,false);
});
test('different sportsbook prices are not same-side conflicts',()=>{
 const [g]=groupNbaResearchQuotes([q(),q({provider:'book-b',americanOdds:-120})]);
 assert.equal(g.conflictingSameSidePrices,false);
});

test('whitespace in identifiers cannot create fake additional sportsbooks or markets',()=>{
 const groups=groupNbaResearchQuotes([
  q({eventId:' event-1 ',market:' player_points ',provider:' book-a ',side:'over'}),
  q({eventId:'event-1',market:'player_points',provider:'book-a',side:'under'})
 ]);
 assert.equal(groups.length,1);
 assert.equal(groups[0].bookCount,1);
 assert.equal(groups[0].sameBookTwoSided,true);
});
test('whitespace-only sportsbook identifiers are rejected',()=>{
 assert.deepEqual(groupNbaResearchQuotes([q({provider:'  '})]),[]);
});

test('two sides at one book without timestamps are not timestamp aligned',()=>{
 const [g]=groupNbaResearchQuotes([q({side:'over'}),q({side:'under'})]);
 assert.equal(g.sameBookTwoSided,true);
 assert.equal(g.sameTimestampTwoSided,false);
});
test('same sportsbook and matching explicit timestamps identify research pair',()=>{
 const [g]=groupNbaResearchQuotes([
  q({side:'over',capturedAt:'2026-11-22T19:00:00Z'}),
  q({side:'under',capturedAt:'2026-11-22T19:00:00Z'})
 ]);
 assert.equal(g.sameTimestampTwoSided,true);
 assert.equal(g.eligibleForEv,false);
});
test('different timestamps never imply simultaneous two-sided quotes',()=>{
 const [g]=groupNbaResearchQuotes([
  q({side:'over',capturedAt:'2026-11-22T19:00:00Z'}),
  q({side:'under',capturedAt:'2026-11-22T19:05:00Z'})
 ]);
 assert.equal(g.sameBookTwoSided,true);
 assert.equal(g.sameTimestampTwoSided,false);
});

test('malformed timestamps cannot establish a synchronized two-sided market',()=>{
 for(const capturedAt of ['not-a-date','2026-11-31T19:00:00Z','2026-11-22T19:00:00+00:00']){
  const [g]=groupNbaResearchQuotes([
   q({side:'over',capturedAt}),q({side:'under',capturedAt})
  ]);
  assert.equal(g.sameBookTwoSided,true);
  assert.equal(g.sameTimestampTwoSided,false,capturedAt);
  assert.equal(g.eligibleForEv,false);
 }
});

test('equivalent canonical UTC timestamps pair even with explicit milliseconds',()=>{
 const [g]=groupNbaResearchQuotes([
  q({side:'over',capturedAt:'2026-11-22T19:00:00Z'}),
  q({side:'under',capturedAt:'2026-11-22T19:00:00.000Z'})
 ]);
 assert.equal(g.sameTimestampTwoSided,true);
 assert.equal(g.eligibleForEv,false);
});
test('different millisecond instants do not establish timestamp alignment',()=>{
 const [g]=groupNbaResearchQuotes([
  q({side:'over',capturedAt:'2026-11-22T19:00:00.001Z'}),
  q({side:'under',capturedAt:'2026-11-22T19:00:00.002Z'})
 ]);
 assert.equal(g.sameTimestampTwoSided,false);
});

test('conflicting same-instant over prices cannot form a timestamp-aligned pair',()=>{
 const capturedAt='2026-11-22T19:00:00Z';
 const [g]=groupNbaResearchQuotes([
  q({side:'over',americanOdds:-110,capturedAt}),
  q({side:'over',americanOdds:-120,capturedAt}),
  q({side:'under',americanOdds:-110,capturedAt})
 ]);
 assert.equal(g.sameBookTwoSided,true);
 assert.equal(g.conflictingSameSidePrices,true);
 assert.equal(g.sameTimestampTwoSided,false);
 assert.equal(g.eligibleForEv,false);
});
test('duplicate identical prices still allow a research timestamp-aligned pair',()=>{
 const capturedAt='2026-11-22T19:00:00Z';
 const [g]=groupNbaResearchQuotes([
  q({side:'over',capturedAt}),q({side:'over',capturedAt}),
  q({side:'under',capturedAt})
 ]);
 assert.equal(g.sameTimestampTwoSided,true);
 assert.equal(g.conflictingSameSidePrices,false);
});

test('same-instant price conflict is distinguished from historical repricing',()=>{
 const at='2026-11-22T19:00:00Z';
 const [conflict]=groupNbaResearchQuotes([
  q({americanOdds:-110,capturedAt:at}),
  q({americanOdds:-120,capturedAt:at})
 ]);
 assert.equal(conflict.sameTimestampPriceConflict,true);
 const [movement]=groupNbaResearchQuotes([
  q({americanOdds:-110,capturedAt:at}),
  q({americanOdds:-120,capturedAt:'2026-11-22T19:05:00Z'})
 ]);
 assert.equal(movement.conflictingSameSidePrices,true);
 assert.equal(movement.sameTimestampPriceConflict,false);
});

test('research groups disclose missing and invalid timestamps without promoting EV',()=>{
 const [g]=groupNbaResearchQuotes([
  q({side:'over'}),
  q({side:'under',capturedAt:'2026-11-31T19:00:00Z'}),
  q({side:'over',provider:'book-b',capturedAt:'2026-11-22T19:00:00Z'})
 ]);
 assert.equal(g.missingOrInvalidQuoteTimestamps,2);
 assert.equal(g.sameTimestampTwoSided,false);
 assert.equal(g.eligibleForEv,false);
});

test('a conflict at another timestamp blocks the group-wide paired-price badge',()=>{
 const [g]=groupNbaResearchQuotes([
  q({side:'over',americanOdds:-110,capturedAt:'2026-11-22T19:00:00Z'}),
  q({side:'under',americanOdds:-110,capturedAt:'2026-11-22T19:00:00Z'}),
  q({side:'over',americanOdds:-115,capturedAt:'2026-11-22T19:05:00Z'}),
  q({side:'over',americanOdds:-120,capturedAt:'2026-11-22T19:05:00Z'})
 ]);
 assert.equal(g.sameTimestampPriceConflict,true);
 assert.equal(g.sameTimestampTwoSided,false);
 assert.equal(g.eligibleForEv,false);
});

test('missing timestamps elsewhere in group prevent a group-wide alignment claim',()=>{
 const at='2026-11-22T19:00:00Z';
 const [g]=groupNbaResearchQuotes([
  q({side:'over',capturedAt:at}),
  q({side:'under',capturedAt:at}),
  q({side:'over',provider:'book-b'})
 ]);
 assert.equal(g.missingOrInvalidQuoteTimestamps,1);
 assert.equal(g.sameTimestampTwoSided,false);
 assert.equal(g.eligibleForEv,false);
});

test('market-level paired timestamps are distinct from bookmaker fallback times',()=>{
 const at='2026-11-22T19:00:00Z';
 const market=groupNbaResearchQuotes([
  q({side:'over',capturedAt:at,timestampSource:'market'}),
  q({side:'under',capturedAt:at,timestampSource:'market'})
 ])[0];
 assert.equal(market.marketTimestampAlignedTwoSided,true);
 assert.equal(market.eligibleForEv,false);
 const fallback=groupNbaResearchQuotes([
  q({side:'over',capturedAt:at,timestampSource:'bookmaker'}),
  q({side:'under',capturedAt:at,timestampSource:'bookmaker'})
 ])[0];
 assert.equal(fallback.sameTimestampTwoSided,true);
 assert.equal(fallback.marketTimestampAlignedTwoSided,false);
 const mixed=groupNbaResearchQuotes([
  q({side:'over',capturedAt:at,timestampSource:'market'}),
  q({side:'under',capturedAt:at,timestampSource:'bookmaker'})
 ])[0];
 assert.equal(mixed.marketTimestampAlignedTwoSided,false);
});

test('group counts only valid UTC timestamps by market versus bookmaker provenance',()=>{
 const at='2026-11-22T19:00:00Z';
 const [g]=groupNbaResearchQuotes([
  q({capturedAt:at,timestampSource:'market'}),
  q({side:'under',capturedAt:at,timestampSource:'bookmaker'}),
  q({provider:'book-b',capturedAt:'bad-date',timestampSource:'market'}),
  q({provider:'book-c',capturedAt:at})
 ]);
 assert.equal(g.marketTimestampQuotes,1);
 assert.equal(g.bookmakerTimestampQuotes,1);
 assert.equal(g.missingOrInvalidQuoteTimestamps,1);
 assert.equal(g.eligibleForEv,false);
});

test('missing market-level chronology is explicitly warned about',()=>{
 const at='2026-11-22T19:00:00Z';
 const [fallback]=groupNbaResearchQuotes([
  q({side:'over',capturedAt:at,timestampSource:'bookmaker'}),
  q({side:'under',capturedAt:at,timestampSource:'bookmaker'})
 ]);
 assert.equal(fallback.hasMarketTimestampEvidence,false);
 assert.match(fallback.timestampEvidenceWarning,/No valid market-level update timestamps/);
 assert.equal(fallback.eligibleForEv,false);
 const [market]=groupNbaResearchQuotes([
  q({side:'over',capturedAt:at,timestampSource:'market'}),
  q({side:'under',capturedAt:at,timestampSource:'market'})
 ]);
 assert.equal(market.hasMarketTimestampEvidence,true);
 assert.equal(market.timestampEvidenceWarning,null);
});

test('research groups count absent source record identifiers without promoting verification',()=>{
 const [g]=groupNbaResearchQuotes([
  q({sourceRecordId:'quote-1'}),
  q({side:'under',sourceRecordId:'  '}),
  q({provider:'book-b',sourceRecordId:null})
 ]);
 assert.equal(g.missingSourceRecordIds,2);
 assert.equal(g.eligibleForEv,false);
 assert.equal(g.status,'RESEARCH_ONLY');
});
