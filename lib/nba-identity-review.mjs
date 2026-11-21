// EV Sports — research-only player-name collision report.
// A repeated name across event IDs is a REVIEW signal, never an identity resolution.
export function crossEventReview(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.events)) throw Error('Invalid events');
  const names = new Map();
  for (const event of snapshot.events) {
    if (!event || !event.id) continue;
    for (const book of event.bookmakers || []) for (const market of book.markets || [])
      for (const outcome of market.outcomes || []) {
        const raw = outcome.description;
        if (typeof raw !== 'string' || !raw.trim()) continue;
        const normalized = raw.trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
        if (!names.has(normalized)) names.set(normalized,{name:raw.trim(),events:new Set(),books:new Set()});
        const item=names.get(normalized);
        item.events.add(String(event.id));item.books.add(String(book.key||'unknown'));
      }
  }
  return [...names.values()].filter(x=>x.events.size>1).map(x=>({
    name:x.name,eventCount:x.events.size,bookCount:x.books.size,
    eventIds:[...x.events].sort(),status:'needs_review',
    explanation:'Name appears under multiple event IDs; player-event association is not verified.'
  })).sort((a,b)=>b.eventCount-a.eventCount||a.name.localeCompare(b.name));
}
