import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileNbaBoxscore} from '../lib/nba-boxscore-reconciliation.mjs';
const event={id:'odds-1',home_team:'Atlanta Hawks',away_team:'Charlotte Hornets',
 bookmakers:[{markets:[{key:'player_points',outcomes:[
  {description:'Example Player',name:'Over'},{description:'Example Player',name:'Under'}
 ]}]}]};
const boxscore={players:[
 {team:{displayName:'Atlanta Hawks'},statistics:[{athletes:[
  {athlete:{displayName:'Example Player'},didNotPlay:false,stats:['12','5','2']}
 ]}]},
 {team:{displayName:'Charlotte Hornets'},statistics:[{athletes:[]}]}
]};
test('historical box score yields research only, never verified quotes',()=>{
 const r=reconcileNbaBoxscore(event,boxscore);
 assert.equal(r.completeTeamCoverage,true);
 assert.equal(r.findings.length,1);
 assert.equal(r.findings[0].status,'listed_in_boxscore_unverified_minutes');
 assert.equal(r.findings[0].verifiedQuote,false);
 assert.equal(r.evEligible,0);
});
test('DNP athlete is not counted as participation',()=>{
 const b=structuredClone(boxscore);b.players[0].statistics[0].athletes[0].didNotPlay=true;
 assert.equal(reconcileNbaBoxscore(event,b).findings[0].status,'listed_did_not_play');
});
test('missing opponent box score is incomplete coverage',()=>{
 const b=structuredClone(boxscore);b.players[0].statistics[0].athletes=[];
 b.players.pop();
 assert.equal(reconcileNbaBoxscore(event,b).findings[0].status,'boxscore_coverage_incomplete');
});
test('duplicate team data fails closed',()=>{
 const b=structuredClone(boxscore);b.players.push(b.players[0]);
 assert.throws(()=>reconcileNbaBoxscore(event,b),/Duplicate box-score team/);
});
