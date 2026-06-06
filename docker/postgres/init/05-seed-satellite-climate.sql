-- Bloque A: 28 filas (zone-sj-n-1..n-4 × 7 días)
INSERT INTO satellite_readings (zone_id, ndvi, ndmi, ndre, source, reading_date, scene_date, captured_at) VALUES
('zone-sj-n-1', 0.64, 0.47, 0.38, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-n-1', 0.63, 0.46, 0.37, 'copernicus', CURRENT_DATE - 1, CURRENT_DATE - 2, now() - interval '1 day'),
('zone-sj-n-1', 0.62, 0.45, 0.36, 'copernicus', CURRENT_DATE - 2, CURRENT_DATE - 3, now() - interval '2 days'),
('zone-sj-n-1', 0.61, 0.44, 0.35, 'copernicus', CURRENT_DATE - 3, CURRENT_DATE - 4, now() - interval '3 days'),
('zone-sj-n-1', 0.60, 0.43, 0.34, 'copernicus', CURRENT_DATE - 4, CURRENT_DATE - 5, now() - interval '4 days'),
('zone-sj-n-1', 0.59, 0.42, 0.33, 'copernicus', CURRENT_DATE - 5, CURRENT_DATE - 6, now() - interval '5 days'),
('zone-sj-n-1', 0.58, 0.41, 0.32, 'copernicus', CURRENT_DATE - 6, CURRENT_DATE - 7, now() - interval '6 days'),
('zone-sj-n-2', 0.55, 0.38, 0.32, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-n-2', 0.54, 0.37, 0.31, 'copernicus', CURRENT_DATE - 1, CURRENT_DATE - 2, now() - interval '1 day'),
('zone-sj-n-2', 0.53, 0.36, 0.30, 'copernicus', CURRENT_DATE - 2, CURRENT_DATE - 3, now() - interval '2 days'),
('zone-sj-n-2', 0.52, 0.35, 0.29, 'copernicus', CURRENT_DATE - 3, CURRENT_DATE - 4, now() - interval '3 days'),
('zone-sj-n-2', 0.51, 0.34, 0.28, 'copernicus', CURRENT_DATE - 4, CURRENT_DATE - 5, now() - interval '4 days'),
('zone-sj-n-2', 0.50, 0.33, 0.27, 'copernicus', CURRENT_DATE - 5, CURRENT_DATE - 6, now() - interval '5 days'),
('zone-sj-n-2', 0.49, 0.32, 0.26, 'copernicus', CURRENT_DATE - 6, CURRENT_DATE - 7, now() - interval '6 days'),
('zone-sj-n-3', 0.58, 0.42, 0.34, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-n-3', 0.57, 0.41, 0.33, 'copernicus', CURRENT_DATE - 1, CURRENT_DATE - 2, now() - interval '1 day'),
('zone-sj-n-3', 0.56, 0.40, 0.32, 'copernicus', CURRENT_DATE - 2, CURRENT_DATE - 3, now() - interval '2 days'),
('zone-sj-n-3', 0.55, 0.39, 0.31, 'copernicus', CURRENT_DATE - 3, CURRENT_DATE - 4, now() - interval '3 days'),
('zone-sj-n-3', 0.54, 0.38, 0.30, 'copernicus', CURRENT_DATE - 4, CURRENT_DATE - 5, now() - interval '4 days'),
('zone-sj-n-3', 0.53, 0.37, 0.29, 'copernicus', CURRENT_DATE - 5, CURRENT_DATE - 6, now() - interval '5 days'),
('zone-sj-n-3', 0.52, 0.36, 0.28, 'copernicus', CURRENT_DATE - 6, CURRENT_DATE - 7, now() - interval '6 days'),
('zone-sj-n-4', 0.38, 0.22, 0.18, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-n-4', 0.37, 0.21, 0.17, 'copernicus', CURRENT_DATE - 1, CURRENT_DATE - 2, now() - interval '1 day'),
('zone-sj-n-4', 0.36, 0.20, 0.16, 'copernicus', CURRENT_DATE - 2, CURRENT_DATE - 3, now() - interval '2 days'),
('zone-sj-n-4', 0.35, 0.19, 0.15, 'copernicus', CURRENT_DATE - 3, CURRENT_DATE - 4, now() - interval '3 days'),
('zone-sj-n-4', 0.34, 0.18, 0.14, 'copernicus', CURRENT_DATE - 4, CURRENT_DATE - 5, now() - interval '4 days'),
('zone-sj-n-4', 0.33, 0.17, 0.13, 'copernicus', CURRENT_DATE - 5, CURRENT_DATE - 6, now() - interval '5 days'),
('zone-sj-n-4', 0.32, 0.16, 0.12, 'copernicus', CURRENT_DATE - 6, CURRENT_DATE - 7, now() - interval '6 days')
ON CONFLICT (zone_id, reading_date) DO NOTHING;

-- Bloque B: 7 zonas restantes (lectura hoy) + 4 semanales backfill = 11 filas
INSERT INTO satellite_readings (zone_id, ndvi, ndmi, ndre, source, reading_date, scene_date, captured_at) VALUES
('zone-sj-n-5', 0.62, 0.44, 0.36, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-n-6', 0.48, 0.30, 0.25, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-e-1', 0.72, 0.52, 0.41, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-e-2', 0.65, 0.44, 0.37, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-w-1', 0.52, 0.35, 0.29, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-s-1', 0.42, 0.28, 0.22, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-s-2', 0.38, 0.24, 0.19, 'copernicus', CURRENT_DATE, CURRENT_DATE - 1, now()),
('zone-sj-e-1', 0.70, 0.50, 0.39, 'copernicus', CURRENT_DATE - 7, CURRENT_DATE - 8, now() - interval '7 days'),
('zone-sj-e-2', 0.63, 0.42, 0.35, 'copernicus', CURRENT_DATE - 7, CURRENT_DATE - 8, now() - interval '7 days'),
('zone-sj-w-1', 0.50, 0.33, 0.27, 'copernicus', CURRENT_DATE - 7, CURRENT_DATE - 8, now() - interval '7 days'),
('zone-sj-s-1', 0.40, 0.26, 0.20, 'copernicus', CURRENT_DATE - 7, CURRENT_DATE - 8, now() - interval '7 days')
ON CONFLICT (zone_id, reading_date) DO NOTHING;

INSERT INTO climate_readings (field_id, soil_moisture_anomaly, temp_anomaly, drought_index, viability_score, projection_year, captured_at) VALUES
('field-sj-norte', -0.05, 0.2, 0.35, 72, 2030, now() - interval '1 day'),
('field-sj-este', 0.02, -0.1, 0.15, 85, 2030, now() - interval '1 day'),
('field-sj-oeste', -0.12, 0.4, 0.55, 58, 2030, now() - interval '1 day'),
('field-sj-sur', -0.08, 0.5, 0.48, 62, 2030, now() - interval '1 day')
ON CONFLICT DO NOTHING;
