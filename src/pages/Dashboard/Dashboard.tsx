import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Users,
  MessageSquareWarning,
  Building2,
  Boxes,
  Hospital,
  MapPin,
  AlertTriangle,
  Droplets,
  Car,
  Flame,
  FileText,
  CalendarDays,
  CreditCard,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./Dashboard.css";

interface DashboardActivity {
  id: number;
  title: string;
  description: string;
  created_at: string;
  activity_type: "complaint" | "emergency";
}

interface DashboardEmergency {
  id: number;
  type: string;
  location: string;
  team: string | null;
  priority: "Critical" | "High" | "Medium";
  status: "Active" | "Responding" | "Resolved";
  reported_at: string;
}

interface MapDepartment {
  id: number;
  name: string;
  category: string | null;
  officer: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
}

interface MapAsset {
  id: number;
  name: string;
  department: string | null;
  status: string;
  latitude: number | string | null;
  longitude: number | string | null;
}

interface MapEmergency {
  id: number;
  type: string;
  location: string;
  priority: string;
  status: string;
  latitude: number | string | null;
  longitude: number | string | null;
}

interface DashboardMapPoint {
  latitude: number | string | null;
  longitude: number | string | null;
}

interface ComplaintCategory {
  category: string;
  total: number;
  percentage: number;
}

interface DepartmentPerformanceItem {
  id: number;
  name: string;
  performance: number;
}

interface ServiceRequestItem {
  id: number;
  service_name: string;
  total_requests: number;
}

const createDashboardMarkerIcon = (color: string, symbol: string) =>
  L.divIcon({
    className: "dashboard-marker-icon",
    html: `<span style="--marker-color: ${color}">${symbol}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

const dashboardDepartmentIcon = createDashboardMarkerIcon("#16a34a", "D");
const dashboardAssetIcon = createDashboardMarkerIcon("#2563eb", "A");
const dashboardEmergencyIcon = createDashboardMarkerIcon("#dc2626", "!");

const DashboardMapBounds = ({
  points,
}: {
  points: DashboardMapPoint[];
}) => {
  const map = useMap();

  useEffect(() => {
    const validPoints = points.filter(
      (point) => point.latitude !== null && point.longitude !== null
    );

    if (validPoints.length === 0) return;

    const bounds = L.latLngBounds(
      validPoints.map(
        (point) =>
          [Number(point.latitude), Number(point.longitude)] as [number, number]
      )
    );

    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 13,
    });
  }, [map, points]);

  return null;
};

function Dashboard() {
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [emergencies, setEmergencies] = useState<DashboardEmergency[]>([]);
  const [departments, setDepartments] = useState<MapDepartment[]>([]);
  const [assets, setAssets] = useState<MapAsset[]>([]);
  const [mapEmergencies, setMapEmergencies] = useState<MapEmergency[]>([]);

  const [dashboardStats, setDashboardStats] = useState({
    complaints: 0,
    departments: 0,
    assets: 0,
    emergencies: 0,
    activeEmergencies: 0,
    resolvedComplaints: 0,
  });

  const [citizenStats, setCitizenStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
  });

  const [complaintCategories, setComplaintCategories] = useState<
    ComplaintCategory[]
  >([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<
    DepartmentPerformanceItem[]
  >([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestItem[]>([]);
  const [totalCategoryComplaints, setTotalCategoryComplaints] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const categoryOrder: Record<string, number> = {
    "Road Damage": 0,
    "Water Supply": 1,
    "Waste Management": 2,
    "Street Lights": 3,
    "Traffic": 4,
    "Public Safety": 5,
  };

  const orderedComplaintCategories = [...complaintCategories].sort((a, b) => {
    const aOrder = categoryOrder[a.category] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = categoryOrder[b.category] ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard/stats"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        const data = await response.json();

        setDashboardStats(data);
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    void fetchDashboardStats();
  }, []);

  useEffect(() => {
    const fetchCitizenStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/citizens/stats/summary"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch citizen stats");
        }

        const data = await response.json();

        setCitizenStats({
          total: Number(data.total) || 0,
          active: Number(data.active) || 0,
          pending: Number(data.pending) || 0,
          inactive: Number(data.inactive) || 0,
        });
      } catch (error) {
        console.error("Citizen stats error:", error);
      }
    };

    void fetchCitizenStats();
  }, []);

  useEffect(() => {
    const fetchComplaintCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard/complaint-categories"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch complaint categories");
        }

        const data = await response.json();

        setComplaintCategories(data.categories || []);
        setTotalCategoryComplaints(data.total || 0);
      } catch (error) {
        console.error("Complaint categories error:", error);
      }
    };

    void fetchComplaintCategories();
  }, []);

  useEffect(() => {
    const fetchDepartmentPerformance = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard/department-performance"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch department performance");
        }

        const data = await response.json();

        setDepartmentPerformance(data);
      } catch (error) {
        console.error("Department performance error:", error);
      }
    };

    void fetchDepartmentPerformance();
  }, []);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard/service-requests"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch service requests");
        }

        const data = await response.json();

        setServiceRequests(data);
      } catch (error) {
        console.error("Service requests error:", error);
      }
    };

    void fetchServiceRequests();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [activitiesRes, emergenciesRes] = await Promise.all([
          fetch("http://localhost:5000/api/dashboard/activities"),
          fetch("http://localhost:5000/api/dashboard/emergency-alerts"),
        ]);

        if (!activitiesRes.ok) {
          throw new Error("Failed to fetch activities");
        }

        if (!emergenciesRes.ok) {
          throw new Error("Failed to fetch emergency alerts");
        }

        const activitiesData = await activitiesRes.json();
        const emergenciesData = await emergenciesRes.json();

        setActivities(activitiesData);
        setEmergencies(emergenciesData);
      } catch (error) {
        console.error("Dashboard data error:", error);
      }
    };

    void fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [departmentsRes, assetsRes, emergenciesRes] = await Promise.all([
          fetch("http://localhost:5000/api/departments"),
          fetch("http://localhost:5000/api/assets"),
          fetch("http://localhost:5000/api/emergencies"),
        ]);

        if (!departmentsRes.ok) {
          throw new Error("Failed to fetch departments");
        }

        if (!assetsRes.ok) {
          throw new Error("Failed to fetch assets");
        }

        if (!emergenciesRes.ok) {
          throw new Error("Failed to fetch emergencies");
        }

        const departmentsData = await departmentsRes.json();
        const assetsData = await assetsRes.json();
        const emergenciesData = await emergenciesRes.json();

        setDepartments(departmentsData);
        setAssets(assetsData);
        setMapEmergencies(emergenciesData);
      } catch (error) {
        console.error("Map data error:", error);
      }
    };

    void fetchMapData();
  }, []);

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL(
      "leaflet/dist/images/marker-icon-2x.png",
      import.meta.url
    ).href,
    iconUrl: new URL(
      "leaflet/dist/images/marker-icon.png",
      import.meta.url
    ).href,
    shadowUrl: new URL(
      "leaflet/dist/images/marker-shadow.png",
      import.meta.url
    ).href,
  });

  const stats = [
    {
      title: "Total Citizens",
      value: citizenStats.total
        ? citizenStats.total.toLocaleString()
        : "...",
      change: citizenStats.active.toLocaleString(),
      text: "active",
      icon: Users,
      type: "blue",
      up: true,
    },
    {
      title: "Total Complaints",
      value: loadingStats
        ? "..."
        : dashboardStats.complaints.toLocaleString(),
      change: dashboardStats.resolvedComplaints.toString(),
      text: "resolved",
      icon: MessageSquareWarning,
      type: "red",
      up: true,
    },
    {
      title: "Active Departments",
      value: loadingStats
        ? "..."
        : dashboardStats.departments.toLocaleString(),
      change: "All systems operational",
      text: "",
      icon: Building2,
      type: "green",
      up: true,
    },
    {
      title: "Public Assets",
      value: loadingStats
        ? "..."
        : dashboardStats.assets.toLocaleString(),
      change: "Database",
      text: "registered",
      icon: Boxes,
      type: "purple",
      up: true,
    },
    {
      title: "Emergencies",
      value: loadingStats
        ? "..."
        : dashboardStats.emergencies.toLocaleString(),
      change: dashboardStats.activeEmergencies.toString(),
      text: "active",
      icon: AlertTriangle,
      type: "cyan",
      up: true,
    },
  ];

  const formattedDashboardDate = currentDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedDashboardTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="dashboard">

      {/* Welcome */}
      <section className="welcome-section">
        <div>
          <div className="welcome-icon">☀</div>

          <div>
            <h1>Good Morning, Admin</h1>
            <p>Here's what's happening in your city today.</p>
          </div>
        </div>

        <div className="weather">
          <div>
            <strong>{formattedDashboardDate}</strong>
            <span>{formattedDashboardTime}</span>
          </div>

          <div className="weather-divider" />

          <div className="weather-icon">☀</div>

          <div>
            <strong>28°C</strong>
            <span>Clear</span>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className={`stat-card ${stat.type}`} key={stat.title}>
              <div className="stat-icon">
                <Icon size={22} />
              </div>

              <div className="stat-content">
                <span>{stat.title}</span>
                <strong>{stat.value}</strong>

                <small>
                  {stat.up ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}

                  {stat.change} {stat.text}
                </small>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Row */}
      <section className="dashboard-grid">

        {/* Map */}
        <div className="panel map-panel">
          <div className="panel-header">
            <div>
              <h2>City Overview</h2>
              <p>Live city operations map</p>
            </div>

            <Link to="/gis" className="view-button">
              View Full Map
            </Link>
          </div>

          <div className="dashboard-real-map">
            <MapContainer
              center={[31.5204, 74.3587]}
              zoom={12}
              scrollWheelZoom={true}
              className="dashboard-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <DashboardMapBounds
                points={[...departments, ...assets, ...mapEmergencies]}
              />

              {departments.map((department) => {
                if (
                  department.latitude === null ||
                  department.longitude === null
                ) {
                  return null;
                }

                return (
                  <Marker
                    key={`department-${department.id}`}
                    position={[
                      Number(department.latitude),
                      Number(department.longitude),
                    ]}
                    icon={dashboardDepartmentIcon}
                  >
                    <Popup>
                      <strong>{department.name}</strong>
                      <br />
                      {department.category || "Department"}
                      <br />
                      Officer: {department.officer || "N/A"}
                    </Popup>
                  </Marker>
                );
              })}

              {assets.map((asset) => {
                if (asset.latitude === null || asset.longitude === null) {
                  return null;
                }

                return (
                  <Marker
                    key={`asset-${asset.id}`}
                    position={[Number(asset.latitude), Number(asset.longitude)]}
                    icon={dashboardAssetIcon}
                  >
                    <Popup>
                      <strong>{asset.name}</strong>
                      <br />
                      Department: {asset.department || "N/A"}
                      <br />
                      Status: {asset.status}
                    </Popup>
                  </Marker>
                );
              })}

              {mapEmergencies.map((emergency) => {
                if (
                  emergency.latitude === null ||
                  emergency.longitude === null
                ) {
                  return null;
                }

                return (
                  <Marker
                    key={`emergency-${emergency.id}`}
                    position={[
                      Number(emergency.latitude),
                      Number(emergency.longitude),
                    ]}
                    icon={dashboardEmergencyIcon}
                  >
                    <Popup>
                      <strong>{emergency.type}</strong>
                      <br />
                      Location: {emergency.location}
                      <br />
                      Priority: {emergency.priority}
                      <br />
                      Status: {emergency.status}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Activities */}
        <div className="panel activities-panel">
          <div className="panel-header">
            <h2>Recent Activities</h2>
            <Link to="/complaints" className="view-button">
              View All
            </Link>
          </div>

          <div className="activity-list">
            {activities.map((activity) => {
              const isEmergency = activity.activity_type === "emergency";
              const Icon = isEmergency
                ? AlertTriangle
                : MessageSquareWarning;
              const activityType = isEmergency ? "orange" : "red";

              return (
                <div
                  className="activity"
                  key={`${activity.activity_type}-${activity.id}`}
                >
                  <div className={`activity-icon ${activityType}`}>
                    <Icon size={17} />
                  </div>

                  <div className="activity-info">
                    <strong>
                      {isEmergency
                        ? "Emergency alert"
                        : "New complaint submitted"}
                    </strong>
                    <span>{activity.description}</span>
                  </div>

                  <time>
                    {new Date(activity.created_at).toLocaleString()}
                  </time>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency */}
        <div className="panel emergency-panel">
          <div className="panel-header">
            <h2>Emergency Alerts</h2>
            <Link to="/emergency" className="view-button">
              View All
            </Link>
          </div>

          <div className="emergency-list">
            {emergencies.map((item) => {
              let Icon = AlertTriangle;

              if (item.type.toLowerCase().includes("fire")) {
                Icon = Flame;
              } else if (item.type.toLowerCase().includes("medical")) {
                Icon = Hospital;
              } else if (item.type.toLowerCase().includes("road")) {
                Icon = Car;
              } else if (item.type.toLowerCase().includes("flood")) {
                Icon = Droplets;
              }

              return (
                <div className="emergency-item" key={item.id}>
                  <div className="emergency-icon">
                    <Icon size={19} />
                  </div>

                  <div>
                    <strong>{item.type}</strong>
                    <span>{item.location}</span>
                  </div>

                  <time>
                    {new Date(item.reported_at).toLocaleString()}
                  </time>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Row */}
      <section className="bottom-grid">

        {/* Services */}
        <div className="panel">
          <div className="panel-header">
            <h2>Service Requests</h2>
            <button className="view-button">View All</button>
          </div>

          <div className="service-list">
            {serviceRequests.map((service, index) => {
              const icons = [
                Users,
                FileText,
                CreditCard,
                Droplets,
                Building2,
                Car,
              ];

              const Icon = icons[index % icons.length];

              return (
                <div className="service-item" key={service.id}>
                  <div className="service-icon">
                    <Icon size={17} />
                  </div>

                  <span>{service.service_name}</span>

                  <strong>
                    {Number(service.total_requests).toLocaleString()}
                  </strong>

                  <ArrowUpRight size={15} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Complaints */}
        <div className="panel complaints-chart">
          <div className="panel-header">
            <div>
              <h2>Complaint Categories</h2>
              <p>Current month</p>
            </div>

            <Link to="/complaints" className="view-button">
              View All
            </Link>
          </div>

          <div className="chart-area">
            <div className="donut">
              <div>
                <strong>{totalCategoryComplaints}</strong>
                <span>Total Complaints</span>
              </div>
            </div>

            <div className="chart-legend">
              {orderedComplaintCategories.map((item, index) => (
                <div key={item.category}>
                  <i className={`legend-color legend-${index}`} />

                  {item.category}

                  <strong>{item.percentage}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="panel">
          <div className="panel-header">
            <h2>Department Performance</h2>
            <Link to="/departments" className="view-button">
              View All
            </Link>
          </div>

          <div className="department-list">
            {departmentPerformance.map((department) => (
              <div className="department" key={department.id}>
                <div className="department-top">
                  <span>{department.name}</span>
                  <strong>{department.performance}%</strong>
                </div>

                <div className="progress">
                  <div
                    style={{
                      width: `${department.performance}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <div className="panel-header">
          <h2>Quick Actions</h2>
        </div>

        <div className="quick-grid">
          <Link to="/complaints" className="quick red-action">
            <MessageSquareWarning size={20} />
            Submit Complaint
          </Link>

          <button className="quick blue-action">
            <FileText size={20} />
            Request Service
          </button>

          <button className="quick green-action">
            <CalendarDays size={20} />
            Book Appointment
          </button>

          <Link to="/complaints" className="quick purple-action">
            <Search size={20} />
            Track Application
          </Link>

          <button className="quick orange-action">
            <CreditCard size={20} />
            Make Payment
          </button>

          <Link to="/gis" className="quick cyan-action">
            <MapPin size={20} />
            View City Map
          </Link>
        </div>
      </section>

      {/* Footer Banner */}
      <div className="city-banner">
        <div>
          <strong>A Smarter, Safer, Healthier City</strong>
          <span>
            Integrated services &nbsp; • &nbsp;
            Better governance &nbsp; • &nbsp;
            Happier citizens
          </span>
        </div>

        <Link to="/gis" className="city-map-link">
          Explore City Map →
        </Link>
      </div>

    </div>
  );
}

export default Dashboard;