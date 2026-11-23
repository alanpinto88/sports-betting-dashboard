// Historical quote timestamp diagnostics; never a provider-authentication signal.
export function researchQuoteTimeStatus(capturedAt, snapshotCapturedAt, now=Date.now()) {
  const parse=value=>{
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))return NaN;
    const time=Date.parse(value);
    return Number.isFinite(time) && (new Date(time).toISOString()===value || new Date(time).toISOString().replace(/\.000Z$/,'Z')===value)?time:NaN;
  };
  const quote=parse(capturedAt),snapshot=parse(snapshotCapturedAt);
  if(!Number.isFinite(now)||now<0)return {status:'INVALID_CLOCK',eligibleForEv:false};
  if(!Number.isFinite(quote))return {status:'MISSING_OR_INVALID_TIME',eligibleForEv:false};
  if(quote>now)return {status:'FUTURE_QUOTE_TIME',eligibleForEv:false};
  if(!Number.isFinite(snapshot))return {status:'SNAPSHOT_TIME_UNVERIFIED',eligibleForEv:false};
  if(snapshot>now)return {status:'FUTURE_SNAPSHOT_TIME',eligibleForEv:false};
  if(quote>snapshot)return {status:'AFTER_SNAPSHOT_CAPTURE',eligibleForEv:false};
  return {status:'HISTORICAL_RESEARCH',ageMinutes:Math.floor((now-quote)/60000),eligibleForEv:false};
}
