import {observedQuoteChanges} from './nba-observed-changes.mjs';
// Compute adjacency on the full accepted timeline BEFORE excluding stale quotes.
// Otherwise removing an intervening stale capture could manufacture a direct transition.
export function filteredObservedChanges(acceptedRecords,freshOnly=false,conflictingCaptureTimes=[]){
  if(!Array.isArray(acceptedRecords)||!Array.isArray(conflictingCaptureTimes))throw Error('Invalid accepted records or conflicting captures');
  // An excluded conflicting capture is still a known point in the timeline.
  // Preserve it as an invalid barrier so neighboring accepted quotes are not
  // incorrectly described as adjacent.
  const timeline=[...acceptedRecords,...conflictingCaptureTimes.map(capturedAt=>({capturedAt,sourceUpdatedAt:null,americanOdds:null}))];
  const changes=observedQuoteChanges(timeline);
  return freshOnly?changes.filter(c=>c.fromSourceAgeMinutes<=60&&c.toSourceAgeMinutes<=60):changes;
}
