// EV Sports — pure NBA prop quote validation utilities (no network calls, no API keys).
// All input is untrusted; these functions never claim a model prediction.
export function impliedProbability(american) {
  if (!Number.isInteger(american) || (american > -100 && american < 100)) return null;
  return american < 0 ? -american / (-american + 100) : 100 / (american + 100);
}
export function decimalOdds(american) {
  if (impliedProbability(american) === null) return null;
  return american < 0 ? 1 + 100 / -american : 1 + american / 100;
}
export function marketKey(q) {
  const fields = ['league', 'eventId', 'playerId', 'stat', 'period', 'line'];
  if (!q || fields.some(k => q[k] === undefined || q[k] === null || String(q[k]).trim() === '')) return null;
  if (q.league !== 'NBA' || typeof q.line !== 'number' || !Number.isFinite(q.line) || q.line < 0) return null;
  return JSON.stringify(fields.map(k => q[k]));
}
export function validateQuote(q, now = Date.now(), maxAgeMs = 5 * 60 * 1000) {
  const key = marketKey(q);
  if (!key) return {ok:false,reason:'missing_or_invalid_market_identity'};
  if (q.side !== 'over' && q.side !== 'under') return {ok:false,reason:'invalid_side'};
  if (typeof q.provider !== 'string' || !q.provider.trim() || typeof q.sourceId !== 'string' || !q.sourceId.trim() || typeof q.sportsbook !== 'string' || !q.sportsbook.trim()) return {ok:false,reason:'missing_provenance'};
  if (impliedProbability(q.americanOdds) === null) return {ok:false,reason:'invalid_odds'};
  const captured = Date.parse(q.capturedAt);
  if (!Number.isFinite(captured) || !Number.isFinite(now) || captured > now || now - captured > maxAgeMs)
    return {ok:false,reason:'stale_or_invalid_timestamp'};
  if (q.suspended === true) return {ok:false,reason:'suspended'};
  return {ok:true,key,ageMs:now-captured};
}
export function noVigPair(over, under, now = Date.now()) {
  const a = validateQuote(over,now), b = validateQuote(under,now);
  if (!a.ok || !b.ok) return {ok:false,reason:'unverified_quote',details:[a.reason,b.reason]};
  if (a.key !== b.key || over.side !== 'over' || under.side !== 'under' || over.sportsbook !== under.sportsbook)
    return {ok:false,reason:'non_comparable_market'};
  const po = impliedProbability(over.americanOdds), pu = impliedProbability(under.americanOdds);
  const sum = po + pu;
  if (!(sum > 0)) return {ok:false,reason:'invalid_probability_sum'};
  return {ok:true,marketImpliedOver:po/sum,marketImpliedUnder:pu/sum,overround:sum-1,
    label:'No-vig market-implied probabilities; not predictive probabilities'};
}
export function expectedValue(americanOdds, calibratedProbability) {
  const dec = decimalOdds(americanOdds);
  if (dec === null || typeof calibratedProbability !== 'number' || !Number.isFinite(calibratedProbability) ||
      calibratedProbability < 0 || calibratedProbability > 1) return null;
  return calibratedProbability * (dec - 1) - (1 - calibratedProbability);
}

/**
 * Group verified-format NBA quotes for research. This does not certify upstream
 * source authenticity or establish positive EV.
 * Side is included: Over and Under must never be compared as the same selection.
 */
export function crossBookGroups(quotes,now=Date.now()){
 const grouped=new Map();
 for(const q of Array.isArray(quotes)?quotes:[]){
  if(!validateQuote(q,now).ok)continue;
  const key=JSON.stringify([marketKey(q),q.side]);
  if(!grouped.has(key))grouped.set(key,new Map());
  const books=grouped.get(key),book=q.sportsbook.trim().toLowerCase();
  if(!book)continue;
  const prior=books.get(book);
  if(!prior||Date.parse(q.capturedAt)>Date.parse(prior.capturedAt))books.set(book,q);
 }
 return [...grouped.entries()].filter(([,books])=>books.size>=2).map(([key,books])=>({key,quotes:[...books.values()]}));
}

/**
 * Production-eligibility gate for cross-book research groups.
 * The allowlists and identity attestations must come from a trusted ingestion
 * process, never from fields copied out of the same sportsbook snapshot.
 */
export function verifiedCrossBookGroups(quotes,{trustedProviders=[],verifiedIdentityKeys=[],now=Date.now()}={}){
 if(!Array.isArray(trustedProviders)||!trustedProviders.length||
    !Array.isArray(verifiedIdentityKeys)||!verifiedIdentityKeys.length)
   return {enabled:false,reason:'missing_independent_verification',groups:[]};
 const providers=new Set(trustedProviders),identities=new Set(verifiedIdentityKeys);
 const eligible=(Array.isArray(quotes)?quotes:[]).filter(q=>{
  if(!validateQuote(q,now).ok||!providers.has(q.provider))return false;
  const identity=JSON.stringify([q.league,q.eventId,q.playerId]);
  return identities.has(identity);
 });
 const groups=crossBookGroups(eligible,now);
 return {enabled:groups.length>0,reason:groups.length?'verified_comparison_groups':'no_eligible_comparison_groups',groups};
}
