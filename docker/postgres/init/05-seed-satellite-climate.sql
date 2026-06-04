-- Satellite readings for all demo zones
INSERT INTO satellite_readings (zone_id, ndvi, ndmi, ndre, source, captured_at) VALUES
('zone-1-b', 0.55, 0.38, 0.32, 'copernicus', now() - interval '1 day'),
('zone-1-c', 0.58, 0.42, 0.34, 'copernicus', now() - interval '1 day'),
('zone-1-d', 0.38, 0.22, 0.18, 'copernicus', now() - interval '1 day'),
('zone-1-e', 0.62, 0.44, 0.36, 'copernicus', now() - interval '2 days'),
('zone-1-f', 0.48, 0.30, 0.25, 'copernicus', now() - interval '2 days'),
('zone-2-b', 0.65, 0.44, 0.37, 'copernicus', now() - interval '1 day'),
('zone-4-a', 0.42, 0.28, 0.22, 'copernicus', now() - interval '2 days'),
('zone-4-b', 0.38, 0.24, 0.19, 'copernicus', now() - interval '2 days'),
('zone-5-a', 0.68, 0.48, 0.39, 'copernicus', now() - interval '1 day'),
('zone-6-a', 0.58, 0.40, 0.31, 'copernicus', now() - interval '2 days'),
('zone-6-b', 0.55, 0.38, 0.29, 'copernicus', now() - interval '2 days')
ON CONFLICT (zone_id, reading_date) DO NOTHING;

INSERT INTO climate_readings (field_id, soil_moisture_anomaly, temp_anomaly, drought_index, viability_score, projection_year, captured_at) VALUES
('field-1', -0.05, 0.2, 0.35, 72, 2030, now() - interval '1 day'),
('field-2', 0.02, -0.1, 0.15, 85, 2030, now() - interval '1 day'),
('field-3', -0.12, 0.4, 0.55, 58, 2030, now() - interval '1 day'),
('field-4', -0.08, 0.5, 0.48, 62, 2030, now() - interval '2 days'),
('field-5', 0.05, -0.2, 0.12, 88, 2030, now() - interval '1 day'),
('field-6', -0.03, 0.1, 0.28, 70, 2030, now() - interval '2 days');
