import express from "express";
import db from "../config/db.js";

const router = express.Router();

const defaultAnalytics = {
  totalActivities: 12486,
  complaints: 4286,
  emergencies: 1284,
  resolutionRate: 87.6,
  monthlyActivity: {
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    complaints: [42, 58, 51, 73, 65, 82],
    emergencies: [18, 24, 20, 31, 27, 35],
  },
  departmentPerformance: [
    { id: 1, name: "Waste Management", performance: 94 },
    { id: 2, name: "Water Management", performance: 89 },
    { id: 3, name: "Roads & Infrastructure", performance: 84 },
    { id: 4, name: "Emergency Services", performance: 91 },
    { id: 5, name: "Sanitation", performance: 78 },
  ],
  complaintCategories: [
    { category: "Roads & Infrastructure", total: 32, percentage: 32 },
    { category: "Waste Management", total: 27, percentage: 27 },
    { category: "Water Supply", total: 21, percentage: 21 },
    { category: "Electricity", total: 12, percentage: 12 },
    { category: "Other", total: 8, percentage: 8 },
  ],
  citizenEngagement: {
    activeCitizens: 8642,
    newRegistrations: 1284,
    engagementRate: 76,
  },
};

const safeNumber = (value) => Number(value ?? 0);

const queryAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(results);
    });
  });
};

const getDatabaseName = () => {
  return process.env.DB_NAME || db?.config?.connectionConfig?.database || "smart_city";
};

const tableExists = async (tableName) => {
  try {
    const rows = await queryAsync(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1",
      [getDatabaseName(), tableName]
    );

    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    return false;
  }
};

const getMetricValue = async (metricName, period = "Last 6 Months") => {
  const rows = await queryAsync(
    `SELECT metric_value
     FROM analytics
     WHERE metric_name = ?
       AND period IN (?, 'All', 'all', 'default', '')
     ORDER BY created_at DESC
     LIMIT 1`,
    [metricName, String(period)]
  );

  if (!Array.isArray(rows) || rows.length === 0) return null;

  return Number(rows[0].metric_value);
};

const getMetricRowsByPrefix = async (prefix, period = "Last 6 Months") => {
  const rows = await queryAsync(
    `SELECT metric_name, metric_value
     FROM analytics
     WHERE metric_name LIKE ?
       AND period IN (?, 'All', 'all', 'default', '')
     ORDER BY created_at DESC`,
    [`${prefix}%`, String(period)]
  );

  return Array.isArray(rows) ? rows : [];
};

const readAnalyticsTableSnapshot = async (period = "Last 6 Months") => {
  const rows = await queryAsync(
    `SELECT metric_name, metric_value
     FROM analytics
     WHERE period IN (?, 'All', 'all', 'default', '')
     ORDER BY created_at DESC`,
    [String(period)]
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const metrics = {};
  for (const row of rows) {
    metrics[row.metric_name] = Number(row.metric_value);
  }

  const labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

  const complaintValues = labels.map((label) => {
    const key = `monthly_complaints_${label}`;
    return metrics[key] ?? 0;
  });

  const emergencyValues = labels.map((label) => {
    const key = `monthly_emergencies_${label}`;
    return metrics[key] ?? 0;
  });

  return {
    totalActivities: Number(metrics.total_activities ?? defaultAnalytics.totalActivities),
    complaints: Number(metrics.complaints ?? defaultAnalytics.complaints),
    emergencies: Number(metrics.emergencies ?? defaultAnalytics.emergencies),
    resolutionRate: Number(metrics.resolution_rate ?? defaultAnalytics.resolutionRate),
    monthlyActivity: {
      labels,
      complaints: complaintValues,
      emergencies: emergencyValues,
    },
    departmentPerformance: defaultAnalytics.departmentPerformance,
    complaintCategories: defaultAnalytics.complaintCategories,
    citizenEngagement: defaultAnalytics.citizenEngagement,
  };
};

const seedAnalyticsTable = async () => {
  const exists = await tableExists("analytics");

  if (!exists) {
    return false;
  }

  const countRows = await queryAsync("SELECT COUNT(*) AS total FROM analytics");

  if (Number(countRows[0]?.total || 0) > 0) {
    return true;
  }

  const monthRows = [
    ["monthly_complaints_Apr", 42, "monthly", "Last 6 Months"],
    ["monthly_complaints_May", 58, "monthly", "Last 6 Months"],
    ["monthly_complaints_Jun", 51, "monthly", "Last 6 Months"],
    ["monthly_complaints_Jul", 73, "monthly", "Last 6 Months"],
    ["monthly_complaints_Aug", 65, "monthly", "Last 6 Months"],
    ["monthly_complaints_Sep", 82, "monthly", "Last 6 Months"],
    ["monthly_emergencies_Apr", 18, "monthly", "Last 6 Months"],
    ["monthly_emergencies_May", 24, "monthly", "Last 6 Months"],
    ["monthly_emergencies_Jun", 20, "monthly", "Last 6 Months"],
    ["monthly_emergencies_Jul", 31, "monthly", "Last 6 Months"],
    ["monthly_emergencies_Aug", 27, "monthly", "Last 6 Months"],
    ["monthly_emergencies_Sep", 35, "monthly", "Last 6 Months"],
    ["total_activities", 12486, "summary", "Last 6 Months"],
    ["complaints", 4286, "summary", "Last 6 Months"],
    ["emergencies", 1284, "summary", "Last 6 Months"],
    ["resolution_rate", 87.6, "summary", "Last 6 Months"],
  ];

  for (const row of monthRows) {
    await queryAsync(
      "INSERT INTO analytics (metric_name, metric_value, metric_type, period) VALUES (?, ?, ?, ?)",
      row
    );
  }

  return true;
};

const buildMonthlyActivity = async (period = "Last 6 Months") => {
  const labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

  const complaintRows = await getMetricRowsByPrefix("monthly_complaints_", period);
  const emergencyRows = await getMetricRowsByPrefix("monthly_emergencies_", period);

  const complaintMap = {};
  for (const row of complaintRows) {
    const key = row.metric_name.replace("monthly_complaints_", "");
    complaintMap[key] = Number(row.metric_value);
  }

  const emergencyMap = {};
  for (const row of emergencyRows) {
    const key = row.metric_name.replace("monthly_emergencies_", "");
    emergencyMap[key] = Number(row.metric_value);
  }

  return {
    labels,
    complaints: labels.map((label) => complaintMap[label] ?? 0),
    emergencies: labels.map((label) => emergencyMap[label] ?? 0),
  };
};

const buildDepartmentPerformance = async () => {
  try {
    const rows = await queryAsync(
      "SELECT id, name, performance FROM departments ORDER BY performance DESC LIMIT 5"
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return defaultAnalytics.departmentPerformance;
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      performance: Number(row.performance || 0),
    }));
  } catch (error) {
    return defaultAnalytics.departmentPerformance;
  }
};

const buildComplaintCategories = async () => {
  try {
    const rows = await queryAsync(`
      SELECT category, COUNT(*) AS total
      FROM complaints
      GROUP BY category
      ORDER BY total DESC
      LIMIT 5
    `);

    if (!Array.isArray(rows) || rows.length === 0) {
      return defaultAnalytics.complaintCategories;
    }

    const totalComplaints = rows.reduce((sum, item) => sum + safeNumber(item.total), 0);

    return rows.map((item) => ({
      category: item.category,
      total: safeNumber(item.total),
      percentage:
        totalComplaints > 0
          ? Math.round((safeNumber(item.total) / totalComplaints) * 100)
          : 0,
    }));
  } catch (error) {
    return defaultAnalytics.complaintCategories;
  }
};

const buildCitizenEngagement = async () => {
  const candidates = ["users", "citizens"];

  for (const tableName of candidates) {
    const exists = await tableExists(tableName);

    if (!exists) continue;

    try {
      const totalRow = await queryAsync(`SELECT COUNT(*) AS total FROM ${tableName}`);
      const total = safeNumber(totalRow[0]?.total);

      return {
        activeCitizens: total,
        newRegistrations: Math.max(0, Math.round(total * 0.15)),
        engagementRate: total > 0 ? Math.min(100, Math.round((total / (total + 200)) * 100)) : 0,
      };
    } catch (error) {
      continue;
    }
  }

  return defaultAnalytics.citizenEngagement;
};

router.get("/", async (req, res) => {
  const period = req.query.period || "Last 6 Months";

  try {
    const [
      complaintCountRows,
      emergencyCountRows,
      resolvedComplaintRows,
    ] = await Promise.all([
      queryAsync("SELECT COUNT(*) AS total FROM complaints"),
      queryAsync("SELECT COUNT(*) AS total FROM emergencies"),
      queryAsync("SELECT COUNT(*) AS total FROM complaints WHERE status = 'Resolved'"),
    ]);

    const totalComplaints = safeNumber(complaintCountRows[0]?.total);
    const totalEmergencies = safeNumber(emergencyCountRows[0]?.total);
    const resolvedComplaints = safeNumber(resolvedComplaintRows[0]?.total);

    const totalActivities = totalComplaints + totalEmergencies;
    const complaints = totalComplaints;
    const emergencies = totalEmergencies;
    const resolutionRate =
      totalComplaints > 0
        ? Number(((resolvedComplaints / totalComplaints) * 100).toFixed(1))
        : defaultAnalytics.resolutionRate;

    const monthlyActivity = await buildMonthlyActivity(period);
    const tableExistsFlag = await tableExists("analytics");
    const snapshot = tableExistsFlag ? await readAnalyticsTableSnapshot(period) : null;

    const payload = {
      totalActivities,
      complaints,
      emergencies,
      resolutionRate,
      monthlyActivity: snapshot?.monthlyActivity || monthlyActivity,
      departmentPerformance: await buildDepartmentPerformance(),
      complaintCategories: await buildComplaintCategories(),
      citizenEngagement: await buildCitizenEngagement(),
    };

    res.json(payload);
  } catch (error) {
    console.error("Analytics fetch error:", error);
    res.json(defaultAnalytics);
  }
});

router.post("/seed", async (req, res) => {
  try {
    const seeded = await seedAnalyticsTable();

    res.json({
      success: true,
      seeded,
      message: seeded ? "Analytics table populated" : "Analytics table not available",
    });
  } catch (error) {
    console.error("Analytics seed error:", error);
    res.status(500).json({ message: "Failed to seed analytics data" });
  }
});

export default router;
