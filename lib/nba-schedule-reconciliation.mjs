// Research-only comparison of sportsbook snapshot events with an independent
// schedule. Never equates provider event IDs or verifies player identities.
const normalizeTeam = value => typeof value==='string'
 ? value.trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US') : '';
const normalizeTime = value => typeof value==='string'&&value.trim() ? Date.parse(value) : NaN;
export function reconcileNbaSchedule(snapshot,officialGames,{toleranceMinutes=90}={}){
 if(!snapshot||!Array.isArray(snapshot.events)||!Array.isArray(officialGames)||
    !Number.isFinite(toleranceMinutes)||toleranceMinutes<0)
  throw Error('Invalid schedule reconciliation inputs');
 const tolerance=toleranceMinutes*60000;
 const results=snapshot.events.map(event=>{
  const home=normalizeTeam(event?.home_team),away=normalizeTeam(event?.away_team);
  const start=normalizeTime(event?.commence_time);
  if(!home||!away||home===away||!Number.isFinite(start))
   return {eventId:event?.id??null,status:'invalid_snapshot_event',matches:0};
  const matches=officialGames.filter(game=>{
   const scheduled=normalizeTime(game?.startTime);
   return normalizeTeam(game?.homeTeam)===home&&
    normalizeTeam(game?.awayTeam)===away&&Number.isFinite(scheduled)&&
    Math.abs(scheduled-start)<=tolerance;
  });
  return {eventId:event.id??null,
   status:matches.length===1?'schedule_match_unverified_identity':
    matches.length?'ambiguous_schedule_match':'schedule_not_matched',
   matches:matches.length};
 });
 return {status:'research_only',events:results,
  matched:results.filter(e=>e.status==='schedule_match_unverified_identity').length,
  ambiguous:results.filter(e=>e.status==='ambiguous_schedule_match').length,
  unmatched:results.filter(e=>e.status!=='schedule_match_unverified_identity'&&e.status!=='ambiguous_schedule_match').length,
  playerIdentityVerified:false,providerEventIdVerified:false,fullSlateVerified:false};
}
