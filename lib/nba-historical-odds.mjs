// EV Sports — historical quote movement research, not live prices or predictions.
// Accepts stored snapshots only. No API calls and no interpolation of missing timestamps.
export function historicalQuoteAudit(snapshots, selection) {
  if (!Array.isArray(snapshots) || !selection || !selection.eventId || !selection.playerName ||
      !selection.book || !selection.market || !selection.side || !Number.isFinite(selection.line))
    throw Error('Missing selection or snapshots');
  const records=[];
  for (const snapshot of snapshots) {
    if (snapshot?.source!=='The Odds API' || !Array.isArray(snapshot.events)) continue;
    const captured=Date.parse(snapshot.captured_at);
    if (!Number.isFinite(captured)) continue;
    for (const event of snapshot.events) {
      if (String(event.id)!==String(selection.eventId)) continue;
      for (const book of event.bookmakers||[]) {
        if (book.key!==selection.book) continue;
        for (const market of book.markets||[]) {
          if (market.key!==selection.market) continue;
          const updated=Date.parse(market.last_update);
          if (!Number.isFinite(updated) || updated>captured) continue;
          for (const outcome of market.outcomes||[]) {
            if (outcome.description!==selection.playerName || outcome.name!==selection.side ||
                outcome.point!==selection.line || !Number.isInteger(outcome.price) ||
                (outcome.price>-100 && outcome.price<100)) continue;
            records.push({capturedAt:new Date(captured).toISOString(),sourceUpdatedAt:new Date(updated).toISOString(),
              americanOdds:outcome.price,playerName:outcome.description,line:outcome.point,
              status:'unverified_player_identity'});
          }
        }
      }
    }
  }
  records.sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));
  // Duplicate capture times are one observation only. Conflicting quotes cannot be
  // resolved from this research data, so exclude that capture rather than pick a winner.
  const grouped=new Map();
  for(const record of records){
    const group=grouped.get(record.capturedAt)||[];
    group.push(record);grouped.set(record.capturedAt,group);
  }
  const groups=[...grouped.values()];
  const conflicts=groups.filter(group=>group.some(r=>
    r.americanOdds!==group[0].americanOdds || r.sourceUpdatedAt!==group[0].sourceUpdatedAt));
  const accepted=groups.filter(group=>!conflicts.includes(group)).map(group=>group[0]);
  return {records:accepted,staleSourceQuotes:accepted.filter(r=>Date.parse(r.capturedAt)-Date.parse(r.sourceUpdatedAt)>60*60*1000).length,conflictingCaptureTimes:conflicts.map(group=>group[0].capturedAt),duplicateRecordsCollapsed:groups.reduce((sum,group)=>sum+group.length-1,0)};
}

export function historicalQuoteSeries(snapshots,selection){return historicalQuoteAudit(snapshots,selection).records}
