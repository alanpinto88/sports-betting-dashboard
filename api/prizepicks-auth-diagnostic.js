import { createHash, timingSafeEqual } from 'node:crypto';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const token = req.headers['x-diagnostic-token'];
  const expected = Buffer.from('02ab69eaf58683473964e3ec3ed07ee67b506bc90769dc3819a21312d1bcc3cc', 'hex');
  if (req.method !== 'POST' || typeof token !== 'string' ||
      !timingSafeEqual(createHash('sha256').update(token).digest(), expected)) {
    return res.status(404).end();
  }
  const key = process.env.PRIZEPICKS_API_KEY;
  if (!key) return res.status(503).json({ result: 'secret_unavailable' });
  try {
    const response = await fetch('https://prizepicksapi.com/api/v1/coverage', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}`, 'X-User-Request': 'Verify NBA dashboard coverage' },
      redirect: 'manual',
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.json({ providerStatus: response.status });
    const payload = await response.json();
    return res.json({
      providerStatus: response.status,
      nbaCoverage: Array.isArray(payload?.data) && payload.data.some(row => row?.league === 'NBA')
    });
  } catch {
    return res.status(502).json({ result: 'provider_connection_failed' });
  }
}
