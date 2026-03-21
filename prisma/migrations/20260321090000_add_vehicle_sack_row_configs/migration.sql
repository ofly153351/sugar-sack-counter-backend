-- Add JSON config column to vehicles
ALTER TABLE "vehicles"
ADD COLUMN IF NOT EXISTS "vehicle_row_conf" JSONB NOT NULL DEFAULT '[]'::JSONB;

-- Backfill from vehicle_sack_row_configs table if it exists, then remove table
DO $$
BEGIN
  IF to_regclass('public.vehicle_sack_row_configs') IS NOT NULL THEN
    UPDATE "vehicles" v
    SET "vehicle_row_conf" = src.rows_json
    FROM (
      SELECT
        vehicle_id,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'rowNumber', row_number,
              'sackCount', sack_count
            )
            ORDER BY row_number
          ),
          '[]'::JSONB
        ) AS rows_json
      FROM "vehicle_sack_row_configs"
      GROUP BY vehicle_id
    ) src
    WHERE src.vehicle_id = v.id;

    DROP TABLE "vehicle_sack_row_configs";
  END IF;
END $$;
