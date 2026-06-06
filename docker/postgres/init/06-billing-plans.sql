-- Doctor Soya — planes de facturación por hectáreas vs zonas (piloto BID)
-- Idempotente: seguro re-ejecutar en volúmenes existentes.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_model TEXT NOT NULL DEFAULT 'hectare';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS hectare_limit NUMERIC;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_zone_split INT NOT NULL DEFAULT 1;

-- Constraints (solo si no existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_billing_model_check'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_billing_model_check
      CHECK (billing_model IN ('hectare', 'zone'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_plan_tier_check'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_plan_tier_check
      CHECK (plan_tier IN ('free', 'growth', 'scale', 'cooperative'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_max_zone_split_check'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_max_zone_split_check
      CHECK (max_zone_split BETWEEN 1 AND 8);
  END IF;
END $$;

-- Defaults para orgs nuevas sin hectare_limit explícito
UPDATE organizations
SET hectare_limit = 5
WHERE hectare_limit IS NULL AND billing_model = 'hectare' AND plan_tier = 'free';

UPDATE organizations
SET hectare_limit = 20
WHERE hectare_limit IS NULL AND billing_model = 'hectare' AND plan_tier = 'growth';

UPDATE organizations
SET hectare_limit = 50
WHERE hectare_limit IS NULL AND billing_model = 'hectare' AND plan_tier = 'scale';

UPDATE organizations
SET hectare_limit = 500
WHERE hectare_limit IS NULL AND billing_model = 'zone' AND plan_tier = 'cooperative';

-- Piloto BID: orgs con ≥50 ha totales → modelo por zonas
UPDATE organizations o
SET
  billing_model = 'zone',
  plan_tier = 'cooperative',
  hectare_limit = 500,
  max_zone_split = 4
WHERE (
  SELECT COALESCE(SUM(f.area_ha), 0)
  FROM fields f
  WHERE f.org_id = o.id
) >= 50;
