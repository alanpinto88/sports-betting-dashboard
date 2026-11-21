// CSV values are quoted and spreadsheet formulas are neutralized.
// Preserve legitimate negative numeric American odds.
export function csvCell(value){
  const s=String(value??'');
  const dangerous=/^[=+@\t\r]/.test(s)||(/^-/ .test(s)&&!Number.isFinite(Number(s)));
  return '"'+(dangerous?"'"+s:s).replaceAll('"','""')+'"';
}
export function nbaMarketCsv(records,selection){
  if(!Array.isArray(records)||!selection)throw Error('Invalid CSV inputs');
  const headers=['captured_at_utc','source_updated_at_utc','american_odds','event_id','player_name_unverified','sportsbook','market','side','threshold','identity_status'];
  const lines=[headers.join(',')];
  for(const r of records){
    if(!Number.isInteger(r.americanOdds)||!Number.isFinite(Date.parse(r.capturedAt)))throw Error('Invalid recorded quote');
    lines.push([r.capturedAt,r.sourceUpdatedAt,r.americanOdds,selection.eventId,selection.playerName,selection.book,selection.market,selection.side,selection.line,'unverified_player_identity'].map(csvCell).join(','));
  }
  return lines.join('\r\n')+'\r\n';
}
