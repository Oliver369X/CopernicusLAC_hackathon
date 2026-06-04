-- Backfill zone bounds from field polygons (demo seed)
-- field-1: 6 zones in 2x3 grid approximations

UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.32,-34.90],[-62.30,-34.90],[-62.30,-34.92],[-62.32,-34.92],[-62.32,-34.90]]]}' WHERE id = 'zone-1-a';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.30,-34.90],[-62.28,-34.90],[-62.28,-34.92],[-62.30,-34.92],[-62.30,-34.90]]]}' WHERE id = 'zone-1-b';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.32,-34.88],[-62.30,-34.88],[-62.30,-34.90],[-62.32,-34.90],[-62.32,-34.88]]]}' WHERE id = 'zone-1-c';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.30,-34.88],[-62.28,-34.88],[-62.28,-34.90],[-62.30,-34.90],[-62.30,-34.88]]]}' WHERE id = 'zone-1-d';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.32,-34.88],[-62.30,-34.88],[-62.30,-34.90],[-62.32,-34.90],[-62.32,-34.88]]]}' WHERE id = 'zone-1-e';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.30,-34.88],[-62.28,-34.88],[-62.28,-34.90],[-62.30,-34.90],[-62.30,-34.88]]]}' WHERE id = 'zone-1-f';

UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.27,-35.12],[-62.25,-35.12],[-62.25,-35.10],[-62.27,-35.10],[-62.27,-35.12]]]}' WHERE id = 'zone-2-a';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.25,-35.12],[-62.23,-35.12],[-62.23,-35.10],[-62.25,-35.10],[-62.25,-35.12]]]}' WHERE id = 'zone-2-b';

UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.42,-34.87],[-62.38,-34.87],[-62.38,-34.83],[-62.42,-34.83],[-62.42,-34.87]]]}' WHERE id = 'zone-3-a';

UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.37,-35.22],[-62.35,-35.22],[-62.35,-35.20],[-62.37,-35.20],[-62.37,-35.22]]]}' WHERE id = 'zone-4-a';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.35,-35.22],[-62.33,-35.22],[-62.33,-35.20],[-62.35,-35.20],[-62.35,-35.22]]]}' WHERE id = 'zone-4-b';

UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.30,-34.82],[-62.26,-34.82],[-62.26,-34.78],[-62.30,-34.78],[-62.30,-34.82]]]}' WHERE id = 'zone-5-a';

UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.34,-34.77],[-62.32,-34.77],[-62.32,-34.73],[-62.34,-34.73],[-62.34,-34.77]]]}' WHERE id = 'zone-6-a';
UPDATE zones SET bounds = '{"type":"Polygon","coordinates":[[[-62.32,-34.77],[-62.30,-34.77],[-62.30,-34.73],[-62.32,-34.73],[-62.32,-34.77]]]}' WHERE id = 'zone-6-b';
