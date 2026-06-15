---
name: Seneye API has no measurement timestamp
description: Why the Seneye probe card uses the stored snapshot time, not a live API timestamp
---

The Seneye v1 API for this account (`api.seneye.com/v1`) does NOT expose when a
reading was actually measured. Confirmed by live probes:
- `/devices/{id}` returns only `id, description, type, time_diff` — no `status` block.
- `/devices/{id}/exps` returns per-metric `curr/avg/trend/status` (status here is
  0/1 OK/warning), with NO timestamp.
- The documented `status.last_experiment` (unix ts) is NOT returned for this account.
- The probe updates only every ~30 min; polling faster yields nothing new.

**Consequence / rule:** Never show `new Date()` as the "measurement time" — that's
just the request/login time and is what users complained about. The only real
time available is when our scheduler acquired+stored a snapshot (`seneye_readings.
record_date`, every ~30 min). So the dashboard card / monitor show the latest
stored snapshot's time labelled "Ultima misura". If the latest snapshot is stale
(> ~31 min, scheduler down), force a fresh poll — then "now" is genuinely the
acquisition time.

**Why:** the API gives no better signal; stored poll time is the closest honest
proxy for "last reading from the sonda".
