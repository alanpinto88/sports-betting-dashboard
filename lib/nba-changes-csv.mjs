import {csvCell} from './nba-market-csv.mjs';
// Export only observed adjacent-capture differences, never interpolated odds or EV.
export function nbaChangesCsv(changes,selection){
  if(!Array.isArray(changes)||!selection)throw Error('Invalid observed changes CSV inputs');
  const headers=['from_capture_utc','to_capture_utc','elapsed_minutes','from_american_odds','to_american_odds','raw_implied_probability_change_pp','source_timestamp_advanced','evidence_status','event_id','player_name_unverified','sportsbook','market','side','threshold'];
  const lines=[headers.join(',')];
  for(const c of changes){
    if(!Number.isFinite(Date.parse(c.fromCapturedAt))||!Number.isFinite(Date.parse(c.toCapturedAt))||
       !Number.isFinite(c.elapsedMinutes)||c.elapsedMinutes<=0||!Number.isInteger(c.fromOdds)||
       !Number.isInteger(c.toOdds)||!Number.isFinite(c.rawImpliedProbabilityChangePoints)||
       typeof c.sourceUpdateAdvanced!=='boolean')throw Error('Invalid observed change');
    lines.push([c.fromCapturedAt,c.toCapturedAt,c.elapsedMinutes,c.fromOdds,c.toOdds,
      c.rawImpliedProbabilityChangePoints,c.sourceUpdateAdvanced,c.status,selection.eventId,
      selection.playerName,selection.book,selection.market,selection.side,selection.line].map(csvCell).join(','));
  }
  return lines.join('\r\n')+'\r\n';
}
