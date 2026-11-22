import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublishedQuote,groupComparableQuotes} from '../lib/nba-published-adapter.mjs';
const now=Date.parse('2026-11-22T01:00:00Z');
const quote=(overrides={})=>({verified:true,player_id:'p1',event_id:'e1',market:'Points',period:'Full game',side:'over',line:24.5,american_odds:-110,sportsbook:'bookA',source_id:'a1',captured_at:'2026-11-22T00:55:00Z',...overrides});
test('accepts complete verified fresh quote',()=>assert.equal(validatePublishedQuote(quote(),now).ok,true));
test('fails closed for missing provenance and invalid prices',()=>{
 for(const changes of [{source_id:null},{verified:false},{american_odds:-99},{player_id:''},{line:NaN},{captured_at:'2026-11-22T01:01:00Z'},{captured_at:'2026-11-22T00:40:00Z'}])
  assert.equal(validatePublishedQuote(quote(changes),now).ok,false);
});
test('matches exact lines across distinct books only',()=>{
 const records=[quote(),quote({sportsbook:'bookB',source_id:'b1'}),quote({sportsbook:'bookC',source_id:'c1',line:25.5})];
 const groups=groupComparableQuotes(records,now);
 assert.equal(groups.length,2);
 assert.equal(groups.filter(x=>x.matched).length,1);
});
