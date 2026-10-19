import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquareWarning,
  Boxes,
  Siren,
  Map,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import "./Sidebar.css";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Citizen Portal",
    icon: Users,
    path: "/citizens",
  },
  {
    label: "Departments",
    icon: Building2,
    path: "/departments",
  },
  {
    label: "Complaints",
    icon: MessageSquareWarning,
    path: "/complaints",
  },
  {
    label: "Assets",
    icon: Boxes,
    path: "/assets",
  },
  {
    label: "Emergency",
    icon: Siren,
    path: "/emergency",
  },
  {
    label: "GIS & City Map",
    icon: Map,
    path: "/gis",
  },
  {
    label: "Analytics & Reports",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

function Sidebar() {
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch(
          "https://smart-city-production-c48b.up.railway.app/api/notifications"
        );

        if (!response.ok) return;

        const data = await response.json();
        if (Array.isArray(data)) {
          const unread = data.filter(
            (n: { is_read?: boolean | number }) => !n.is_read
          ).length;
          setNotificationCount(unread);
        }
      } catch (error) {
        console.error("Error fetching notification count for sidebar:", error);
      }
    };

    void fetchNotificationCount();

    // Auto-refresh sidebar count every 10 seconds
    const interval = setInterval(fetchNotificationCount, 10000);

    const handleUpdate = () => {
      void fetchNotificationCount();
    };

    window.addEventListener(
      "smartcity-notifications-updated",
      handleUpdate
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "smartcity-notifications-updated",
        handleUpdate
      );
    };
  }, []);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Building2 size={25} />
        </div>

        <div>
          <h2>SmartCity</h2>
          <span>Operations Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/dashboard" && location.pathname === "/");

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{item.label}</span>

              {item.label === "Notifications" && notificationCount > 0 && (
                <span className="notification-badge">
                  {notificationCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div className="city-illustration">
          <span>▂</span>
          <span>▅</span>
          <span>▇</span>
          <span>▆</span>
          <span>█</span>
          <span>▅</span>
        </div>

        <h3>Smarter City</h3>
        <p>Better Tomorrow</p>

        <small>City Operations Platform</small>
        <small>v1.0.0</small>
      </div>
    </aside>
  );
}

export default Sidebar;