import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET nearby locations
router.get("/nearby", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 5;

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required",
      });
    }

    // Validate radius
    if (radius <= 0) {
      return res.status(400).json({
        message: "Radius must be greater than 0",
      });
    }

    const results = [];

    // -------------------------
    // Departments
    // -------------------------
    const [departments] = await db.query(
      `SELECT
        id,
        name,
        category,
        officer,
        latitude,
        longitude,
        'department' AS type,
        (
          6371 * ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(latitude))
            * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(latitude))
          )
        ) AS distance_km
       FROM departments
       WHERE latitude IS NOT NULL
         AND longitude IS NOT NULL`,
      [lat, lng, lat]
    );

    results.push(...departments);

    // -------------------------
    // Assets
    // -------------------------
    const [assets] = await db.query(
      `SELECT
        id,
        name,
        department,
        location,
        status,
        condition_status,
        latitude,
        longitude,
        'asset' AS type,
        (
          6371 * ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(latitude))
            * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(latitude))
          )
        ) AS distance_km
       FROM assets
       WHERE latitude IS NOT NULL
         AND longitude IS NOT NULL`,
      [lat, lng, lat]
    );

    results.push(...assets);

    // -------------------------
    // Emergencies
    // -------------------------
    const [emergencies] = await db.query(
      `SELECT
        id,
        type AS emergency_type,
        location,
        team,
        priority,
        status,
        latitude,
        longitude,
        'emergency' AS type,
        (
          6371 * ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(latitude))
            * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(latitude))
          )
        ) AS distance_km
       FROM emergencies
       WHERE latitude IS NOT NULL
         AND longitude IS NOT NULL`,
      [lat, lng, lat]
    );

    results.push(...emergencies);

    // -------------------------
    // Complaints
    // -------------------------
    const [complaints] = await db.query(
      `SELECT
        id,
        category,
        description,
        location,
        priority,
        status,
        latitude,
        longitude,
        'complaint' AS type,
        (
          6371 * ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(latitude))
            * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(latitude))
          )
        ) AS distance_km
       FROM complaints
       WHERE latitude IS NOT NULL
         AND longitude IS NOT NULL`,
      [lat, lng, lat]
    );

    results.push(...complaints);

    // Only locations within radius
    const nearby = results
      .filter((item) => item.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json({
      center: {
        latitude: lat,
        longitude: lng,
      },
      radius_km: radius,
      count: nearby.length,
      locations: nearby,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error finding nearby locations",
    });
  }
});

// GET nearest location
router.get("/nearest", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const type = req.query.type;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required",
      });
    }

    const allowedTypes = [
      "department",
      "asset",
      "emergency",
      "complaint",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message:
          "Type must be department, asset, emergency, or complaint",
      });
    }

    let table;
    let selectFields;

    if (type === "department") {
      table = "departments";
      selectFields = `
        id,
        name,
        category,
        officer,
        phone,
        email,
        latitude,
        longitude
      `;
    }

    if (type === "asset") {
      table = "assets";
      selectFields = `
        id,
        name,
        department,
        location,
        status,
        condition_status,
        latitude,
        longitude
      `;
    }

    if (type === "emergency") {
      table = "emergencies";
      selectFields = `
        id,
        type AS emergency_type,
        location,
        team,
        priority,
        status,
        latitude,
        longitude
      `;
    }

    if (type === "complaint") {
      table = "complaints";
      selectFields = `
        id,
        category,
        description,
        location,
        priority,
        status,
        latitude,
        longitude
      `;
    }

    const query = `
      SELECT
        ${selectFields},
        (
          6371 * ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(latitude))
            * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(latitude))
          )
        ) AS distance_km
      FROM ${table}
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 1
    `;

    const [rows] = await db.query(query, [lat, lng, lat]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: `No ${type} found with coordinates`,
      });
    }

    res.json({
      user_location: {
        latitude: lat,
        longitude: lng,
      },
      type,
      nearest: rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error finding nearest location",
    });
  }
});

// GET all locations as GeoJSON
router.get("/geojson", async (req, res) => {
  try {
    const features = [];

    const [departments] = await db.query(`
      SELECT *
      FROM departments
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
    `);

    departments.forEach((item) => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            Number(item.longitude),
            Number(item.latitude),
          ],
        },
        properties: {
          id: item.id,
          type: "department",
          name: item.name,
          category: item.category,
          officer: item.officer,
          status: item.status,
        },
      });
    });

    const [assets] = await db.query(`
      SELECT *
      FROM assets
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
    `);

    assets.forEach((item) => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            Number(item.longitude),
            Number(item.latitude),
          ],
        },
        properties: {
          id: item.id,
          type: "asset",
          name: item.name,
          department: item.department,
          location: item.location,
          status: item.status,
          condition_status: item.condition_status,
        },
      });
    });

    const [emergencies] = await db.query(`
      SELECT *
      FROM emergencies
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
    `);

    emergencies.forEach((item) => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            Number(item.longitude),
            Number(item.latitude),
          ],
        },
        properties: {
          id: item.id,
          type: "emergency",
          emergency_type: item.type,
          location: item.location,
          team: item.team,
          priority: item.priority,
          status: item.status,
        },
      });
    });

    const [complaints] = await db.query(`
      SELECT *
      FROM complaints
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
    `);

    complaints.forEach((item) => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            Number(item.longitude),
            Number(item.latitude),
          ],
        },
        properties: {
          id: item.id,
          type: "complaint",
          category: item.category,
          description: item.description,
          location: item.location,
          priority: item.priority,
          status: item.status,
        },
      });
    });

    res.json({
      type: "FeatureCollection",
      features,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error generating GeoJSON",
    });
  }
});

export default router;