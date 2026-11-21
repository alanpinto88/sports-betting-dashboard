import {observedQuoteChanges} from './nba-observed-changes.mjs';
// Compute adjacency on the full accepted timeline BEFORE excluding stale quotes.
// Otherwise removing an intervening stale capture could manufacture a direct transition.
export function filteredObservedChanges(acceptedRecords,freshOnly=false){
  const changes=observedQuoteChanges(acceptedRecords);
  return freshOnly?changes.filter(c=>c.fromSourceAgeMinutes<=60&&c.toSourceAgeMinutes<=60):changes;
}
