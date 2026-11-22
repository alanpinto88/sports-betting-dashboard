import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMarket,validateComparison,americanToProbability,noVigProbability,evaluateEV,validatePublishedSnapshot,groupComparableQuotes} from './nba-quote-validation.mjs';

const now=Date.parse('2026-11-21T20:00:00Z');
const quote={playerId:'nba-123',eventId:'nba-event-456',market:'Points',period:'Full Game',line:26.5,side:'Over',timestamp:'2026-11-21T19:55:00Z',source:'test-provider',verified:true};
test('market aliases normalize',()=>assert.equal(normalizeMarket('PTS'),'points'));
test('identical fresh verified quotes compare',()=>assert.equal(validateComparison(quote,{...quote,source:'other-provider'},{now}).comparable,true));
test('different threshold blocked',()=>assert.ok(validateComparison(quote,{...quote,line:24.5},{now}).reasons.includes('different_line')));
test('different player blocked',()=>assert.ok(validateComparison(quote,{...quote,playerId:'other'},{now}).reasons.includes('different_player')));
test('stale quote blocked',()=>assert.ok(validateComparison(quote,{...quote,timestamp:'2026-11-21T19:00:00Z'},{now}).reasons.includes('stale_or_invalid_timestamp')));
test('unverified source blocked',()=>assert.ok(validateComparison(quote,{...quote,verified:false},{now}).reasons.includes('unverified_source')));
test('string line rejected',()=>assert.equal(validateComparison(quote,{...quote,line:'26.5'},{now}).comparable,false));
test('invalid odds rejected',()=>assert.equal(americanToProbability(-99),null));
test('no-vig normalizes to one',()=>{const p=noVigProbability(-110,-110);assert.ok(Math.abs(p.over+p.under-1)<1e-12)});
test('EV disabled without model verification',()=>assert.equal(evaluateEV({comparison:{comparable:true},modelProbability:.6,americanOdds:-110}).enabled,false));
test('EV computed only after verification',()=>assert.equal(evaluateEV({comparison:{comparable:true},modelProbability:.6,americanOdds:-110,modelVerified:true}).enabled,true));

test('published snapshot refuses empty trusted source list',()=>assert.equal(validatePublishedSnapshot({quotes:[{...quote,americanOdds:-110}]}).valid,false));
test('published snapshot refuses unknown source',()=>assert.ok(validatePublishedSnapshot({quotes:[{...quote,americanOdds:-110}]},{trustedSourceIds:['other'],now}).errors.includes('untrusted_source')));
test('published snapshot accepts trusted complete fresh quote',()=>assert.equal(validatePublishedSnapshot({quotes:[{...quote,americanOdds:-110}]},{trustedSourceIds:['test-provider'],now}).valid,true));
test('published snapshot rejects stale trusted quote',()=>assert.ok(validatePublishedSnapshot({quotes:[{...quote,americanOdds:-110,timestamp:'2026-11-21T19:00:00Z'}]},{trustedSourceIds:['test-provider'],now}).errors.includes('stale_timestamp')));

test('same sportsbook cannot create independent comparison',()=>{
 const q={...quote,americanOdds:-110,sportsbook:'Book A'};
 assert.equal(groupComparableQuotes([q,{...q,source:'second-feed'}],{now}).length,0);
});
test('different sportsbooks can create comparison',()=>{
 const q={...quote,americanOdds:-110,sportsbook:'Book A'};
 assert.equal(groupComparableQuotes([q,{...q,sportsbook:'Book B',americanOdds:-115}],{now}).length,1);
});
test('different line cannot create comparison',()=>{
 const q={...quote,americanOdds:-110,sportsbook:'Book A'};
 assert.equal(groupComparableQuotes([q,{...q,sportsbook:'Book B',line:24.5}],{now}).length,0);
});
test('newest duplicate quote wins within sportsbook',()=>{
 const q={...quote,americanOdds:-110,sportsbook:'Book A'};
 const groups=groupComparableQuotes([q,{...q,americanOdds:-120,timestamp:'2026-11-21T19:57:00Z'},{...q,sportsbook:'Book B'}],{now});
 assert.equal(groups[0].quotes.find(x=>x.sportsbook==='Book A').americanOdds,-120);
});
