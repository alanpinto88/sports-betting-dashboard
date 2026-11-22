import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNbaResearchReport} from '../lib/nba-research-report.mjs';
const schedule={events:[{eventId:'event-1',status:'schedule_match_unverified_identity'}]};
const rosters={players:[{eventId:'event-1',playerName:'Example Player',status:'current_roster_match_unverified_participation'}]};
test('schedule and roster matches never unlock EV',()=>{
 const r=buildNbaResearchReport(schedule,rosters);
 assert.equal(r.findings[0].verified,false);
 assert.equal(r.findings[0].evEligible,false);
 assert.equal(r.verifiedPlayerEvents,0);
 assert.equal(r.evEligible,0);
 assert.deepEqual(r.findings[0].flags,['player_game_participation_unverified','sportsbook_event_identity_unverified','quotes_unverified']);
});
test('unmatched schedule and roster produce explicit flags',()=>{
 const r=buildNbaResearchReport({events:[{eventId:'event-1',status:'schedule_not_matched'}]},
 {players:[{...rosters.players[0],status:'roster_coverage_incomplete'}]});
 assert.ok(r.findings[0].flags.includes('schedule_review_required'));
 assert.ok(r.findings[0].flags.includes('roster_review_required'));
});
test('missing schedule record remains unverified',()=>{
 const r=buildNbaResearchReport({events:[]},rosters);
 assert.equal(r.findings[0].scheduleStatus,'schedule_not_checked');
 assert.equal(r.findings[0].evEligible,false);
});
test('duplicate schedule event identifiers fail closed',()=>{
 assert.throws(()=>buildNbaResearchReport({events:[schedule.events[0],schedule.events[0]]},rosters),/duplicate schedule/);
});

test('duplicate player-event records fail closed',()=>{
 assert.throws(()=>buildNbaResearchReport(schedule,{players:[rosters.players[0],{...rosters.players[0],playerName:'example player'}]}),/Duplicate player\/event/);
});
test('missing player name fails closed',()=>{
 assert.throws(()=>buildNbaResearchReport(schedule,{players:[{...rosters.players[0],playerName:''}]}),/Missing player\/event/);
});
