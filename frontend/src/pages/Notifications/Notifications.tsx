import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquareWarning,
  Building2,
  Clock3,
  Trash2,
  Check,
} from "lucide-react";
import "./Notification.css";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "Complaint" | "Emergency" | "Department" | "System";
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Emergency Alert",
    message:
      "Road accident reported in Blue Area. Emergency team has been dispatched.",
    type: "Emergency",
    time: "10 mins ago",
    read: false,
  },
  {
    id: 2,
    title: "Complaint Resolved",
    message:
      "Complaint CMP-1024 regarding street lights has been resolved.",
    type: "Complaint",
    time: "25 mins ago",
    read: false,
  },
  {
    id: 3,
    title: "Department Update",
    message:
      "Waste Management department completed today's collection schedule.",
    type: "Department",
    time: "1 hour ago",
    read: true,
  },
  {
    id: 4,
    title: "System Update",
    message:
      "City Operations dashboard data has been successfully synchronized.",
    type: "System",
    time: "2 hours ago",
    read: true,
  },
  {
    id: 5,
    title: "New Complaint",
    message: "A new citizen complaint has been submitted for Sector G-9.",
    type: "Complaint",
    time: "3 hours ago",
    read: false,
  },
  {
    id: 6,
    title: "Emergency Resolved",
    message: "Water pipeline emergency in Sector I-9 has been resolved.",
    type: "Emergency",
    time: "4 hours ago",
    read: true,
  },
];

const Notifications: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const savedNotifications = localStorage.getItem(
        "smartcity_notifications"
      );

      if (!savedNotifications) {
        return initialNotifications;
      }

      const parsed = JSON.parse(savedNotifications) as Notification[];
      return Array.isArray(parsed) ? parsed : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "smartcity_notifications",
      JSON.stringify(notifications)
    );
    window.dispatchEvent(new Event("smartcity-notifications-updated"));
  }, [notifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const notificationStats = {
    total: notifications.length,
    unread: unreadCount,
    emergency: notifications.filter(
      (notification) => notification.type === "Emergency"
    ).length,
    read: notifications.filter((notification) => notification.read)
      .length,
  };

  const filteredNotifications =
    activeFilter === "Unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "Emergency":
        return <AlertTriangle size={18} />;

      case "Complaint":
        return <MessageSquareWarning size={18} />;

      case "Department":
        return <Building2 size={18} />;

      default:
        return <CheckCircle2 size={18} />;
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with city operations and activities</p>
        </div>

        <div className="notification-header-actions">
          <button onClick={markAllAsRead}>
            <Check size={14} />
            Mark all as read
          </button>

          <button onClick={clearAll}>
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
          {filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <CheckCircle2 size={28} />
              <strong>No notifications</strong>
              <span>You are all caught up.</span>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                className={`notification-item ${
                  notification.read ? "read" : "unread"
                }`}
                key={notification.id}
              >
                <div className={`notification-icon ${notification.type}`}>
                  {getIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <strong>{notification.title}</strong>

                    {!notification.read && (
                      <span className="unread-dot"></span>
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <span className="notification-time">
                    <Clock3 size={11} />
                    {notification.time}
                  </span>
                </div>

                <div className="notification-actions">
                  {!notification.read && (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;