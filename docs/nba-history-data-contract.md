# NBA historical quote snapshot contract

The NBA Player Props historical movement panel reads `data/nba-props-history.json`.
This file is intentionally **not** populated with fabricated data. Publishing the
panel alone does not enable a provider or paid API calls.

Expected JSON shape:

```json
{
  "quotes": []
}
```

Each actual quote must include:
- `verified`: boolean true only after independent source checks
- `player_id`, `player_name`, `event_id`: source-grounded identifiers
- `market`, `period`, `side`, `line`: exact market identity
- `american_odds`: integer American odds, absolute value >= 100
- `sportsbook`: source sportsbook
- `source_id`: unique source record identifier
- `captured_at`: original ISO 8601 timestamp
- `event_starts_at`: valid ISO 8601 game-start timestamp, strictly later than quote capture; required for pregame movement

At least two independently timestamped records from the **same sportsbook**
and exact market are needed to calculate a movement. Data cannot be backfilled
from illustrative examples. The UI uses a 3-percentage-point implied-probability
movement threshold for the 'Significant' research flag; it is **not** a sharp
money determination. All EV recommendations remain disabled.

Operational requirements: preserve original source records, document usage
rights and API costs, verify provider coverage and freshness, and avoid placing
credentials in this public repository.

## iPhone local JSON import

The NBA historical movement panel supports selecting a JSON file from the iPhone Files picker. This is a **local, temporary inspection**, not a server upload or a permanent data connection. Reloading the page clears the selected data. The file must be a JSON object containing a `quotes` array, with no more than 100,000 records, and the file must be at most 5 MB.

A quote marked `verified: true` is **not independently authenticated by the browser**. It only means the source record claims verification and passes structural and timestamp checks. Do not describe local imports as verified sportsbook feeds without independent source provenance.

The displayed first price is the **first observed price in the supplied dataset**, not necessarily the actual sportsbook opening price. Snapshot counts reflect distinct observed capture timestamps, not bet counts or betting volume. A 3-percentage-point implied-probability change is a research flag, not evidence of sharp money.

Never import or publish API keys, credentials, private account data, or datasets whose use or redistribution is unauthorized. The local import does not spend API credits.
