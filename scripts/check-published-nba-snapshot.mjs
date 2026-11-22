// Offline integrity check of the published NBA research snapshot.
// No provider requests, credentials, player identity claims, or paid API credits.
import {readFileSync} from 'node:fs';
import {auditSnapshot} from './audit-nba-snapshot.mjs';
const path=new URL('../data/nba-player-props-latest.json',import.meta.url);
const snapshot=JSON.parse(readFileSync(path,'utf8'));
if(typeof snapshot.captured_at!=='string'||!Number.isFinite(Date.parse(snapshot.captured_at)))
 throw Error('Published NBA snapshot has no valid capture timestamp');
if(snapshot.sport!=='basketball_nba')throw Error('Unexpected NBA snapshot sport');
const report=auditSnapshot(snapshot);
const coverageWarnings=[];
if(report.events<2)coverageWarnings.push('single_event_snapshot_not_full_slate');
// Even multi-event captures cannot establish full-slate completeness without
// independently reconciling against an authoritative NBA schedule.
if(report.identityUnverified>0)coverageWarnings.push('player_event_identity_unverified');
if(report.staleOrUndatedMarkets>0)coverageWarnings.push('stale_or_undated_market_quotes');
const output={
 status:'research_only',coverageWarnings,captured_at:snapshot.captured_at,events:report.events,
 books:report.books,outcomes:report.outcomes,identityUnverified:report.identityUnverified,
 playersAcrossMultipleEvents:report.playersAcrossMultipleEvents,
 invalidPrices:report.invalidPrices,invalidThresholds:report.invalidThresholds,
 staleOrUndatedMarkets:report.staleOrUndatedMarkets,
 verifiedPlayerQuotes:0,verifiedEVPicks:0
};
console.log(JSON.stringify(output,null,2));
if(report.outcomes===0)throw Error('Published NBA snapshot contains no player prop outcomes');
if(report.invalidPrices||report.invalidThresholds)
 throw Error('Published NBA snapshot contains invalid price or threshold values');
