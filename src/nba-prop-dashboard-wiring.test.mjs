import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const html=readFileSync(new URL('../nba-props.html',import.meta.url),'utf8');

test('NBA dashboard uses tested snapshot chronology gate',()=>{
 assert.match(html,/historicalNbaMovementsFromSnapshot\(matches,snapshotCapturedAt\)/);
 assert.doesNotMatch(html,/historicalNbaPriceMovements\(matches\)/);
});
test('NBA dashboard distinguishes saved and loaded movement provenance',()=>{
 assert.match(html,/historySource:'Saved device captures'/);
 assert.match(html,/historySource:'Current loaded snapshot'/);
 assert.match(html,/m\.historySource/);
});
test('NBA research module initializes cached snapshot without rebroadcasting globally',()=>{
 assert.match(html,/onResearchSnapshotLoaded\(\{detail:window\.__evsportsResearchSnapshot\}\)/);
 assert.match(html,/addEventListener\('evsports:nba-snapshot-loaded',onResearchSnapshotLoaded\)/);
});

test('every inline dashboard script parses as JavaScript',()=>{
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length>0,'dashboard should contain inline scripts');
 for(const [index,match] of scripts.entries()){
  if(!match[2].trim())continue;
  const module=match[1].includes('type="module"');
  const result=spawnSync(process.execPath,['--input-type='+ (module?'module':'commonjs'),'--check'],{
   input:match[2],encoding:'utf8'
  });
  assert.equal(result.status,0,'script '+index+' syntax error: '+result.stderr);
 }
});

test('historical movement cards explicitly disclose the betting period',()=>{
 assert.match(html,/Period: '\+m\.period/);
});

test('NBA comparison cards show market period and same-book sides',()=>{
 assert.match(html,/group\.playerLabel\+' · '\+group\.market\+' · '\+group\.period/);
 assert.match(html,/group\.marketTimestampAlignedTwoSided\?'both sides share a market-level timestamp \(unverified\)'/);
 assert.match(html,/group\.sameTimestampTwoSided\?'both sides share a recorded timestamp; market timing unconfirmed'/);
 assert.match(html,/group\.sameBookTwoSided\?'both sides at same sportsbook; timing unconfirmed'/);
});

test('NBA research cards warn about conflicting same-side prices',()=>{
 assert.match(html,/group\.sameTimestampPriceConflict\?' · conflicting prices at identical timestamp'/);
 assert.match(html,/group\.conflictingSameSidePrices\?' · same-side prices differ across records; review timestamps'/);
});

test('NBA comparison cards disclose missing or invalid source timestamps',()=>{
 assert.match(html,/group\.missingOrInvalidQuoteTimestamps\?' · '/);
 assert.match(html,/quote\(s\) missing valid UTC time/);
});

test('research cards preserve distinct quote times and disclose timestamp provenance',()=>{
 assert.match(html,/const signature=JSON\.stringify\(\[q\.provider,q\.side,q\.line,q\.americanOdds,q\.capturedAt,q\.timestampSource,q\.sourceRecordId\]\)/);
 assert.match(html,/q\.timestampSource==='market'\?'market timestamp'/);
 assert.match(html,/q\.timestampSource==='bookmaker'\?'sportsbook timestamp'/);
 assert.match(html,/q\.capturedAt\|\|'no UTC time'/);
});

test('NBA research cards cap visible quotes without silently hiding diagnostic volume',()=>{
 assert.match(html,/const maxVisibleQuotesPerGroup=30;/);
 assert.match(html,/if\(unique\.size>maxVisibleQuotesPerGroup\)\{hiddenQuotes\+\+;continue;\}/);
 assert.match(html,/additional distinct research quote\(s\) hidden for display performance/);
 assert.match(html,/group\.quotes\.length\+' research quote\(s\)'/);
});

test('NBA group cards disclose market-level and sportsbook-level timestamp counts',()=>{
 assert.match(html,/group\.marketTimestampQuotes\+' valid market timestamp\(s\)'/);
 assert.match(html,/group\.bookmakerTimestampQuotes\+' valid sportsbook timestamp\(s\)'/);
});

test('NBA cards disclose missing market-level timing evidence',()=>{
 assert.match(html,/if\(group\.timestampEvidenceWarning\)/);
 assert.match(html,/Timing evidence warning: '\+group\.timestampEvidenceWarning/);
});

test('NBA research cards disclose missing source record identifiers',()=>{
 assert.match(html,/group\.missingSourceRecordIds\+' missing source record ID\(s\)'/);
});

test('NBA research cards expose source record IDs without merging distinct records',()=>{
 assert.match(html,/q\.sourceRecordId\?'record ID: '\+q\.sourceRecordId:'source record ID missing'/);
 assert.match(html,/q\.capturedAt,q\.timestampSource,q\.sourceRecordId\]/);
});
