# NBA Player Props — verified-data integration contract

Status: specification only. No provider feed is claimed live by this document.

## Source separation
- **Raw research quotes**: unverified, opt-in, never eligible for EV picks.
- **Verified quotes**: must have provider, immutable quote ID, event ID, player ID, market, period, side, line, American price, captured timestamp, and verification result.
- **Historical stats**: source, game ID, player ID, opponent, venue, date, minutes, stat value and retrieval timestamp. Do not confuse game logs with future projections.

## Identity checks
Resolve each player by provider ID plus NBA roster/team mapping. Never join on display name alone. Ambiguous, traded, inactive or unmatched players are quarantined for manual review.

## Market comparability
Compare only same player, event, stat, period, threshold and settlement rules. Over 24.5 and Over 25.5 are different markets. PrizePicks fantasy picks are not automatically equivalent to sportsbook American odds.

## Movement signal
Compute opening/current movement only from chronological, same-provider comparable quotes. Keep source timestamps and time zones; label historical versus live. A large move is a research signal, not proof of sharp action.

## EV eligibility
Require verified identity, comparable two-sided prices or defensible model probabilities, sufficiently fresh quotes, and source provenance. Remove vig from matched sportsbook Over/Under prices; do not use raw implied probability as a win forecast. If any prerequisite fails, show **EV unavailable — data unverified**. No fabricated win probabilities, recommendations or odds.

## Security and cost
Never put provider API keys in frontend JavaScript or GitHub. Server relay must enforce allowed origins, endpoint allowlist, rate limits, caching, bounded usage and no sensitive logs. Free-plan endpoints stay disabled until allowance and terms are confirmed.

## Next implementation gates
1. Inventory the existing frontend and relay routes.
2. Build deterministic player-ID reconciliation tests.
3. Validate quote schema and source freshness.
4. Render verified and unverified states separately.
5. Enable models only after backtesting and data-quality checks.

## Deployment acceptance
- Existing NHL database and bet tracker remain functional.
- Missing provider data renders an explicit unavailable state.
- Unverified odds never create positive-EV cards.
- No secrets in client bundles, logs or repository.
- Mobile layout stays usable on iPhone.
