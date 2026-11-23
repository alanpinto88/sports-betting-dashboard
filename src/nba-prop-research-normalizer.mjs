// EV Sports — research-only normalization of sportsbook NBA player props.
// Never assert providerVerified from untrusted snapshot data.
export function normalizeNbaPropOutcomes(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.events)) return [];
  const rows=[];
  for (const event of snapshot.events) {
    if (!event || typeof event !== 'object' || typeof event.id!=='string' || !event.id.trim()) continue;
    for (const book of Array.isArray(event.bookmakers)?event.bookmakers:[]) {
      if (!book || typeof book.key!=='string' || !book.key.trim()) continue;
      for (const market of Array.isArray(book.markets)?book.markets:[]) {
        if (!market || typeof market.key!=='string' || !/^player_[a-z0-9]+(?:_[a-z0-9]+)*$/.test(market.key.trim())) continue;
        for (const outcome of Array.isArray(market.outcomes)?market.outcomes:[]) {
          if (!outcome || typeof outcome !== 'object') continue;
          if(typeof outcome.name!=='string')continue;
          const side=outcome.name.trim().toLowerCase();
          if (!['over','under'].includes(side)) continue;
          const line=outcome.point, price=outcome.price;
          if (typeof line!=='number' || !Number.isFinite(line) || line<0 ||
              !Number.isInteger(price) || Math.abs(price)<100) continue;
          const rawPlayer=outcome.description??outcome.player;
          if(typeof rawPlayer!=='string')continue;
          const playerLabel=rawPlayer.trim();
          if (!playerLabel) continue;
          // An explicitly supplied market timestamp must not silently fall back to
          // the bookmaker timestamp when malformed; that would invent provenance.
          const sourceTime=market.last_update==null?book.last_update:market.last_update;
          const capturedAt=typeof sourceTime==='string'&&sourceTime.trim()?sourceTime.trim():null;
          rows.push(Object.freeze({
            eventId:event.id.trim(), playerLabel, playerId:null,
            market:market.key.trim(),period:'unverified',
            side,line,americanOdds:price,provider:book.key.trim(),
            capturedAt,sourceRecordId:typeof outcome.source_record_id==='string'&&outcome.source_record_id.trim()?outcome.source_record_id.trim():null,
            providerVerified:false,identityVerified:false,
            status:'RESEARCH_ONLY',eligibleForEv:false
          }));
        }
      }
    }
  }
  return rows;
}
