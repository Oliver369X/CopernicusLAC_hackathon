-- Enlaces opcionales a Data-Historica (parcel_key por campo demo)
CREATE TABLE IF NOT EXISTS field_external_ids (
  field_id TEXT PRIMARY KEY REFERENCES fields(id) ON DELETE CASCADE,
  parcel_key TEXT NOT NULL,
  geodata_region_code TEXT DEFAULT 'SC-BO',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO field_external_ids (field_id, parcel_key, geodata_region_code) VALUES
  ('field-sj-norte', 'SJ-NORTE-001', 'SC-BO'),
  ('field-sj-este', 'SJ-ESTE-001', 'SC-BO'),
  ('field-sj-oeste', 'SJ-OESTE-001', 'SC-BO'),
  ('field-sj-sur', 'SJ-SUR-001', 'SC-BO'),
  ('field-pf-soja', 'PF-SOJA-001', 'SC-BO'),
  ('field-pf-maiz', 'PF-MAIZ-001', 'SC-BO'),
  ('field-pf-trigo', 'PF-TRIGO-001', 'SC-BO')
ON CONFLICT (field_id) DO NOTHING;
