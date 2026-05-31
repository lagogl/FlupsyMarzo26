---
name: Seneye probe integration
description: How the DF SIFONI Seneye probe integration works and its non-obvious gotchas.
---
- The probe is resolved by device NAME `"DF SIFONI"` (matched case-insensitively against `description` from `GET /v1/devices`), NOT by a hard-coded id or env var. Its current id happens to be 162884, but a device id env var the user set (163010) pointed at a different device named "morta" and is intentionally ignored.
- Credentials: `SENEYE_USERNAME` (account email) + `SENEYE_PASSWORD` (account password), used as query params `?user=&pwd=` against `https://api.seneye.com/v1`. Service also falls back to `SENEYE_USER`/`SENEYE_PWD`.
- The Seneye API returns only the LAST reading and updates ~every 30 min. There is no historical endpoint — history is built by snapshotting into `seneye_readings` on a 30-min scheduler.
- `pollAndStore` throttles: it skips inserting if the latest stored row is < 5 min old (anti-abuse / anti-bloat), since the endpoint is unauthenticated.

**Why:** `total_weight`/id-based identification proved unreliable; the user's device-id secret was wrong, so name resolution is the source of truth.
