import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET all assets
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM assets ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching assets",
    });
  }
});

// GET single asset
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM assets WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching asset",
    });
  }
});

// POST asset
router.post("/", async (req, res) => {
  try {
    const {
      name,
      department,
      location,
      status,
      condition_status,
      latitude,
      longitude,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO assets
      (name, department, location, status, condition_status, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        department,
        location,
        status,
        condition_status,
        latitude,
        longitude,
      ]
    );

    res.status(201).json({
      message: "Asset created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating asset",
    });
  }
});

// PUT asset
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      department,
      location,
      status,
      condition_status,
      latitude,
      longitude,
    } = req.body;

    const [result] = await db.query(
      `UPDATE assets
       SET name = ?,
           department = ?,
           location = ?,
           status = ?,
           condition_status = ?,
           latitude = ?,
           longitude = ?
       WHERE id = ?`,
      [
        name,
        department,
        location,
        status,
        condition_status,
        latitude,
        longitude,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.json({
      message: "Asset updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating asset",
    });
  }
});

// DELETE asset
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM assets WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.json({
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting asset",
    });
  }
});

export default router;