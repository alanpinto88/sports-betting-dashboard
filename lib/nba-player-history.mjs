import {extractNbaPlayerGameStats,summarizeNbaLastFive} from './nba-player-game-stats.mjs';
// Build historical player research only from independently identified final games.
// Caller must supply completed game records with stable ESPN IDs and timestamps.
export function buildNbaPlayerHistory(playerName,records,{before}={}){
 if(typeof playerName!=='string'||!playerName.trim()||!Array.isArray(records))
  throw Error('Invalid player history input');
 const seen=new Set(),games=[],warnings=[];
 for(const record of records){
  const gameId=String(record?.gameId??'').trim();
  const startTime=record?.startTime;
  if(!gameId||!Number.isFinite(Date.parse(startTime)))throw Error('Invalid historical game identity');
  if(seen.has(gameId))throw Error('Duplicate historical game ID');
  seen.add(gameId);
  if(record.final!==true){warnings.push(gameId+': game not final');continue}
  if(!record.boxscore||!Array.isArray(record.boxscore.players)){
   warnings.push(gameId+': box score unavailable');continue;
  }
  const result=extractNbaPlayerGameStats(record.boxscore,playerName);
  if(result.status!=='stats_available')warnings.push(gameId+': '+result.status);
  games.push({...result,gameId,startTime,final:true});
 }
 const summary=summarizeNbaLastFive(games,{before});
 return {...summary,playerName,inspectedGames:records.length,warnings,
  status:summary.games===5?'five_completed_games':'partial_history',
  researchOnly:true,evEligible:false};
}
