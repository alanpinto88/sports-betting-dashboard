import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePropQuote, comparePropQuotes, validateTwoWayPropMarket } from './nba-prop-quote-validation.mjs';
const now=Date.parse('2026-11-22T20:00:00Z');
const base={provider:'book-a',playerId:'player-1',eventId:'event-1',market:'points',period:'full-game',side:'over',line:24.5,americanOdds:-110,capturedAt:'2026-11-22T19:59:00Z',providerVerified:true,sourceRecordId:'quote-1'};
const clone=()=>({...base});
test('valid canonical quote accepted structurally',()=>assert.equal(validatePropQuote(clone(),now).valid,true));
for(const [key,value] of [['playerId',''],['eventId',''],['market',''],['period',''],['line',NaN],['americanOdds',-99],['providerVerified',false],['sourceRecordId',''],['capturedAt','invalid'],['side','yes']]){
 test('reject invalid '+key,()=>{const q=clone();q[key]=value;assert.equal(validatePropQuote(q,now).valid,false)});
}
test('reject stale quote',()=>{const q=clone();q.capturedAt='2026-11-22T19:50:00Z';assert.equal(validatePropQuote(q,now).valid,false)});
test('reject mismatched player',()=>{const b=clone();b.playerId='player-2';assert.equal(comparePropQuotes(clone(),b,now).comparable,false)});
test('two-way same provider opposite sides passes structural gate',()=>{const b={...clone(),side:'under',sourceRecordId:'quote-2'};assert.equal(validateTwoWayPropMarket(clone(),b,now).valid,true)});
test('two-way mismatched threshold fails',()=>{const b={...clone(),side:'under',line:25.5,sourceRecordId:'quote-2'};assert.equal(validateTwoWayPropMarket(clone(),b,now).valid,false)});
test('two-way duplicate record fails',()=>{const b={...clone(),side:'under'};assert.equal(validateTwoWayPropMarket(clone(),b,now).valid,false)});
