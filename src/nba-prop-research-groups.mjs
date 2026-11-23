// Group unverified historical NBA prop quotes for research, never EV.
export function groupNbaResearchQuotes(rows) {
  if (!Array.isArray(rows)) return [];
  const groups=new Map();
  for (const q of rows) {
    if (!q || q.status!=='RESEARCH_ONLY' || q.eligibleForEv!==false ||
        typeof q.eventId!=='string' || !q.eventId ||
        typeof q.playerLabel!=='string' || !q.playerLabel.trim() ||
        typeof q.market!=='string' || !q.market ||
        typeof q.period!=='string' || !q.period.trim() ||
        !Number.isFinite(q.line) || q.line<0 ||
        !Number.isInteger(q.americanOdds) || Math.abs(q.americanOdds)<100 ||
        !['over','under'].includes(q.side) ||
        typeof q.provider!=='string' || !q.provider) continue;
    const key=JSON.stringify([q.eventId,q.playerLabel.trim().toLowerCase(),q.market,q.period,q.line]);
    if(!groups.has(key))groups.set(key,{eventId:q.eventId,playerLabel:q.playerLabel,market:q.market,period:q.period,line:q.line,quotes:[],status:'RESEARCH_ONLY',eligibleForEv:false});
    groups.get(key).quotes.push(q);
  }
  return [...groups.values()].map(g=>{
    const books=new Set(g.quotes.map(q=>q.provider));
    const sides=new Set(g.quotes.map(q=>q.side));
    const bookSides=new Map();
    for(const q of g.quotes){
      if(!bookSides.has(q.provider))bookSides.set(q.provider,new Set());
      bookSides.get(q.provider).add(q.side);
    }
    const sameBookTwoSided=[...bookSides.values()].some(s=>s.has('over')&&s.has('under'));
    return Object.freeze({...g,quotes:Object.freeze(g.quotes.slice()),bookCount:books.size,
      hasBothSides:sides.has('over')&&sides.has('under'),sameBookTwoSided,
      warning:'Player-event identity, provider authenticity, and price validity unverified; not an EV comparison.'});
  }).sort((a,b)=>b.bookCount-a.bookCount||a.playerLabel.localeCompare(b.playerLabel));
}
