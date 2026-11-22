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
 assert.equal(summarizeNbaLastFive([dnp,extractNbaPlayerGameStats(box,'Example Player')]).games,1);
});
test('missing stat labels never yield fabricated values',()=>{
 const b=structuredClone(box);b.players[0].statistics[0].labels=['MIN','PTS'];
 assert.equal(extractNbaPlayerGameStats(b,'Example Player').status,'stats_incomplete');
});
test('last-five averages use at most five complete games',()=>{
 const item=extractNbaPlayerGameStats(box,'Example Player');
 const avg=summarizeNbaLastFive(Array(7).fill(item));
 assert.equal(avg.games,5);assert.equal(avg.points,25);assert.equal(avg.evEligible,false);
});
