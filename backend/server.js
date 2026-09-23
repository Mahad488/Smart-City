import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

const app = express();

app.use(cors());
app.use(express.json());

// Departments API
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

app.get("/test-assets", (req, res) => {
  res.json({ message: "Assets route test working" });
});

app.get("/", (req, res) => {
  res.json({
    message: "Smart City Backend API is running",
  });
});

const PORT = process.env.PORT || 5000;

const ensureAdminSettingsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      admin_id INT PRIMARY KEY,
      language VARCHAR(50) DEFAULT 'English',
      timezone VARCHAR(100) DEFAULT 'Pakistan Standard Time',
      date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY',
      dashboard_refresh VARCHAR(30) DEFAULT '5 Minutes',
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      CONSTRAINT fk_admin_settings_admin
        FOREIGN KEY (admin_id) REFERENCES admins(id)
        ON DELETE CASCADE
    )
  `);
};

const startServer = async () => {
  try {
    await ensureAdminSettingsTable();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exitCode = 1;
  }
};

void startServer();