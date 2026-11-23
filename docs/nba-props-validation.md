# NBA Player Props validation checks

The browser page is `nba-props.html`. The pure quote validators live in `src/nba-prop-quote-validation.mjs`.

## Run tests

With Node.js 20 or newer, from the repository root:

```sh
node --test tests/nba-prop-quote-validation.test.mjs tests/nba-props-page-integration.test.mjs
```

These tests make **no paid provider API calls** and do not need secrets.

## Trust boundary

- `providerVerified: true` is **not authentication**. It is an upstream assertion. Only a trusted server-side ingestion pipeline can establish provenance.
- A quote's capture time is not necessarily the provider's last-updated time.
- Matching player, event, market, period, and line fields are necessary but not sufficient for trustworthy cross-provider comparisons.
- Two-way market validation checks opposite sides at the same book and threshold; it does not establish a predictive edge.
- The NBA browser page currently keeps EV recommendations disabled for raw and unverified quotes.

## Release checklist

1. Run the test command and resolve failures.
2. Verify that `nba-props.html` loads its ES module without console errors on GitHub Pages.
3. Check the player finder and quote validation panel on a phone.
4. Confirm failed or stale snapshots never enable recommendations.
5. Do not enable live EV predictions until independent provider authentication, player identity, event mapping, and per-quote timestamps are available.

The local regression run of the **20 unit tests** passed on 2026-11-22; the six HTML integration tests and live browser deployment have not yet been independently run.
