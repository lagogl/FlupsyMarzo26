-- Tabella per le letture automatiche dalla sonda Seneye (es. "DF SIFONI")
-- via API api.seneye.com. Ogni record è uno snapshot dell'ultima lettura.
CREATE TABLE IF NOT EXISTS seneye_readings (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  record_date TIMESTAMP NOT NULL DEFAULT now(),
  temperature REAL,
  ph REAL,
  nh3 REAL,
  nh4 REAL,
  o2 REAL,
  lux REAL,
  par REAL,
  kelvin REAL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seneye_readings_device_date_idx
  ON seneye_readings (device_id, record_date);
