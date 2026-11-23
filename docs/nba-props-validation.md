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

## Automated checks

The existing `.github/workflows/nba-prop-validation.yml` now watches `src/nba-prop-quote-validation.mjs`, `nba-props.html`, and both related test files on pushes and pull requests. Its Node.js 22 test command includes both newer suites alongside the existing NBA validation, odds movement, adapter, and dashboard smoke tests. Confirm the workflow run is green in GitHub Actions before release; editing the workflow does not itself prove it passed.

## Release checklist

1. Run the test command and resolve failures.
2. Verify that `nba-props.html` loads its ES module without console errors on GitHub Pages.
3. Check the player finder and quote validation panel on a phone.
4. Confirm failed or stale snapshots never enable recommendations.
5. Do not enable live EV predictions until independent provider authentication, player identity, event mapping, and per-quote timestamps are available.

On 2026-11-22, **34 of 34 quote-validation unit tests passed** using Node.js 22.16.0 against locally reconstructed copies of the GitHub connector's current validator and unit-test content. This was not a full repository checkout. The 14 HTML integration cases were independently checked against the GitHub connector's current `nba-props.html` content: all 26 regex assertions passed. This was a source-level assertion check, **not** an execution of the Node.js integration test file. The live GitHub Pages browser deployment remains unverified. Do not describe all 48 Node.js tests as passing until both test files run against a checked-out repository.

## Published snapshot compatibility and provenance (2026-11-22)

- The repository's historical fixture at `data/nba-player-props-latest.json` reports capture time `2026-11-20T21:14:27.090695+00:00`. The browser now accepts explicit UTC `Z` or `+00:00` with up to six fractional digits and checks the calendar time before enabling snapshot exports.
- The inspected fixture has **1 event, 6 bookmakers and 304 player-market outcomes**. The 304 outcomes have **zero explicit `source_record_id` values**. This is a data-provenance gap, not evidence that the quotes are false or that any particular bet has positive EV.
- The fixture's 304 player-market outcomes have valid integer American prices under the basic UI audit; market update times were present and not later than snapshot capture. These checks do not authenticate the provider, identify the player independently, or make odds live.
- The new `tests/nba-published-snapshot.test.mjs` exercises the committed fixture without network calls. The GitHub Actions workflow includes this file and triggers on changes to the fixture. **A green CI run and deployed-browser check have not been confirmed.**
- There are now 34 quote-validation unit tests, 21 page-integration source checks, and 2 published-fixture tests (57 written tests in these three suites). The previous 34/34 local unit-test result predates recent page and fixture changes; do not interpret it as a current full-suite pass.
