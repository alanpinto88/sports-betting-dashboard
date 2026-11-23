// Group unverified historical NBA prop quotes for research, never EV.
export function groupNbaResearchQuotes(rows) {
  if (!Array.isArray(rows)) return [];
  const groups=new Map();
  for (const q of rows) {
    if (!q || q.status!=='RESEARCH_ONLY' || q.eligibleForEv!==false ||
        typeof q.eventId!=='string' || !q.eventId.trim() ||
        typeof q.playerLabel!=='string' || !q.playerLabel.trim() ||
        typeof q.market!=='string' || !q.market.trim() ||
        typeof q.period!=='string' || !q.period.trim() ||
        !Number.isFinite(q.line) || q.line<0 ||
        !Number.isInteger(q.americanOdds) || Math.abs(q.americanOdds)<100 ||
        !['over','under'].includes(q.side) ||
        typeof q.provider!=='string' || !q.provider.trim()) continue;
    const key=JSON.stringify([q.eventId.trim(),q.playerLabel.trim().toLowerCase(),q.market.trim(),q.period.trim(),q.line]);
    if(!groups.has(key))groups.set(key,{eventId:q.eventId.trim(),playerLabel:q.playerLabel.trim(),market:q.market.trim(),period:q.period.trim(),line:q.line,quotes:[],status:'RESEARCH_ONLY',eligibleForEv:false});
    groups.get(key).quotes.push(q);
  }
  return [...groups.values()].map(g=>{
    const books=new Set(g.quotes.map(q=>q.provider.trim()));
    const sides=new Set(g.quotes.map(q=>q.side));
    const bookSides=new Map();
    for(const q of g.quotes){
      if(!bookSides.has(q.provider.trim()))bookSides.set(q.provider.trim(),new Set());
      bookSides.get(q.provider.trim()).add(q.side);
    }
    const sameBookTwoSided=[...bookSides.values()].some(s=>s.has('over')&&s.has('under'));
    // A pair from one sportsbook is not necessarily a simultaneous market.
    // Only mark timestamp alignment when both sides share an explicit timestamp.
    const timedBookSides=new Map();
    for(const q of g.quotes){
      if(typeof q.capturedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(q.capturedAt))continue;
      const timestamp=Date.parse(q.capturedAt);
      if(!Number.isFinite(timestamp)||![new Date(timestamp).toISOString(),new Date(timestamp).toISOString().replace(/\.000Z$/,'Z')].includes(q.capturedAt))continue;
      const key=JSON.stringify([q.provider.trim(),q.capturedAt]);
      if(!timedBookSides.has(key))timedBookSides.set(key,new Set());
      timedBookSides.get(key).add(q.side);
    }
    const sameTimestampTwoSided=[...timedBookSides.values()].some(s=>s.has('over')&&s.has('under'));
    // Multiple prices for the same provider/side in one research group need
    // chronology checks; never silently treat them as one authoritative quote.
    const seenPrices=new Map();
    let conflictingSameSidePrices=false;
    for(const q of g.quotes){
      const key=JSON.stringify([q.provider.trim(),q.side]);
      if(seenPrices.has(key)&&seenPrices.get(key)!==q.americanOdds)conflictingSameSidePrices=true;
      else if(!seenPrices.has(key))seenPrices.set(key,q.americanOdds);
    }
    return Object.freeze({...g,quotes:Object.freeze(g.quotes.slice()),bookCount:books.size,
      hasBothSides:sides.has('over')&&sides.has('under'),sameBookTwoSided,sameTimestampTwoSided,conflictingSameSidePrices,
      warning:'Player-event identity, provider authenticity, and price validity unverified; not an EV comparison.'});
  }).sort((a,b)=>b.bookCount-a.bookCount||a.playerLabel.localeCompare(b.playerLabel));
}
