import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const html=readFileSync(new URL('../nba-props.html',import.meta.url),'utf8');

test('NBA dashboard gates loaded snapshot movement on quote chronology',()=>{
 assert.match(html,/timeValidRows=matches\.filter\(q=>researchQuoteTimeStatus\(q\.capturedAt,snapshotCapturedAt\)\.status==='HISTORICAL_RESEARCH'\)/);
 assert.match(html,/historicalNbaPriceMovements\(timeValidRows\)/);
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
