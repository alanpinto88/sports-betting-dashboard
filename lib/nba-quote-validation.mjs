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
  if (!q.provider || !q.sourceId || !q.sportsbook) return {ok:false,reason:'missing_provenance'};
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
