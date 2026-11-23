import {normalizeNbaPropOutcomes} from './nba-prop-research-normalizer.mjs';
import {historicalNbaPriceMovements} from './nba-prop-historical-movement.mjs';
// Historical local captures only. No network, no provider authentication, no EV signals.
export function movementsFromSavedNbaSnapshots(records, now=Date.now()) {
 if(!Array.isArray(records)||!Number.isFinite(now)||now<0)return [];
 const rows=[];
 const validUtc=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)&&
   Number.isFinite(Date.parse(value))&&
   [new Date(Date.parse(value)).toISOString(),new Date(Date.parse(value)).toISOString().replace(/\.000Z$/,'Z')].includes(value);
 const seenCaptures=new Set();
 // Choose the eight most recent valid captures by timestamp, independent of input order.
 // Invalid records must not displace valid historical captures.
 const distinct=new Map();
 for(const record of records){
  if(!record||!Array.isArray(record.events)||!validUtc(record.capture)||Date.parse(record.capture)>now)continue;
  const timestamp=Date.parse(record.capture);
  // Browser storage is JSON, but callers may supply malformed cyclic objects.
  // Fail closed rather than letting one bad record crash the movement display.
  let fingerprint;
  try{fingerprint=JSON.stringify(record.events);}catch{continue;}
  if(typeof fingerprint!=='string')continue;
  if(!distinct.has(timestamp))distinct.set(timestamp,{record,fingerprint});
  else if(distinct.get(timestamp)!==null&&distinct.get(timestamp).fingerprint!==fingerprint)distinct.set(timestamp,null);
 }
 const ordered=[...distinct.values()].filter(Boolean).map(entry=>entry.record).sort((a,b)=>Date.parse(a.capture)-Date.parse(b.capture));
 for(const record of ordered.slice(-8)){
  if(!record||!Array.isArray(record.events)||typeof record.capture!=='string')continue;
 
  if(!validUtc(record.capture))continue;
  const t=Date.parse(record.capture);
  if(t>now||seenCaptures.has(t))continue;
  seenCaptures.add(t);
  for(const quote of normalizeNbaPropOutcomes({events:record.events})){
   // A stored capture establishes when the snapshot was saved, not when the bookmaker updated a price.
   // Require an explicit quote-level update timestamp, valid and no later than the capture.
   // A bookmaker-wide update timestamp does not establish when this prop
   // market changed. Require explicit market-level provenance for movement.
   if(quote.timestampSource!=='market'||!validUtc(quote.capturedAt))continue;
   const quoteTime=Date.parse(quote.capturedAt);
   if(quoteTime>t||quoteTime>now)continue;
   rows.push(quote);
  }
 }
 return historicalNbaPriceMovements(rows);
}
