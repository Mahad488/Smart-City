import express from "express";
import db from "../config/db.js";
import { sendEmergencyStatusEmail, isSmtpConfigured } from "../utils/mailer.js";

const router = express.Router();


// =====================================================
// GET ALL EMERGENCIES - ADMIN
// =====================================================
router.get("/", async (req, res) => {
  try {
    let emergencies = [];
    try {
      const [rows] = await db.query(
        `SELECT * FROM emergencies ORDER BY created_at DESC`
      );
      emergencies = rows;
    } catch (orderErr) {
      const [rows] = await db.query(
        `SELECT * FROM emergencies ORDER BY id DESC`
      );
      emergencies = rows;
    }

    try {
      const [citizens] = await db.query(
        `SELECT id, citizen_id, name, email, phone FROM citizens`
      );

      const citizenMap = new Map();
      for (const cz of citizens) {
        if (cz.citizen_id) {
          citizenMap.set(String(cz.citizen_id).trim(), cz);
        }
        if (cz.id) {
          citizenMap.set(String(cz.id).trim(), cz);
        }
      }

      const enriched = emergencies.map((e) => {
        const cz = e.citizen_id ? citizenMap.get(String(e.citizen_id).trim()) : null;
        return {
          ...e,
          citizen_name: cz ? cz.name : null,
          citizen_email: cz ? cz.email : null,
          citizen_phone: cz ? cz.phone : null,
        };
      });

      return res.json(enriched);
    } catch (czErr) {
      console.warn("Could not enrich emergencies with citizens:", czErr.message);
      return res.json(emergencies);
    }
  } catch (error) {
    console.error("GET EMERGENCIES ERROR:", error);

    res.status(500).json({
      message: "Error fetching emergencies",
      error: error.message,
    });
  }
});


// =====================================================
// GET CITIZEN'S EMERGENCIES
// =====================================================
router.get("/citizen/:citizen_id", async (req, res) => {
  try {
    const { citizen_id } = req.params;

    const [rows] = await db.query(
      `SELECT *
       FROM emergencies
       WHERE citizen_id = ?
       ORDER BY id DESC`,
      [citizen_id]
    );

    res.json(rows);

  } catch (error) {
    console.error("GET CITIZEN EMERGENCIES ERROR:", error);

    res.status(500).json({
      message: "Error fetching citizen emergencies",
    });
  }
});


// =====================================================
// POST EMERGENCY FROM CITIZEN
// =====================================================
router.post("/", async (req, res) => {
  try {
    const {
      citizen_id,
      type,
      location,
      team,
      priority,
      status,
      latitude,
      longitude,
    } = req.body;

    if (!citizen_id || !type || !location) {
      return res.status(400).json({
        message: "Citizen, emergency type and location are required",
      });
    }

    // Check citizen
    const [citizenRows] = await db.query(
      `SELECT id, name, status
       FROM citizens
       WHERE citizen_id = ?`,
      [citizen_id]
    );

    if (citizenRows.length === 0) {
      return res.status(404).json({
        message: "Citizen not found",
      });
    }

    const citizen = citizenRows[0];

    if (citizen.status !== "Active") {
      return res.status(403).json({
        message: "Only active citizens can report emergencies",
      });
    }

    const [result] = await db.query(
      `INSERT INTO emergencies
       (
         citizen_id,
         type,
         location,
         team,
         priority,
         status,
         latitude,
         longitude
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        citizen_id,
        type,
        location,
        team || "Emergency Response Team",
        priority || "High",
        status || "Active",
        latitude ?? null,
        longitude ?? null,
      ]
    );

    res.status(201).json({
      message: "Emergency reported successfully",
      id: result.insertId,
    });

  } catch (error) {
    console.error("CREATE EMERGENCY ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error creating emergency",
    });
  }
});


// =====================================================
// UPDATE CITIZEN EMERGENCY
// =====================================================
router.put("/citizen/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      citizen_id,
      type,
      location,
    } = req.body;

    if (!citizen_id || !type || !location) {
      return res.status(400).json({
        message: "Citizen, emergency type and location are required",
      });
    }

    // Make sure emergency belongs to citizen
    const [existing] = await db.query(
      `SELECT id
       FROM emergencies
       WHERE id = ? AND citizen_id = ?`,
      [id, citizen_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Emergency not found or access denied",
      });
    }

    await db.query(
      `UPDATE emergencies
       SET type = ?,
           location = ?
       WHERE id = ? AND citizen_id = ?`,
      [
        type,
        location,
        id,
        citizen_id,
      ]
    );

    res.json({
      message: "Emergency updated successfully",
    });

  } catch (error) {
    console.error("UPDATE CITIZEN EMERGENCY ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error updating emergency",
    });
  }
});


// =====================================================
// DELETE CITIZEN EMERGENCY
// =====================================================
router.delete("/citizen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { citizen_id } = req.body;

    if (!citizen_id) {
      return res.status(400).json({
        message: "Citizen ID is required",
      });
    }

    const [result] = await db.query(
      `DELETE FROM emergencies
       WHERE id = ? AND citizen_id = ?`,
      [id, citizen_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Emergency not found or access denied",
      });
    }

    res.json({
      message: "Emergency deleted successfully",
    });

  } catch (error) {
    console.error("DELETE CITIZEN EMERGENCY ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error deleting emergency",
    });
  }
});


// =====================================================
// GET SINGLE EMERGENCY
// =====================================================
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *
       FROM emergencies
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Emergency not found",
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("GET SINGLE EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Error fetching emergency",
    });
  }
});


// =====================================================
// ADMIN UPDATE EMERGENCY
// =====================================================
router.put("/:id", async (req, res) => {
  try {
    const {
      type,
      location,
      team,
      priority,
      status,
      latitude,
      longitude,
      citizen_email,
      citizen_name,
    } = req.body;

    // Fetch existing emergency
    const [existingRows] = await db.query(
      `SELECT * FROM emergencies WHERE id = ?`,
      [req.params.id]
    );

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({
        message: "Emergency not found",
      });
    }

    const existingEmergency = existingRows[0];
    const previousStatus = existingEmergency.status;

    const [result] = await db.query(
      `UPDATE emergencies
       SET type = ?,
           location = ?,
           team = ?,
           priority = ?,
           status = ?,
           latitude = ?,
           longitude = ?
       WHERE id = ?`,
      [
        type ?? existingEmergency.type,
        location ?? existingEmergency.location,
        team ?? existingEmergency.team,
        priority ?? existingEmergency.priority,
        status ?? existingEmergency.status,
        latitude ?? existingEmergency.latitude ?? null,
        longitude ?? existingEmergency.longitude ?? null,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Emergency not found",
      });
    }

    // Check if status has changed and trigger notification email in English
    let recipientEmail = citizen_email || existingEmergency.citizen_email;
    let resolvedCitizenName =
      citizen_name || existingEmergency.citizen_name || "Valued Citizen";

    // If recipientEmail was not passed or joined, look it up directly from citizens table
    if (!recipientEmail && existingEmergency.citizen_id) {
      try {
        const [czRows] = await db.query(
          `SELECT name, email FROM citizens WHERE citizen_id = ? OR CAST(id AS CHAR) = ? LIMIT 1`,
          [existingEmergency.citizen_id, existingEmergency.citizen_id]
        );
        if (czRows && czRows.length > 0) {
          recipientEmail = czRows[0].email;
          if (!citizen_name && czRows[0].name) {
            resolvedCitizenName = czRows[0].name;
          }
        }
      } catch (lookupErr) {
        console.warn("Direct emergency citizen email lookup failed:", lookupErr.message);
      }
    }

    let emailDispatched = false;
    let mailSendResult = null;

    if (status && status !== previousStatus && recipientEmail) {
      try {
        mailSendResult = await sendEmergencyStatusEmail({
          toEmail: recipientEmail,
          citizenName: resolvedCitizenName,
          emergencyId: req.params.id,
          emergencyType: type || existingEmergency.type,
          location: location || existingEmergency.location,
          team: team || existingEmergency.team,
          priority: priority || existingEmergency.priority,
          previousStatus,
          newStatus: status,
        });
        emailDispatched = mailSendResult?.success === true;
        console.log(`[Emergencies] Email result for EMG-${req.params.id}:`, mailSendResult);
      } catch (mailErr) {
        console.error("Background emergency email send error:", mailErr);
        mailSendResult = { success: false, error: mailErr.message };
      }

      // Also record system notification
      try {
        await db.query(
          `INSERT INTO notifications (title, message, type)
           VALUES (?, ?, 'Emergency')`,
          [
            `Emergency #${req.params.id} Status: ${status}`,
            `Emergency EMG-${String(req.params.id).padStart(4, "0")} (${type || existingEmergency.type}) status updated to "${status}". Notification dispatched to ${recipientEmail}.`,
          ]
        );
      } catch (notifErr) {
        console.warn("Could not insert notification:", notifErr.message);
      }
    }

    res.json({
      message: "Emergency updated successfully",
      emailSent: emailDispatched,
      mailResult: mailSendResult,
      recipient: recipientEmail || null,
      smtpConfigured: isSmtpConfigured(),
      previousStatus,
      newStatus: status,
    });

  } catch (error) {
    console.error("ADMIN UPDATE EMERGENCY ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error updating emergency",
    });
  }
});


// =====================================================
// ADMIN DELETE EMERGENCY
// =====================================================
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM emergencies
       WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Emergency not found",
      });
    }

    res.json({
      message: "Emergency deleted successfully",
    });

  } catch (error) {
    console.error("ADMIN DELETE EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Error deleting emergency",
    });
  }
});


export default router;