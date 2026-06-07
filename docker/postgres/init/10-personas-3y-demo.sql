-- Demo personas 3 años: Lucía 10 ha + Rosa 500 ha (contraseña demo123456)
-- Publicación geo-data: personas-demo-3y (LUCIA-SOJA-10, ROSA-SOJA-500)

INSERT INTO users (id, email, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000005', 'lucia@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy'),
  ('b0000000-0000-4000-8000-000000000006', 'rosa@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO organizations (id, name) VALUES
  ('a0000000-0000-4000-8000-000000000003', 'Finca Lucía — Chacra 10 ha'),
  ('a0000000-0000-4000-8000-000000000004', 'Cooperativa Rosa Valiente')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO organization_members (org_id, user_id, role) VALUES
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000005', 'owner'),
  ('a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000006', 'owner')
ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

UPDATE organizations SET
  billing_model = 'hectare', plan_tier = 'growth', hectare_limit = 15, max_zone_split = 1
WHERE id = 'a0000000-0000-4000-8000-000000000003';

UPDATE organizations SET
  billing_model = 'zone', plan_tier = 'cooperative', hectare_limit = 500, max_zone_split = 5
WHERE id = 'a0000000-0000-4000-8000-000000000004';

INSERT INTO fields (id, org_id, name, crop_type, area_ha, center_lat, center_lng, bounds, location_label, planting_date, days_from_planting, overall_health, risk_score, notifications) VALUES
('field-lucia-soja', 'a0000000-0000-4000-8000-000000000003', 'Chacra Soja Lucía', 'soybean', 10, -16.968, -62.828,
 '{"type":"Polygon","coordinates":[[[-62.832,-16.972],[-62.824,-16.972],[-62.824,-16.964],[-62.832,-16.964],[-62.832,-16.972]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-10-01', 32, 'good', 32, 1),
('field-rosa-soja', 'a0000000-0000-4000-8000-000000000004', 'Lote Soja Rosa — 500 ha', 'soybean', 500, -16.945, -62.855,
 '{"type":"Polygon","coordinates":[[[-62.875,-16.965],[-62.835,-16.965],[-62.835,-16.925],[-62.875,-16.925],[-62.875,-16.965]]]}',
 'San Julián, Santa Cruz — Bolivia', '2024-09-20', 45, 'good', 40, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, area_ha = EXCLUDED.area_ha, crop_type = EXCLUDED.crop_type,
  center_lat = EXCLUDED.center_lat, center_lng = EXCLUDED.center_lng, bounds = EXCLUDED.bounds,
  location_label = EXCLUDED.location_label, overall_health = EXCLUDED.overall_health, risk_score = EXCLUDED.risk_score;

INSERT INTO zones (id, field_id, name, area_ha, bounds, health, ndvi_average, ndmi_average, temperature_average, soil_moisture_average, observation_count, disease_risks) VALUES
('zone-lucia-soja', 'field-lucia-soja', 'Parcela completa — 10 ha', 10,
 '{"type":"Polygon","coordinates":[[[-62.832,-16.972],[-62.824,-16.972],[-62.824,-16.964],[-62.832,-16.964],[-62.832,-16.972]]]}',
 'good', 0.60, 0.42, 29.0, 71, 14, '[]'),
('zone-rosa-n', 'field-rosa-soja', 'Sector Norte — 100 ha', 100,
 '{"type":"Polygon","coordinates":[[[-62.875,-16.965],[-62.855,-16.965],[-62.855,-16.945],[-62.875,-16.945],[-62.875,-16.965]]]}',
 'good', 0.62, 0.44, 28.8, 73, 22, '[]'),
('zone-rosa-s', 'field-rosa-soja', 'Sector Sur — estrés 2024', 100,
 '{"type":"Polygon","coordinates":[[[-62.875,-16.945],[-62.855,-16.945],[-62.855,-16.925],[-62.875,-16.925],[-62.875,-16.945]]]}',
 'warning', 0.48, 0.28, 31.2, 52, 18, '["Estrés hídrico 2024"]'),
('zone-rosa-e', 'field-rosa-soja', 'Sector Este — 100 ha', 100,
 '{"type":"Polygon","coordinates":[[[-62.855,-16.965],[-62.835,-16.965],[-62.835,-16.945],[-62.855,-16.945],[-62.855,-16.965]]]}',
 'good', 0.58, 0.40, 29.5, 70, 20, '[]'),
('zone-rosa-w', 'field-rosa-soja', 'Sector Oeste — 100 ha', 100,
 '{"type":"Polygon","coordinates":[[[-62.875,-16.965],[-62.855,-16.965],[-62.855,-16.945],[-62.875,-16.945],[-62.875,-16.965]]]}',
 'good', 0.57, 0.39, 29.8, 68, 19, '[]'),
('zone-rosa-c', 'field-rosa-soja', 'Sector Central — 100 ha', 100,
 '{"type":"Polygon","coordinates":[[[-62.855,-16.955],[-62.835,-16.955],[-62.835,-16.935],[-62.855,-16.935],[-62.855,-16.955]]]}',
 'good', 0.61, 0.43, 29.1, 72, 21, '[]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, health = EXCLUDED.health, ndvi_average = EXCLUDED.ndvi_average,
  ndmi_average = EXCLUDED.ndmi_average, disease_risks = EXCLUDED.disease_risks;

INSERT INTO field_external_ids (field_id, parcel_key, geodata_region_code) VALUES
  ('field-lucia-soja', 'LUCIA-SOJA-10', 'SC-BO'),
  ('field-rosa-soja', 'ROSA-SOJA-500', 'SC-BO')
ON CONFLICT (field_id) DO UPDATE SET
  parcel_key = EXCLUDED.parcel_key, geodata_region_code = EXCLUDED.geodata_region_code, updated_at = now();

-- Observaciones de campo (bitácora humana 2023-2025)
INSERT INTO observations (id, field_id, zone_id, user_id, notes, lat, lng, created_at) VALUES
('obs-lucia-2023-03', 'field-lucia-soja', 'zone-lucia-soja', 'b0000000-0000-4000-8000-000000000005',
 'Emergencia uniforme. Sin roya. Registro fotográfico en cuaderno.', -16.968, -62.828, '2023-03-12 10:00:00+00'),
('obs-lucia-2023-11', 'field-lucia-soja', 'zone-lucia-soja', 'b0000000-0000-4000-8000-000000000005',
 'R3-R4: buen vigor. Aplicación preventiva contra roya cancelada por clima seco.', -16.967, -62.827, '2023-11-08 09:30:00+00'),
('obs-lucia-2024-02', 'field-lucia-soja', 'zone-lucia-soja', 'b0000000-0000-4000-8000-000000000005',
 'Sequía feb-mar: hojas enrolladas al mediodía. NDVI bajo confirmado en app.', -16.969, -62.829, '2024-02-20 14:00:00+00'),
('obs-lucia-2024-10', 'field-lucia-soja', 'zone-lucia-soja', 'b0000000-0000-4000-8000-000000000005',
 'Recuperación post-sequía. Cosecha estimada normal.', -16.968, -62.828, '2024-10-05 11:00:00+00'),
('obs-lucia-2025-03', 'field-lucia-soja', 'zone-lucia-soja', 'b0000000-0000-4000-8000-000000000005',
 'Nueva campaña: siembra directa. Humedad del suelo adecuada.', -16.968, -62.828, '2025-03-18 08:00:00+00'),
('obs-rosa-2023-04', 'field-rosa-soja', 'zone-rosa-n', 'b0000000-0000-4000-8000-000000000006',
 'Inspección cooperativa: 500 ha en R1 homogéneo. Sin alertas sanitarias.', -16.950, -62.865, '2023-04-22 07:00:00+00'),
('obs-rosa-2023-09', 'field-rosa-soja', 'zone-rosa-s', 'b0000000-0000-4000-8000-000000000006',
 'Sector sur con mancha amarilla — posible nematodo. Muestra enviada al lab.', -16.935, -62.865, '2023-09-14 15:00:00+00'),
('obs-rosa-2024-02', 'field-rosa-soja', 'zone-rosa-s', 'b0000000-0000-4000-8000-000000000006',
 'Estrés hídrico regional: sector sur NDVI crítico. Riego por aspersión parcial.', -16.935, -62.865, '2024-02-18 12:00:00+00'),
('obs-rosa-2024-11', 'field-rosa-soja', 'zone-rosa-c', 'b0000000-0000-4000-8000-000000000006',
 'Cosecha cooperativa: rendimiento -8% vs 2023 por sequía en sur.', -16.945, -62.845, '2024-11-20 16:00:00+00'),
('obs-rosa-2025-04', 'field-rosa-soja', 'zone-rosa-n', 'b0000000-0000-4000-8000-000000000006',
 'Campaña 2025: rotación y corrección sur. Tendencia NDVI mejorando vs 2024.', -16.950, -62.865, '2025-04-10 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes, created_at = EXCLUDED.created_at;

UPDATE zones SET observation_count = (
  SELECT count(*)::int FROM observations o WHERE o.zone_id = zones.id
) WHERE id IN ('zone-lucia-soja', 'zone-rosa-n', 'zone-rosa-s', 'zone-rosa-e', 'zone-rosa-w', 'zone-rosa-c');

-- Alertas históricas (seguridad alimentaria / sanidad)
DELETE FROM alerts WHERE dedup_key LIKE 'personas-3y-%';
INSERT INTO alerts (field_id, zone_id, type, severity, title, description, recommendation, resolved, dedup_key, created_at) VALUES
('field-lucia-soja', 'zone-lucia-soja', 'threshold', 'warning', 'Sequía 2024 — vigor en descenso',
 'NDVI y humedad bajos feb-mar 2024. Riesgo para rendimiento de la chacra.',
 'Monitorear riego; registrar en bitácora de campo.', true, 'personas-3y-lucia-2024-drought', '2024-02-25 08:00:00+00'),
('field-lucia-soja', 'zone-lucia-soja', 'threshold', 'info', 'Recuperación 2025',
 'Tendencia NDVI estable-mejorando tras campaña 2024.',
 'Mantener prácticas de conservación del suelo.', false, 'personas-3y-lucia-2025-recovery', '2025-04-01 08:00:00+00'),
('field-rosa-soja', 'zone-rosa-s', 'threshold', 'critical', 'Estrés hídrico sector sur 2024',
 'Zona sur con NDVI crítico 3 meses consecutivos — impacto en calidad de grano.',
 'Priorizar riego sur; revisar trazabilidad para seguridad alimentaria.', true, 'personas-3y-rosa-2024-south', '2024-02-20 10:00:00+00'),
('field-rosa-soja', 'zone-rosa-s', 'disease', 'warning', 'Nematodo sospechado 2023',
 'Mancha amarilla en sur — muestra lab pendiente de confirmación.',
 'Rotación y tratamiento según diagnóstico.', true, 'personas-3y-rosa-2023-nema', '2023-09-20 10:00:00+00');

-- Clima agregado por campo
INSERT INTO climate_readings (field_id, soil_moisture_anomaly, temp_anomaly, drought_index, viability_score, projection_year, captured_at) VALUES
('field-lucia-soja', -0.04, 0.18, 0.30, 74, 2030, now() - interval '1 day'),
('field-rosa-soja', -0.07, 0.35, 0.42, 68, 2030, now() - interval '1 day')
ON CONFLICT DO NOTHING;

