import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

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

test('CSV export guards absent snapshot and escapes whitespace-prefixed formulas', () => {
  const start = page.indexOf('function exportQuoteArchive(){');
  const end = page.indexOf('function parseCsv(text)', start);
  const exporter = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(exporter, /if\(!loadedSnapshot \|\| !quoteArchiveCapture\)/);
  assert.ok(exporter.includes(String.raw`/^\\s*[=+@-]/`) === false, 'must not use a literal-backslash whitespace class');
  assert.ok(exporter.includes(String.raw`/^\s*[=+@-]/`), 'must match actual leading whitespace');
});

test('identity review CSV escapes leading-whitespace formulas', () => {
  const start = page.indexOf('function exportReviewCsv(){');
  const end = page.indexOf('async function checkSourceRosters()', start);
  const exporter = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.ok(exporter.includes(String.raw`/^\s*[=+@-]/`));
  assert.ok(!exporter.includes(String.raw`/^[=+@\\-\\t\\r]/`));
});
test('raw quote CSV includes an explicit source record ID column', () => {
  const start = page.indexOf('function exportQuoteArchive(){');
  const end = page.indexOf('function parseCsv(text)', start);
  const exporter = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(exporter, /"source_record_id","verification_status"/);
  assert.match(exporter, /outcome\.source_record_id\|\|""/);
});

test('NBA identity export fails closed when no validated snapshot exists', () => {
  const start = page.indexOf('function exportReviewCsv(){');
  const end = page.indexOf('async function checkSourceRosters()', start);
  const exporter = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(exporter, /if\(!loadedSnapshot\)/);
  assert.match(exporter, /Identity review export unavailable/);
});
test('NBA quote archive CSV decimal detection uses a real decimal-point regex', () => {
  const start = page.indexOf('function exportQuoteArchive(){');
  const end = page.indexOf('function parseCsv(text)', start);
  const exporter = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.ok(exporter.includes(String.raw`(?:\.[0-9]+)?`));
  assert.ok(!exporter.includes(String.raw`(?:\\.[0-9]+)?`));
});

test('NBA freshness computation uses constant memory for market timestamps', () => {
  const start = page.indexOf('function renderFreshness(data){');
  const end = page.indexOf('const historyKey=', start);
  const freshness = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(freshness, /let latestUpdate=-Infinity/);
  assert.match(freshness, /Number\.isFinite\(t\)&&t>latestUpdate/);
  assert.ok(!freshness.includes('Math.max(...updates)'));
});

test('historical odds comparisons require explicit canonical UTC timestamps', () => {
  const start = page.indexOf('function validateQuoteTimestamp(updated,capture){');
  const end = page.indexOf('function localArchive(record)', start);
  const validator = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(validator, /const parseUtc=value=>/);
  assert.match(validator, /new Date\(time\)\.toISOString\(\)\.slice\(0,19\)/);
  assert.match(validator, /Missing or invalid explicit UTC market\/capture timestamp/);
});

test('historical UTC validation executes correctly for real capture and invalid timestamps', () => {
  const start = page.indexOf('function validateQuoteTimestamp(updated,capture){');
  const end = page.indexOf('function localArchive(record)', start);
  assert.ok(start >= 0 && end > start);
  const validate = runInNewContext(page.slice(start, end) + '\nvalidateQuoteTimestamp', {}, { timeout: 1000 });
  const capture = '2026-11-20T21:14:27.090695+00:00';
  assert.equal(validate(capture, capture), Date.parse(capture));
  assert.equal(validate('2026-11-20T21:14:27Z', capture), Date.parse('2026-11-20T21:14:27Z'));
  assert.throws(() => validate('2026-11-20T21:14:27', capture), /explicit UTC/);
  assert.throws(() => validate('2026-02-30T21:14:27Z', capture), /explicit UTC/);
  assert.throws(() => validate('2026-11-20T21:16:27Z', capture), /later than its capture/);
});

test('archive CSV validates capture timestamps even when selection side is skipped', () => {
  const start = page.indexOf('function archiveRows(csv){');
  const end = page.indexOf('const implied=', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  const captureCheck = importer.indexOf('validateQuoteTimestamp(capture,capture)');
  const sideSkip = importer.indexOf('if(!["over","under"].includes(side))continue');
  assert.ok(captureCheck >= 0 && sideSkip > captureCheck);
});

test('NBA archive CSV rejects duplicate column names before importing quotes', () => {
  const start = page.indexOf('function archiveRows(csv){');
  const end = page.indexOf('const implied=', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /new Set\(header\)\.size!==header\.length/);
  assert.match(importer, /CSV has duplicate archive column names/);
});

test('NBA CSV parser executes strict quote handling with valid multiline fields', () => {
  const start = page.indexOf('function parseCsv(text){');
  const end = page.indexOf('function archiveRows(csv){', start);
  assert.ok(start >= 0 && end > start);
  const parse = runInNewContext(page.slice(start, end) + '\nparseCsv', {}, { timeout: 1000 });
  assert.deepEqual(JSON.parse(JSON.stringify(parse('"a,b","c""d"\r\n"multi\nline",x'))), [['a,b', 'c"d'], ['multi\nline', 'x']]);
  assert.throws(() => parse('a"b,c'), /Unexpected quote/);
  assert.throws(() => parse('"a"junk,c'), /Unexpected characters/);
  assert.throws(() => parse('"unclosed,c'), /Unclosed CSV quote/);
});

test('NBA archive importer rejects invalid odds and thresholds rather than silently dropping selections', () => {
  const start = page.indexOf('function archiveRows(csv){');
  const end = page.indexOf('const implied=', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /throw Error\("Invalid player quote odds or threshold in archive"\)/);
  assert.ok(!importer.includes('Math.abs(price)<100||!Number.isFinite(line))continue'));
});

test('NBA archive CSV rejects blank thresholds and scientific-notation numbers', () => {
  const start = page.indexOf('function archiveRows(csv){');
  const end = page.indexOf('const implied=', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /const priceText=r\[cols\.american_odds\]\.trim\(\),lineText=r\[cols\.threshold\]\.trim\(\)/);
  assert.match(importer, /Number\(priceText\),line=Number\(lineText\)/);
});

test('saved NBA archive rejects malformed timestamps and incomplete quote values', () => {
  const start = page.indexOf('function localArchive(record){');
  const end = page.indexOf('function compareLocalHistory(){', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /validateQuoteTimestamp\(record\.capture,record\.capture\)/);
  assert.match(importer, /Saved player quote has invalid odds or threshold/);
  assert.match(importer, /Saved player quote is missing player label/);
});

test('locally stored NBA history ignores malformed records and caps retained selection list', () => {
  const start = page.indexOf('function localHistory(){');
  const end = page.indexOf('function updateLocalSelections(){', start);
  const source = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(source, /Array\.isArray\(item\.events\)/);
  assert.match(source, /\.sort\(\(a,b\)=>Date\.parse\(a\.capture\)-Date\.parse\(b\.capture\)\)\.slice\(-8\)/);
});

test('NBA local-history selection filters ambiguous or impossible capture timestamps', () => {
  const start = page.indexOf('function localHistory(){');
  const end = page.indexOf('function updateLocalSelections(){', start);
  const source = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(source, /validateQuoteTimestamp\(item\.capture,item\.capture\)/);
  assert.match(source, /catch\{return false\}/);
});

test('NBA audit discloses player-quote source record ID coverage without implying verification', () => {
  const start = page.indexOf('function auditSnapshot(events, capturedAt){');
  const end = page.indexOf('async function readJson(url){', start);
  const audit = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(audit, /withSourceRecordId=0/);
  assert.match(audit, /outcome\.source_record_id\.trim\(\)/);
  assert.match(audit, /Source record IDs present:/);
  assert.match(audit, /0 independently verified player-to-event assignments/);
});

test('NBA audit does not turn missing player prop thresholds into zero-point lines', () => {
  const start = page.indexOf('function auditSnapshot(events, capturedAt){');
  const end = page.indexOf('async function readJson(url){', start);
  const audit = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(audit, /outcome\.point===null\|\|outcome\.point===undefined/);
  assert.match(audit, /String\(outcome\.point\)\.trim\(\)===""/);
  assert.match(audit, /\?NaN:Number\(outcome\.point\)/);
});

test('NBA archive CSV parser strips a UTF-8 BOM before reading the header', () => {
  const start = page.indexOf('function parseCsv(text){');
  const end = page.indexOf('function archiveRows(csv){', start);
  const parser = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(parser, /text\.charCodeAt\(0\)===0xFEFF/);
  const parse = runInNewContext(parser + '\nparseCsv');
  assert.deepEqual(Array.from(parse('\uFEFFcapture_utc,market\n2026-11-20T21:14:27Z,player_points')[0]), ['capture_utc', 'market']);
});

test('NBA CSV parser rejects bare carriage returns but permits CRLF and quoted multiline fields', () => {
  const start = page.indexOf('function parseCsv(text){');
  const end = page.indexOf('function archiveRows(csv){', start);
  const parser = runInNewContext(page.slice(start, end) + '\nparseCsv');
  assert.throws(() => parser('capture_utc,market\r2026-11-20,player_points'), /Bare carriage return/);
  assert.equal(parser('capture_utc,market\r\n2026-11-20,player_points').length, 2);
  assert.equal(parser('capture_utc,market\n"2026-11-20\rinside",player_points')[1][0], '2026-11-20\rinside');
});

test('NBA archive rejects unsupported player-quote sides instead of silently dropping rows', () => {
  const start = page.indexOf('function archiveRows(csv){');
  const end = page.indexOf('const implied=', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /Unsupported player quote side in archive/);
  assert.match(importer, /r\[cols\.side\]\.trim\(\)\.toLowerCase\(\)/);
});

test('locally saved NBA quotes reject unsupported sides rather than skipping them', () => {
  const start = page.indexOf('function localArchive(record){');
  const end = page.indexOf('function compareLocalHistory(){', start);
  const source = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(source, /Saved player quote has unsupported side/);
  assert.match(source, /String\(o\.name\|\|""\)\.trim\(\)\.toLowerCase\(\)/);
});

test('saved NBA player quotes require decimal thresholds and integer American odds', () => {
  const start = page.indexOf('function localArchive(record){');
  const end = page.indexOf('function compareLocalHistory(){', start);
  const source = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(source, /lineText=String\(o\.point\?\?""\)\.trim\(\)/);
  assert.match(source, /priceText=String\(o\.price\?\?""\)\.trim\(\)/);
  assert.match(source, /price===0\|\|Math\.abs\(price\)<100/);
});

test('NBA CSV and saved history comparisons reject negative player-stat thresholds', () => {
  const csvStart = page.indexOf('function archiveRows(csv){');
  const csvEnd = page.indexOf('const implied=', csvStart);
  const localStart = page.indexOf('function localArchive(record){');
  const localEnd = page.indexOf('function compareLocalHistory(){', localStart);
  assert.ok(csvStart >= 0 && csvEnd > csvStart && localStart >= 0 && localEnd > localStart);
  assert.match(page.slice(csvStart, csvEnd), /line<0/);
  assert.match(page.slice(localStart, localEnd), /line<0/);
});

test('NBA CSV archive importer rejects non-player betting markets', () => {
  const start = page.indexOf('function archiveRows(csv){');
  const end = page.indexOf('const implied=', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /Archive contains a non-player market/);
  assert.match(importer, /r\[cols\.market\]\.trim\(\)\.startsWith\("player_"\)/);
});

test('NBA audit excludes invalid prices and negative thresholds from pairing groups', () => {
  const start = page.indexOf('function auditSnapshot(events, capturedAt){');
  const end = page.indexOf('async function readJson(url){', start);
  const audit = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(audit, /const validPrice=Number\.isInteger\(outcome\.price\)/);
  assert.match(audit, /!validPrice\|\|!Number\.isFinite\(point\)\|\|point<0/);
});

test('NBA audit groups only decimal-format player-stat thresholds', () => {
  const start = page.indexOf('function auditSnapshot(events, capturedAt){');
  const end = page.indexOf('async function readJson(url){', start);
  const audit = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(audit, /const pointText=String\(outcome\.point\?\?""\)\.trim\(\)/);
  assert.match(audit, /Number\(pointText\):NaN/);
});

test('NBA audit reports missing market timestamps and uses 60-second future tolerance', () => {
  const start = page.indexOf('function auditSnapshot(events, capturedAt){');
  const end = page.indexOf('async function readJson(url){', start);
  const audit = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(audit, /missingMarketTimestamps/);
  assert.match(audit, /market\.last_update\|\|book\.last_update/);
  assert.match(audit, /updateMs>captureMs\+60000/);
  assert.match(audit, /Missing market timestamps:/);
});

test('NBA archive comparison normalizes source identity whitespace before matching', () => {
  const start = page.indexOf('function archiveRows(csv){');
  const end = page.indexOf('const implied=', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /eventId=r\[cols\.source_event_id\]\.trim\(\)/);
  assert.match(importer, /bookKey=r\[cols\.sportsbook_key\]\.trim\(\)/);
  assert.match(importer, /marketKey=r\[cols\.market\]\.trim\(\)/);
  assert.match(importer, /player=r\[cols\.player_label_unverified\]\.trim\(\)/);
});

test('locally saved NBA archive comparisons normalize event, book and market identities', () => {
  const start = page.indexOf('function localArchive(record){');
  const end = page.indexOf('function compareLocalHistory(){', start);
  const importer = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(importer, /eventId=String\(game\.id\)\.trim\(\)/);
  assert.match(importer, /bookKey=String\(book\.key\)\.trim\(\)/);
  assert.match(importer, /marketKey=String\(market\.key\)\.trim\(\)/);
  assert.match(importer, /JSON\.stringify\(\[eventId,bookKey,marketKey,player\.toLowerCase\(\),side,line\]\)/);
});

test('NBA local history filters duplicate capture timestamps', () => {
  const start = page.indexOf('function localHistory(){');
  const end = page.indexOf('function updateLocalSelections(){', start);
  const source = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(source, /const captures=new Set\(\)/);
  assert.match(source, /captures\.has\(item\.capture\)/);
  assert.match(source, /captures\.add\(item\.capture\)/);
});

test('NBA movement comparison reports stale and non-newer market timestamps', () => {
  const start = page.indexOf('function compareArchiveData(a,b){');
  const end = page.indexOf('function auditSnapshot(events, capturedAt){', start);
  const comparison = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(comparison, /let matched=0,changed=0,stale=0/);
  assert.match(comparison, /stale\+\+;continue/);
  assert.match(comparison, /skipped for non-newer or invalid market timestamps/);
});

test('NBA historical comparison executes stale exclusion and renders only newer quote movements', () => {
  const start = page.indexOf('function compareArchiveData(a,b){');
  const end = page.indexOf('function auditSnapshot(events, capturedAt){', start);
  assert.ok(start >= 0 && end > start);
  const elements = new Map();
  const byId = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '0', textContent: '', children: [],
      replaceChildren() { this.children = []; },
      append(node) { this.children.push(node); }
    });
    return elements.get(id);
  };
  const document = { createElement: () => ({ className: '', textContent: '' }) };
  const implied = price => price < 0 ? -price / (-price + 100) : 100 / (price + 100);
  const context = { byId, document, implied, Date, Number, Math, Map, Error };
  const compare = runInNewContext(page.slice(start, end) + '\ncompareArchiveData', context);
  const old = '2026-11-19T19:00:00Z', newer = '2026-11-20T19:00:00Z';
  const quote = (updated, price) => ({
    updated, price, player: 'Test Player', book: 'Test Book',
    market: 'player_points', side: 'over', line: 10.5
  });
  const a = { capture: '2026-11-19T20:00:00Z', quotes: new Map([
    ['stale', quote(old, -110)], ['fresh', quote(old, -110)]
  ]) };
  const b = { capture: '2026-11-20T20:00:00Z', quotes: new Map([
    ['stale', quote(old, -120)], ['fresh', quote(newer, -120)]
  ]) };
  compare(a, b);
  assert.match(byId('archiveCompareStatus').textContent, /2 matching selections; 1 skipped/);
  assert.match(byId('archiveCompareStatus').textContent, /1 price changes/);
  assert.equal(byId('archiveCompareResults').children.length, 1);
  assert.match(byId('archiveCompareResults').children[0].textContent, /Test Player/);
});

test('NBA CSV importer executes identity normalization and duplicate rejection', () => {
  const timestampStart = page.indexOf('function validateQuoteTimestamp(updated,capture){');
  const timestampEnd = page.indexOf('function localArchive(record){', timestampStart);
  const csvStart = page.indexOf('function parseCsv(text){');
  const csvEnd = page.indexOf('const implied=', csvStart);
  assert.ok(timestampStart >= 0 && timestampEnd > timestampStart && csvStart >= 0 && csvEnd > csvStart);
  const archiveRows = runInNewContext(
    page.slice(timestampStart, timestampEnd) + '\n' +
    page.slice(csvStart, csvEnd) + '\narchiveRows',
    { Date, Number, String, Set, Map, JSON, Error }
  );
  const d = '2026-11-20T21:14:27Z';
  const header = 'capture_utc,source_event_id,sportsbook_key,market,player_label_unverified,side,threshold,american_odds,market_updated_utc';
  const row = (event, book, market, player) =>
    [d, event, book, market, player, 'Over', '10.5', '-110', d].join(',');
  const clean = archiveRows(header + '\n' + row('evt', 'book', 'player_points', 'Player'));
  const padded = archiveRows(header + '\n' + row(' evt ', ' book ', ' player_points ', ' Player '));
  assert.equal([...clean.quotes.keys()][0], [...padded.quotes.keys()][0]);
  assert.throws(
    () => archiveRows(header + '\n' + row('evt', 'book', 'player_points', 'Player') +
      '\n' + row(' evt ', ' book ', ' player_points ', ' Player ')),
    /Duplicate selection/
  );
  assert.throws(
    () => archiveRows(header + '\n' + row('evt', 'book', 'totals', 'Player')),
    /non-player market/
  );
});

test('NBA local snapshot saving validates UTC timestamps and quote integrity before storage', () => {
  const start = page.indexOf('function saveLocalHistory(){');
  const end = page.indexOf('function clearLocalHistory(){', start);
  const source = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(source, /validateQuoteTimestamp\(capture,capture\)/);
  assert.match(source, /localArchive\(\{capture,events:loadedSnapshot\.events\}\)/);
  assert.ok(source.indexOf('localArchive({capture,events:loadedSnapshot.events})') <
    source.indexOf('localStorage.setItem(historyKey,'));
});
