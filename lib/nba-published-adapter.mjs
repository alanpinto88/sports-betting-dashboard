// Published NBA research snapshot adapter. No network requests, credentials, or recommendations.
import {normalizeProp,americanToProbability} from './nba-prop-validation.mjs';
export function validatePublishedQuote(q, now=Date.now()) {
 if(!q || typeof q!=='object' || q.verified!==true) return {ok:false,reason:'unverified'};
 // Require an explicit timezone; date-only and local-time strings are ambiguous.
 if(typeof q.captured_at!=='string' || !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$/.test(q.captured_at)) return {ok:false,reason:'invalid-timestamp'};
 const timestamp=Date.parse(q.captured_at);
 if(!Number.isFinite(timestamp) || timestamp>now || now-timestamp>15*60*1000) return {ok:false,reason:'stale'};
 const sourceId=q.source_id??q.quote_id;
 if(typeof sourceId!=='string' || !sourceId.trim()) return {ok:false,reason:'missing-source-id'};
 const normalized=normalizeProp({
   provider:q.sportsbook||q.source,playerId:q.player_id,eventId:q.event_id,
   stat:q.market,period:q.period,side:q.side,line:q.line,odds:q.american_odds,
   capturedAt:q.captured_at,sourceId,verified:q.verified
 });
 if(!normalized || americanToProbability(normalized.odds)===null)
   return {ok:false,reason:'incomplete'};
 return {ok:true,quote:normalized};
}
export function groupComparableQuotes(records,now=Date.now()) {
 const groups=new Map();
 for(const raw of records){
  const result=validatePublishedQuote(raw,now);
  if(!result.ok)continue;
  const q=result.quote;
  const key=JSON.stringify([q.playerId,q.eventId,q.stat,q.period,q.line,q.side]);
  if(!groups.has(key))groups.set(key,{key,books:new Set(),quotes:[]});
  const group=groups.get(key);
  group.books.add(q.provider);group.quotes.push(q);
 }
 return [...groups.values()].map(g=>({key:g.key,books:[...g.books],quotes:g.quotes,matched:g.books.size>=2}));
}
