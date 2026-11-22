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

At least two independently timestamped records from the **same sportsbook**
and exact market are needed to calculate a movement. Data cannot be backfilled
from illustrative examples. The UI uses a 3-percentage-point implied-probability
movement threshold for the 'Significant' research flag; it is **not** a sharp
money determination. All EV recommendations remain disabled.

Operational requirements: preserve original source records, document usage
rights and API costs, verify provider coverage and freshness, and avoid placing
credentials in this public repository.
