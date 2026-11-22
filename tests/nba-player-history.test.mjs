import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNbaPlayerHistory} from '../lib/nba-player-history.mjs';
const boxscore={players:[{team:{displayName:'Atlanta Hawks'},statistics:[{
 labels:['MIN','PTS','REB','AST'],athletes:[{athlete:{displayName:'Example Player'},
 stats:['30:00','20','5','7'],didNotPlay:false}]
}]}]};
const game=(id,day,final=true)=>({gameId:id,startTime:'2026-11-'+day+'T00:00:00Z',final,boxscore});
test('five completed historical games produce research averages only',()=>{
 const r=buildNbaPlayerHistory('Example Player',[game('a','01'),game('b','02'),game('c','03'),game('d','04'),game('e','05')],{before:'2026-11-06T00:00:00Z'});
 assert.equal(r.games,5);assert.equal(r.points,20);assert.equal(r.minutes,30);
 assert.equal(r.status,'five_completed_games');assert.equal(r.evEligible,false);
});
test('unfinalized games do not inflate history',()=>{
 const r=buildNbaPlayerHistory('Example Player',[game('a','01'),game('b','02',false)]);
 assert.equal(r.games,1);assert.equal(r.status,'partial_history');
 assert.match(r.warnings.join(' '),/game not final/);
});
test('future games excluded from historical cutoff',()=>{
 const r=buildNbaPlayerHistory('Example Player',[game('a','01'),game('b','05')],{before:'2026-11-03T00:00:00Z'});
 assert.deepEqual(r.gameIds,['a']);
});
test('duplicate ESPN game IDs are rejected',()=>{
 assert.throws(()=>buildNbaPlayerHistory('Example Player',[game('a','01'),game('a','02')]),/Duplicate historical game ID/);
});
