import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileNbaSchedule} from '../lib/nba-schedule-reconciliation.mjs';
import {reconcileNbaRosters} from '../lib/nba-roster-reconciliation.mjs';
import {buildNbaResearchReport} from '../lib/nba-research-report.mjs';
const snapshot={events:[{id:'provider-event-1',home_team:'Atlanta Hawks',
 away_team:'Charlotte Hornets',commence_time:'2026-11-21T00:10:00Z',
 bookmakers:[{markets:[{key:'player_points',outcomes:[
  {description:'Example Player',name:'Over',point:20.5,price:-110},
  {description:'Example Player',name:'Under',point:20.5,price:-110}
 ]}]}]}]};
test('complete schedule-roster-research pipeline remains non-bettable',()=>{
 const schedule=reconcileNbaSchedule(snapshot,[{homeTeam:'Atlanta Hawks',
  awayTeam:'Charlotte Hornets',startTime:'2026-11-21T00:00:00Z'}]);
 const roster=reconcileNbaRosters(snapshot,[{team:'Atlanta Hawks',players:['Example Player']},
  {team:'Charlotte Hornets',players:[]}]);
 const report=buildNbaResearchReport(schedule,roster);
 assert.equal(schedule.matched,1);
 assert.equal(roster.players.length,1);
 assert.equal(report.findings.length,1);
 assert.equal(report.findings[0].scheduleStatus,'schedule_match_unverified_identity');
 assert.equal(report.findings[0].rosterStatus,'current_roster_match_unverified_participation');
 assert.equal(report.findings[0].evEligible,false);
 assert.equal(report.verifiedPlayerEvents,0);
 assert.equal(report.evEligible,0);
});
test('player assigned to a different game is flagged for roster review',()=>{
 const schedule=reconcileNbaSchedule(snapshot,[{homeTeam:'Atlanta Hawks',
  awayTeam:'Charlotte Hornets',startTime:'2026-11-21T00:00:00Z'}]);
 const roster=reconcileNbaRosters(snapshot,[{team:'Atlanta Hawks',players:[]},
  {team:'Charlotte Hornets',players:[]}]);
 const report=buildNbaResearchReport(schedule,roster);
 assert.ok(report.findings[0].flags.includes('roster_review_required'));
 assert.equal(report.findings[0].evEligible,false);
});

test('roster normalization handles extra whitespace in provider player names',()=>{
 const input=structuredClone(snapshot);
 input.events[0].bookmakers[0].markets[0].outcomes[0].description='  Example   Player  ';
 const roster=reconcileNbaRosters(input,[{team:'Atlanta Hawks',players:['Example Player']},
  {team:'Charlotte Hornets',players:[]}]);
 assert.equal(roster.players.length,1);
 assert.equal(roster.players[0].status,'current_roster_match_unverified_participation');
});
