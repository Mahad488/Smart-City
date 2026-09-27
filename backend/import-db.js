import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

async function initDB() {
  let connection;
  try {
    console.log("Railway MySQL se connect ho raha hai...");

    connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: Number(process.env.MYSQLPORT || 3306),
      multipleStatements: true,
    });

    console.log("Connected successfully!");

    // 1. Purani aadhi tables ko saaf karein taake fresh setup ho
    console.log("Database clean kar raha hai...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
    const [tables] = await connection.query("SHOW TABLES;");
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. database.sql file read karein
    const sqlPath = path.resolve(__dirname, "../database.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Queries ko alag alag split karein
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log("Tables aur data insert ho raha hai...");

    for (const stmt of statements) {
      const upper = stmt.toUpperCase();
      // Skip queries jo zaroori nahi hain
      if (
        upper.startsWith("CREATE DATABASE") ||
        upper.startsWith("USE ") ||
        upper.startsWith("DESCRIBE") ||
        upper.startsWith("SHOW") ||
        upper.startsWith("SELECT")
      ) {
        continue;
      }

      try {
        await connection.query(stmt);
      } catch (err) {
        // Agar duplicate column ho toh ignore karein aur aagay chalain
        if (err.code === "ER_DUP_FIELDNAME") {
          continue;
        }
        console.warn("Notice:", err.message);
      }
    }

    console.log("\n✅ Mubarak ho! Saari tables aur data successfully ban gaya!");
  } catch (error) {
    console.error("❌ Error aaya:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

initDB();