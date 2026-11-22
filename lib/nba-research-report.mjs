// Combines independent schedule and current-roster research without upgrading
// either source into verified sportsbook identities or betting recommendations.
export function buildNbaResearchReport(schedule,rosters){
 if(!schedule||!Array.isArray(schedule.events)||!rosters||!Array.isArray(rosters.players))
  throw Error('Invalid NBA research inputs');
 const events=new Map();
 for(const e of schedule.events){
  const id=String(e?.eventId??'');
  if(!id||events.has(id))throw Error('Missing or duplicate schedule event ID');
  events.set(id,e.status);
 }
 const seenPlayers=new Set();
 const findings=rosters.players.map(p=>{
  const eventId=String(p?.eventId??'');
  const playerName=typeof p?.playerName==='string'?p.playerName.trim():'';
  if(!eventId||!playerName)throw Error('Missing player/event research identity');
  const key=JSON.stringify([eventId,playerName.toLocaleLowerCase('en-US')]);
  if(seenPlayers.has(key))throw Error('Duplicate player/event research record');
  seenPlayers.add(key);
  const scheduleStatus=events.get(eventId)||'schedule_not_checked';
  const rosterStatus=String(p?.status||'roster_not_checked');
  const flags=[];
  if(scheduleStatus!=='schedule_match_unverified_identity')flags.push('schedule_review_required');
  if(rosterStatus!=='current_roster_match_unverified_participation')flags.push('roster_review_required');
  flags.push('player_game_participation_unverified','sportsbook_event_identity_unverified','quotes_unverified');
  return {eventId,playerName,scheduleStatus,rosterStatus,flags,
   verified:false,evEligible:false};
 });
 return {status:'research_only',findings,verifiedPlayerEvents:0,evEligible:0,
  warnings:['Current rosters do not prove historical participation',
   'Schedule matching does not verify sportsbook event IDs',
   'No sportsbook quote or EV recommendation is independently verified']};
}
