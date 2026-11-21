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
 'Paired sportsbook quote provenance missing — quarantined',
 'Duplicate sportsbook quote provenance IDs — quarantined',
 'Ambiguous duplicate sportsbook side at same capture — quarantined',
 'Eligible sportsbook quote identity mismatch — quarantined',
 'Eligible sportsbook quote market mismatch — quarantined',
 '(!x.market?.stat||String(x.market.stat).toLowerCase()===\'points\')',
 '(!x.event_id||String(x.event_id)===String(p.event?.id))',
 "Math.abs(x.price.american)>=100&&String(x.quote_id||x.id||'').trim()",
 'item.projection.line>=0',
 'Number.isInteger(x?.price?.american)&&Math.abs(x.price.american)>=100',
 'Number.isInteger(x.price?.american)&&Math.abs(x.price.american)>=100',
 'x.quote_id||x.id',
 'x.captured_at',
 'No same-book, same-capture two-sided sportsbook pair'
])assert.ok(html.includes(token),token);
console.log('NBA quote provenance and timestamp guards: 20 checks passed');
