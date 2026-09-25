import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Save,
  Mail,
  Lock,
  Smartphone,
  Monitor,
} from "lucide-react";
import { useToast } from "../../components/Toast";
import "./Settings.css";

interface SettingsApiResponse {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  admin?: Record<string, unknown>;
  email_notifications?: boolean;
  emergency_alerts?: boolean;
  complaint_updates?: boolean;
  system_updates?: boolean;
  language?: string;
  timezone?: string;
  date_format?: string;
  dashboard_refresh?: string;
  two_factor_enabled?: boolean;
}

const readJsonResponse = async (
  response: Response
): Promise<SettingsApiResponse> => {
  const responseText = await response.text();

  try {
    return responseText
      ? (JSON.parse(responseText) as SettingsApiResponse)
      : {};
  } catch {
    throw new Error(
      response.ok
        ? "Server returned an invalid response."
        : `Settings API error (${response.status}). Please restart the backend server.`
    );
  }
};

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [adminId, setAdminId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Pakistan Standard Time");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [dashboardRefresh, setDashboardRefresh] = useState("5 Minutes");

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const systemRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (
    tab: string,
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    setActiveTab(tab);

    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [complaintUpdates, setComplaintUpdates] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedAdmin = localStorage.getItem("admin");
        const parsedAdmin = savedAdmin ? JSON.parse(savedAdmin) : null;
        const savedAdminId = Number(parsedAdmin?.id);

        if (!savedAdminId) {
          throw new Error("Admin session not found. Please login again.");
        }

        setAdminId(savedAdminId);

        const [profileResponse, preferencesResponse, settingsResponse] =
          await Promise.all([
            fetch(`https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/admin/${savedAdminId}/profile`),
            fetch("https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/notification-preferences"),
            fetch(`https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/admin/${savedAdminId}/settings`),
          ]);

        const profile = await readJsonResponse(profileResponse);
        const preferences = await readJsonResponse(preferencesResponse);
        const adminSettings = await readJsonResponse(settingsResponse);

        if (!profileResponse.ok) {
          throw new Error(profile.message || "Unable to load admin profile");
        }

        if (!preferencesResponse.ok || !settingsResponse.ok) {
          throw new Error("Unable to load settings");
        }

        const nameParts = String(profile.name || "").trim().split(/\s+/);
        setFirstName(nameParts.shift() || "");
        setLastName(nameParts.join(" "));
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        setEmailNotifications(Boolean(preferences.email_notifications));
        setEmergencyAlerts(Boolean(preferences.emergency_alerts));
        setComplaintUpdates(Boolean(preferences.complaint_updates));
        setSystemUpdates(Boolean(preferences.system_updates));
        setLanguage(adminSettings.language || "English");
        setTimezone(adminSettings.timezone || "Pakistan Standard Time");
        setDateFormat(adminSettings.date_format || "DD/MM/YYYY");
        setDashboardRefresh(adminSettings.dashboard_refresh || "5 Minutes");
        setTwoFactorEnabled(Boolean(adminSettings.two_factor_enabled));
      } catch (error) {
        console.error("Error loading settings:", error);
        showToast(
          error instanceof Error ? error.message : "Unable to load settings",
          "error"
        );
      }
    };

    void loadSettings();
  }, [showToast]);

  const handleSave = async () => {
    if (!adminId) {
      showToast("Admin session not found. Please login again.", "error");
      return;
    }

    try {
      setSaving(true);
      const profileName = `${firstName} ${lastName}`.trim();
      const [profileResponse, preferencesResponse, settingsResponse] =
        await Promise.all([
          fetch(`https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/admin/${adminId}/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: profileName, email, phone }),
          }),
          fetch("https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/notification-preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email_notifications: emailNotifications,
              emergency_alerts: emergencyAlerts,
              complaint_updates: complaintUpdates,
              system_updates: systemUpdates,
            }),
          }),
          fetch(`https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/admin/${adminId}/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language,
              timezone,
              date_format: dateFormat,
              dashboard_refresh: dashboardRefresh,
              two_factor_enabled: twoFactorEnabled,
            }),
          }),
        ]);
      const profileData = await readJsonResponse(profileResponse);

      if (!profileResponse.ok || !preferencesResponse.ok || !settingsResponse.ok) {
        throw new Error(profileData.message || "Failed to save settings");
      }

      if (profileData.admin) {
        const savedAdmin = localStorage.getItem("admin");
        const currentAdmin = savedAdmin ? JSON.parse(savedAdmin) : {};
        localStorage.setItem(
          "admin",
          JSON.stringify({ ...currentAdmin, ...profileData.admin })
        );
      }

      setSaved(true);
      showToast("Settings saved successfully.", "success");

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      showToast(
        error instanceof Error ? error.message : "Unable to save settings",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminId) {
      showToast("Admin session not found. Please login again.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    try {
      const response = await fetch(
        `https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/admin/${adminId}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      showToast("Password changed successfully.", "success");
    } catch (error) {
      console.error("Error changing password:", error);
      showToast(
        error instanceof Error ? error.message : "Unable to change password",
        "error"
      );
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}

      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and system preferences</p>
        </div>

        <button
          className="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={15} />
          {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
        </button>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}

        <div className="settings-menu">
          <button
            className={activeTab === "Profile" ? "active" : ""}
            onClick={() => handleTabClick("Profile", profileRef)}
          >
            <User size={16} />
            Profile
          </button>

          <button
            className={activeTab === "Notifications" ? "active" : ""}
            onClick={() =>
              handleTabClick("Notifications", notificationsRef)
            }
          >
            <Bell size={16} />
            Notifications
          </button>

          <button
            className={activeTab === "Security" ? "active" : ""}
            onClick={() => handleTabClick("Security", securityRef)}
          >
            <Shield size={16} />
            Security
          </button>

          <button
            className={
              activeTab === "System Preferences" ? "active" : ""
            }
            onClick={() =>
              handleTabClick("System Preferences", systemRef)
            }
          >
            <SettingsIcon size={16} />
            System Preferences
          </button>
        </div>

        {/* Content */}

        <div className="settings-content">
          {/* Profile */}

          <div
            className="settings-card"
            ref={profileRef}
          >
            <div className="settings-card-header">
              <div>
                <h3>Profile Information</h3>
                <p>Manage your administrator account information</p>
              </div>

              <User size={18} />
            </div>

            <div className="profile-section">
              <div className="profile-avatar">
                {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "AD"}
              </div>

              <div>
                <strong>{`${firstName} ${lastName}`.trim() || "Administrator"}</strong>
                <span>Administrator</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
              </div>

              <div className="form-group">
                <label>Email Address</label>

                <div className="input-icon">
                  <Mail size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>

                <div className="input-icon">
                  <Smartphone size={14} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}

          <div
            className="settings-card"
            ref={notificationsRef}
          >
            <div className="settings-card-header">
              <div>
                <h3>Notification Preferences</h3>
                <p>Choose which notifications you want to receive</p>
              </div>

              <Bell size={18} />
            </div>

            <div className="preference-list">
              <div className="preference-item">
                <div>
                  <strong>Email Notifications</strong>
                  <span>Receive important updates through email</span>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) =>
                      setEmailNotifications(e.target.checked)
                    }
                  />
                  <span></span>
                </label>
              </div>

              <div className="preference-item">
                <div>
                  <strong>Emergency Alerts</strong>
                  <span>Receive alerts about active emergencies</span>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={emergencyAlerts}
                    onChange={(e) =>
                      setEmergencyAlerts(e.target.checked)
                    }
                  />
                  <span></span>
                </label>
              </div>

              <div className="preference-item">
                <div>
                  <strong>Complaint Updates</strong>
                  <span>Receive updates about citizen complaints</span>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={complaintUpdates}
                    onChange={(e) =>
                      setComplaintUpdates(e.target.checked)
                    }
                  />
                  <span></span>
                </label>
              </div>

              <div className="preference-item">
                <div>
                  <strong>System Updates</strong>
                  <span>Receive system maintenance notifications</span>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={systemUpdates}
                    onChange={(e) =>
                      setSystemUpdates(e.target.checked)
                    }
                  />
                  <span></span>
                </label>
              </div>
            </div>
          </div>

          {/* Security */}

          <div
            className="settings-card"
            ref={securityRef}
          >
            <div className="settings-card-header">
              <div>
                <h3>Security</h3>
                <p>Manage your account security settings</p>
              </div>

              <Shield size={18} />
            </div>

            <div className="security-list">
              <div className="security-item">
                <div className="security-icon">
                  <Lock size={16} />
                </div>

                <div>
                  <strong>Password</strong>
                  <span>Last changed 30 days ago</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordForm((previous) => !previous)}
                >
                  {showPasswordForm ? "Cancel" : "Change Password"}
                </button>
              </div>

              {showPasswordForm && (
                <form
                  className="password-form"
                  onSubmit={handleChangePassword}
                >
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="New password (8+ characters)"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <button type="submit">Update Password</button>
                </form>
              )}

              <div className="security-item">
                <div className="security-icon">
                  <Smartphone size={16} />
                </div>

                <div>
                  <strong>Two-Factor Authentication</strong>
                  <span>Add an extra layer of account protection</span>
                </div>

                <button
                  type="button"
                  onClick={() => setTwoFactorEnabled((previous) => !previous)}
                >
                  {twoFactorEnabled ? "Enabled" : "Enable"}
                </button>
              </div>
            </div>
          </div>

          {/* System Preferences */}

          <div
            className="settings-card"
            ref={systemRef}
          >
            <div className="settings-card-header">
              <div>
                <h3>System Preferences</h3>
                <p>Configure dashboard display preferences</p>
              </div>

              <Monitor size={18} />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Language</label>

                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option>English</option>
                  <option>Urdu</option>
                </select>
              </div>

              <div className="form-group">
                <label>Timezone</label>

                <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                  <option>Pakistan Standard Time</option>
                  <option>UTC</option>
                  <option>Gulf Standard Time</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date Format</label>

                <select value={dateFormat} onChange={(event) => setDateFormat(event.target.value)}>
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dashboard Refresh</label>

                <select value={dashboardRefresh} onChange={(event) => setDashboardRefresh(event.target.value)}>
                  <option>1 Minute</option>
                  <option>5 Minutes</option>
                  <option>10 Minutes</option>
                  <option>30 Minutes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;