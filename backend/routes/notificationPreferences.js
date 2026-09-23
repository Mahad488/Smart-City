import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET preferences
router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM notification_preferences
    WHERE id = 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch notification preferences",
      });
    }

    res.json(results[0]);
  });
});

// UPDATE preferences
router.put("/", (req, res) => {
  const {
    email_notifications,
    emergency_alerts,
    complaint_updates,
    system_updates,
  } = req.body;

  const sql = `
    UPDATE notification_preferences
    SET
      email_notifications = ?,
      emergency_alerts = ?,
      complaint_updates = ?,
      system_updates = ?
    WHERE id = 1
  `;

  db.query(
    sql,
    [
      email_notifications,
      emergency_alerts,
      complaint_updates,
      system_updates,
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to update preferences",
        });
      }

      res.json({
        message: "Notification preferences updated successfully",
      });
    }
  );
});

export default router;
