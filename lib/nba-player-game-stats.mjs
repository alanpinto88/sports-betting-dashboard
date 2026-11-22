// ESPN box-score stat extraction for historical research, never EV verification.
// Uses column labels rather than positional assumptions across provider formats.
const norm=x=>typeof x==='string'?x.trim().replace(/\s+/g,' ').toLowerCase():'';
const numeric=x=>typeof x==='string'&&/^\d+(?:\.\d+)?$/.test(x.trim())?Number(x):null;
const minutes=x=>{
 if(typeof x!=='string')return null;
 if(/^\d+:\d{2}$/.test(x.trim())){const [m,s]=x.trim().split(':').map(Number);return s<60?+(m+s/60).toFixed(2):null}
 return numeric(x);
};
export function extractNbaPlayerGameStats(boxscore,playerName){
 if(!Array.isArray(boxscore?.players)||!norm(playerName))throw Error('Invalid box-score stats input');
 const matches=[];
 for(const team of boxscore.players){
  for(const group of team?.statistics||[]){
   const labels=(group.labels||[]).map(norm);
   for(const row of group.athletes||[]){
    if(norm(row?.athlete?.displayName||row?.athlete?.fullName)!==norm(playerName))continue;
    const values=row.stats||[];
    const at=(...keys)=>{const i=labels.findIndex(k=>keys.includes(k));return i<0?null:values[i]};
    const dnp=Boolean(row.didNotPlay);
    const points=numeric(at('pts','points')),rebounds=numeric(at('reb','rebounds')),
      assists=numeric(at('ast','assists')),mins=minutes(at('min','minutes'));
    matches.push({playerName:row.athlete.displayName||row.athlete.fullName,
      team:team?.team?.displayName||null,didNotPlay:dnp,
      points:dnp?null:points,rebounds:dnp?null:rebounds,
      assists:dnp?null:assists,minutes:dnp?null:mins});
   }
  }
 }
 if(matches.length!==1)return {status:matches.length?'ambiguous_player':'player_not_found',stats:null};
 const stats=matches[0];
 return {status:stats.didNotPlay?'did_not_play':
  [stats.points,stats.rebounds,stats.assists,stats.minutes].every(Number.isFinite)?'stats_available':'stats_incomplete',
  stats,verifiedQuote:false,evEligible:false};
}
// Each record must identify a distinct historical game and an explicit start time.
// Never average duplicate games, future games, or DNP/incomplete statistics.
export function summarizeNbaLastFive(games,{before}={}){
 if(!Array.isArray(games))throw Error('Invalid player game history');
 const cutoff=before===undefined?Infinity:Date.parse(before);
 if(Number.isNaN(cutoff))throw Error('Invalid history cutoff');
 const seen=new Set(),eligible=[];
 for(const game of games){
  const id=String(game?.gameId??'').trim(),time=Date.parse(game?.startTime);
  if(!id||!Number.isFinite(time))throw Error('Missing historical game identity or date');
  if(seen.has(id))throw Error('Duplicate historical game ID');
  seen.add(id);
  if(time>=cutoff||game.status!=='stats_available'||!game.stats||game.stats.didNotPlay)continue;
  if(!['points','rebounds','assists','minutes'].every(key=>Number.isFinite(game.stats[key])&&game.stats[key]>=0))continue;
  eligible.push({...game,startTimestamp:time});
 }
 eligible.sort((a,b)=>b.startTimestamp-a.startTimestamp);
 const selected=eligible.slice(0,5);
 const average=key=>selected.length?+(selected.reduce((sum,g)=>sum+g.stats[key],0)/selected.length).toFixed(2):null;
 return {games:selected.length,gameIds:selected.map(g=>String(g.gameId)),
  points:average('points'),rebounds:average('rebounds'),
  assists:average('assists'),minutes:average('minutes'),researchOnly:true,evEligible:false};
}
