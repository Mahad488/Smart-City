import express from "express";
import db from "../config/db.js";
import { sendComplaintStatusEmail, isSmtpConfigured } from "../utils/mailer.js";

const router = express.Router();


// =====================================================
// GET ALL COMPLAINTS - ADMIN
// =====================================================
router.get("/", async (req, res) => {
  try {
    let complaints = [];
    try {
      const [rows] = await db.query(
        `SELECT * FROM complaints ORDER BY created_at DESC`
      );
      complaints = rows;
    } catch (orderErr) {
      const [rows] = await db.query(
        `SELECT * FROM complaints ORDER BY id DESC`
      );
      complaints = rows;
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

      const enriched = complaints.map((c) => {
        const cz = c.citizen_id ? citizenMap.get(String(c.citizen_id).trim()) : null;
        return {
          ...c,
          citizen_name: cz ? cz.name : null,
          citizen_email: cz ? cz.email : null,
          citizen_phone: cz ? cz.phone : null,
        };
      });

      return res.json(enriched);
    } catch (czErr) {
      console.warn("Could not enrich complaints with citizens:", czErr.message);
      return res.json(complaints);
    }
  } catch (error) {
    console.error("GET COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Error fetching complaints",
      error: error.message,
    });
  }
});


// =====================================================
// GET CITIZEN'S COMPLAINTS
// =====================================================
router.get("/citizen/:citizen_id", async (req, res) => {
  try {
    const { citizen_id } = req.params;

    const [rows] = await db.query(
      `SELECT *
       FROM complaints
       WHERE citizen_id = ?
       ORDER BY created_at DESC`,
      [citizen_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("GET CITIZEN COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Error fetching citizen complaints",
    });
  }
});


// =====================================================
// POST COMPLAINT FROM CITIZEN
// =====================================================
router.post("/citizen", async (req, res) => {
  try {
    const {
      citizen_id,
      title,
      description,
      category,
      area,
      latitude,
      longitude,
    } = req.body;

    if (!citizen_id || !title || !description) {
      return res.status(400).json({
        message: "Citizen, title and description are required",
      });
    }

    // Check citizen
    const [citizenRows] = await db.query(
      `SELECT id, name, email, area, status
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
        message: "Only active citizens can submit complaints",
      });
    }

    const [result] = await db.query(
      `INSERT INTO complaints
       (
         citizen_id,
         category,
         description,
         location,
         priority,
         status,
         latitude,
         longitude
       )
      VALUES (?, ?, ?, ?, 'Medium', 'Pending', ?, ?)`,
      [
        citizen_id,
        category || "Other",
        `Title: ${title}\n\n${description}`,
        area || citizen.area || "Not provided",
        latitude ?? null,
        longitude ?? null,
      ]
    );

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaintId: result.insertId,
    });

  } catch (error) {
    console.error("CREATE CITIZEN COMPLAINT ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error creating complaint",
    });
  }
});


// =====================================================
// UPDATE CITIZEN COMPLAINT
// =====================================================
router.put("/citizen/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      citizen_id,
      title,
      description,
      category,
      area,
    } = req.body;

    if (!citizen_id || !title || !description) {
      return res.status(400).json({
        message: "Citizen, title and description are required",
      });
    }

    // Make sure complaint belongs to citizen
    const [existing] = await db.query(
      `SELECT id
       FROM complaints
       WHERE id = ? AND citizen_id = ?`,
      [id, citizen_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Complaint not found or access denied",
      });
    }

    await db.query(
      `UPDATE complaints
       SET category = ?,
           description = ?,
           location = ?
       WHERE id = ? AND citizen_id = ?`,
      [
        category || "Other",
        `Title: ${title}\n\n${description}`,
        area || "Not provided",
        id,
        citizen_id,
      ]
    );

    res.json({
      message: "Complaint updated successfully",
    });

  } catch (error) {
    console.error("UPDATE CITIZEN COMPLAINT ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error updating complaint",
    });
  }
});


// =====================================================
// DELETE CITIZEN COMPLAINT
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
      `DELETE FROM complaints
       WHERE id = ? AND citizen_id = ?`,
      [id, citizen_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Complaint not found or access denied",
      });
    }

    res.json({
      message: "Complaint deleted successfully",
    });

  } catch (error) {
    console.error("DELETE CITIZEN COMPLAINT ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error deleting complaint",
    });
  }
});


// =====================================================
// GET SINGLE COMPLAINT
// =====================================================
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *
       FROM complaints
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("GET SINGLE COMPLAINT ERROR:", error);

    res.status(500).json({
      message: "Error fetching complaint",
    });
  }
});


// =====================================================
// ADMIN CREATE COMPLAINT
// =====================================================
router.post("/", async (req, res) => {
  try {
    const {
      citizen_id,
      category,
      description,
      location,
      priority,
      status,
      latitude,
      longitude,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO complaints
       (
         citizen_id,
         category,
         description,
         location,
         priority,
         status,
         latitude,
         longitude
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        citizen_id || null,
        category,
        description,
        location,
        priority || "Medium",
        status || "Pending",
        latitude ?? null,
        longitude ?? null,
      ]
    );

    res.status(201).json({
      message: "Complaint created successfully",
      id: result.insertId,
    });

  } catch (error) {
    console.error("ADMIN CREATE COMPLAINT ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error creating complaint",
    });
  }
});


// =====================================================
// ADMIN UPDATE COMPLAINT
// =====================================================
router.put("/:id", async (req, res) => {
  try {
    const {
      category,
      description,
      location,
      priority,
      status,
      latitude,
      longitude,
      citizen_email,
      citizen_name,
    } = req.body;

    // Fetch existing complaint
    const [existingRows] = await db.query(
      `SELECT * FROM complaints WHERE id = ?`,
      [req.params.id]
    );

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    const existingComplaint = existingRows[0];
    const previousStatus = existingComplaint.status;

    const [result] = await db.query(
      `UPDATE complaints
       SET category = ?,
           description = ?,
           location = ?,
           priority = ?,
           status = ?,
           latitude = ?,
           longitude = ?
       WHERE id = ?`,
      [
        category ?? existingComplaint.category,
        description ?? existingComplaint.description,
        location ?? existingComplaint.location,
        priority ?? existingComplaint.priority,
        status ?? existingComplaint.status,
        latitude ?? existingComplaint.latitude ?? null,
        longitude ?? existingComplaint.longitude ?? null,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    // Check if status has changed and trigger notification email in English
    let recipientEmail = citizen_email || existingComplaint.citizen_email;
    let resolvedCitizenName =
      citizen_name || existingComplaint.citizen_name || "Valued Citizen";

    // If recipientEmail was not passed or joined, look it up directly from citizens table
    if (!recipientEmail && existingComplaint.citizen_id) {
      try {
        const [czRows] = await db.query(
          `SELECT name, email FROM citizens WHERE citizen_id = ? OR CAST(id AS CHAR) = ? LIMIT 1`,
          [existingComplaint.citizen_id, existingComplaint.citizen_id]
        );
        if (czRows && czRows.length > 0) {
          recipientEmail = czRows[0].email;
          if (!citizen_name && czRows[0].name) {
            resolvedCitizenName = czRows[0].name;
          }
        }
      } catch (lookupErr) {
        console.warn("Direct citizen email lookup failed:", lookupErr.message);
      }
    }

    let emailDispatched = false;

    if (status && status !== previousStatus && recipientEmail) {
      emailDispatched = true;
      sendComplaintStatusEmail({
        toEmail: recipientEmail,
        citizenName: resolvedCitizenName,
        complaintId: req.params.id,
        category: category || existingComplaint.category,
        location: location || existingComplaint.location,
        priority: priority || existingComplaint.priority,
        previousStatus,
        newStatus: status,
        description: description || existingComplaint.description,
      })
        .then((res) => {
          console.log(`[Complaints] Email dispatched to ${recipientEmail} for CMP-${req.params.id}:`, res?.messageId || res);
        })
        .catch((mailErr) => {
          console.error(`[Complaints] Email dispatch error for CMP-${req.params.id}:`, mailErr.message);
        });

      // Also record system notification
      try {
        await db.query(
          `INSERT INTO notifications (title, message, type)
           VALUES (?, ?, 'Complaint')`,
          [
            `Complaint #${req.params.id} Status: ${status}`,
            `Complaint CMP-${String(req.params.id).padStart(4, "0")} (${category || existingComplaint.category}) status changed to "${status}". Notification dispatched to ${recipientEmail}.`,
          ]
        );
      } catch (notifErr) {
        console.warn("Could not insert notification:", notifErr.message);
      }
    }

    res.json({
      message: "Complaint updated successfully",
      emailSent: emailDispatched,
      recipient: recipientEmail || null,
      smtpConfigured: isSmtpConfigured(),
      previousStatus,
      newStatus: status,
    });

  } catch (error) {
    console.error("ADMIN UPDATE COMPLAINT ERROR:", error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Error updating complaint",
    });
  }
});


// =====================================================
// ADMIN DELETE COMPLAINT
// =====================================================
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM complaints
       WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.json({
      message: "Complaint deleted successfully",
    });

  } catch (error) {
    console.error("ADMIN DELETE COMPLAINT ERROR:", error);

    res.status(500).json({
      message: "Error deleting complaint",
    });
  }
});


export default router;