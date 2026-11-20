# EV Sports integration audit — 2026-11-20

Branch: ev-sports-integration-safe. Production main is not modified by this audit.

## Verified repository files
- `index.html`: actual standalone dashboard entry point (not `public/index.html`).
- `worker/prop-comparison-relay.mjs`: PrizePicks relay.
- `worker/nhl-final-relay.mjs`: read-only NHL final-score lookup.

## Verified current behavior
- Dashboard contains manual EV calculator, archived market-review signal display, locally stored bet tracker and calendar, and optional NHL final-score settlement preview.
- Dashboard explicitly says live odds and sharp-money feeds are not connected.
- PrizePicks relay reports live projections and comparisons disabled; `/comparisons` returns 503.
- `/provider-check` currently makes an authenticated coverage request whenever invoked and has no server-side rate limit. Do not publicly expose or repeatedly call it until its allowance and request charging are confirmed.
- The NHL relay validates 10-digit game IDs and final score shape, and returns `settlementEligible:false`.
- This audit did not verify API subscription allowances or consume PrizePicksAPI requests.

## Next engineering tasks
1. Audit existing HTML/JS navigation and add the agreed sidebar layout without breaking the existing tracker.
2. Add NHL database UI with explicit source, capture timestamp, missing-value warnings, and verified pre-puck-drop checks; never invent historical prices.
3. Integrate PrizePicks only after confirming the provider's free-plan quota and billing rules out-of-band, with secret kept server-side, explicit request budget, caching, and safe rate limits.
4. Review public-facing names, URLs, and logos for trademark risk. Rename/remove potentially confusing branding; don't claim that renaming alone resolves a complaint.
5. Test on a preview branch before merging to main or changing deployments.

Do not place API keys or tokens in this public repository.
