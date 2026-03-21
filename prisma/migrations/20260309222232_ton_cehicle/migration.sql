DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'max_load_weight_ton'
  ) THEN
    ALTER TABLE "vehicles" ALTER COLUMN "max_load_weight_ton" DROP DEFAULT;
  END IF;
END $$;
