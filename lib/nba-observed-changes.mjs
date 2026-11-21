// Recorded-only NBA quote changes. Never infer intragap prices or verified EV.
export function observedQuoteChanges(records){
  if(!Array.isArray(records))throw Error('Expected accepted quote records');
  const ordered=[...records].sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
  const changes=[];
  for(let i=1;i<ordered.length;i++){
    const previous=ordered[i-1],current=ordered[i];
    const from=Date.parse(previous.capturedAt),to=Date.parse(current.capturedAt);
    const oldUpdate=Date.parse(previous.sourceUpdatedAt),newUpdate=Date.parse(current.sourceUpdatedAt);
    if(![from,to,oldUpdate,newUpdate].every(Number.isFinite)||to<=from||
      !Number.isInteger(previous.americanOdds)||!Number.isInteger(current.americanOdds)||
      [previous.americanOdds,current.americanOdds].some(x=>x>-100&&x<100))continue;
    // Same source update timestamp with a different price cannot establish when
    // the bookmaker changed the quote; preserve the warning in the result.
    if(previous.americanOdds===current.americanOdds)continue;
    const implied=x=>x<0?-x/(-x+100):100/(x+100);
    changes.push({
      fromCapturedAt:previous.capturedAt,toCapturedAt:current.capturedAt,
      fromOdds:previous.americanOdds,toOdds:current.americanOdds,
      elapsedMinutes:(to-from)/60000,
      rawImpliedProbabilityChangePoints:Math.round((implied(current.americanOdds)-implied(previous.americanOdds))*10000)/100,
      sourceUpdateAdvanced:newUpdate>oldUpdate,
      status:newUpdate>oldUpdate?'observed_change':'unconfirmed_source_timestamp'
    });
  }
  return changes;
}
