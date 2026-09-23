import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  MessageSquareWarning,
  Siren,
  CheckCircle2,
  Users,
  FileText,
  Download,
} from "lucide-react";
import "./Analytics.css";

type MonthlyActivity = {
  labels: string[];
  complaints: number[];
  emergencies: number[];
};

type DepartmentPerformanceItem = {
  id: number;
  name: string;
  performance: number;
};

type ComplaintCategory = {
  category: string;
  total: number;
  percentage: number;
};

type CitizenEngagement = {
  activeCitizens: number;
  newRegistrations: number;
  engagementRate: number;
};

interface AnalyticsResponse {
  totalActivities: number;
  complaints: number;
  emergencies: number;
  resolutionRate: number;
  monthlyActivity: MonthlyActivity;
  departmentPerformance: DepartmentPerformanceItem[];
  complaintCategories: ComplaintCategory[];
  citizenEngagement: CitizenEngagement;
}

const defaultAnalytics: AnalyticsResponse = {
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

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState("Last 6 Months");
  const [analytics, setAnalytics] = useState<AnalyticsResponse>(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ period });
        const response = await fetch(
          `http://localhost:5000/api/analytics?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const data = await response.json();

        setAnalytics({
          ...defaultAnalytics,
          ...data,
          monthlyActivity: {
            ...defaultAnalytics.monthlyActivity,
            ...(data?.monthlyActivity || {}),
          },
          departmentPerformance: Array.isArray(data?.departmentPerformance)
            ? data.departmentPerformance
            : defaultAnalytics.departmentPerformance,
          complaintCategories: Array.isArray(data?.complaintCategories)
            ? data.complaintCategories
            : defaultAnalytics.complaintCategories,
          citizenEngagement: {
            ...defaultAnalytics.citizenEngagement,
            ...(data?.citizenEngagement || {}),
          },
        });
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Unable to load analytics data right now.");
        setAnalytics(defaultAnalytics);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, [period]);

  const months = analytics.monthlyActivity.labels.length
    ? analytics.monthlyActivity.labels
    : defaultAnalytics.monthlyActivity.labels;

  const complaints = analytics.monthlyActivity.complaints.length
    ? analytics.monthlyActivity.complaints
    : defaultAnalytics.monthlyActivity.complaints;

  const emergencies = analytics.monthlyActivity.emergencies.length
    ? analytics.monthlyActivity.emergencies
    : defaultAnalytics.monthlyActivity.emergencies;

  const maxValue = Math.max(
    100,
    ...complaints.map((value, index) => Math.max(value, emergencies[index] || 0))
  );

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Monitor city operations and performance insights</p>
        </div>

        <div className="analytics-header-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>Last 6 Months</option>
            <option>Last 12 Months</option>
            <option>This Year</option>
          </select>

          <button className="download-report-btn">
            <Download size={15} />
            Export Report
          </button>
        </div>
      </div>

      {error && <div className="analytics-error">{error}</div>}

      <div className="analytics-stats">
        <div className="analytics-stat">
          <div className="analytics-stat-icon blue">
            <BarChart3 size={20} />
          </div>

          <div>
            <span>Total Activities</span>
            <strong>{loading ? "Loading..." : formatNumber(analytics.totalActivities)}</strong>
            <small>{loading ? "Updating data" : "+12.5% this period"}</small>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat-icon orange">
            <MessageSquareWarning size={20} />
          </div>

          <div>
            <span>Complaints</span>
            <strong>{loading ? "Loading..." : formatNumber(analytics.complaints)}</strong>
            <small>{loading ? "Updating data" : "+8.2% this period"}</small>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat-icon red">
            <Siren size={20} />
          </div>

          <div>
            <span>Emergencies</span>
            <strong>{loading ? "Loading..." : formatNumber(analytics.emergencies)}</strong>
            <small>{loading ? "Updating data" : "+5.4% this period"}</small>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Resolution Rate</span>
            <strong>
              {loading ? "Loading..." : `${analytics.resolutionRate.toFixed(1)}%`}
            </strong>
            <small>{loading ? "Updating data" : "+3.1% improvement"}</small>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card activity-card">
          <div className="analytics-card-header">
            <div>
              <h3>City Activity Overview</h3>
              <p>Complaints and emergency activity</p>
            </div>

            <BarChart3 size={18} />
          </div>

          <div className="chart-area">
            <div className="chart-y-axis">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            <div className="chart">
              <div className="chart-lines">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="bars">
                {months.map((month, index) => (
                  <div className="bar-group" key={month + index}>
                    <div className="bar-wrapper">
                      <div
                        className="bar complaint-bar"
                        style={{
                          height: `${(complaints[index] / maxValue) * 100}%`,
                        }}
                      ></div>

                      <div
                        className="bar emergency-bar"
                        style={{
                          height: `${(emergencies[index] / maxValue) * 100}%`,
                        }}
                      ></div>
                    </div>

                    <span>{month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-legend">
            <div>
              <i className="legend-dot complaint"></i>
              Complaints
            </div>

            <div>
              <i className="legend-dot emergency"></i>
              Emergencies
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Department Performance</h3>
              <p>Resolution performance by department</p>
            </div>

            <TrendingUp size={18} />
          </div>

          <div className="department-list">
            {analytics.departmentPerformance.map((department) => (
              <div className="department-item" key={department.id || department.name}>
                <div>
                  <strong>{department.name}</strong>
                  <span>{department.performance}% resolved</span>
                </div>

                <div className="progress">
                  <span style={{ width: `${department.performance}%` }}></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-bottom-grid">
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Complaint Categories</h3>
              <p>Distribution of citizen complaints</p>
            </div>

            <MessageSquareWarning size={18} />
          </div>

          <div className="category-list">
            {analytics.complaintCategories.map((category) => (
              <div className="category-row" key={category.category}>
                <span>{category.category}</span>
                <strong>{category.percentage}%</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Citizen Engagement</h3>
              <p>Citizen platform activity</p>
            </div>

            <Users size={18} />
          </div>

          <div className="engagement-stats">
            <div>
              <strong>{formatNumber(analytics.citizenEngagement.activeCitizens)}</strong>
              <span>Active Citizens</span>
            </div>

            <div>
              <strong>{formatNumber(analytics.citizenEngagement.newRegistrations)}</strong>
              <span>New Registrations</span>
            </div>

            <div>
              <strong>{analytics.citizenEngagement.engagementRate}%</strong>
              <span>Engagement Rate</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Reports</h3>
              <p>Generate operational reports</p>
            </div>

            <FileText size={18} />
          </div>

          <div className="report-list">
            <button>
              <FileText size={14} />
              Monthly Operations Report
            </button>

            <button>
              <FileText size={14} />
              Department Performance
            </button>

            <button>
              <FileText size={14} />
              Citizen Complaints Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
