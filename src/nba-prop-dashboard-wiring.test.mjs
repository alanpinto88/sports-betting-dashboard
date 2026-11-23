import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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
