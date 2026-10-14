import express from "express";
import db from "../config/db.js";
import { sendEmergencyStatusEmail } from "../utils/mailer.js";

const router = express.Router();


// =====================================================
// GET ALL EMERGENCIES - ADMIN
// =====================================================
router.get("/", async (req, res) => {
  try {
    let rows;
    try {
      const [joinedRows] = await db.query(
        `SELECT e.*, cz.name AS citizen_name, cz.email AS citizen_email, cz.phone AS citizen_phone
         FROM emergencies e
         LEFT JOIN citizens cz ON (e.citizen_id = cz.citizen_id OR e.citizen_id = CAST(cz.id AS CHAR))
         ORDER BY e.id DESC`
      );
      rows = joinedRows;
    } catch (joinErr) {
      console.warn("Emergencies join query failed, falling back to basic query:", joinErr.message);
      const [basicRows] = await db.query(
        `SELECT * FROM emergencies ORDER BY id DESC`
      );
      rows = basicRows;
    }

    res.json(rows || []);

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

    // Fetch existing emergency with citizen details (with safe fallback)
    let existingEmergency = null;
    try {
      const [existingRows] = await db.query(
        `SELECT e.*, cz.name AS citizen_name, cz.email AS citizen_email
         FROM emergencies e
         LEFT JOIN citizens cz ON (e.citizen_id = cz.citizen_id OR e.citizen_id = CAST(cz.id AS CHAR))
         WHERE e.id = ?`,
        [req.params.id]
      );
      if (existingRows && existingRows.length > 0) {
        existingEmergency = existingRows[0];
      }
    } catch (joinErr) {
      console.warn("Fetch emergency join failed, falling back:", joinErr.message);
      const [plainRows] = await db.query(
        `SELECT * FROM emergencies WHERE id = ?`,
        [req.params.id]
      );
      if (plainRows && plainRows.length > 0) {
        existingEmergency = plainRows[0];
      }
    }

    if (!existingEmergency) {
      return res.status(404).json({
        message: "Emergency not found",
      });
    }

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
    let emailDispatched = false;
    const recipientEmail = citizen_email || existingEmergency.citizen_email;
    const resolvedCitizenName =
      citizen_name || existingEmergency.citizen_name || "Valued Citizen";

    if (status && status !== previousStatus && recipientEmail) {
      emailDispatched = true;
      sendEmergencyStatusEmail({
        toEmail: recipientEmail,
        citizenName: resolvedCitizenName,
        emergencyId: req.params.id,
        emergencyType: type || existingEmergency.type,
        location: location || existingEmergency.location,
        team: team || existingEmergency.team,
        priority: priority || existingEmergency.priority,
        previousStatus,
        newStatus: status,
      }).catch((mailErr) => {
        console.error("Background emergency email send error:", mailErr);
      });

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
      recipient: recipientEmail || null,
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