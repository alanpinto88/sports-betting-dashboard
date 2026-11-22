// Browser-safe, manual ESPN research collector. Never authenticates sportsbook odds.
import {buildNbaPlayerHistory} from './nba-player-history.mjs';
import {extractNbaPlayerGameStats} from './nba-player-game-stats.mjs';
export async function collectNbaPlayerHistory({playerName,teamId,before,fetchJson,maxGames=5}){
 if(typeof playerName!=='string'||!playerName.trim()||
    !/^[0-9]{1,6}$/.test(String(teamId))||!Number.isFinite(Date.parse(before))||
    typeof fetchJson!=='function'||!Number.isInteger(maxGames)||maxGames<1||maxGames>5)
  throw Error('Invalid ESPN history collection parameters');
 const cutoff=Date.parse(before),cutoffDate=new Date(cutoff),season=cutoffDate.getUTCFullYear()+(cutoffDate.getUTCMonth()>=6?1:0);
 const schedule=await fetchJson('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/'+teamId+'/schedule?season='+season);
 if(!Array.isArray(schedule?.events))throw Error('ESPN team schedule unavailable');
 const seen=new Set(),candidates=[];
 for(const e of schedule.events){
  const id=String(e?.id??''),date=Date.parse(e?.date);
  const final=e?.status?.type?.completed===true||e?.competitions?.[0]?.status?.type?.completed===true;
  if(!/^\d+$/.test(id)||!Number.isFinite(date)||date>=cutoff||!final||seen.has(id))continue;
  seen.add(id);candidates.push({gameId:id,startTime:e.date,final:true});
 }
 candidates.sort((a,b)=>Date.parse(b.startTime)-Date.parse(a.startTime));
 // Bounded requests: at most 12 completed team games to find five player appearances.
 const records=[],warnings=[];
 for(const candidate of candidates.slice(0,12)){
  const summary=await fetchJson('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event='+candidate.gameId);
  const complete=summary?.header?.competitions?.[0]?.status?.type?.completed===true||
    summary?.header?.competitions?.[0]?.competitors?.every(c=>c?.winner!==undefined)&&
    summary?.header?.competitions?.[0]?.status?.type?.name==='STATUS_FINAL';
  if(!complete){warnings.push(candidate.gameId+': final status not confirmed in summary');continue}
  const player=Array.isArray(summary?.boxscore?.players)?extractNbaPlayerGameStats(summary.boxscore,playerName):null;
  if(player?.stats&&player.stats.teamId!==String(teamId)){
   warnings.push(candidate.gameId+': player team ID does not match requested ESPN team');
   continue;
  }
  if(player?.stats?.teamId==null){
   warnings.push(candidate.gameId+': player team ID unavailable; excluded');
   continue;
  }
  records.push({...candidate,boxscore:summary.boxscore});
  const current=buildNbaPlayerHistory(playerName,records,{before});
  if(current.games>=maxGames)break;
 }
 const history=buildNbaPlayerHistory(playerName,records,{before});
 return {...history,warnings:[...warnings,...history.warnings],teamId:String(teamId),
  source:'ESPN historical team schedule and final box scores',requestedGames:maxGames,
  complete:history.games>=maxGames,verifiedQuote:false,evEligible:false};
}
