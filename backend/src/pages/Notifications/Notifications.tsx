import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquareWarning,
  Building2,
  Clock3,
  Trash2,
  Check,
  RefreshCw,
} from "lucide-react";
import "./Notification.css";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean | number;
  created_at: string;
}

const API_BASE = "https://smart-city-production-c48b.up.railway.app/api/notifications";

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const Notifications: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const response = await fetch(API_BASE);

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();

    // Auto-refresh notifications every 10 seconds (matching navbar Header)
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 10000);

    const handleUpdate = () => {
      void fetchNotifications();
    };

    window.addEventListener("smartcity-notifications-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("smartcity-notifications-updated", handleUpdate);
    };
  }, [fetchNotifications]);

  const isRead = (notification: NotificationItem) => Boolean(notification.is_read);

  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const notificationStats = {
    total: notifications.length,
    unread: unreadCount,
    emergency: notifications.filter(
      (n) => n.type?.toLowerCase() === "emergency"
    ).length,
    read: notifications.filter((n) => isRead(n)).length,
  };

  const filteredNotifications =
    activeFilter === "Unread"
      ? notifications.filter((n) => !isRead(n))
      : activeFilter === "Emergency"
      ? notifications.filter(
          (n) => n.type?.toLowerCase() === "emergency"
        )
      : activeFilter === "Complaint"
      ? notifications.filter(
          (n) => n.type?.toLowerCase() === "complaint"
        )
      : notifications;

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_BASE}/${id}/read`, {
        method: "PUT",
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      window.dispatchEvent(new Event("smartcity-notifications-updated"));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadItems = notifications.filter((n) => !isRead(n));
    if (unreadItems.length === 0) return;

    try {
      try {
        const res = await fetch(`${API_BASE}/read-all`, { method: "PUT" });
        if (!res.ok) throw new Error("Bulk read not supported");
      } catch {
        await Promise.all(
          unreadItems.map((n) =>
            fetch(`${API_BASE}/${n.id}/read`, { method: "PUT" })
          )
        );
      }

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );

      window.dispatchEvent(new Event("smartcity-notifications-updated"));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event("smartcity-notifications-updated"));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;

    try {
      try {
        const res = await fetch(API_BASE, { method: "DELETE" });
        if (!res.ok) throw new Error("Bulk delete not supported");
      } catch {
        await Promise.all(
          notifications.map((n) =>
            fetch(`${API_BASE}/${n.id}`, { method: "DELETE" })
          )
        );
      }

      setNotifications([]);
      window.dispatchEvent(new Event("smartcity-notifications-updated"));
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const getIcon = (type?: string) => {
    const lower = type?.toLowerCase() || "";
    if (lower === "emergency") {
      return <AlertTriangle size={18} />;
    }
    if (lower === "complaint") {
      return <MessageSquareWarning size={18} />;
    }
    if (lower === "department") {
      return <Building2 size={18} />;
    }
    return <CheckCircle2 size={18} />;
  };

  const getIconClass = (type?: string) => {
    const lower = type?.toLowerCase() || "";
    if (lower === "emergency") return "Emergency";
    if (lower === "complaint") return "Complaint";
    if (lower === "department") return "Department";
    return "System";
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with city operations and activities</p>
        </div>

        <div className="notification-header-actions">
          <button
            onClick={() => void fetchNotifications(true)}
            title="Refresh"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "spin-icon" : ""}
            />
            Refresh
          </button>

          <button onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check size={14} />
            Mark all as read
          </button>

          <button onClick={clearAll} disabled={notifications.length === 0}>
            <Trash2 size={14} />
            Clear all
          </button>
        </div>
      </div>

      <div className="notification-stats">
        <div className="notification-stat">
          <div className="notification-stat-icon blue">
            <Bell size={18} />
          </div>

          <div>
            <span>Total Notifications</span>
            <strong>{notificationStats.total}</strong>
          </div>
        </div>

        <div className="notification-stat">
          <div className="notification-stat-icon orange">
            <Clock3 size={18} />
          </div>

          <div>
            <span>Unread</span>
            <strong>{notificationStats.unread}</strong>
          </div>
        </div>

        <div className="notification-stat">
          <div className="notification-stat-icon red">
            <AlertTriangle size={18} />
          </div>

          <div>
            <span>Emergency Alerts</span>
            <strong>{notificationStats.emergency}</strong>
          </div>
        </div>

        <div className="notification-stat">
          <div className="notification-stat-icon green">
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span>Read</span>
            <strong>{notificationStats.read}</strong>
          </div>
        </div>
      </div>

      <div className="notification-toolbar">
        <div className="notification-filters">
          <button
            className={activeFilter === "All" ? "active" : ""}
            onClick={() => setActiveFilter("All")}
          >
            All
            <span>{notificationStats.total}</span>
          </button>

          <button
            className={activeFilter === "Unread" ? "active" : ""}
            onClick={() => setActiveFilter("Unread")}
          >
            Unread
            <span>{notificationStats.unread}</span>
          </button>

          <button
            className={activeFilter === "Emergency" ? "active" : ""}
            onClick={() => setActiveFilter("Emergency")}
          >
            Emergencies
            <span>{notificationStats.emergency}</span>
          </button>

          <button
            className={activeFilter === "Complaint" ? "active" : ""}
            onClick={() => setActiveFilter("Complaint")}
          >
            Complaints
            <span>
              {
                notifications.filter(
                  (n) => n.type?.toLowerCase() === "complaint"
                ).length
              }
            </span>
          </button>
        </div>
      </div>

      <div className="notifications-card">
        <div className="notifications-card-header">
          <div>
            <h3>Recent Notifications</h3>
            <p>Latest updates from the city operations platform</p>
          </div>

          <Bell size={18} />
        </div>

        <div className="notifications-list">
          {loading ? (
            <div className="no-notifications">
              <Clock3 size={28} />
              <strong>Loading notifications...</strong>
              <span>Fetching latest reports from server</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <CheckCircle2 size={28} />
              <strong>No notifications</strong>
              <span>You are all caught up.</span>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const read = isRead(notification);

              return (
                <div
                  className={`notification-item ${read ? "read" : "unread"}`}
                  key={notification.id}
                >
                  <div
                    className={`notification-icon ${getIconClass(
                      notification.type
                    )}`}
                  >
                    {getIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <strong>{notification.title}</strong>

                      {!read && <span className="unread-dot"></span>}
                    </div>

                    <p>{notification.message}</p>

                    <span className="notification-time">
                      <Clock3 size={11} />
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>

                  <div className="notification-actions">
                    {!read && (
                      <button
                        title="Mark as read"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check size={14} />
                      </button>
                    )}

                    <button
                      title="Delete"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;