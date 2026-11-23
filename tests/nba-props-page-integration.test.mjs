import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../nba-props.html', import.meta.url), 'utf8');

test('NBA player props imports the validation module', () => {
  assert.match(page, /import\s*\{\s*validatePropQuote,\s*comparePropQuotes,\s*validateTwoWayPropMarket\s*\}\s*from\s*['"]\.\/src\/nba-prop-quote-validation\.mjs['"]/);
});
test('NBA props validation panel is accessible', () => {
  assert.match(page, /id="nbaValidationGate"[^>]*role="status"/);
  assert.match(page, /id="nbaValidationDetail"/);
});
test('snapshot event is emitted and handled', () => {
  assert.match(page, /dispatchEvent\(new CustomEvent\('evsports:nba-snapshot-loaded'/);
  assert.match(page, /addEventListener\('evsports:nba-snapshot-loaded'/);
});
test('snapshot failure is emitted and handled', () => {
  assert.match(page, /dispatchEvent\(new Event\('evsports:nba-snapshot-unavailable'\)/);
  assert.match(page, /addEventListener\('evsports:nba-snapshot-unavailable'/);
});
test('raw quotes never become verified automatically', () => {
  assert.match(page, /0 provider-verified NBA props · EV recommendations disabled/);
  assert.match(page, /raw quote\(s\) observed/);
});

test('two-way validation is exposed only for diagnostics', () => {
  assert.match(page, /Object\.freeze\(\{ validatePropQuote, comparePropQuotes, validateTwoWayPropMarket \}\)/);
});

test('snapshot event carries local records for raw quote quality audit', () => {
  assert.match(page, /eventCount:propEvents\.length,events:propEvents/);
});
test('validation gate reports raw missing labels, odds and timestamps', () => {
  assert.match(page, /missingPlayerLabels/);
  assert.match(page, /invalidPrices/);
  assert.match(page, /missingMarketTimestamps/);
  assert.match(page, /No picks or EV predictions/);
});

test('snapshot age requires a finite nonnegative numeric value', () => {
  assert.match(page, /typeof age === 'number' && Number\.isFinite\(age\) && age >= 0/);
});
test('validation gate flags quotes updated after snapshot capture', () => {
  assert.match(page, /postCaptureTimestamps/);
  assert.match(page, /timestamps after snapshot capture/);
});

test('quote audit compares timestamps to recorded capture time', () => {
  assert.match(page, /snapshotCapturedAt:data\.captured_at/);
  assert.match(page, /updatedAt > captureTime/);
});

test('snapshot capture timestamp requires explicit UTC format', () => {
  assert.match(page, /const captureValue = info\.snapshotCapturedAt/);
  assert.match(page, /Invalid or missing UTC capture timestamp/);
});

test('raw NBA audit reports missing explicit source record IDs', () => {
  assert.match(page, /missingSourceRecordIds/);
  assert.match(page, /missing explicit source record IDs/);
});
test('snapshot capture check uses canonical UTC timestamps', () => {
  assert.match(page, /canonicalCaptureTime/);
  assert.match(page, /new Date\(captureTime\)\.toISOString\(\)\.slice\(0, 19\)/);
});

test('raw snapshot audit tolerates null games, books, markets, and outcomes', () => {
  assert.match(page, /Array\.isArray\(game\?\.bookmakers\)/);
  assert.match(page, /Array\.isArray\(book\?\.markets\)/);
  assert.match(page, /String\(market\?\.key \|\| ''\)/);
  assert.match(page, /rawOutcome && typeof rawOutcome === 'object'/);
});

test('malformed snapshot is rejected before publishing records to UI', () => {
  assert.match(page, /const validSnapshotShape = data\.events\.every/);
  assert.match(page, /market\.outcomes\.every\(outcome => outcome && typeof outcome === 'object'\)/);
  assert.match(page, /if \(!validSnapshotShape\)/);
  assert.match(page, /Malformed snapshot rejected\. No quotes or picks verified\./);
  assert.ok(page.indexOf('if (!validSnapshotShape)') < page.indexOf('propEvents=data.events;'));
});

test('snapshot refresh clears stale quote displays and export metadata before fetch', () => {
  const start = page.indexOf('async function load(){');
  const fetch = page.indexOf('await readJson("./data/nba-player-props-latest.json")', start);
  const refresh = page.slice(start, fetch);
  assert.ok(start >= 0 && fetch > start);
  assert.match(refresh, /byId\("results"\)\.replaceChildren\(\)/);
  assert.match(refresh, /byId\("mobileProps"\)\.replaceChildren\(\)/);
  assert.match(refresh, /quoteArchiveCapture=''/);
  assert.match(refresh, /byId\("exportQuoteArchive"\)\.disabled=true/);
  assert.match(refresh, /evsports:nba-snapshot-unavailable/);
});

test('snapshot timestamp is canonical and not future dated before enabling exports', () => {
  const validation = page.indexOf('if (!canonicalSnapshotTime || parsedSnapshotTime > Date.now() + 30_000)');
  const exportEnabled = page.indexOf('byId("saveLocalSnapshot").disabled=false;', validation);
  assert.ok(validation >= 0 && exportEnabled > validation);
  assert.match(page, /Invalid snapshot capture time\. No quotes verified\./);
  assert.match(page, /const parsedSnapshotTime = snapshotMatch \? Date\.parse\(snapshotCapturedAt\) : NaN/);
});

test('invalid NBA snapshot formats and capture times notify verification panels', () => {
  const invalidFormat = page.slice(page.indexOf('if(data?.source!=="The Odds API"'), page.indexOf('const snapshotCapturedAt = data.captured_at;'));
  const invalidCapture = page.slice(page.indexOf('if (!canonicalSnapshotTime ||'), page.indexOf('const validSnapshotShape ='));
  assert.match(invalidFormat, /evsports:nba-snapshot-unavailable/);
  assert.match(invalidCapture, /evsports:nba-snapshot-unavailable/);
});

test('published Python UTC timestamps with six-digit fractions are supported', () => {
  assert.match(page, /const snapshotUtcPattern =/);
  assert.match(page, /snapshotCapturedAt\.match\(snapshotUtcPattern\)/);
  assert.match(page, /snapshotMatch\[2\]/);
  assert.match(page, /new Date\(parsedSnapshotTime\)\.toISOString\(\)\.slice\(0, 19\)/);
});

test('raw quote audit accepts the same Python UTC capture format as snapshot ingestion', () => {
  assert.match(page, /const captureMatch = typeof captureValue === 'string'/);
  assert.match(page, /const captureTime = captureMatch \? Date\.parse\(captureValue\) : NaN/);
  assert.match(page, /captureMatch\[2\]/);
});

test('hidden raw quotes are not described as absent, and empty searches have guidance', () => {
  assert.match(page, /Raw quote research view is off\. This does not mean the snapshot has no player props/);
  assert.match(page, /else if\(grouped\.size===0\)/);
  assert.match(page, /No raw player props match the current filters/);
});

test('raw NBA research display explains its 1000-outcome limit', () => {
  assert.match(page, /if\(count>=1000\)\{truncated=true;continue\}/);
  assert.match(page, /Raw research display limited to the first 1,000 matching outcomes/);
  assert.match(page, /if\(showRaw&&truncated\)/);
});
