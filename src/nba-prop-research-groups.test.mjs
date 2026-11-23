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
