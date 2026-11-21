import {csvCell} from './nba-market-csv.mjs';
// Export only observed adjacent-capture differences, never interpolated odds or EV.
export function nbaChangesCsv(changes,selection,gapThresholdMinutes=60){
  if(!Array.isArray(changes)||!selection)throw Error('Invalid observed changes CSV inputs');
  if(!Number.isFinite(gapThresholdMinutes)||gapThresholdMinutes<=0)throw Error('Invalid gap threshold');
  const headers=['from_capture_utc','to_capture_utc','elapsed_minutes','exceeds_gap_threshold','from_source_age_minutes','to_source_age_minutes','from_american_odds','to_american_odds','raw_implied_probability_change_pp','source_timestamp_advanced','source_timestamp_regressed','evidence_status','event_id','player_name_unverified','sportsbook','market','side','threshold'];
  const lines=[headers.join(',')];
  for(const c of changes){
    if(typeof c.fromCapturedAt!=='string'||typeof c.toCapturedAt!=='string'||!Number.isFinite(Date.parse(c.fromCapturedAt))||!Number.isFinite(Date.parse(c.toCapturedAt))||Date.parse(c.toCapturedAt)<=Date.parse(c.fromCapturedAt)||
       !Number.isFinite(c.elapsedMinutes)||c.elapsedMinutes<=0||Math.abs(c.elapsedMinutes-(Date.parse(c.toCapturedAt)-Date.parse(c.fromCapturedAt))/60000)>0.000001||!Number.isFinite(c.fromSourceAgeMinutes)||c.fromSourceAgeMinutes<0||!Number.isFinite(c.toSourceAgeMinutes)||c.toSourceAgeMinutes<0||!Number.isInteger(c.fromOdds)||
       !Number.isInteger(c.toOdds)||!Number.isFinite(c.rawImpliedProbabilityChangePoints)||
       typeof c.sourceUpdateAdvanced!=='boolean'||typeof c.sourceTimestampRegressed!=='boolean'||(c.sourceUpdateAdvanced&&c.sourceTimestampRegressed)||c.status!==(c.sourceUpdateAdvanced?'observed_change':c.sourceTimestampRegressed?'regressed_source_timestamp':'unconfirmed_source_timestamp'))throw Error('Invalid observed change');
    lines.push([c.fromCapturedAt,c.toCapturedAt,c.elapsedMinutes,c.elapsedMinutes>gapThresholdMinutes,c.fromSourceAgeMinutes,c.toSourceAgeMinutes,c.fromOdds,c.toOdds,
      c.rawImpliedProbabilityChangePoints,c.sourceUpdateAdvanced,c.sourceTimestampRegressed,c.status,selection.eventId,
      selection.playerName,selection.book,selection.market,selection.side,selection.line].map(csvCell).join(','));
  }
  return lines.join('\r\n')+'\r\n';
}
