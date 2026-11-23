// EV Sports — NBA prop quote validation (standalone, dependency-free).
// A quote is NOT a recommendation. Reject mismatched thresholds and stale records.
export function validatePropComparison(a, b, { now = Date.now(), maxAgeMs = 120000 } = {}) {
  const errors = [];
  if (!Number.isFinite(now) || now < 0 || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0)
    errors.push('invalid validation clock');
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
    const raw = q.capturedAt;
    const ts = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(raw) ? Date.parse(raw) : NaN;
    const canonical = Number.isFinite(ts) && (new Date(ts).toISOString() === raw || new Date(ts).toISOString().replace(/\.000Z$/, 'Z') === raw);
    if (!canonical || ts > now || now - ts > maxAgeMs)
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
