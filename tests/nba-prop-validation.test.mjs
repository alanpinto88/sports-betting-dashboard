import assert from 'node:assert/strict';
import {americanToProbability,normalizeProp,sameMarket,noVigPair,evaluateEV} from '../lib/nba-prop-validation.mjs';
import test from 'node:test';
const raw=(side,odds=-110,extra={})=>({provider:'book',playerId:'p1',eventId:'e1',stat:'Points',period:'Full game',side,line:24.5,odds,capturedAt:'2026-11-22T00:00:00Z',sourceId:'quote1',verified:true,...extra});
test('American odds conversion rejects malformed prices',()=>{
 assert.equal(americanToProbability(-110),110/210);
 assert.equal(americanToProbability(150),100/250);
 for(const bad of [0,99,-99,110.5,NaN])assert.equal(americanToProbability(bad),null);
});
test('normalization rejects missing identity, side and line',()=>{
 assert.equal(normalizeProp(raw('push')),null);
 assert.equal(normalizeProp(raw('over',-110,{playerId:''})),null);
 assert.equal(normalizeProp(raw('over',-110,{line:-1})),null);
 assert.equal(normalizeProp(raw('over',-110,{line:'not-a-number'})),null);
});
test('exact market equality excludes different thresholds, events and periods',()=>{
 const a=normalizeProp(raw('over'));
 assert.equal(sameMarket(a,normalizeProp(raw('under'))),true);
 for(const changes of [{line:25.5},{eventId:'e2'},{period:'First half'},{playerId:'p2'},{stat:'Rebounds'}])
  assert.equal(sameMarket(a,normalizeProp(raw('under',-110,changes))),false);
});
test('no-vig calculation requires verified opposing quotes',()=>{
 const over=normalizeProp(raw('over',-110)),under=normalizeProp(raw('under',-110));
 const p=noVigPair(over,under);
 assert.ok(p);assert.ok(Math.abs(p.over-0.5)<1e-12);
 assert.equal(noVigPair(over,normalizeProp(raw('under',-110,{line:25.5}))),null);
 assert.equal(noVigPair(over,normalizeProp(raw('under',-110,{verified:false}))),null);
 assert.equal(noVigPair(over,normalizeProp(raw('under',-110,{sourceId:null}))),null);
});
test('EV requires provenance and a bounded model probability',()=>{
 const quote=normalizeProp(raw('over',100));
 assert.ok(Math.abs(evaluateEV(quote,0.6).evPerDollar-0.2)<1e-12);
 assert.equal(evaluateEV(quote,1),null);
 assert.equal(evaluateEV(quote,NaN),null);
 assert.equal(evaluateEV(normalizeProp(raw('over',100,{verified:false})),0.6),null);
 assert.equal(evaluateEV(normalizeProp(raw('over',100,{capturedAt:null})),0.6),null);
});
