DO $$
BEGIN
  IF to_regclass('public.vehicle_sack_row_configs_vehicle_id_idx') IS NOT NULL THEN
    DROP INDEX "vehicle_sack_row_configs_vehicle_id_idx";
  END IF;

  IF to_regclass('public.vehicle_sack_row_configs') IS NOT NULL THEN
    ALTER TABLE "vehicle_sack_row_configs"
    ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'max_load_weight_ton'
  ) THEN
    ALTER TABLE "vehicles" ALTER COLUMN "max_load_weight_ton" DROP DEFAULT;
  END IF;
END $$;
