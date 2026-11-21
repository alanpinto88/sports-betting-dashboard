import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('player-props.html','utf8');
for(const token of [
 'Quote event ID mismatch',
 'Quote player ID mismatch',
 'Quote provenance ID missing',
 'Quote capture timestamps missing, future-dated or stale',
 'Quote capture timestamps inconsistent with provider snapshot',
 'No usable sportsbook American odds quotes',
 'Number.isInteger(x?.price?.american)&&Math.abs(x.price.american)>=100',
 'Number.isInteger(x.price?.american)&&Math.abs(x.price.american)>=100',
 'x.quote_id||x.id',
 'x.captured_at',
 'No same-book, same-capture two-sided sportsbook pair'
])assert.ok(html.includes(token),token);
console.log('NBA quote provenance and timestamp guards: 11 checks passed');
