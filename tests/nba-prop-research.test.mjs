import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateNbaPropHitRate} from '../lib/nba-prop-research.mjs';
const games=[0,1,2,3,4,5].map((i)=>({
 gameId:String(100+i),startTime:new Date(Date.UTC(2026,10,1+i)).toISOString(),
 final:true,status:'stats_available',stats:{points:[18,20,21,22,23,99][i]}
}));
test('uses five most recent eligible games and excludes future cutoff',()=>{
 const r=calculateNbaPropHitRate({games,stat:'points',line:20.5,before:'2026-11-06'});
 assert.equal(r.games,5);assert.equal(r.hits,3);assert.equal(r.hitRate,60);
 assert.equal(r.evEligible,false);assert.deepEqual(r.gameIds,['104','103','102','101','100']);
});
test('pushes are excluded from decided hit rate',()=>{
 const r=calculateNbaPropHitRate({games,stat:'points',line:20,before:'2026-11-06'});
 assert.equal(r.pushes,1);assert.equal(r.decisions,4);assert.equal(r.hits,3);
 assert.equal(r.hitRate,75);
});
test('incomplete sample stays labeled incomplete',()=>{
 const r=calculateNbaPropHitRate({games:games.slice(0,2),stat:'points',line:19,before:'2026-11-06'});
 assert.equal(r.sampleComplete,false);assert.equal(r.games,2);
});
test('duplicate game IDs fail closed',()=>{
 assert.throws(()=>calculateNbaPropHitRate({games:[games[0],games[0]],stat:'points',line:20,before:'2026-11-06'}),/Duplicate/);
});
