import {normalizeNbaPropOutcomes} from './nba-prop-research-normalizer.mjs';
import {historicalNbaPriceMovements} from './nba-prop-historical-movement.mjs';
// Historical local captures only. No network, no provider authentication, no EV signals.
export function movementsFromSavedNbaSnapshots(records, now=Date.now()) {
 if(!Array.isArray(records)||!Number.isFinite(now))return [];
 const rows=[];
 const seenCaptures=new Set();
 for(const record of records.slice(-8)){
  if(!record||!Array.isArray(record.events)||typeof record.capture!=='string')continue;
  const t=Date.parse(record.capture);
  if(!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$/.test(record.capture)||!Number.isFinite(t)||new Date(t).toISOString().replace(/\\.000Z$/,'Z')!==record.capture&&new Date(t).toISOString()!==record.capture||t>now||seenCaptures.has(t))continue;
  seenCaptures.add(t);
  for(const quote of normalizeNbaPropOutcomes({events:record.events})){
   // A stored capture establishes when the snapshot was saved, not when the bookmaker updated a price.
   // Require an explicit quote-level update timestamp, valid and no later than the capture.
   const quoteTime=Date.parse(quote.capturedAt);
   if(typeof quote.capturedAt!=='string'||!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$/.test(quote.capturedAt)||!Number.isFinite(quoteTime)||quoteTime>t||quoteTime>now)continue;
   rows.push(quote);
  }
 }
 return historicalNbaPriceMovements(rows);
}
