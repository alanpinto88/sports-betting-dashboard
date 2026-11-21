// Syntax-check inline ES modules on public NBA pages without executing browser code or API calls.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const pages=['nba-historical-odds.html','nba-props.html','nba-audit.html'];
for(const page of pages){
  const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(match=>/\btype\s*=\s*["']module["']/i.test(match[1]));
  if(!scripts.length)throw Error(page+': no inline ES module scripts found');
  for(const [index,script] of scripts.entries()){
    const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:script[2],encoding:'utf8'});
    if(check.status!==0)throw Error(page+' module '+(index+1)+': '+check.stderr);
  }
  console.log(page+': '+scripts.length+' inline module(s) syntax valid');
}
