import { writeFile } from 'node:fs/promises';

// Verify PrizePicks coverage during the Vercel production build.
async function verifyCoverage() {
  

  const key = process.env.PRIZEPICKS_API_KEY;
  if (!key) throw new Error('PrizePicks production secret is unavailable.');

  let response;
  try {
    response = await fetch('https://prizepicksapi.com/api/v1/coverage', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
        'X-User-Request': 'Verify NBA dashboard coverage'
      },
      redirect: 'error',
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw new Error('PrizePicks coverage connection failed.');
  }

  if (!response.ok) {
    throw new Error(`PrizePicks coverage returned HTTP ${response.status}.`);
  }

  const payload = await response.json().catch(() => null);
  if (!Array.isArray(payload?.data) || !payload.data.some(row => row?.league === 'NBA')) {
    throw new Error('PrizePicks coverage response did not include NBA.');
  }

  return 'PrizePicks authenticated NBA coverage verified.';
}

const result = await verifyCoverage().then(message => ({ ok: true, message }), error => ({ ok: false, message: error.message }));
console.log(result.message);
await writeFile('prizepicks-coverage-diagnostic.json', JSON.stringify(result));
