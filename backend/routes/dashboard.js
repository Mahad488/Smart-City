import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.get("/stats", (req, res) => {
  const queries = {
    complaints: "SELECT COUNT(*) AS total FROM complaints",
    departments: "SELECT COUNT(*) AS total FROM departments",
    assets: "SELECT COUNT(*) AS total FROM assets",
    emergencies: "SELECT COUNT(*) AS total FROM emergencies",
    activeEmergencies:
      "SELECT COUNT(*) AS total FROM emergencies WHERE status = 'Active'",
    resolvedComplaints:
      "SELECT COUNT(*) AS total FROM complaints WHERE status = 'Resolved'",
  };

  Promise.all(
    Object.entries(queries).map(([key, query]) => {
      return new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          resolve([key, result[0].total]);
        });
      });
    })
  )
    .then((results) => {
      const stats = Object.fromEntries(results);

      res.json(stats);
    })
    .catch((error) => {
      console.error("Dashboard stats error:", error);

      res.status(500).json({
        message: "Failed to load dashboard statistics",
      });
    });
});

// Recent Activities
router.get("/activities", (req, res) => {
  const query = `
    SELECT
      id,
      category AS title,
      description,
      created_at,
      'complaint' AS activity_type
    FROM complaints

    UNION ALL

    SELECT
      id,
      type AS title,
      location AS description,
      reported_at AS created_at,
      'emergency' AS activity_type
    FROM emergencies

    ORDER BY created_at DESC
    LIMIT 10
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Activities error:", err);

      return res.status(500).json({
        message: "Failed to load activities",
      });
    }

    res.json(results);
  });
});

// Emergency Alerts
router.get("/emergency-alerts", (req, res) => {
  const query = `
    SELECT
      id,
      type,
      location,
      team,
      priority,
      status,
      reported_at
    FROM emergencies
    ORDER BY reported_at DESC
    LIMIT 10
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Emergency alerts error:", err);

      return res.status(500).json({
        message: "Failed to load emergency alerts",
      });
    }

    res.json(results);
  });
});

router.get("/complaint-categories", (req, res) => {
  const query = `
    SELECT
      category,
      COUNT(*) AS total
    FROM complaints
    GROUP BY category
    ORDER BY total DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Complaint categories error:", err);

      return res.status(500).json({
        message: "Failed to load complaint categories",
      });
    }

    const total = results.reduce(
      (sum, item) => sum + Number(item.total),
      0
    );

    const categories = results.map((item) => ({
      category: item.category,
      total: Number(item.total),
      percentage:
        total > 0
          ? Math.round((Number(item.total) / total) * 100)
          : 0,
    }));

    res.json({
      total,
      categories,
    });
  });
});

router.get("/department-performance", (req, res) => {
  const query = `
    SELECT
      id,
      name,
      performance
    FROM departments
    ORDER BY performance DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Department performance error:", err);
      return res.status(500).json({
        message: "Failed to fetch department performance",
      });
    }

    res.json(results);
  });
});

router.get("/service-requests", (req, res) => {
  const query = `
    SELECT
      id,
      service_name,
      total_requests
    FROM service_requests
    ORDER BY total_requests DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Service requests error:", err);

      return res.status(500).json({
        message: "Failed to fetch service requests",
      });
    }

    res.json(results);
  });
});

export default router;