import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import db from "./config/db.js";

import departmentsRoutes from "./routes/departments.js";
import assetsRoutes from "./routes/assets.js";
import complaintsRoutes from "./routes/complaints.js";
import emergenciesRoutes from "./routes/emergencies.js";
import gisRoutes from "./routes/gis.js";
import dashboardRoutes from "./routes/dashboard.js";
import analyticsRoutes from "./routes/analytics.js";
import citizenRoutes from "./routes/citizens.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import notificationPreferencesRoutes from "./routes/notificationPreferences.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local development ke liye .env load karega.
// Vercel par Environment Variables automatically available hoti hain.
dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Database initialization
|--------------------------------------------------------------------------
*/

let databaseInitialized = false;
let databaseInitializationPromise = null;

const ensureAdminSettingsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        admin_id INT PRIMARY KEY,
        language VARCHAR(50) DEFAULT 'English',
        timezone VARCHAR(100) DEFAULT 'Pakistan Standard Time',
        date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY',
        dashboard_refresh VARCHAR(30) DEFAULT '5 Minutes',
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_admin_settings_admin
          FOREIGN KEY (admin_id)
          REFERENCES admins(id)
          ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.warn("Notice admin_settings table:", err.message);
  }
};

const ensureDatabaseSchema = async () => {
  await ensureAdminSettingsTable();

  // Ensure citizen_id column exists in complaints table with utf8mb4_unicode_ci collation
  try {
    await db.query(`
      ALTER TABLE complaints
      ADD COLUMN citizen_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL
    `);
    console.log("Added citizen_id column to complaints table.");
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME" && err.errno !== 1060) {
      console.warn("Notice complaints.citizen_id column:", err.message);
    }
  }

  // Ensure collation of citizen_id in complaints matches citizens table
  try {
    await db.query(`
      ALTER TABLE complaints
      MODIFY COLUMN citizen_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL
    `);
  } catch (err) {
    // Non-fatal
  }

  // Ensure citizen_id column exists in emergencies table with utf8mb4_unicode_ci collation
  try {
    await db.query(`
      ALTER TABLE emergencies
      ADD COLUMN citizen_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL
    `);
    console.log("Added citizen_id column to emergencies table.");
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME" && err.errno !== 1060) {
      console.warn("Notice emergencies.citizen_id column:", err.message);
    }
  }

  // Ensure collation of citizen_id in emergencies matches citizens table
  try {
    await db.query(`
      ALTER TABLE emergencies
      MODIFY COLUMN citizen_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL
    `);
  } catch (err) {
    // Non-fatal
  }
};

const initializeDatabase = async () => {
  if (databaseInitialized) {
    return;
  }

  if (!databaseInitializationPromise) {
    databaseInitializationPromise = ensureDatabaseSchema()
      .then(() => {
        databaseInitialized = true;
        console.log("Database initialized successfully.");
      })
      .catch((error) => {
        console.warn("Schema initialization warning (proceeding safely):", error.message);
        databaseInitialized = true;
      });
  }

  await databaseInitializationPromise;
};

/*
|--------------------------------------------------------------------------
| Health / Test routes
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart City Backend API is running",
  });
});

app.get("/health", async (req, res) => {
  try {
    await initializeDatabase();

    res.status(200).json({
      success: true,
      message: "Backend is healthy",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(200).json({
      success: true,
      message: "Backend is running (with init warning)",
      warning: error.message,
    });
  }
});

app.get("/test-assets", async (req, res) => {
  try {
    await initializeDatabase();

    res.status(200).json({
      success: true,
      message: "Assets route test working",
    });
  } catch (error) {
    console.error("Test assets error:", error);

    res.status(500).json({
      success: false,
      message: "Database initialization failed",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Database middleware for API routes
|--------------------------------------------------------------------------
*/

app.use("/api", async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    console.error("Database middleware warning:", error);
    // Proceed to routes so individual route fallbacks can respond
    next();
  }
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/departments", departmentsRoutes);

app.use("/api/assets", assetsRoutes);

app.use("/api/complaints", complaintsRoutes);

app.use("/api/emergencies", emergenciesRoutes);

app.use("/api/emergency", emergenciesRoutes);

app.use("/api/gis", gisRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/citizens", citizenRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/notifications", notificationRoutes);

app.use(
  "/api/notification-preferences",
  notificationPreferencesRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/*
|--------------------------------------------------------------------------
| Vercel / Serverless Export
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Yahan app.listen() NAHI lagana.
|
| Vercel Express app ko function ke taur par handle karega.
|
*/

const port = Number(process.env.PORT || 5000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Smart City backend running on port ${port}`);
});

export default app;