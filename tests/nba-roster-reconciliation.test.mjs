import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileNbaRosters} from '../lib/nba-roster-reconciliation.mjs';
const snapshot={events:[{id:'game-1',home_team:'Atlanta Hawks',away_team:'Charlotte Hornets',
 bookmakers:[{markets:[{key:'player_points',outcomes:[{description:'Example Player',name:'Over'}]}]}]}]};
const roster=(home=['Example Player'],away=[])=>[{team:'Atlanta Hawks',players:home},{team:'Charlotte Hornets',players:away}];
test('current roster match is never verified participation',()=>{
 const r=reconcileNbaRosters(snapshot,roster());
 assert.equal(r.players[0].status,'current_roster_match_unverified_participation');
 assert.equal(r.players[0].playerIdentityVerified,false);
 assert.equal(r.players[0].participationVerified,false);
 assert.equal(r.verifiedEVPicks,0);
});
test('player listed on both event teams remains ambiguous',()=>{
 assert.equal(reconcileNbaRosters(snapshot,roster(['Example Player'],['Example Player'])).players[0].status,'ambiguous_team_roster');
});
test('missing roster coverage is not a negative identity finding',()=>{
 assert.equal(reconcileNbaRosters(snapshot,roster().slice(0,1).map(x=>({...x,players:[]}))).players[0].status,'roster_coverage_incomplete');
});
test('complete roster coverage can report player not listed',()=>{
 assert.equal(reconcileNbaRosters(snapshot,roster([],[])).players[0].status,'not_listed_on_current_event_team_rosters');
});
test('duplicate team roster records are rejected',()=>{
 assert.throws(()=>reconcileNbaRosters(snapshot,[...roster(),roster()[0]]),/Duplicate team roster/);
});

test('provider player fallback is included in roster research',()=>{
 const input=structuredClone(snapshot);
 input.events[0].bookmakers[0].markets[0].outcomes=[{player:'Example Player',name:'Over'}];
 const result=reconcileNbaRosters(input,roster());
 assert.equal(result.players.length,1);
 assert.equal(result.players[0].status,'current_roster_match_unverified_participation');
});
