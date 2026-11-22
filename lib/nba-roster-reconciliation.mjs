// Research-only roster comparison. Current roster listings are not historical
// participation evidence and must never attest sportsbook player/event identity.
const norm=x=>typeof x==='string'?x.trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US'):'';
export function reconcileNbaRosters(snapshot,teamRosters){
 if(!snapshot||!Array.isArray(snapshot.events)||!Array.isArray(teamRosters))
  throw Error('Invalid roster reconciliation inputs');
 const rosters=new Map();
 for(const roster of teamRosters){
  const team=norm(roster?.team);
  if(!team||!Array.isArray(roster?.players))throw Error('Invalid roster record');
  if(rosters.has(team))throw Error('Duplicate team roster');
  rosters.set(team,new Set(roster.players.map(norm).filter(Boolean)));
 }
 const players=new Map();
 for(const event of snapshot.events){
  if(!event||!Array.isArray(event.bookmakers)||!String(event.id??'').trim())throw Error('Invalid event');
  const home=norm(event.home_team),away=norm(event.away_team);
  if(!home||!away||home===away)throw Error('Invalid event teams');
  for(const book of event.bookmakers){
   if(!book||!Array.isArray(book.markets))throw Error('Invalid bookmaker');
   for(const market of book.markets){
    if(!market||!Array.isArray(market.outcomes))throw Error('Invalid market');
    if(!String(market.key||'').startsWith('player_'))continue;
    for(const outcome of market.outcomes){
     const name=norm(outcome?.description||outcome?.player);
     if(!name)continue;
     const key=JSON.stringify([String(event.id??''),name]);
     if(!players.has(key)){
      const teams=[home,away].filter(t=>rosters.get(t)?.has(name));
      const coverage=[home,away].every(t=>rosters.has(t));
      players.set(key,{eventId:event.id??null,playerName:name,
       status:teams.length>1?'ambiguous_team_roster':
        teams.length===1?'current_roster_match_unverified_participation':
        coverage?'not_listed_on_current_event_team_rosters':'roster_coverage_incomplete',
       teams,playerIdentityVerified:false,participationVerified:false});
     }
    }
   }
  }
 }
 return {status:'research_only',players:[...players.values()],
  verifiedPlayerQuotes:0,verifiedEVPicks:0};
}
