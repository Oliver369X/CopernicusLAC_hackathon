-- Overlay mensual 2023-2025 para Lab (opcional — SEED_DEMO_OVERLAY=1)
-- No ejecutar en prod cuando geo-data CDSE está activo.

INSERT INTO satellite_readings (zone_id, ndvi, ndmi, ndre, source, reading_date, scene_date, captured_at)
SELECT
  z.zone_id,
  round((z.base_ndvi + z.amp * sin((extract(month from m)::int - 3) / 12.0 * 2 * pi())
    + CASE WHEN z.zone_id = 'zone-lucia-soja' AND extract(year from m) = 2024 AND extract(month from m) IN (2,3) THEN -0.18
           WHEN z.zone_id = 'zone-rosa-s' AND extract(year from m) = 2024 AND extract(month from m) IN (1,2,3) THEN -0.22
           WHEN extract(year from m) = 2025 AND extract(month from m) >= 4 THEN 0.05 ELSE 0 END)::numeric, 3),
  round((0.38 + 0.06 * cos(extract(month from m)::int / 12.0 * 2 * pi()))::numeric, 3),
  round((0.30 + 0.04 * sin(extract(month from m)::int / 12.0 * 2 * pi()))::numeric, 3),
  'copernicus-personas-3y',
  m::date,
  m::date,
  m::timestamptz
FROM generate_series(date '2023-01-15', date '2025-12-15', interval '1 month') AS m
CROSS JOIN (
  VALUES
    ('zone-lucia-soja', 0.58::float, 0.08::float),
    ('zone-rosa-n', 0.60::float, 0.09::float),
    ('zone-rosa-s', 0.52::float, 0.08::float),
    ('zone-rosa-e', 0.57::float, 0.08::float),
    ('zone-rosa-w', 0.56::float, 0.07::float),
    ('zone-rosa-c', 0.59::float, 0.08::float)
) AS z(zone_id, base_ndvi, amp)
ON CONFLICT (zone_id, reading_date) DO NOTHING;
