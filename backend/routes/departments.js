import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET all departments
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM departments ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching departments" });
  }
});

// GET single department
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM departments WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching department" });
  }
});

// POST department
router.post("/", async (req, res) => {
  try {
    const {
      name,
      category,
      officer,
      phone,
      email,
      cases,
      performance,
      description,
      status,
      latitude,
      longitude,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO departments
      (name, category, officer, phone, email, cases, performance,
       description, status, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        officer,
        phone,
        email,
        cases,
        performance,
        description,
        status,
        latitude,
        longitude,
      ]
    );

    res.status(201).json({
      message: "Department created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating department",
    });
  }
});

// PUT department
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      category,
      officer,
      phone,
      email,
      cases,
      performance,
      description,
      status,
      latitude,
      longitude,
    } = req.body;

    const [result] = await db.query(
      `UPDATE departments
       SET name = ?,
           category = ?,
           officer = ?,
           phone = ?,
           email = ?,
           cases = ?,
           performance = ?,
           description = ?,
           status = ?,
           latitude = ?,
           longitude = ?
       WHERE id = ?`,
      [
        name,
        category,
        officer,
        phone,
        email,
        cases,
        performance,
        description,
        status,
        latitude,
        longitude,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json({
      message: "Department updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating department",
    });
  }
});

// DELETE department
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM departments WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting department",
    });
  }
});

export default router;