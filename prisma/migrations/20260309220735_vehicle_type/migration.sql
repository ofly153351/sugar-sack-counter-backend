DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicle_types' AND column_name = 'max_load_weight_kg'
  ) THEN
    ALTER TABLE "vehicle_types" ALTER COLUMN "max_load_weight_kg" DROP DEFAULT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicle_types' AND column_name = 'max_load_weight_ton'
  ) THEN
    ALTER TABLE "vehicle_types" ALTER COLUMN "max_load_weight_ton" DROP DEFAULT;
  END IF;
END $$;
