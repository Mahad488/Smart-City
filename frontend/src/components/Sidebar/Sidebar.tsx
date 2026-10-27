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
    const updateNotificationCount = () => {
      try {
        const savedNotifications = localStorage.getItem(
          "smartcity_notifications"
        );

        if (!savedNotifications) {
          setNotificationCount(0);
          return;
        }

        const parsed = JSON.parse(savedNotifications);
        setNotificationCount(
          Array.isArray(parsed) ? parsed.length : 0
        );
      } catch {
        setNotificationCount(0);
      }
    };

    updateNotificationCount();
    window.addEventListener(
      "smartcity-notifications-updated",
      updateNotificationCount
    );

    return () => {
      window.removeEventListener(
        "smartcity-notifications-updated",
        updateNotificationCount
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

              {item.label === "Notifications" && (
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