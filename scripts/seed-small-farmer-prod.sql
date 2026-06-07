-- Demo pequeña agricultora (maria@doctorsoya.app) — idempotente para VPS/prod.
-- Contraseña: demo123456

INSERT INTO users (id, email, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000004', 'maria@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO organizations (id, name) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'Finca María — San Julián')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO organization_members (org_id, user_id, role) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004', 'owner')
ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

UPDATE organizations
SET
  billing_model = 'hectare',
  plan_tier = 'growth',
  hectare_limit = 20,
  max_zone_split = 1
WHERE id = 'a0000000-0000-4000-8000-000000000002';

INSERT INTO fields (id, org_id, name, crop_type, area_ha, center_lat, center_lng, bounds, location_label, planting_date, days_from_planting, overall_health, risk_score, notifications) VALUES
('field-pf-soja', 'a0000000-0000-4000-8000-000000000002', 'Chacra Soja María', 'soybean', 8, -16.97, -62.83,
 '{"type":"Polygon","coordinates":[[[-62.835,-16.975],[-62.825,-16.975],[-62.825,-16.965],[-62.835,-16.965],[-62.835,-16.975]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-10-05', 28, 'good', 38, 1),
('field-pf-maiz', 'a0000000-0000-4000-8000-000000000002', 'Parcela Maíz El Ceibo', 'corn', 6, -16.93, -62.87,
 '{"type":"Polygon","coordinates":[[[-62.875,-16.935],[-62.865,-16.935],[-62.865,-16.925],[-62.875,-16.925],[-62.875,-16.935]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-09-20', 42, 'excellent', 25, 0),
('field-pf-trigo', 'a0000000-0000-4000-8000-000000000002', 'Huerta Trigo Sur', 'wheat', 5, -16.99, -62.81,
 '{"type":"Polygon","coordinates":[[[-62.815,-16.995],[-62.805,-16.995],[-62.805,-16.985],[-62.815,-16.985],[-62.815,-16.995]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-04-15', 120, 'warning', 55, 2)
ON CONFLICT (id) DO UPDATE SET
  org_id = EXCLUDED.org_id, name = EXCLUDED.name, crop_type = EXCLUDED.crop_type, area_ha = EXCLUDED.area_ha,
  center_lat = EXCLUDED.center_lat, center_lng = EXCLUDED.center_lng,
  bounds = EXCLUDED.bounds, location_label = EXCLUDED.location_label,
  planting_date = EXCLUDED.planting_date, days_from_planting = EXCLUDED.days_from_planting,
  overall_health = EXCLUDED.overall_health, risk_score = EXCLUDED.risk_score,
  notifications = EXCLUDED.notifications;

INSERT INTO zones (id, field_id, name, area_ha, bounds, health, ndvi_average, ndmi_average, temperature_average, soil_moisture_average, observation_count, disease_risks) VALUES
('zone-pf-soja', 'field-pf-soja', 'Parcela completa — soja', 8, '{"type":"Polygon","coordinates":[[[-62.835,-16.975],[-62.825,-16.975],[-62.825,-16.965],[-62.835,-16.965],[-62.835,-16.975]]]}', 'good', 0.61, 0.43, 29.2, 70, 5, '[]'),
('zone-pf-maiz', 'field-pf-maiz', 'Parcela completa — maíz', 6, '{"type":"Polygon","coordinates":[[[-62.875,-16.935],[-62.865,-16.935],[-62.865,-16.925],[-62.875,-16.925],[-62.875,-16.935]]]}', 'excellent', 0.68, 0.48, 28.8, 74, 4, '[]'),
('zone-pf-trigo', 'field-pf-trigo', 'Parcela completa — trigo', 5, '{"type":"Polygon","coordinates":[[[-62.815,-16.995],[-62.805,-16.995],[-62.805,-16.985],[-62.815,-16.985],[-62.815,-16.995]]]}', 'warning', 0.49, 0.33, 23.5, 62, 6, '["Roya temprana"]')
ON CONFLICT (id) DO UPDATE SET
  field_id = EXCLUDED.field_id, name = EXCLUDED.name, area_ha = EXCLUDED.area_ha, bounds = EXCLUDED.bounds,
  health = EXCLUDED.health, ndvi_average = EXCLUDED.ndvi_average,
  ndmi_average = EXCLUDED.ndmi_average, temperature_average = EXCLUDED.temperature_average,
  soil_moisture_average = EXCLUDED.soil_moisture_average,
  observation_count = EXCLUDED.observation_count, disease_risks = EXCLUDED.disease_risks;

DELETE FROM alerts WHERE dedup_key IN ('seed-alert-pf-1', 'seed-alert-pf-2');

INSERT INTO alerts (field_id, zone_id, type, severity, title, description, recommendation, resolved, dedup_key) VALUES
('field-pf-soja', 'zone-pf-soja', 'threshold', 'warning', 'NDVI en descenso — Chacra Soja',
 'Lectura satelital muestra leve caída de vigor en la parcela.', 'Revisar riego y nutrición en los próximos días.', false, 'seed-alert-pf-1'),
('field-pf-trigo', 'zone-pf-trigo', 'disease', 'warning', 'Riesgo de roya — Huerta Trigo',
 'Condiciones húmedas favorables para roya en trigo.', 'Programar fungicida preventivo si persiste la humedad.', false, 'seed-alert-pf-2');

INSERT INTO satellite_readings (zone_id, ndvi, ndmi, ndre, source, reading_date, scene_date, captured_at) VALUES
('zone-pf-soja', 0.61, 0.43, 0.35, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-pf-maiz', 0.68, 0.48, 0.39, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-pf-trigo', 0.49, 0.33, 0.27, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now())
ON CONFLICT (zone_id, reading_date) DO NOTHING;

INSERT INTO field_external_ids (field_id, parcel_key, geodata_region_code) VALUES
  ('field-pf-soja', 'PF-SOJA-001', 'SC-BO'),
  ('field-pf-maiz', 'PF-MAIZ-001', 'SC-BO'),
  ('field-pf-trigo', 'PF-TRIGO-001', 'SC-BO')
ON CONFLICT (field_id) DO UPDATE SET
  parcel_key = EXCLUDED.parcel_key,
  geodata_region_code = EXCLUDED.geodata_region_code,
  updated_at = now();
