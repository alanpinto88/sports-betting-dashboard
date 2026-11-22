import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../intelligence.html',import.meta.url),'utf8');
test('NBA dashboard inline JavaScript parses',()=>{
 const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.ok(blocks.length>0,'Expected an inline script');
 for(const block of blocks)new vm.Script(block[1],{filename:'intelligence.html inline script'});
});
test('NBA research panels have required controls and status targets',()=>{
 for(const id of ['nbaPlayerSearch','nbaMarketFilter','nbaPropsStatus','nbaPropsRows','nbaMovementStatus','nbaMovementRows','nbaEVStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
});
test('NBA research loads only published local snapshots',()=>{
 assert.match(html,/\.\/data\/nba-props-latest\.json/);
 assert.match(html,/\.\/data\/nba-props-history\.json/);
 assert.match(html,/\.\/lib\/nba-published-adapter\.mjs/);
 assert.match(html,/\.\/lib\/nba-odds-movement\.mjs/);
});

test('NBA feed errors remain visible after filter-driven rerenders',()=>{
 assert.match(html,/let feedError=null/);
 assert.match(html,/status\.textContent=feedError\?/);
 assert.match(html,/catch\(e\)\{feedError=e\.message;render\(\);return\}/);
});

test('significant NBA movement filter is wired to the research table',()=>{
 assert.match(html,/id="nbaSignificantOnly"/);
 assert.match(html,/significantOnly\.checked&&!q\.significant/);
 assert.match(html,/significantOnly\.addEventListener\('change',render\)/);
});
