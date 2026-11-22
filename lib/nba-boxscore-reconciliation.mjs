// Historical box-score research only. A box score can corroborate a player
// appearing for a team, but cannot authenticate a sportsbook quote or event ID.
const norm=x=>typeof x==='string'?x.trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US'):'';
export function reconcileNbaBoxscore(snapshotEvent,boxscore){
 if(!snapshotEvent||!String(snapshotEvent.id??'').trim()||!boxscore||
    !Array.isArray(boxscore.players))throw Error('Invalid box-score research inputs');
 const home=norm(snapshotEvent.home_team),away=norm(snapshotEvent.away_team);
 if(!home||!away||home===away)throw Error('Invalid event teams');
 const teams=new Map();
 for(const entry of boxscore.players){
  const team=norm(entry?.team?.displayName);
  if(!team||!Array.isArray(entry?.statistics))continue;
  if(teams.has(team))throw Error('Duplicate box-score team');
  const athletes=new Map();
  for(const group of entry.statistics){
   for(const record of group?.athletes||[]){
    const name=norm(record?.athlete?.displayName||record?.athlete?.fullName);
    if(!name)continue;
    if(athletes.has(name))throw Error('Ambiguous duplicate box-score athlete');
    athletes.set(name,{didNotPlay:Boolean(record.didNotPlay),
      stats:Array.isArray(record.stats)?record.stats:[]});
   }
  }
  teams.set(team,athletes);
 }
 const complete=teams.has(home)&&teams.has(away);
 const findings=[];
 const seen=new Set();
 for(const book of snapshotEvent.bookmakers||[]){
  for(const market of book.markets||[]){
   if(!String(market.key||'').startsWith('player_'))continue;
   for(const outcome of market.outcomes||[]){
    const name=norm(outcome?.description||outcome?.player);
    if(!name||seen.has(name))continue;
    seen.add(name);
    const found=[home,away].filter(team=>teams.get(team)?.has(name));
    const athlete=found.length===1?teams.get(found[0]).get(name):null;
    const status=found.length>1?'ambiguous_player_team':
      found.length===1?(athlete.didNotPlay?'listed_did_not_play':'listed_in_boxscore_unverified_minutes'):
      complete?'not_listed_in_boxscore':'boxscore_coverage_incomplete';
    findings.push({eventId:String(snapshotEvent.id),playerName:name,status,
      team:found.length===1?found[0]:null,verifiedQuote:false,evEligible:false});
   }
  }
 }
 return {status:'research_only',completeTeamCoverage:complete,findings,
  verifiedQuotes:0,evEligible:0};
}
