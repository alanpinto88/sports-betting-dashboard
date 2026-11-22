import test from 'node:test';
import assert from 'node:assert/strict';
import {extractNbaPlayerGameStats,summarizeNbaLastFive} from '../lib/nba-player-game-stats.mjs';
const box={players:[{team:{displayName:'Atlanta Hawks'},statistics:[{
 labels:['MIN','PTS','REB','AST'],athletes:[{athlete:{displayName:'Example Player'},
 stats:['31:30','25','7','6'],didNotPlay:false}]
}]}]};
test('extracts statistics using column names and parses MM:SS minutes',()=>{
 const r=extractNbaPlayerGameStats(box,' example PLAYER ');
 assert.equal(r.status,'stats_available');
 assert.equal(r.stats.minutes,31.5);
 assert.equal(r.stats.points,25);
 assert.equal(r.stats.rebounds,7);
 assert.equal(r.stats.assists,6);
 assert.equal(r.evEligible,false);
});
test('DNP is excluded from statistical averages',()=>{
 const b=structuredClone(box);b.players[0].statistics[0].athletes[0].didNotPlay=true;
 const dnp=extractNbaPlayerGameStats(b,'Example Player');
 assert.equal(dnp.status,'did_not_play');
 assert.equal(summarizeNbaLastFive([{...dnp,gameId:'g1',final:true,startTime:'2026-11-19T00:00:00Z'}, {...extractNbaPlayerGameStats(box,'Example Player'),gameId:'g2',final:true,startTime:'2026-11-18T00:00:00Z'}]).games,1);
});
test('missing stat labels never yield fabricated values',()=>{
 const b=structuredClone(box);b.players[0].statistics[0].labels=['MIN','PTS'];
 assert.equal(extractNbaPlayerGameStats(b,'Example Player').status,'stats_incomplete');
});
test('last-five averages use at most five complete games',()=>{
 const item=extractNbaPlayerGameStats(box,'Example Player');
 const avg=summarizeNbaLastFive(Array.from({length:7},(_,i)=>({...item,gameId:'game-'+i,final:true,startTime:new Date(Date.UTC(2026,10,1+i)).toISOString()})));
 assert.equal(avg.games,5);assert.equal(avg.points,25);assert.equal(avg.evEligible,false);
});

test('last-five history sorts by date and excludes games at or after cutoff',()=>{
 const item=extractNbaPlayerGameStats(box,'Example Player');
 const history=[{...item,gameId:'old',final:true,startTime:'2026-11-01T00:00:00Z'},
  {...item,gameId:'new',final:true,startTime:'2026-11-03T00:00:00Z'},
  {...item,gameId:'future',final:true,startTime:'2026-11-05T00:00:00Z'}];
 const r=summarizeNbaLastFive(history,{before:'2026-11-04T00:00:00Z'});
 assert.deepEqual(r.gameIds,['new','old']);
});
test('duplicate historical game identifiers fail closed',()=>{
 const item=extractNbaPlayerGameStats(box,'Example Player');
 const game={...item,gameId:'same',final:true,startTime:'2026-11-01T00:00:00Z'};
 assert.throws(()=>summarizeNbaLastFive([game,game]),/Duplicate historical game ID/);
});

test('unconfirmed games cannot enter last-five averages',()=>{
 const item=extractNbaPlayerGameStats(box,'Example Player');
 const r=summarizeNbaLastFive([{...item,gameId:'pending',final:false,startTime:'2026-11-01T00:00:00Z'}]);
 assert.equal(r.games,0);assert.equal(r.points,null);
});
