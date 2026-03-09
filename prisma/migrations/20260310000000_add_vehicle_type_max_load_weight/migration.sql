-- Add weight on vehicles table
ALTER TABLE "vehicles"
ADD COLUMN IF NOT EXISTS "max_load_weight_ton" DOUBLE PRECISION;

-- Backfill from vehicle_types if old columns exist there
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicle_types' AND column_name = 'max_load_weight_ton'
  ) THEN
    EXECUTE '
      UPDATE "vehicles" v
      SET "max_load_weight_ton" = vt."max_load_weight_ton"
      FROM "vehicle_types" vt
      WHERE v."vehicle_type_id" = vt."id"
        AND v."max_load_weight_ton" IS NULL
    ';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicle_types' AND column_name = 'max_load_weight_kg'
  ) THEN
    EXECUTE '
      UPDATE "vehicles" v
      SET "max_load_weight_ton" = vt."max_load_weight_kg" / 1000.0
      FROM "vehicle_types" vt
      WHERE v."vehicle_type_id" = vt."id"
        AND v."max_load_weight_ton" IS NULL
    ';
  END IF;
END $$;

UPDATE "vehicles"
SET "max_load_weight_ton" = 0
WHERE "max_load_weight_ton" IS NULL;

ALTER TABLE "vehicles"
ALTER COLUMN "max_load_weight_ton" SET DEFAULT 0;

ALTER TABLE "vehicles"
ALTER COLUMN "max_load_weight_ton" SET NOT NULL;

-- Remove old columns from vehicle_types if present
ALTER TABLE "vehicle_types"
DROP COLUMN IF EXISTS "max_load_weight_ton";

ALTER TABLE "vehicle_types"
DROP COLUMN IF EXISTS "max_load_weight_kg";
