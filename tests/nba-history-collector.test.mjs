import test from 'node:test';import assert from 'node:assert/strict';
import {collectNbaPlayerHistory} from '../lib/nba-history-collector.mjs';
const events=Array.from({length:7},(_,i)=>({id:String(100+i),date:new Date(Date.UTC(2026,10,1+i)).toISOString(),status:{type:{completed:true}}}));
const boxscore={players:[{team:{id:'1',displayName:'Atlanta Hawks'},statistics:[{labels:['MIN','PTS','REB','AST'],athletes:[{athlete:{displayName:'Example Player'},stats:['30','20','5','7']}]}]}]};
test('collects five distinct final player games without requesting future games',async()=>{
 const calls=[];
 const fetchJson=async url=>{calls.push(url);return url.includes('/schedule?')?{events}:
  {header:{competitions:[{status:{type:{completed:true}},competitors:[{team:{id:'1'}},{team:{id:'2'}}]}]},boxscore}};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06T00:00:00Z',fetchJson});
 assert.equal(r.games,5);assert.equal(r.complete,true);assert.equal(r.evEligible,false);
 assert.equal(calls.filter(u=>u.includes('/summary?')).length,5);
 assert.deepEqual(r.gameIds,['104','103','102','101','100']);
});
test('rejects invalid team identifiers before network access',async()=>{
 await assert.rejects(collectNbaPlayerHistory({playerName:'Example Player',teamId:'../bad',before:'2026-11-06',fetchJson:async()=>({})}),/Invalid ESPN history/);
});
test('does not count games whose summary is not confirmed final',async()=>{
 const fetchJson=async url=>url.includes('/schedule?')?{events:[events[0]]}:{header:{competitions:[{status:{type:{completed:false}},competitors:[{team:{id:'1'}},{team:{id:'2'}}]}]},boxscore};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,0);assert.equal(r.complete,false);
});

test('rejects player results belonging to a different ESPN team',async()=>{
 const other=structuredClone(boxscore);other.players[0].team.id='2';
 const fetchJson=async url=>url.includes('/schedule?')?{events:[events[0]]}:
  {header:{competitions:[{status:{type:{completed:true}},competitors:[{team:{id:'1'}},{team:{id:'2'}}]}]},boxscore:other};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,0);assert.match(r.warnings.join(' '),/team ID does not match/);
});
test('excludes historical box scores missing player team identity',async()=>{
 const missing=structuredClone(boxscore);delete missing.players[0].team.id;
 const fetchJson=async url=>url.includes('/schedule?')?{events:[events[0]]}:
  {header:{competitions:[{status:{type:{completed:true}},competitors:[{team:{id:'1'}},{team:{id:'2'}}]}]},boxscore:missing};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,0);assert.match(r.warnings.join(' '),/team ID unavailable/);
});

test('rejects a game summary that does not include the requested team',async()=>{
 const fetchJson=async url=>url.includes('/schedule?')?{events:[events[0]]}:
  {header:{competitions:[{status:{type:{completed:true}},competitors:[{team:{id:'3'}},{team:{id:'4'}}]}]},boxscore};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,0);assert.match(r.warnings.join(' '),/requested team missing/);
});

test('one ESPN summary failure does not erase other completed games',async()=>{
 const fetchJson=async url=>{
  if(url.includes('/schedule?'))return {events:[events[0],events[1]]};
  if(url.endsWith('101'))throw Error('temporary provider failure');
  return {header:{competitions:[{status:{type:{completed:true}},competitors:[{team:{id:'1'}},{team:{id:'2'}}]}]},boxscore};
 };
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,1);assert.match(r.warnings.join(' '),/summary request failed/);
});
test('aborted ESPN requests stop the collector immediately',async()=>{
 const fetchJson=async url=>{
  if(url.includes('/schedule?'))return {events:[events[0]]};
  const e=new Error('cancelled');e.name='AbortError';throw e;
 };
 await assert.rejects(collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson}),{name:'AbortError'});
});

test('accepts explicit STATUS_FINAL schedule and summary status',async()=>{
 const scheduleEvent={id:'200',date:'2026-11-01T00:00:00Z',status:{type:{name:'STATUS_FINAL'}}};
 const fetchJson=async url=>url.includes('/schedule?')?{events:[scheduleEvent]}:
  {header:{competitions:[{status:{type:{name:'STATUS_FINAL'}},competitors:[{team:{id:'1'}},{team:{id:'2'}}]}]},boxscore};
 const r=await collectNbaPlayerHistory({playerName:'Example Player',teamId:'1',before:'2026-11-06',fetchJson});
 assert.equal(r.games,1);assert.deepEqual(r.gameIds,['200']);
});
