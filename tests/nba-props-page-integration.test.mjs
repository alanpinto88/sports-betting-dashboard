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
