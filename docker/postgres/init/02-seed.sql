-- Usuarios demo (contraseña: demo123456)
INSERT INTO users (id, email, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'admin@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000002', 'campo@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000003', 'analista@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000004', 'maria@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy');

INSERT INTO organizations (id, name) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Aura Agro Demo LAC'),
  ('a0000000-0000-4000-8000-000000000002', 'Finca María — San Julián');

INSERT INTO organization_members (org_id, user_id, role) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'owner'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'viewer'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'admin'),
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004', 'owner');

-- SJ_SEED_START
INSERT INTO fields (id, org_id, name, crop_type, area_ha, center_lat, center_lng, bounds, location_label, planting_date, days_from_planting, overall_health, risk_score, notifications) VALUES
('field-sj-norte', 'a0000000-0000-4000-8000-000000000001', 'Lote Norte San Julián', 'soybean', 150, -16.95, -62.85,
 '{"type":"Polygon","coordinates":[[[-62.86,-16.96],[-62.84,-16.96],[-62.84,-16.94],[-62.86,-16.94],[-62.86,-16.96]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-09-15', 45, 'good', 35, 2),
('field-sj-este', 'a0000000-0000-4000-8000-000000000001', 'Parcela Este San Ramón', 'corn', 200, -17.05, -62.55,
 '{"type":"Polygon","coordinates":[[[-62.56,-17.06],[-62.54,-17.06],[-62.54,-17.04],[-62.56,-17.04],[-62.56,-17.06]]]}',
 'San Ramón, Santa Cruz — Bolivia', '2024-08-20', 70, 'excellent', 22, 1),
('field-sj-oeste', 'a0000000-0000-4000-8000-000000000001', 'Chacra Oeste Pailón', 'wheat', 120, -16.75, -62.95,
 '{"type":"Polygon","coordinates":[[[-62.96,-16.76],[-62.94,-16.76],[-62.94,-16.74],[-62.96,-16.74],[-62.96,-16.76]]]}',
 'Pailón, Santa Cruz — Bolivia', '2024-03-10', 140, 'warning', 62, 3),
('field-sj-sur', 'a0000000-0000-4000-8000-000000000001', 'Sector Sur Tres Cruces', 'soybean', 180, -17.15, -62.70,
 '{"type":"Polygon","coordinates":[[[-62.71,-17.16],[-62.69,-17.16],[-62.69,-17.14],[-62.71,-17.14],[-62.71,-17.16]]]}',
 'Tres Cruces, Santa Cruz — Bolivia', '2024-10-01', 30, 'good', 45, 1);

INSERT INTO zones (id, field_id, name, area_ha, bounds, health, ndvi_average, ndmi_average, temperature_average, soil_moisture_average, observation_count, disease_risks) VALUES
('zone-sj-n-1', 'field-sj-norte', 'Zona N1 — Alta biomasa', 50, '{"type":"Polygon","coordinates":[[[-62.86,-16.955],[-62.845,-16.955],[-62.845,-16.945],[-62.86,-16.945],[-62.86,-16.955]]]}', 'good', 0.64, 0.47, 29.6, 73, 12, '[]'),
('zone-sj-n-2', 'field-sj-norte', 'Zona N2 — Riesgo roya', 50, '{"type":"Polygon","coordinates":[[[-62.855,-16.955],[-62.84,-16.955],[-62.84,-16.945],[-62.855,-16.945],[-62.855,-16.955]]]}', 'warning', 0.55, 0.38, 30.2, 68, 10, '["Riesgo de roya"]'),
('zone-sj-n-3', 'field-sj-norte', 'Zona N3 — Estable', 50, '{"type":"Polygon","coordinates":[[[-62.86,-16.95],[-62.845,-16.95],[-62.845,-16.94],[-62.86,-16.94],[-62.86,-16.95]]]}', 'good', 0.58, 0.42, 28.9, 71, 11, '[]'),
('zone-sj-n-4', 'field-sj-norte', 'Zona N4 — Estrés hídrico', 40, '{"type":"Polygon","coordinates":[[[-62.855,-16.95],[-62.84,-16.95],[-62.84,-16.94],[-62.855,-16.94],[-62.855,-16.95]]]}', 'critical', 0.38, 0.22, 31.5, 48, 6, '["Estrés hídrico","Déficit de agua"]'),
('zone-sj-n-5', 'field-sj-norte', 'Zona N5 — Recuperación', 40, '{"type":"Polygon","coordinates":[[[-62.86,-16.945],[-62.845,-16.945],[-62.845,-16.94],[-62.86,-16.94],[-62.86,-16.945]]]}', 'good', 0.62, 0.44, 28.5, 72, 9, '[]'),
('zone-sj-n-6', 'field-sj-norte', 'Zona N6 — Radar S1 bajo', 40, '{"type":"Polygon","coordinates":[[[-62.855,-16.945],[-62.84,-16.945],[-62.84,-16.94],[-62.855,-16.94],[-62.855,-16.945]]]}', 'warning', 0.48, 0.30, 30.0, 55, 7, '["Anomalía de humedad del suelo"]'),
('zone-sj-e-1', 'field-sj-este', 'Zona E1 — Dosel alto', 100, '{"type":"Polygon","coordinates":[[[-62.56,-17.055],[-62.545,-17.055],[-62.545,-17.045],[-62.56,-17.045],[-62.56,-17.055]]]}', 'excellent', 0.72, 0.52, 28.5, 75, 15, '[]'),
('zone-sj-e-2', 'field-sj-este', 'Zona E2 — Mancha foliar', 100, '{"type":"Polygon","coordinates":[[[-62.555,-17.055],[-62.54,-17.055],[-62.54,-17.045],[-62.555,-17.045],[-62.555,-17.055]]]}', 'good', 0.65, 0.44, 29.1, 72, 14, '["Mancha foliar gris"]'),
('zone-sj-w-1', 'field-sj-oeste', 'Zona W1 — Roya y septoria', 120, '{"type":"Polygon","coordinates":[[[-62.96,-16.755],[-62.94,-16.755],[-62.94,-16.745],[-62.96,-16.745],[-62.96,-16.755]]]}', 'warning', 0.52, 0.35, 22.8, 65, 18, '["Septoria","Roya amarilla"]'),
('zone-sj-s-1', 'field-sj-sur', 'Zona S1 — Emergencia', 90, '{"type":"Polygon","coordinates":[[[-62.71,-17.155],[-62.695,-17.155],[-62.695,-17.145],[-62.71,-17.145],[-62.71,-17.155]]]}', 'warning', 0.42, 0.28, 31.2, 68, 8, '[]'),
('zone-sj-s-2', 'field-sj-sur', 'Zona S2 — Riesgo bacteriano', 90, '{"type":"Polygon","coordinates":[[[-62.705,-17.155],[-62.69,-17.155],[-62.69,-17.145],[-62.705,-17.145],[-62.705,-17.155]]]}', 'warning', 0.38, 0.24, 32.1, 62, 7, '["Riesgo de tizón bacteriano"]');

INSERT INTO alerts (field_id, zone_id, type, severity, title, description, recommendation, resolved, dedup_key) VALUES
('field-sj-norte', 'zone-sj-n-2', 'threshold', 'warning', 'NDVI bajo en Zona N2',
 'El índice NDVI cayó por debajo del umbral en la zona norte.', 'Inspeccionar mancha amarilla; considerar riego suplementario.', false, 'seed-alert-1'),
('field-sj-norte', 'zone-sj-n-4', 'threshold', 'critical', 'Estrés hídrico Zona N4',
 'NDVI y humedad suelo muy bajos — escenario demo sequía.', 'Priorizar riego localizado; validar con Sentinel-1.', false, 'seed-alert-3'),
('field-sj-oeste', 'zone-sj-w-1', 'disease', 'critical', 'Riesgo de roya en trigo',
 'Condiciones favorables para roya detectadas.', 'Aplicar fungicida preventivo en las próximas 48h.', false, 'seed-alert-2');

-- PF_SEED_START — demo pequeña agricultora (19 ha, 1 zona = 1 parcela)
INSERT INTO fields (id, org_id, name, crop_type, area_ha, center_lat, center_lng, bounds, location_label, planting_date, days_from_planting, overall_health, risk_score, notifications) VALUES
('field-pf-soja', 'a0000000-0000-4000-8000-000000000002', 'Chacra Soja María', 'soybean', 8, -16.97, -62.83,
 '{"type":"Polygon","coordinates":[[[-62.835,-16.975],[-62.825,-16.975],[-62.825,-16.965],[-62.835,-16.965],[-62.835,-16.975]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-10-05', 28, 'good', 38, 1),
('field-pf-maiz', 'a0000000-0000-4000-8000-000000000002', 'Parcela Maíz El Ceibo', 'corn', 6, -16.93, -62.87,
 '{"type":"Polygon","coordinates":[[[-62.875,-16.935],[-62.865,-16.935],[-62.865,-16.925],[-62.875,-16.925],[-62.875,-16.935]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-09-20', 42, 'excellent', 25, 0),
('field-pf-trigo', 'a0000000-0000-4000-8000-000000000002', 'Huerta Trigo Sur', 'wheat', 5, -16.99, -62.81,
 '{"type":"Polygon","coordinates":[[[-62.815,-16.995],[-62.805,-16.995],[-62.805,-16.985],[-62.815,-16.985],[-62.815,-16.995]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-04-15', 120, 'warning', 55, 2);

INSERT INTO zones (id, field_id, name, area_ha, bounds, health, ndvi_average, ndmi_average, temperature_average, soil_moisture_average, observation_count, disease_risks) VALUES
('zone-pf-soja', 'field-pf-soja', 'Parcela completa — soja', 8, '{"type":"Polygon","coordinates":[[[-62.835,-16.975],[-62.825,-16.975],[-62.825,-16.965],[-62.835,-16.965],[-62.835,-16.975]]]}', 'good', 0.61, 0.43, 29.2, 70, 5, '[]'),
('zone-pf-maiz', 'field-pf-maiz', 'Parcela completa — maíz', 6, '{"type":"Polygon","coordinates":[[[-62.875,-16.935],[-62.865,-16.935],[-62.865,-16.925],[-62.875,-16.925],[-62.875,-16.935]]]}', 'excellent', 0.68, 0.48, 28.8, 74, 4, '[]'),
('zone-pf-trigo', 'field-pf-trigo', 'Parcela completa — trigo', 5, '{"type":"Polygon","coordinates":[[[-62.815,-16.995],[-62.805,-16.995],[-62.805,-16.985],[-62.815,-16.985],[-62.815,-16.995]]]}', 'warning', 0.49, 0.33, 23.5, 62, 6, '["Roya temprana"]');

INSERT INTO alerts (field_id, zone_id, type, severity, title, description, recommendation, resolved, dedup_key) VALUES
('field-pf-soja', 'zone-pf-soja', 'threshold', 'warning', 'NDVI en descenso — Chacra Soja',
 'Lectura satelital muestra leve caída de vigor en la parcela.', 'Revisar riego y nutrición en los próximos días.', false, 'seed-alert-pf-1'),
('field-pf-trigo', 'zone-pf-trigo', 'disease', 'warning', 'Riesgo de roya — Huerta Trigo',
 'Condiciones húmedas favorables para roya en trigo.', 'Programar fungicida preventivo si persiste la humedad.', false, 'seed-alert-pf-2');
