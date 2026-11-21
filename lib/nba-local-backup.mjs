// EV Sports — pure local NBA history backup validation; no network or secrets.
export function validateLocalBackup(input,maxSnapshots=100) {
  if (input?.format!=='evsports-nba-local-history-backup-v1'||!Array.isArray(input.snapshots))
    throw Error('Unrecognized backup format');
  if (input.snapshots.length>maxSnapshots)throw Error('Too many snapshots in backup');
  for(const s of input.snapshots){
    if(!s||s.source!=='The Odds API'||typeof s.capture!=='string'||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(s.capture)||
      !Number.isFinite(Date.parse(s.capture))||!Array.isArray(s.events))
      throw Error('Invalid snapshot record');
  }
  return input.snapshots;
}
export function mergeLocalHistory(existing,incoming,limit=8){
  if(!Array.isArray(existing)||!Array.isArray(incoming))throw Error('Invalid local history');
  const records=new Map();
  for(const record of existing){
    if(!record||typeof record.capture!=='string'||!Number.isFinite(Date.parse(record.capture)))continue;
    records.set(record.capture,record);
  }
  let conflicts=0,added=0;
  for(const record of incoming){
    if(records.has(record.capture)){
      if(JSON.stringify(records.get(record.capture))!==JSON.stringify(record))conflicts++;
      continue; // Never overwrite existing data silently.
    }
    records.set(record.capture,record);added++;
  }
  const merged=[...records.values()].sort((a,b)=>Date.parse(a.capture)-Date.parse(b.capture));
  return {snapshots:merged.slice(-limit),added,conflicts,dropped:Math.max(0,merged.length-limit)};
}
