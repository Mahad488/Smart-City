import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const [rows] = await db.query(
      `SELECT id, name, email, password_hash, status
       FROM admins
       WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const admin = rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (admin.status !== "Active") {
      return res.status(403).json({
        message: "Admin account is inactive",
      });
    }

    res.json({
      message: "Admin login successful",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Admin login failed",
    });
  }
});

// GET ADMIN PROFILE
router.get("/:id/profile", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, status, created_at
       FROM admins
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get admin profile error:", error);

    res.status(500).json({
      message: "Error loading admin profile",
    });
  }
});

// UPDATE ADMIN PROFILE
router.put("/:id/profile", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const [existing] = await db.query(
      `SELECT id
       FROM admins
       WHERE email = ? AND id != ?`,
      [email, req.params.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Email is already being used",
      });
    }

    const [result] = await db.query(
      `UPDATE admins
       SET name = ?, email = ?, phone = ?
       WHERE id = ?`,
      [
        name.trim(),
        email.trim(),
        phone?.trim() || null,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const [rows] = await db.query(
      `SELECT id, name, email, phone, status, created_at
       FROM admins
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      message: "Profile updated successfully",
      admin: rows[0],
    });
  } catch (error) {
    console.error("Update admin profile error:", error);

    res.status(500).json({
      message: "Error updating profile",
    });
  }
});

// CHANGE ADMIN PASSWORD
router.put("/:id/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const [rows] = await db.query(
      `SELECT password_hash
       FROM admins
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      rows[0].password_hash
    );

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE admins
       SET password_hash = ?
       WHERE id = ?`,
      [newPasswordHash, req.params.id]
    );

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      message: "Error changing password",
    });
  }
});

// GET ADMIN SETTINGS
router.get("/:id/settings", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT language, timezone, date_format, dashboard_refresh,
              two_factor_enabled
       FROM admin_settings
       WHERE admin_id = ?`,
      [req.params.id]
    );

    res.json(
      rows[0] || {
        language: "English",
        timezone: "Pakistan Standard Time",
        date_format: "DD/MM/YYYY",
        dashboard_refresh: "5 Minutes",
        two_factor_enabled: false,
      }
    );
  } catch (error) {
    console.error("Get admin settings error:", error);
    res.status(500).json({ message: "Error loading admin settings" });
  }
});

// UPDATE ADMIN SETTINGS
router.put("/:id/settings", async (req, res) => {
  try {
    const {
      language,
      timezone,
      date_format: dateFormat,
      dashboard_refresh: dashboardRefresh,
      two_factor_enabled: twoFactorEnabled,
    } = req.body;

    await db.query(
      `INSERT INTO admin_settings
        (admin_id, language, timezone, date_format, dashboard_refresh,
         two_factor_enabled)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        language = VALUES(language),
        timezone = VALUES(timezone),
        date_format = VALUES(date_format),
        dashboard_refresh = VALUES(dashboard_refresh),
        two_factor_enabled = VALUES(two_factor_enabled)`,
      [
        req.params.id,
        language || "English",
        timezone || "Pakistan Standard Time",
        dateFormat || "DD/MM/YYYY",
        dashboardRefresh || "5 Minutes",
        Boolean(twoFactorEnabled),
      ]
    );

    res.json({ message: "Admin settings updated successfully" });
  } catch (error) {
    console.error("Update admin settings error:", error);
    res.status(500).json({ message: "Error updating admin settings" });
  }
});

export default router;