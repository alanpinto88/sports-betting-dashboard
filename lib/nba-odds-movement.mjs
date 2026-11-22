// Historical NBA prop quote movement. Pure calculations, no API calls.
import {validatePublishedQuote} from './nba-published-adapter.mjs';
export function summarizeNbaMovement(records,{now=Date.now(),minimumProbabilityPoints=3}={}) {
 if(!Array.isArray(records) || !Number.isFinite(now) || !Number.isFinite(minimumProbabilityPoints) || minimumProbabilityPoints<=0) return [];
 const groups=new Map();
 for(const raw of records){
  // Historical records require provenance, but may be older than the live 15-minute window.
  const at=Date.parse(raw?.captured_at);
  if(!Number.isFinite(at) || at>now)continue;
  const start=Date.parse(raw?.event_starts_at);
  // Historical pregame analysis requires an explicit valid event start.
  if(typeof raw?.event_starts_at!=='string' || !Number.isFinite(start) || at>=start)continue;
  const checked=validatePublishedQuote(raw,at);
  if(!checked.ok)continue;
  const q=checked.quote;
  const key=JSON.stringify([q.provider,q.playerId,q.eventId,q.stat,q.period,q.side,q.line]);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({...q,time:at,eventStart:start});
 }
 const results=[];
 for(const [key,items] of groups){
  items.sort((a,b)=>a.time-b.time);
  // A market cannot have contradictory scheduled starts in its source history.
  if(new Set(items.map(q=>q.eventStart)).size!==1)continue;
  // Conflicting quotes at the same timestamp cannot establish a reliable sequence.
  const byTime=new Map();
  let conflict=false;
  for(const q of items){
   const previous=byTime.get(q.time);
   if(previous && previous.odds!==q.odds){conflict=true;break;}
   if(!previous)byTime.set(q.time,q);
  }
  if(conflict)continue;
  // A source quote ID must not be reused at different capture times.
  const sourceTimes=new Map();
  for(const q of items){
   const prior=sourceTimes.get(q.sourceId);
   if(prior!==undefined && prior!==q.time){conflict=true;break;}
   sourceTimes.set(q.sourceId,q.time);
  }
  if(conflict)continue;
  const unique=[...byTime.values()].sort((a,b)=>a.time-b.time);
  if(unique.length<2)continue;
  const first=unique[0],last=unique[unique.length-1];
  const prob=odds=>odds>0?100/(odds+100):-odds/(-odds+100);
  const changePoints=(prob(last.odds)-prob(first.odds))*100;
  results.push({key,provider:last.provider,playerId:last.playerId,eventId:last.eventId,
   stat:last.stat,period:last.period,side:last.side,line:last.line,
   openingOdds:first.odds,latestOdds:last.odds,openingAt:first.capturedAt,
   latestAt:last.capturedAt,probabilityPointChange:changePoints,
   significant:Math.abs(changePoints)>=minimumProbabilityPoints,
   snapshotCount:unique.length,verifiedHistorical:true});
 }
 return results.sort((a,b)=>Math.abs(b.probabilityPointChange)-Math.abs(a.probabilityPointChange));
}

/**
 * Summarize why a published historical dataset is not fully usable.
 * These counts are quote-level diagnostics, not proof of independent verification.
 */
export function auditNbaHistory(records,{now=Date.now()}={}){
 const result={total:0,eligible:0,unverified:0,invalidCapture:0,missingEventStart:0,notPregame:0,invalidQuote:0};
 if(!Array.isArray(records)||!Number.isFinite(now))return result;
 result.total=records.length;
 for(const raw of records){
  if(raw?.verified!==true){result.unverified++;continue;}
  const at=Date.parse(raw?.captured_at);
  if(!Number.isFinite(at)||at>now){result.invalidCapture++;continue;}
  const start=typeof raw?.event_starts_at==='string'?Date.parse(raw.event_starts_at):NaN;
  if(!Number.isFinite(start)){result.missingEventStart++;continue;}
  if(at>=start){result.notPregame++;continue;}
  if(!validatePublishedQuote(raw,at).ok){result.invalidQuote++;continue;}
  result.eligible++;
 }
 return result;
}
