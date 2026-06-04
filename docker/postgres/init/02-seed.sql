-- Usuarios demo (contraseña: demo123456)
-- admin@doctorsoya.app   → owner
-- campo@doctorsoya.app   → viewer
-- analista@doctorsoya.app → admin

INSERT INTO users (id, email, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'admin@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000002', 'campo@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000003', 'analista@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy');

INSERT INTO organizations (id, name) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Aura Agro Demo LAC');

INSERT INTO organization_members (org_id, user_id, role) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'owner'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'viewer'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'admin');

-- Campos demo (subset representativo)
INSERT INTO fields (id, org_id, name, crop_type, area_ha, center_lat, center_lng, bounds, location_label, planting_date, days_from_planting, overall_health, risk_score, notifications) VALUES
('field-1', 'a0000000-0000-4000-8000-000000000001', 'North Sector 1', 'soybean', 150, -34.9, -62.3,
 '{"type":"Polygon","coordinates":[[[-62.32,-34.92],[-62.28,-34.92],[-62.28,-34.88],[-62.32,-34.88],[-62.32,-34.92]]]}',
 'Pampas Region', '2024-09-15', 45, 'good', 35, 2),
('field-2', 'a0000000-0000-4000-8000-000000000001', 'East Field', 'corn', 200, -35.1, -62.25,
 '{"type":"Polygon","coordinates":[[[-62.27,-35.12],[-62.23,-35.12],[-62.23,-35.08],[-62.27,-35.08],[-62.27,-35.12]]]}',
 'Valley Region', '2024-08-20', 70, 'excellent', 22, 1),
('field-3', 'a0000000-0000-4000-8000-000000000001', 'West Plot', 'wheat', 120, -34.85, -62.4,
 '{"type":"Polygon","coordinates":[[[-62.42,-34.87],[-62.38,-34.87],[-62.38,-34.83],[-62.42,-34.83],[-62.42,-34.87]]]}',
 'Plateau Region', '2024-03-10', 140, 'warning', 62, 3),
('field-4', 'a0000000-0000-4000-8000-000000000001', 'South Section', 'cotton', 180, -35.2, -62.35,
 '{"type":"Polygon","coordinates":[[[-62.37,-35.22],[-62.33,-35.22],[-62.33,-35.18],[-62.37,-35.18],[-62.37,-35.22]]]}',
 'Lowlands', '2024-10-01', 30, 'good', 45, 1),
('field-5', 'a0000000-0000-4000-8000-000000000001', 'North 2', 'sunflower', 160, -34.8, -62.28,
 '{"type":"Polygon","coordinates":[[[-62.30,-34.82],[-62.26,-34.82],[-62.26,-34.78],[-62.30,-34.78],[-62.30,-34.82]]]}',
 'Pampas North', '2024-08-05', 85, 'excellent', 18, 0),
('field-6', 'a0000000-0000-4000-8000-000000000001', 'Canola North', 'canola', 140, -34.75, -62.32,
 '{"type":"Polygon","coordinates":[[[-62.34,-34.77],[-62.30,-34.77],[-62.30,-34.73],[-62.34,-34.73],[-62.34,-34.77]]]}',
 'Northern Plains', '2024-02-15', 145, 'warning', 58, 2);

INSERT INTO zones (id, field_id, name, area_ha, bounds, health, ndvi_average, ndmi_average, temperature_average, soil_moisture_average, observation_count, disease_risks) VALUES
('zone-1-a', 'field-1', 'Zone A1', 50, '{}', 'good', 0.64, 0.47, 29.6, 73, 12, '[]'),
('zone-1-b', 'field-1', 'Zone A2', 50, '{}', 'warning', 0.55, 0.38, 30.2, 68, 10, '["Powdery Mildew Risk"]'),
('zone-1-c', 'field-1', 'Zone A3', 50, '{}', 'good', 0.58, 0.42, 28.9, 71, 11, '[]'),
('zone-1-d', 'field-1', 'Zone A4 — Estrés hídrico', 40, '{}', 'critical', 0.38, 0.22, 31.5, 48, 6, '["Drought Stress","Water Deficit"]'),
('zone-1-e', 'field-1', 'Zone A5 — Recuperación', 40, '{}', 'good', 0.62, 0.44, 28.5, 72, 9, '[]'),
('zone-1-f', 'field-1', 'Zone A6 — Radar S1 bajo', 40, '{}', 'warning', 0.48, 0.30, 30.0, 55, 7, '["Soil Moisture Anomaly"]'),
('zone-2-a', 'field-2', 'Zone B1', 100, '{}', 'excellent', 0.72, 0.52, 28.5, 75, 15, '[]'),
('zone-2-b', 'field-2', 'Zone B2', 100, '{}', 'good', 0.65, 0.44, 29.1, 72, 14, '["Gray Leaf Spot"]'),
('zone-3-a', 'field-3', 'Zone C1', 120, '{}', 'warning', 0.52, 0.35, 22.8, 65, 18, '["Septoria Tritici","Stripe Rust"]'),
('zone-4-a', 'field-4', 'Zone D1', 90, '{}', 'warning', 0.42, 0.28, 31.2, 68, 8, '[]'),
('zone-4-b', 'field-4', 'Zone D2', 90, '{}', 'warning', 0.38, 0.24, 32.1, 62, 7, '["Bacterial Blight Risk"]'),
('zone-5-a', 'field-5', 'Zone E1', 160, '{}', 'excellent', 0.68, 0.48, 27.4, 70, 13, '[]'),
('zone-6-a', 'field-6', 'Zone F1', 70, '{}', 'warning', 0.58, 0.40, 20.5, 72, 16, '["Blackleg Risk"]'),
('zone-6-b', 'field-6', 'Zone F2', 70, '{}', 'warning', 0.55, 0.38, 21.2, 68, 14, '["Sclerotinia"]');

INSERT INTO alerts (field_id, zone_id, type, severity, title, description, recommendation, resolved, dedup_key) VALUES
('field-1', 'zone-1-b', 'threshold', 'warning', 'NDVI bajo en Zone A2',
 'El índice NDVI cayó por debajo del umbral en la zona norte.', 'Inspeccionar mancha amarilla; considerar riego suplementario.', false, 'seed-alert-1'),
('field-1', 'zone-1-d', 'threshold', 'critical', 'Estrés hídrico Zone A4',
 'NDVI y humedad suelo muy bajos — escenario demo sequía.', 'Priorizar riego localizado; validar con Sentinel-1.', false, 'seed-alert-3'),
('field-3', 'zone-3-a', 'disease', 'critical', 'Riesgo de roya en trigo',
 'Condiciones favorables para Stripe Rust detectadas.', 'Aplicar fungicida preventivo en las próximas 48h.', false, 'seed-alert-2');

INSERT INTO satellite_readings (zone_id, ndvi, ndmi, ndre, source, captured_at) VALUES
('zone-1-a', 0.64, 0.47, 0.38, 'copernicus', now() - interval '1 day'),
('zone-2-a', 0.72, 0.52, 0.41, 'copernicus', now() - interval '1 day'),
('zone-3-a', 0.52, 0.35, 0.29, 'copernicus', now() - interval '2 days');
