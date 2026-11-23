import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Historical fixture checks only: no network requests, provider authentication, or EV claims.
const snapshot = JSON.parse(readFileSync(new URL('../data/nba-player-props-latest.json', import.meta.url), 'utf8'));
const utcPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|\+00:00)$/;
test('published NBA snapshot has a traceable source and UTC capture time', () => {
  assert.equal(snapshot.source, 'The Odds API');
  assert.ok(Array.isArray(snapshot.events));
  const match = String(snapshot.captured_at || '').match(utcPattern);
  assert.ok(match, 'capture timestamp must be explicit UTC');
  const captured = Date.parse(snapshot.captured_at);
  assert.ok(Number.isFinite(captured));
  assert.equal(new Date(captured).toISOString().slice(0, 19), match[1]);
  assert.equal(new Date(captured).getUTCMilliseconds(), Number((match[2] || '').padEnd(3, '0').slice(0, 3)));
});
test('published NBA snapshot has safe game/book/market/outcome nesting', () => {
  for (const game of snapshot.events) {
    assert.ok(game && typeof game === 'object' && Array.isArray(game.bookmakers));
    for (const book of game.bookmakers) {
      assert.ok(book && typeof book === 'object' && Array.isArray(book.markets));
      for (const market of book.markets) {
        assert.ok(market && typeof market === 'object' && Array.isArray(market.outcomes));
        for (const outcome of market.outcomes) assert.ok(outcome && typeof outcome === 'object');
      }
    }
  }
});
