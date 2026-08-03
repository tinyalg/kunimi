CREATE TABLE IF NOT EXISTS hourly_stats (
  date TEXT,
  hour INTEGER,
  host TEXT,
  referrer TEXT,
  country TEXT,
  region TEXT,
  path TEXT,
  device TEXT,
  pv_count INTEGER DEFAULT 1,
  PRIMARY KEY (date, hour, host, referrer, country, region, path, device)
);