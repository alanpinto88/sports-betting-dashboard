import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('player-props.html','utf8');
assert.match(html,/market\?\.period\|\|''\)\.toLowerCase\(\)==='full game'/);
assert.match(html,/Quote period differs from full-game market/);
assert.match(html,/String\(x\.period\)\.toLowerCase\(\)==='full game'/);
assert.match(html,/No same-book, same-capture two-sided sportsbook pair/);
assert.match(html,/id="gameLogStatus"/);
console.log('NBA market period isolation: 5 checks passed');
