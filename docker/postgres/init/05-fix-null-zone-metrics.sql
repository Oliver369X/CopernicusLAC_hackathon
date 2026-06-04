-- Backfill métricas inválidas (NULL/NaN) tras lecturas Copernicus fallidas
UPDATE zones SET ndvi_average = 0 WHERE ndvi_average IS NULL;
UPDATE zones SET ndmi_average = 0 WHERE ndmi_average IS NULL;
UPDATE zones SET temperature_average = 0 WHERE temperature_average IS NULL;
UPDATE zones SET soil_moisture_average = 0 WHERE soil_moisture_average IS NULL;

UPDATE zones SET ndvi_average = 0 WHERE ndvi_average::text = 'NaN';
UPDATE zones SET ndmi_average = 0 WHERE ndmi_average::text = 'NaN';
