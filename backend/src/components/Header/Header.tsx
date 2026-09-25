import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Bell,
  Check,
  Trash2,
  X,
} from "lucide-react";
import "./Header.css";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "Complaint" | "Emergency" | "Department" | "System";
  is_read: boolean;
  created_at: string;
}

function Header() {
  const [admin] = useState<{
    id?: number;
    name?: string;
    email?: string;
    status?: string;
  } | null>(() => {
    try {
      const savedAdmin = localStorage.getItem("admin");
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch (error) {
      console.error("Invalid admin data:", error);
      localStorage.removeItem("admin");
      return null;
    }
  });
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        "https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/notifications"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    const refreshNotifications = () => {
      void fetchNotifications();
    };

    refreshNotifications();

    // Refresh notifications every 10 seconds
    const interval = setInterval(refreshNotifications, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  // Mark as read
  const markAsRead = async (id: number) => {
    try {
      await fetch(
        `https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/notifications/${id}/read`,
        {
          method: "PUT",
        }
      );

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: number) => {
    try {
      await fetch(
        `https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/notifications/${id}`,
        {
          method: "DELETE",
        }
      );

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <header className="header">
      <div className="header-search">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search for citizens, complaints, assets or services..."
        />
      </div>

      <div className="header-right">

        {/* Notification */}
        <div className="notification-wrapper">
          <button
            className="notification-button"
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
          >
            <Bell size={21} />

            {unreadCount > 0 && (
              <span>{unreadCount}</span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="notification-dropdown">

              <div className="notification-header">
                <strong>Notifications</strong>

                <button
                  onClick={() => setShowNotifications(false)}
                  className="notification-close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="notification-list">

                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${
                        !notification.is_read
                          ? "unread"
                          : ""
                      }`}
                    >
                      <div className="notification-content">

                        <strong>
                          {notification.title}
                        </strong>

                        <p>
                          {notification.message}
                        </p>

                        <small>
                          {notification.type} •{" "}
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </small>

                      </div>

                      <div className="notification-actions">

                        {!notification.is_read && (
                          <button
                            title="Mark as read"
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                          >
                            <Check size={15} />
                          </button>
                        )}

                        <button
                          title="Delete"
                          onClick={() =>
                            deleteNotification(notification.id)
                          }
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>
                    </div>
                  ))
                )}

              </div>
            </div>
          )}
        </div>

        <div className="header-divider" />

        <div className="admin-profile-wrapper">
          <button
            type="button"
            className="admin-profile-btn"
            onClick={() => setShowAdminMenu((previous) => !previous)}
          >
            <div className="admin-avatar">
              {(admin?.name || "Admin").charAt(0).toUpperCase()}
            </div>

            <div className="admin-profile-info">
              <strong>{admin?.name || "Admin User"}</strong>
              <span>City Administrator</span>
            </div>

            <span className="admin-chevron">
              {showAdminMenu ? "▲" : "▼"}
            </span>
          </button>

          {showAdminMenu && (
            <div className="admin-dropdown">
              <div className="admin-dropdown-header">
                <strong>{admin?.name || "Admin User"}</strong>
                <span>{admin?.email || "admin@smartcity.com"}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAdminMenu(false);
                  window.location.href = "/settings";
                }}
              >
                Settings
              </button>

              <button
                type="button"
                className="admin-logout"
                onClick={() => {
                  localStorage.removeItem("admin");
                  window.location.href = "/admin-login";
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Header;