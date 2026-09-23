import mysql from "mysql2";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database:
    process.env.MYSQL_DATABASE ||
    process.env.MYSQLDATABASE ||
    process.env.DB_NAME,
  port: Number(
    process.env.MYSQLPORT ||
    process.env.DB_PORT ||
    3306
  ),
});

const nativeQuery = db.query.bind(db);

db.query = (...args) => {
  const callback = args[args.length - 1];

  if (typeof callback === "function") {
    return nativeQuery(...args);
  }

  return db.promise().query(...args);
};

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("MySQL connected successfully!");
});

export default db;