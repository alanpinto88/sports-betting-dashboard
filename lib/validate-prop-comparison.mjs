// EV Sports — NBA prop quote validation (standalone, dependency-free).
// A quote is NOT a recommendation. Reject mismatched thresholds and stale records.
export function validatePropComparison(a, b, { now = Date.now(), maxAgeMs = 120000 } = {}) {
  const errors = [];
  const fields = ['eventId','playerId','market','period','side'];
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object')
    return { verified:false, errors:['Both quotes are required'] };
  for (const field of fields) {
    if (typeof a[field] !== 'string' || !a[field].trim() ||
        typeof b[field] !== 'string' || !b[field].trim() || a[field] !== b[field])
      errors.push(field + ' missing or mismatched');
  }
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line) || a.line !== b.line)
    errors.push('line missing or mismatched');
  for (const [name, q] of [['first',a],['second',b]]) {
    const ts = Date.parse(q.capturedAt);
    if (!Number.isFinite(ts) || ts > now || now - ts > maxAgeMs)
      errors.push(name + ' quote stale, future-dated or missing timestamp');
    if (typeof q.source !== 'string' || !q.source.trim())
      errors.push(name + ' source missing');
    if (typeof q.quoteId !== 'string' || !q.quoteId.trim())
      errors.push(name + ' quote ID missing');
  }
  if (a.source && b.source && a.source === b.source)
    errors.push('independent sources required');
  return { verified: errors.length === 0, errors };
}
