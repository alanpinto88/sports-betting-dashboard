// Evidence screening for recorded-only changes; never a prediction or EV signal.
export function highEvidenceChanges(changes,gapMinutes=60){
  if(!Array.isArray(changes)||!Number.isFinite(gapMinutes)||gapMinutes<=0)throw Error('Invalid change evidence inputs');
  return changes.filter(c=>c&&c.sourceUpdateAdvanced===true&&c.sourceTimestampRegressed===false&&c.status==='observed_change'&&Number.isFinite(c.elapsedMinutes)&&c.elapsedMinutes>0&&c.elapsedMinutes<=gapMinutes&&Number.isFinite(c.fromSourceAgeMinutes)&&c.fromSourceAgeMinutes>=0&&c.fromSourceAgeMinutes<=60&&Number.isFinite(c.toSourceAgeMinutes)&&c.toSourceAgeMinutes>=0&&c.toSourceAgeMinutes<=60);
}

// Counts why recorded differences do not meet the stricter evidence screen.
// Reasons overlap: one difference can have more than one limitation.
export function changeEvidenceSummary(changes,gapMinutes=60){
  if(!Array.isArray(changes)||!Number.isFinite(gapMinutes)||gapMinutes<=0)throw Error('Invalid change evidence inputs');
  const stronger=highEvidenceChanges(changes,gapMinutes);
  return {
    total:changes.length,
    stronger:stronger.length,
    weaker:changes.length-stronger.length,
    nonAdvancingSource:changes.filter(c=>!c||c.sourceUpdateAdvanced!==true||c.sourceTimestampRegressed!==false||c.status!=='observed_change').length,
    staleEndpoints:changes.filter(c=>!c||!Number.isFinite(c.fromSourceAgeMinutes)||!Number.isFinite(c.toSourceAgeMinutes)||c.fromSourceAgeMinutes<0||c.toSourceAgeMinutes<0||c.fromSourceAgeMinutes>60||c.toSourceAgeMinutes>60).length,
    longOrInvalidGaps:changes.filter(c=>!c||!Number.isFinite(c.elapsedMinutes)||c.elapsedMinutes<=0||c.elapsedMinutes>gapMinutes).length
  };
}
