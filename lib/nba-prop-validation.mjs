// EV Sports NBA props: pure validation utilities, no network calls or API keys.
// This module does not enable predictions or change the existing website.
export function americanToProbability(odds) {
  if (!Number.isInteger(odds) || odds === 0 || Math.abs(odds) < 100) return null;
  return odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
}
export function normalizeProp(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const required = ['provider','playerId','eventId','stat','period','side'];
  if (required.some(k => typeof raw[k] !== 'string' || !raw[k].trim())) return null;
  if (typeof raw.line !== 'number') return null;
  const line = raw.line;
  if (!Number.isFinite(line) || line < 0) return null;
  const side = raw.side.trim().toLowerCase();
  if (!['over','under'].includes(side)) return null;
  return {
    provider: raw.provider.trim().toLowerCase(),
    playerId: raw.playerId.trim(),
    eventId: raw.eventId.trim(),
    stat: raw.stat.trim().toLowerCase().replace(/\s+/g,' '),
    period: raw.period.trim().toLowerCase().replace(/\s+/g,' '),
    side, line,
    odds: Number.isInteger(raw.odds) && Math.abs(raw.odds)>=100 ? raw.odds : null,
    capturedAt: raw.capturedAt || null,
    sourceId: raw.sourceId || null,
    verified: raw.verified === true
  };
}
export function sameMarket(a,b) {
  return !!a && !!b &&
    a.playerId === b.playerId && a.eventId === b.eventId &&
    a.stat === b.stat && a.period === b.period && a.line === b.line;
}
export function noVigPair(over,under) {
  if (!sameMarket(over,under) || over.side !== 'over' || under.side !== 'under') return null;
  // A no-vig pair must come from the same sportsbook, not synthetic cross-book sides.
  if (over.provider !== under.provider) return null;
  if (!over.verified || !under.verified || !over.sourceId || !under.sourceId ||
      !over.capturedAt || !under.capturedAt) return null;
  const pOver = americanToProbability(over.odds);
  const pUnder = americanToProbability(under.odds);
  if (pOver === null || pUnder === null || pOver + pUnder <= 0) return null;
  return {over: pOver/(pOver+pUnder),under: pUnder/(pOver+pUnder)};
}
export function evaluateEV(quote, probability) {
  if (!quote?.verified || !quote.sourceId || !quote.capturedAt ||
      !Number.isFinite(probability) || probability <= 0 || probability >= 1) return null;
  const implied = americanToProbability(quote.odds);
  if (implied === null) return null;
  const profit = quote.odds > 0 ? quote.odds/100 : 100/(-quote.odds);
  return {evPerDollar: probability*profit-(1-probability), impliedProbability: implied};
}
