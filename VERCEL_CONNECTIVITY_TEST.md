# Isolated Vercel connectivity test

This branch adds `api/prizepicks-connectivity.js` for a Vercel deployment. It does **not** change the GitHub Pages site or Cloudflare Workers.

Deploy this branch as a separate Vercel project (Framework Preset: Other; no build command required for the function). Do not configure any API keys for this test.

Visit:
- `https://YOUR-VERCEL-DOMAIN/api/prizepicks-connectivity?check=demo`
- `https://YOUR-VERCEL-DOMAIN/api/prizepicks-connectivity?check=coverage`

Interpretation:
- `reachable:true`: Vercel received an HTTP response from the upstream. A 401/403 on the unauthenticated coverage probe is expected and still proves HTTP connectivity.
- `reachable:false`: Vercel could not obtain an HTTP response. Check provider hostname, restrictions, and hosting networking.
- A demo response is not real PrizePicks data, and this test does not validate API credentials.
- No secret is used, no provider response body is exposed, and no paid comparison request is made.

Only consider switching your dashboard after successful independent tests and authorized provider access. Keep the Cloudflare Worker unchanged.
