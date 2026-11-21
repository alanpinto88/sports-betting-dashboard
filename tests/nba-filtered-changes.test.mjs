import assert from 'node:assert/strict';
import {filteredObservedChanges} from '../lib/nba-filtered-changes.mjs';
const r=(capture,update,odds)=>({capturedAt:`2026-11-21T${capture}:00Z`,sourceUpdatedAt:`2026-11-21T${update}:00Z`,americanOdds:odds});
const captures=[r('16:00','15:55',-110),r('16:30','15:00',-125),r('17:00','16:55',-120)];
assert.equal(filteredObservedChanges(captures,false).length,2);
assert.equal(filteredObservedChanges(captures,true).length,0,'stale intermediate quote must not be bridged');
assert.equal(filteredObservedChanges([captures[0],captures[2]],true).length,1);
assert.throws(()=>filteredObservedChanges(null),/Expected accepted/);
console.log('NBA filtered changes preserve adjacency across excluded stale quotes');
