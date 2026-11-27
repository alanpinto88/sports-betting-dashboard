# EV Sports — NBA player props release checks

This checklist protects the live dashboard from unverified or misleading betting signals.

## Release status

The public NBA Player Props dashboard is available for historical research. Player Finder, archived sportsbook snapshots, quote audits, and box-score research can be used now.

| Release gate | Evidence | Status |
| --- | --- | --- |
| Public research dashboard | Deployment, offline tests, and internal navigation checks passed. | Available |
| Sportsbook player-to-game identity | Published captures carry raw display names and event IDs. All 94 outcomes in the latest checked capture lack independently verified player-to-event mappings. | Blocked |
| Authenticated PrizePicks coverage | Vercel reached the provider on the unauthenticated probe. The authenticated request ended before an HTTP response. | Unverified |
| EV picks | No verified sportsbook quote inputs or calibrated model evidence are available for this capture. | Disabled |
| Mobile browser acceptance | Viewport and touch checks remain pending. | Pending |

To verify a live comparison, obtain provider-supported player and event identifiers and immutable quote provenance, reconcile them against independent evidence, and confirm both sides represent the same market and settlement rules. Historical box scores can corroborate participation and remain research evidence.

## Data provenance
- [ ] Player identity is resolved to a stable provider/player ID; ambiguous names are quarantined.
- [ ] Market key includes league, event ID, player ID, stat type, period, line, and side.
- [ ] Quote records retain provider, sportsbook, captured_at (UTC), source ID, and raw price.
- [ ] Missing provider timestamps or unknown event identity result in research-only status.
- [ ] No secrets or paid provider keys are committed or exposed to browser JavaScript.

## Odds normalization
- [ ] American odds are valid nonzero numbers (negative less than -100 or positive at least +100, with +100/-100 accepted).
- [ ] Opposite sides must refer to the same player, game, stat, period and threshold.
- [ ] Convert American odds to implied probability: negative = abs(odds)/(abs(odds)+100); positive = 100/(odds+100).
- [ ] Remove two-sided vig by dividing each side's implied probability by their sum.
- [ ] No-vig probability is not a calibrated prediction; label it market-implied.
- [ ] Reject stale, mismatched, suspended, or unverified quotes from EV recommendations.

## Expected value
- [ ] Decimal odds = 1 + (odds > 0 ? odds/100 : 100/abs(odds)).
- [ ] EV per $1 = model_probability * (decimal_odds - 1) - (1 - model_probability).
- [ ] EV is not displayed as verified unless model calibration, market match and timestamp checks pass.
- [ ] Backtests use only data available before each event and avoid look-ahead leakage.
- [ ] Show sample size, model version, quote age, and uncertainty alongside any future predictions.

## Mobile release tests
- [ ] Test 320px, 375px, and 430px widths for horizontal overflow.
- [ ] Player Finder and filters work using touch and keyboard.
- [ ] Empty and API-error states are explicit and do not invent picks.
- [ ] Confirm all navigation tabs load on the published GitHub Pages site.
- [ ] Check GitHub Pages deployment after any merge.

## Trademark and billing safety
- [ ] Use EV Sports branding, not sportsbook trademarks as the site's own brand.
- [ ] Keep provider logos and names factual, with appropriate attribution and terms review.
- [ ] Do not enable credit-consuming API endpoints until allowance and consent are confirmed.
- [ ] Retire old Cloudflare resources only after backups, dependency checks and migration verification.
