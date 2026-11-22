import test from 'node:test';import assert from 'node:assert/strict';
import {collectNbaPlayerHistory} from '../lib/nba-history-collector.mjs';
const events=Array.from({length:7},(_,i)=>({id:String(100+i),date:new Date(Date.UTC(2026,10,1+i)).toISOString(),status:{type:{completed:true}}}));
const boxscore={players:[{team:{id:'1',displayName:'Atlanta Hawks'},statistics:[{labels:['MIN','PTS','REB','AST'],athletes:[{athlete:{displayName:'Example Player'},stats:['30','20','5','7']}]}]}]};
test('collects five distinct final player games without requesting future games',async()=>{
 const calls=[];
 const fetchJson=async url=>{calls.push(url);return url.includes('/schedule?')?{events}:
  {header:{competitions:[{status:{type:{completed:true}}}]},boxscore}};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06T00:00:00Z',fetchJson});
 assert.equal(r.games,5);assert.equal(r.complete,true);assert.equal(r.evEligible,false);
 assert.equal(calls.filter(u=>u.includes('/summary?')).length,5);
 assert.deepEqual(r.gameIds,['104','103','102','101','100']);
});
test('rejects invalid team identifiers before network access',async()=>{
 await assert.rejects(collectNbaPlayerHistory({playerName:'Example Player',teamId:'../bad',before:'2026-11-06',fetchJson:async()=>({})}),/Invalid ESPN history/);
});
test('does not count games whose summary is not confirmed final',async()=>{
 const fetchJson=async url=>url.includes('/schedule?')?{events:[events[0]]}:{header:{competitions:[{status:{type:{completed:false}}}]},boxscore};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,0);assert.equal(r.complete,false);
});

test('rejects player results belonging to a different ESPN team',async()=>{
 const other=structuredClone(boxscore);other.players[0].team.id='2';
 const fetchJson=async url=>url.includes('/schedule?')?{events:[events[0]]}:
  {header:{competitions:[{status:{type:{completed:true}}}]},boxscore:other};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,0);assert.match(r.warnings.join(' '),/team ID does not match/);
});
test('excludes historical box scores missing player team identity',async()=>{
 const missing=structuredClone(boxscore);delete missing.players[0].team.id;
 const fetchJson=async url=>url.includes('/schedule?')?{events:[events[0]]}:
  {header:{competitions:[{status:{type:{completed:true}}}]},boxscore:missing};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,0);assert.match(r.warnings.join(' '),/team ID unavailable/);
});
