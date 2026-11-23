import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePropQuote, comparePropQuotes, validateTwoWayPropMarket } from '../src/nba-prop-quote-validation.mjs';

const NOW = Date.parse('2026-11-22T20:00:00.000Z');
const quote = (changes = {}) => ({
  provider: 'licensed-test-feed', playerId: 'nba-player-123',
  eventId: 'nba-event-456', market: 'points', period: 'full_game',
  side: 'over', line: 24.5, americanOdds: -110,
  capturedAt: '2026-11-22T19:59:00.000Z', providerVerified: true,
  sourceRecordId: 'quote-record-789', ...changes
});

test('valid fresh quote passes structural checks', () => {
  assert.equal(validatePropQuote(quote(), NOW).valid, true);
});
test('unverified provider fails closed', () => {
  assert.ok(validatePropQuote(quote({ providerVerified: false }), NOW).errors.includes('provider_unverified'));
});
test('stale quote fails closed', () => {
  assert.ok(validatePropQuote(quote({ capturedAt: '2026-11-22T19:50:00.000Z' }), NOW).errors.includes('stale_or_future_quote'));
});
test('future quote fails closed', () => {
  assert.ok(validatePropQuote(quote({ capturedAt: '2026-11-22T20:02:00.000Z' }), NOW).errors.includes('stale_or_future_quote'));
});
test('invalid odds fail closed', () => {
  assert.ok(validatePropQuote(quote({ americanOdds: 0 }), NOW).errors.includes('invalid_odds'));
});
test('identical market dimensions are comparable', () => {
  assert.equal(comparePropQuotes(quote(), quote({ provider: 'other-test-feed' }), NOW).comparable, true);
});
for (const field of ['playerId', 'eventId', 'market', 'period', 'line', 'side']) {
  test('mismatched ' + field + ' cannot be compared', () => {
    const change = field === 'line' ? 25.5 : field === 'side' ? 'under' : 'different';
    assert.ok(comparePropQuotes(quote(), quote({ [field]: change }), NOW).errors.includes('mismatch_' + field));
  });
}
test('missing quote cannot be compared', () => {
  assert.equal(comparePropQuotes(null, quote(), NOW).comparable, false);
});

test('unverified quotes still expose market mismatches for diagnosis', () => {
  const result = comparePropQuotes(
    quote({ providerVerified: false }),
    quote({ providerVerified: false, line: 25.5 }),
    NOW
  );
  assert.equal(result.comparable, false);
  assert.ok(result.errors.includes('mismatch_line'));
  assert.ok(result.errors.includes('left_provider_unverified'));
});
test('invalid validation clock fails closed', () => {
  assert.ok(validatePropQuote(quote(), Number.NaN).errors.includes('invalid_validation_clock'));
});

test('matching opposite-side quotes pass two-way structural validation', () => {
  assert.equal(validateTwoWayPropMarket(quote(), quote({ side: 'under', sourceRecordId: 'quote-record-790' }), NOW).valid, true);
});
test('same-side quotes cannot form a two-way market', () => {
  assert.ok(validateTwoWayPropMarket(quote(), quote(), NOW).errors.includes('invalid_under_side'));
});
test('different sportsbook quotes cannot form one two-way market', () => {
  assert.ok(validateTwoWayPropMarket(quote(), quote({ side: 'under', provider: 'other-feed' }), NOW).errors.includes('mismatch_provider'));
});
test('different lines cannot form one two-way market', () => {
  assert.ok(validateTwoWayPropMarket(quote(), quote({ side: 'under', line: 25.5 }), NOW).errors.includes('mismatch_line'));
});
test('unverified quote blocks two-way market validation', () => {
  assert.ok(validateTwoWayPropMarket(quote({ providerVerified: false }), quote({ side: 'under', sourceRecordId: 'quote-record-790' }), NOW).errors.includes('over_provider_unverified'));
});

test('ambiguous date-only quote timestamps fail closed', () => {
  assert.ok(validatePropQuote(quote({ capturedAt: '2026-11-22' }), NOW).errors.includes('invalid_timestamp'));
});
test('timestamps without timezone fail closed', () => {
  assert.ok(validatePropQuote(quote({ capturedAt: '2026-11-22T19:59:00' }), NOW).errors.includes('invalid_timestamp'));
});
test('UTC ISO timestamps with milliseconds remain valid', () => {
  assert.equal(validatePropQuote(quote(), NOW).valid, true);
});
test('American odds minus 99 are rejected', () => {
  assert.ok(validatePropQuote(quote({ americanOdds: -99 }), NOW).errors.includes('invalid_odds'));
});

test('quote without source record ID fails traceability check', () => {
  assert.ok(validatePropQuote(quote({ sourceRecordId: '' }), NOW).errors.includes('missing_source_record_id'));
});
test('source record ID must be a nonblank string', () => {
  assert.ok(validatePropQuote(quote({ sourceRecordId: 123 }), NOW).errors.includes('missing_source_record_id'));
});

test('two-way market cannot reuse one source record for both sides', () => {
  const result = validateTwoWayPropMarket(quote(), quote({ side: 'under' }), NOW);
  assert.ok(result.errors.includes('duplicate_source_record_id'));
  assert.equal(result.valid, false);
});

test('negative validation clock fails closed', () => {
  assert.ok(validatePropQuote(quote(), -1).errors.includes('invalid_validation_clock'));
});
test('zero or negative freshness window fails closed', () => {
  assert.ok(validatePropQuote(quote(), NOW, 0).errors.includes('invalid_validation_clock'));
  assert.ok(validatePropQuote(quote(), NOW, -1).errors.includes('invalid_validation_clock'));
});
