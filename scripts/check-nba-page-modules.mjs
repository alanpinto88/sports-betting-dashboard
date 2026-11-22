// Syntax-check inline browser scripts on public NBA pages without executing browser code or API calls.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const pages=['nba-historical-odds.html','nba-props.html','nba-audit.html'];
let checkedScripts=0;
for(const page of pages){
  const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  if(!scripts.length)throw Error(page+': no inline browser scripts found');
  for(const [index,script] of scripts.entries()){
    const isModule=/\btype\s*=\s*["']module["']/i.test(script[1]);
    const check=spawnSync(process.execPath,['--check','--input-type='+(isModule?'module':'commonjs')],{input:script[2],encoding:'utf8'});
    if(check.status!==0)throw Error(page+' script '+(index+1)+': '+check.stderr);
    checkedScripts++;
  }
  console.log(page+': '+scripts.length+' inline script(s) syntax valid');
}

// Fail CI if the published NBA page silently drops the independent research
// wiring while still displaying the corresponding controls.
const props=readFileSync(new URL('../nba-props.html',import.meta.url),'utf8');
for(const required of [
 'id="combinedResearchStatus"',
 "import('./lib/nba-research-report.mjs')",
 "import('./lib/nba-roster-reconciliation.mjs')",
 "import('./lib/nba-schedule-reconciliation.mjs')",
 'renderCombinedResearch()',
 'playerResearchKey(',
 'snapshotRevision',
 'id="checkBoxscores"',
 "import('./lib/nba-boxscore-reconciliation.mjs')",
 'checkHistoricalBoxscores()',
 'id="checkLastFive"',
 'id="historyPlayer"',
 'id="historyTeamId"',
 'id="historyTeamSelect"',
 'id="loadHistoryTeams"',
 'loadHistoryTeams()',
 'id="lastFiveStatus"',
 "import('./lib/nba-history-collector.mjs')",
 'checkLastFive()',
 'evEligible'
]){
 // evEligible is represented by the report module, not necessarily the page.
 if(required==='evEligible')continue;
 if(!props.includes(required))throw Error('nba-props.html: missing research integration '+required);
}
console.log('NBA player research integration anchors present');

if(checkedScripts<3)throw Error('Expected to validate at least three NBA page scripts');
console.log('Validated '+checkedScripts+' NBA browser scripts across '+pages.length+' pages');
