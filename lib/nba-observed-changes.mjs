// Recorded-only NBA quote changes. Never infer intragap prices or verified EV.
export function observedQuoteChanges(records){
  if(!Array.isArray(records))throw Error('Expected accepted quote records');
  const isoTimestamp=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).getUTCFullYear()>=2020;
  const valid=r=>r&&isoTimestamp(r.capturedAt)&&isoTimestamp(r.sourceUpdatedAt)&&Date.parse(r.sourceUpdatedAt)<=Date.parse(r.capturedAt)&&Number.isInteger(r.americanOdds)&&(r.americanOdds<=-100||r.americanOdds>=100);
  // Unknown capture times cannot be placed between observations. Known invalid
  // captures remain in the timeline as barriers rather than being bridged.
  const ordered=records.filter(r=>r&&isoTimestamp(r.capturedAt)).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
  const changes=[];
  // Equal-time captures have no defensible ordering. Exclude transitions touching
  // either member of a duplicated capture timestamp.
  const duplicateTimes=new Set();
  for(let i=1;i<ordered.length;i++)if(Date.parse(ordered[i].capturedAt)===Date.parse(ordered[i-1].capturedAt))duplicateTimes.add(Date.parse(ordered[i].capturedAt));
  for(let i=1;i<ordered.length;i++){
    const previous=ordered[i-1],current=ordered[i];
    if(!valid(previous)||!valid(current)||duplicateTimes.has(Date.parse(previous.capturedAt))||duplicateTimes.has(Date.parse(current.capturedAt)))continue;
    const from=Date.parse(previous.capturedAt),to=Date.parse(current.capturedAt);
    const oldUpdate=Date.parse(previous.sourceUpdatedAt),newUpdate=Date.parse(current.sourceUpdatedAt);
    if(to<=from)continue;
    // Same source update timestamp with a different price cannot establish when
    // the bookmaker changed the quote; preserve the warning in the result.
    if(previous.americanOdds===current.americanOdds)continue;
    const implied=x=>x<0?-x/(-x+100):100/(x+100);
    changes.push({
      fromCapturedAt:previous.capturedAt,toCapturedAt:current.capturedAt,
      fromOdds:previous.americanOdds,toOdds:current.americanOdds,
      elapsedMinutes:(to-from)/60000,
      fromSourceAgeMinutes:(from-oldUpdate)/60000,
      toSourceAgeMinutes:(to-newUpdate)/60000,
      rawImpliedProbabilityChangePoints:Math.round((implied(current.americanOdds)-implied(previous.americanOdds))*10000)/100,
      sourceUpdateAdvanced:newUpdate>oldUpdate,
      status:newUpdate>oldUpdate?'observed_change':'unconfirmed_source_timestamp'
    });
  }
  return changes;
}
