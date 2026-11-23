import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePropQuote, comparePropQuotes } from '../src/nba-prop-quote-validation.mjs';

const NOW = Date.parse('2026-11-22T20:00:00.000Z');
const quote = (changes = {}) => ({
  provider: 'licensed-test-feed', playerId: 'nba-player-123',
  eventId: 'nba-event-456', market: 'points', period: 'full_game',
  side: 'over', line: 24.5, americanOdds: -110,
  capturedAt: '2026-11-22T19:59:00.000Z', providerVerified: true, ...changes
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
