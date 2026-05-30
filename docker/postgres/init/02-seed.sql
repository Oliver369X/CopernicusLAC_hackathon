-- Usuarios demo (contraseña: demo123456)
-- admin@doctorsoya.app   → owner
-- campo@doctorsoya.app   → viewer
-- analista@doctorsoya.app → admin

INSERT INTO users (id, email, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'admin@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000002', 'campo@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000003', 'analista@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy');

INSERT INTO organizations (id, name) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Finca Demo CopernicusLAC');

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
 'Plateau Region', '2024-03-10', 140, 'warning', 62, 3);

INSERT INTO zones (id, field_id, name, area_ha, bounds, health, ndvi_average, ndmi_average, temperature_average, soil_moisture_average, observation_count, disease_risks) VALUES
('zone-1-a', 'field-1', 'Zone A1', 50, '{}', 'good', 0.64, 0.47, 29.6, 73, 12, '[]'),
('zone-1-b', 'field-1', 'Zone A2', 50, '{}', 'warning', 0.55, 0.38, 30.2, 68, 10, '["Powdery Mildew Risk"]'),
('zone-1-c', 'field-1', 'Zone A3', 50, '{}', 'good', 0.58, 0.42, 28.9, 71, 11, '[]'),
('zone-2-a', 'field-2', 'Zone B1', 100, '{}', 'excellent', 0.72, 0.52, 28.5, 75, 15, '[]'),
('zone-2-b', 'field-2', 'Zone B2', 100, '{}', 'good', 0.65, 0.44, 29.1, 72, 14, '["Gray Leaf Spot"]'),
('zone-3-a', 'field-3', 'Zone C1', 120, '{}', 'warning', 0.52, 0.35, 22.8, 65, 18, '["Septoria Tritici","Stripe Rust"]');

INSERT INTO alerts (field_id, zone_id, type, severity, title, description, recommendation, resolved, dedup_key) VALUES
('field-1', 'zone-1-b', 'threshold', 'warning', 'NDVI bajo en Zone A2',
 'El índice NDVI cayó por debajo del umbral en la zona norte.', 'Inspeccionar mancha amarilla; considerar riego suplementario.', false, 'seed-alert-1'),
('field-3', 'zone-3-a', 'disease', 'critical', 'Riesgo de roya en trigo',
 'Condiciones favorables para Stripe Rust detectadas.', 'Aplicar fungicida preventivo en las próximas 48h.', false, 'seed-alert-2');

INSERT INTO satellite_readings (zone_id, ndvi, ndmi, ndre, source, captured_at) VALUES
('zone-1-a', 0.64, 0.47, 0.38, 'copernicus', now() - interval '1 day'),
('zone-2-a', 0.72, 0.52, 0.41, 'copernicus', now() - interval '1 day'),
('zone-3-a', 0.52, 0.35, 0.29, 'copernicus', now() - interval '2 days');
