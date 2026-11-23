// EV Sports NBA player-prop quote validation (pure functions; no API calls).
// A verified label here means structurally comparable, NOT provider-authenticated.
export function validatePropQuote(q, now = Date.now(), maxAgeMs = 5 * 60_000) {
  const errors = [];
  if (!q || typeof q !== 'object') return { valid: false, errors: ['missing_quote'] };
  for (const k of ['provider','playerId','eventId','market','period','side','capturedAt'])
    if (typeof q[k] !== 'string' || !q[k].trim()) errors.push('missing_' + k);
  if (!['over','under'].includes(q.side)) errors.push('invalid_side');
  if (typeof q.line !== 'number' || !Number.isFinite(q.line) || q.line < 0) errors.push('invalid_line');
  if (!Number.isInteger(q.americanOdds) || (q.americanOdds > -100 && q.americanOdds < 100)) errors.push('invalid_odds');
  const captured = Date.parse(q.capturedAt);
  if (!Number.isFinite(captured)) errors.push('invalid_timestamp');
  else if (captured > now + 30_000 || now - captured > maxAgeMs) errors.push('stale_or_future_quote');
  if (q.providerVerified !== true) errors.push('provider_unverified');
  return { valid: errors.length === 0, errors };
}
export function comparePropQuotes(a, b, now = Date.now()) {
  const left = validatePropQuote(a, now), right = validatePropQuote(b, now);
  const errors = [...left.errors.map(x => 'left_' + x), ...right.errors.map(x => 'right_' + x)];
  if (left.valid && right.valid) {
    for (const k of ['playerId','eventId','market','period','line','side'])
      if (a[k] !== b[k]) errors.push('mismatch_' + k);
  }
  return { comparable: errors.length === 0, errors };
}
