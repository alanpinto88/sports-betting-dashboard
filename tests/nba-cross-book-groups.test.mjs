import test from 'node:test';
import assert from 'node:assert/strict';
import {crossBookGroups,verifiedCrossBookGroups} from '../lib/nba-quote-validation.mjs';
const now=Date.parse('2026-11-21T20:00:00Z');
const q={league:'NBA',eventId:'game1',playerId:'player1',stat:'points',period:'full_game',line:26.5,side:'over',provider:'trusted-ingest',sourceId:'quote1',sportsbook:'Book A',americanOdds:-110,capturedAt:'2026-11-21T19:59:00Z'};
test('independent books with identical market and side group',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:'Book B',sourceId:'quote2'}],now).length,1));
test('same sportsbook is not an independent comparison',()=>assert.equal(crossBookGroups([q,{...q,sourceId:'quote2'}],now).length,0));
test('different lines do not group',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:'Book B',line:24.5}],now).length,0));
test('opposite sides do not group',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:'Book B',side:'under'}],now).length,0));
test('stale quotes do not group',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:'Book B',capturedAt:'2026-11-21T19:30:00Z'}],now).length,0));
test('latest quote from each sportsbook wins',()=>{const groups=crossBookGroups([q,{...q,americanOdds:-120,capturedAt:'2026-11-21T19:59:30Z'},{...q,sportsbook:'Book B'}],now);assert.equal(groups[0].quotes.find(x=>x.sportsbook==='Book A').americanOdds,-120)});
test('missing provenance is excluded',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:'Book B',sourceId:''}],now).length,0));

test('non-string sportsbook provenance is rejected',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:{name:'Book B'}}],now).length,0));
test('non-string provider provenance is rejected',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:'Book B',provider:{name:'feed'}}],now).length,0));
test('non-string source ID provenance is rejected',()=>assert.equal(crossBookGroups([q,{...q,sportsbook:'Book B',sourceId:123}],now).length,0));

test('independent verification required for production grouping',()=>{
 const result=verifiedCrossBookGroups([q,{...q,sportsbook:'Book B'}],{now});
 assert.equal(result.enabled,false);
 assert.equal(result.reason,'missing_independent_verification');
});
test('unknown provider excluded from production grouping',()=>{
 const result=verifiedCrossBookGroups([q,{...q,sportsbook:'Book B'}],{now,trustedProviders:['different'],verifiedIdentityKeys:[JSON.stringify(['NBA','game1','player1'])]});
 assert.equal(result.enabled,false);
});
test('unattested player-event identity excluded from production grouping',()=>{
 const result=verifiedCrossBookGroups([q,{...q,sportsbook:'Book B'}],{now,trustedProviders:['trusted-ingest'],verifiedIdentityKeys:[JSON.stringify(['NBA','other-game','player1'])]});
 assert.equal(result.enabled,false);
});
test('attested provider and identity allow eligible comparison groups',()=>{
 const result=verifiedCrossBookGroups([q,{...q,sportsbook:'Book B'}],{now,trustedProviders:['trusted-ingest'],verifiedIdentityKeys:[JSON.stringify(['NBA','game1','player1'])]});
 assert.equal(result.enabled,true);assert.equal(result.groups.length,1);
});

test('object event identifier is rejected rather than string-coerced',()=>{
 assert.equal(crossBookGroups([q,{...q,eventId:{id:'game1'},sportsbook:'Book B'}],now).length,0);
});
test('object player identifier is rejected rather than string-coerced',()=>{
 assert.equal(crossBookGroups([q,{...q,playerId:{id:'player1'},sportsbook:'Book B'}],now).length,0);
});
test('object market stat is rejected rather than string-coerced',()=>{
 assert.equal(crossBookGroups([q,{...q,stat:{name:'points'},sportsbook:'Book B'}],now).length,0);
});

test('production gate rejects duplicate upstream record masquerading as two sportsbooks',()=>{
 const result=verifiedCrossBookGroups([q,{...q,sportsbook:'Book B'}],{
  now,trustedProviders:['trusted-ingest'],verifiedIdentityKeys:[JSON.stringify(['NBA','game1','player1'])]
 });
 assert.equal(result.enabled,false);
 assert.equal(result.groups.length,0);
});
test('production gate permits independently sourced sportsbook records',()=>{
 const result=verifiedCrossBookGroups([q,{...q,sportsbook:'Book B',sourceId:'quote2'}],{
  now,trustedProviders:['trusted-ingest'],verifiedIdentityKeys:[JSON.stringify(['NBA','game1','player1'])]
 });
 assert.equal(result.enabled,true);
 assert.equal(result.groups.length,1);
});
