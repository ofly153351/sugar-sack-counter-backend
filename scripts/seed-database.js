const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  // Read database URL from environment
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/sugar_sack_counter";

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Read SQL file
    const sqlFilePath = path.join(__dirname, "../seed/seed_data.sql");

    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ SQL file not found: ${sqlFilePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFilePath, "utf8");
    console.log("📄 Reading SQL file...");

    // Execute SQL
    await client.query(sql);
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Database connection closed");
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
