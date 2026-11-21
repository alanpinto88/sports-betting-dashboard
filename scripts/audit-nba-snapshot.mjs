// EV Sports — research-only audit of a published The Odds API NBA prop snapshot.
// No provider calls, no API keys, no verified player identities inferred.
import {impliedProbability} from '../lib/nba-quote-validation.mjs';
export function auditSnapshot(snapshot) {
  if (snapshot?.source !== 'The Odds API' || !Array.isArray(snapshot.events)) throw Error('Unexpected snapshot schema');
  const findings = {events:snapshot.events.length,books:new Set(),outcomes:0,invalidPrices:0,
    invalidThresholds:0,unpairedSides:0,pairedMarkets:0,identityUnverified:0,staleOrUndatedMarkets:0};
  for (const event of snapshot.events) {
    for (const book of event.bookmakers || []) {
      findings.books.add(book.key);
      for (const market of book.markets || []) {
        const t = Date.parse(market.last_update);
        const captured = Date.parse(snapshot.captured_at);
        if (!Number.isFinite(t) || !Number.isFinite(captured) || t > captured || captured-t > 300000)
          findings.staleOrUndatedMarkets++;
        const groups = new Map();
        for (const o of market.outcomes || []) {
          findings.outcomes++;
          if (impliedProbability(o.price) === null) findings.invalidPrices++;
          if (typeof o.point !== 'number' || !Number.isFinite(o.point) || o.point < 0) findings.invalidThresholds++;
          // Name is not a stable player ID. Every raw outcome remains identity-unverified.
          findings.identityUnverified++;
          const key = JSON.stringify([o.description,market.key,o.point]);
          if (!groups.has(key)) groups.set(key,new Set());
          groups.get(key).add(o.name);
        }
        for (const sides of groups.values()) {
          if (sides.has('Over') && sides.has('Under')) findings.pairedMarkets++;
          else findings.unpairedSides++;
        }
      }
    }
  }
  return {...findings,books:findings.books.size,verifiedPlayerQuotes:0,verifiedEVPicks:0,
    status:'research_only',note:'Pairing raw Over/Under outcomes does not verify player or event identity.'};
}
