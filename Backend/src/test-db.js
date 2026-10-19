require("dotenv").config();

const pool = require("./db");

async function main() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Connected to PostgreSQL!");
    console.log(result);
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

main();