// EV Sports — report gaps between genuine saved capture times; never synthesize odds.
export function snapshotCoverage(snapshots, expectedIntervalMinutes=60) {
  if(!Array.isArray(snapshots)||!Number.isFinite(expectedIntervalMinutes)||expectedIntervalMinutes<=0)
    throw Error('Invalid snapshot coverage inputs');
  const captures=[...new Set(snapshots.map(s=>Date.parse(s?.captured_at||s?.capture)).filter(Number.isFinite))].sort((a,b)=>a-b);
  const gaps=[];
  for(let i=1;i<captures.length;i++){
    const elapsedMinutes=(captures[i]-captures[i-1])/60000;
    if(elapsedMinutes>expectedIntervalMinutes)
      gaps.push({from:new Date(captures[i-1]).toISOString(),to:new Date(captures[i]).toISOString(),
        elapsedMinutes:Math.round(elapsedMinutes*10)/10,status:'missing_capture_window'});
  }
  return {captures:captures.length,first:captures.length?new Date(captures[0]).toISOString():null,
    last:captures.length?new Date(captures[captures.length-1]).toISOString():null,
    expectedIntervalMinutes,gaps,missingPricesNotInferred:true};
}
