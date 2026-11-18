# NHL final-score relay (not deployed)

This directory contains a proposed read-only Cloudflare Worker relay. The public GitHub Pages website does **not** call this Worker yet. No Cloudflare account, domain, paid API, or scheduled job was created.

## Before enabling
1. Run `node --test tests/nhl-relay.test.mjs` and verify the GitHub Actions smoke workflow.
2. Deploy `worker/nhl-final-relay.mjs` to a Cloudflare Worker under an account you control. Configure a custom Worker route/domain if appropriate.
3. Test against known completed NHL games and in-progress games, including overtime/shootout outcomes. Confirm actual upstream availability, Worker compatibility, CORS, and reasonable request limits.
4. Only after successful live testing, update the dashboard's lookup URL to the verified Worker URL. **Do not** treat a matching game ID and final score as sufficient to auto-settle: verify selected team identity, market period, book rules, voids, and score provenance.

The Worker only permits ten-digit IDs in `GET /nhl/final/{gameId}`, restricts browser origins to `https://alanpinto88.github.io`, and returns a minimal validated final-score response. Origin checks are **not authentication**; non-browser clients can omit or spoof Origin. Add rate limiting before public deployment. The Worker does not accept arbitrary upstream URLs and does not write bet data.

This relay is intentionally separate from the user's local-only bet ledger.
