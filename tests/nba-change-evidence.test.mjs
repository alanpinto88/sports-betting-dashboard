import assert from 'node:assert/strict';
import {highEvidenceChanges,changeEvidenceSummary} from '../lib/nba-change-evidence.mjs';
const good={sourceUpdateAdvanced:true,sourceTimestampRegressed:false,status:'observed_change',elapsedMinutes:30,fromSourceAgeMinutes:5,toSourceAgeMinutes:10};
assert.deepEqual(highEvidenceChanges([good]),[good]);
assert.equal(highEvidenceChanges([good],20).length,0);
for(const bad of [{...good,sourceUpdateAdvanced:false},{...good,sourceTimestampRegressed:true},{...good,status:'unconfirmed_source_timestamp'},{...good,elapsedMinutes:61},{...good,fromSourceAgeMinutes:61},{...good,toSourceAgeMinutes:61},{...good,toSourceAgeMinutes:-1}])assert.equal(highEvidenceChanges([bad]).length,0);
assert.throws(()=>highEvidenceChanges(null),/Invalid change evidence/);
assert.throws(()=>highEvidenceChanges([],0),/Invalid change evidence/);
console.log('NBA high-evidence change screening passed');

const breakdown=changeEvidenceSummary([good,{...good,sourceUpdateAdvanced:false,status:'unconfirmed_source_timestamp',fromSourceAgeMinutes:70,elapsedMinutes:90}]);
assert.deepEqual(breakdown,{total:2,stronger:1,weaker:1,nonAdvancingSource:1,staleEndpoints:1,longOrInvalidGaps:1});
assert.deepEqual(changeEvidenceSummary([]),{total:0,stronger:0,weaker:0,nonAdvancingSource:0,staleEndpoints:0,longOrInvalidGaps:0});
