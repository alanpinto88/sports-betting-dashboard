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
  // Provider verification is an upstream trust assertion; this function cannot authenticate it.
  if (!Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) errors.push('invalid_validation_clock');
  return { valid: errors.length === 0, errors };
}
export function comparePropQuotes(a, b, now = Date.now()) {
  const left = validatePropQuote(a, now), right = validatePropQuote(b, now);
  const errors = [...left.errors.map(x => 'left_' + x), ...right.errors.map(x => 'right_' + x)];
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of ['playerId','eventId','market','period','line','side'])
      if (a[k] !== b[k]) errors.push('mismatch_' + k);
  }
  return { comparable: errors.length === 0, errors };
}

/**
 * Check whether two opposite-side quotes describe the same player prop.
 * This is a prerequisite for no-vig modeling, not proof of provider authenticity.
 */
export function validateTwoWayPropMarket(over, under, now = Date.now()) {
  const left = validatePropQuote(over, now);
  const right = validatePropQuote(under, now);
  const errors = [
    ...left.errors.map(error => 'over_' + error),
    ...right.errors.map(error => 'under_' + error)
  ];
  if (over && under && typeof over === 'object' && typeof under === 'object') {
    if (over.side !== 'over') errors.push('invalid_over_side');
    if (under.side !== 'under') errors.push('invalid_under_side');
    for (const key of ['playerId', 'eventId', 'market', 'period', 'line', 'provider']) {
      if (over[key] !== under[key]) errors.push('mismatch_' + key);
    }
  }
  return { valid: errors.length === 0, errors };
}
