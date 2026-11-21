// Evidence screening for recorded-only changes; never a prediction or EV signal.
export function highEvidenceChanges(changes,gapMinutes=60){
  if(!Array.isArray(changes)||!Number.isFinite(gapMinutes)||gapMinutes<=0)throw Error('Invalid change evidence inputs');
  return changes.filter(c=>c&&c.sourceUpdateAdvanced===true&&c.sourceTimestampRegressed===false&&c.status==='observed_change'&&Number.isFinite(c.elapsedMinutes)&&c.elapsedMinutes>0&&c.elapsedMinutes<=gapMinutes&&Number.isFinite(c.fromSourceAgeMinutes)&&c.fromSourceAgeMinutes>=0&&c.fromSourceAgeMinutes<=60&&Number.isFinite(c.toSourceAgeMinutes)&&c.toSourceAgeMinutes>=0&&c.toSourceAgeMinutes<=60);
}
