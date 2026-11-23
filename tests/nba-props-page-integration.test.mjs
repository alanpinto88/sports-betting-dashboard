import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../nba-props.html', import.meta.url), 'utf8');

test('NBA player props imports the validation module', () => {
  assert.match(page, /import\s*\{\s*validatePropQuote,\s*comparePropQuotes\s*\}\s*from\s*['"]\.\/src\/nba-prop-quote-validation\.mjs['"]/);
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
