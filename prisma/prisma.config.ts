import { defineDatasource } from "@prisma/adapter-utils";
import { PgAdapter } from "@prisma/adapter-pg";
import { Pool } from "pg";

export default {
  datasources: {
    db: defineDatasource({
      adapter: new PgAdapter(
        new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        }),
      ),
    }),
  },
};
