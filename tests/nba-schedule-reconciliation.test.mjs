import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileNbaSchedule} from '../lib/nba-schedule-reconciliation.mjs';
const snapshot={events:[{id:'provider-event-1',home_team:'Atlanta Hawks',away_team:'Charlotte Hornets',commence_time:'2026-11-21T00:10:00Z'}]};
const game={homeTeam:'Atlanta Hawks',awayTeam:'Charlotte Hornets',startTime:'2026-11-21T00:00:00Z'};
test('matching independent schedule does not verify player or provider event IDs',()=>{
 const result=reconcileNbaSchedule(snapshot,[game]);
 assert.equal(result.matched,1);
 assert.equal(result.events[0].status,'schedule_match_unverified_identity');
 assert.equal(result.playerIdentityVerified,false);
 assert.equal(result.providerEventIdVerified,false);
 assert.equal(result.fullSlateVerified,false);
});
test('opposite home and away sides cannot match',()=>{
 const result=reconcileNbaSchedule(snapshot,[{...game,homeTeam:game.awayTeam,awayTeam:game.homeTeam}]);
 assert.equal(result.unmatched,1);
});
test('outside schedule time tolerance is not a match',()=>{
 const result=reconcileNbaSchedule(snapshot,[{...game,startTime:'2026-11-21T04:00:00Z'}]);
 assert.equal(result.unmatched,1);
});
test('multiple matching schedule entries remain ambiguous',()=>{
 const result=reconcileNbaSchedule(snapshot,[game,{...game}]);
 assert.equal(result.ambiguous,1);
 assert.equal(result.matched,0);
});
test('malformed event is explicitly rejected from matching',()=>{
 const result=reconcileNbaSchedule({events:[{id:'bad',home_team:'Atlanta Hawks'}]},[game]);
 assert.equal(result.events[0].status,'invalid_snapshot_event');
});
test('invalid tolerance fails closed',()=>{
 assert.throws(()=>reconcileNbaSchedule(snapshot,[game],{toleranceMinutes:-1}),/Invalid schedule/);
});
