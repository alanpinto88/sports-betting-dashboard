// Isolated, keyless Vercel connectivity probe. No paid endpoints or secrets.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  const checks = {
    demo: 'https://prizepicksapi.com/api/v1/demo/projections',
    coverage: 'https://prizepicksapi.com/api/v1/coverage'
  };
  const target = typeof req.query.check === 'string' ? req.query.check : 'demo';
  if (!Object.hasOwn(checks, target)) return res.status(400).json({ ok: false, error: 'Unknown check' });
  const started = Date.now();
  try {
    const response = await fetch(checks[target], {
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(10000)
    });
    return res.status(200).json({
      ok: true, check: target, reachable: true,
      providerHttpStatus: response.status,
      providerRespondedOk: response.ok,
      elapsedMs: Date.now() - started,
      note: target === 'coverage' ? 'Unauthenticated probe; HTTP 401/403 can be expected.' : 'Demo data is not real player projections.',
      paidRequestsEnabled: false
    });
  } catch (error) {
    const name = String(error?.name || '');
    const reason = name === 'TimeoutError' ? 'timeout' : name === 'TypeError' ? 'fetch_type_error' : 'network_or_runtime_error';
    return res.status(502).json({ ok: false, check: target, reachable: false, reason, elapsedMs: Date.now() - started, paidRequestsEnabled: false });
  }
}
