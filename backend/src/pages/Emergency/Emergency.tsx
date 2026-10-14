import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Siren,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Search,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Users,
  Flame,
  ArrowRight,
  Mail,
} from "lucide-react";

import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../components/Toast";
import "./Emergency.css";

interface Emergency {
  id: number;
  citizen_id?: string | number | null;
  citizen_name?: string | null;
  citizen_email?: string | null;
  citizen_phone?: string | null;
  type: string;
  location: string;
  team: string | null;
  priority: "Critical" | "High" | "Medium";
  status: "Active" | "Responding" | "Resolved";
  reported_at: string;
}

const COMMON_EMERGENCY_TYPES = [
  "Fire Outbreak",
  "Medical Emergency",
  "Traffic Accident",
  "Building Hazard",
  "Gas Leak",
  "Power Outage / Transformer Fire",
  "Flash Flood / Drainage Overflow",
  "Other",
];

const SUGGESTED_TEAMS = [
  "Emergency Response Team",
  "Fire Brigade Squad #1",
  "City Ambulance Unit A",
  "Rescue 1122 Dispatch",
  "Traffic Police Unit",
  "Hazard Control Team",
];

const Emergency: React.FC = () => {
  const { showToast } = useToast();

  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [editingEmergency, setEditingEmergency] = useState<Emergency | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Emergency | null>(null);

  const [saving, setSaving] = useState(false);
  const [quickUpdatingId, setQuickUpdatingId] = useState<number | null>(null);

  const [newEmergency, setNewEmergency] = useState({
    type: "",
    location: "",
    team: "Emergency Response Team",
    priority: "High" as "Critical" | "High" | "Medium",
    status: "Active" as "Active" | "Responding" | "Resolved",
  });

  const API_BASE = "https://smart-city-production-c48b.up.railway.app/api/emergencies";

  // ================================
  // FETCH EMERGENCIES
  // ================================
  const fetchEmergencies = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await fetch(`${API_BASE}/`);

      if (!response.ok) {
        throw new Error("Failed to load emergencies");
      }

      const data = await response.json();
      setEmergencies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch emergencies error:", err);
      setError("Unable to connect to server to fetch emergencies.");
      showToast("Failed to load emergencies", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchEmergencies();
  }, [fetchEmergencies]);

  // ================================
  // FORMATTERS
  // ================================
  const formatEmergencyId = (id: number) => {
    return `EMG-${String(id).padStart(4, "0")}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ================================
  // METRICS
  // ================================
  const totalCount = emergencies.length;
  const activeCount = emergencies.filter((e) => e.status === "Active").length;
  const respondingCount = emergencies.filter((e) => e.status === "Responding").length;
  const resolvedCount = emergencies.filter((e) => e.status === "Resolved").length;
  const criticalCount = emergencies.filter((e) => e.priority === "Critical").length;

  // ================================
  // FILTERING
  // ================================
  const filteredEmergencies = useMemo(() => {
    return emergencies.filter((emergency) => {
      const q = search.toLowerCase().trim();
      const eId = formatEmergencyId(emergency.id).toLowerCase();

      const matchesSearch =
        !q ||
        eId.includes(q) ||
        emergency.type?.toLowerCase().includes(q) ||
        emergency.location?.toLowerCase().includes(q) ||
        emergency.team?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Critical"
          ? emergency.priority === "Critical"
          : emergency.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All Priority" || emergency.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [emergencies, search, statusFilter, priorityFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmergencies.length / itemsPerPage) || 1;
  const paginatedEmergencies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmergencies.slice(start, start + itemsPerPage);
  }, [filteredEmergencies, currentPage, itemsPerPage]);

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "All" || priorityFilter !== "All Priority";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All Priority");
  };

  // ================================
  // QUICK STATUS UPDATE
  // ================================
  const handleQuickStatusChange = async (
    emergency: Emergency,
    nextStatus: "Active" | "Responding" | "Resolved"
  ) => {
    if (emergency.status === nextStatus) return;

    try {
      setQuickUpdatingId(emergency.id);

      const response = await fetch(`${API_BASE}/${emergency.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: emergency.type,
          location: emergency.location,
          team: emergency.team,
          priority: emergency.priority,
          status: nextStatus,
          citizen_email: emergency.citizen_email,
          citizen_name: emergency.citizen_name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update emergency status");
      }

      const resData = await response.json().catch(() => ({}));

      setEmergencies((prev) =>
        prev.map((item) =>
          item.id === emergency.id ? { ...item, status: nextStatus } : item
        )
      );

      if (selectedEmergency?.id === emergency.id) {
        setSelectedEmergency({ ...selectedEmergency, status: nextStatus });
      }

      if (resData?.emailSent && resData?.recipient) {
        showToast(
          `Incident marked as ${nextStatus}. Email dispatched to ${resData.recipient}`,
          "success"
        );
      } else {
        showToast(`Emergency incident marked as ${nextStatus}`, "success");
      }
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Failed to update status", "error");
    } finally {
      setQuickUpdatingId(null);
    }
  };

  // ================================
  // ADD EMERGENCY
  // ================================
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmergency.type || !newEmergency.location) {
      showToast("Please enter emergency type and location", "error");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmergency),
      });

      if (!response.ok) {
        throw new Error("Failed to report emergency");
      }

      await fetchEmergencies(true);

      setNewEmergency({
        type: "",
        location: "",
        team: "Emergency Response Team",
        priority: "High",
        status: "Active",
      });

      setShowAddModal(false);
      showToast("Emergency incident reported successfully!", "success");
    } catch (err) {
      console.error("Add emergency error:", err);
      showToast("Error reporting emergency", "error");
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // EDIT EMERGENCY
  // ================================
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEmergency) return;

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/${editingEmergency.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingEmergency.type,
          location: editingEmergency.location,
          team: editingEmergency.team,
          priority: editingEmergency.priority,
          status: editingEmergency.status,
          citizen_email: editingEmergency.citizen_email,
          citizen_name: editingEmergency.citizen_name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update emergency");
      }

      const resData = await response.json().catch(() => ({}));

      await fetchEmergencies(true);

      setShowEditModal(false);
      setEditingEmergency(null);

      if (resData?.emailSent && resData?.recipient) {
        showToast(
          `Emergency updated! Incident email dispatched to ${resData.recipient}`,
          "success"
        );
      } else {
        showToast("Emergency details updated!", "success");
      }
    } catch (err) {
      console.error("Edit emergency error:", err);
      showToast("Error updating emergency", "error");
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // DELETE EMERGENCY
  // ================================
  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/${pendingDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete emergency");
      }

      setEmergencies((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);

      if (selectedEmergency?.id === pendingDelete.id) {
        setShowViewModal(false);
        setSelectedEmergency(null);
      }

      showToast("Emergency incident deleted.", "success");
    } catch (err) {
      console.error("Delete emergency error:", err);
      showToast("Failed to delete emergency", "error");
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // LOADING STATE
  // ================================
  if (loading) {
    return (
      <div className="emergency-page">
        <div className="emergency-loading-state">
          <Siren size={40} className="emergency-pulse-icon" />
          <p>Connecting to Emergency Incident Feed...</p>
        </div>
      </div>
    );
  }

  // ================================
  // ERROR STATE
  // ================================
  if (error && emergencies.length === 0) {
    return (
      <div className="emergency-page">
        <div className="emergency-error-state">
          <AlertTriangle size={42} />
          <h2>Emergency Feed Offline</h2>
          <p>{error}</p>
          <button className="emergency-primary-btn" onClick={() => fetchEmergencies()}>
            <RefreshCw size={16} /> Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-page">
      {/* ==================================================
          CRITICAL ALERT BANNER (IF ACTIVE / CRITICAL)
      =================================================== */}
      {(activeCount > 0 || criticalCount > 0) && (
        <div className="emergency-alert-banner">
          <div className="alert-banner-left">
            <span className="alert-pulsing-badge">
              <span className="beacon-ring" />
              <Siren size={18} />
            </span>
            <div>
              <strong>URGENT INCIDENT ALERT:</strong>{" "}
              <span>
                {activeCount} active incident{activeCount === 1 ? "" : "s"} require response dispatch.{" "}
                {criticalCount > 0 && `${criticalCount} marked as CRITICAL priority.`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="alert-filter-shortcut"
            onClick={() => setStatusFilter("Active")}
          >
            Filter Active Incidents <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ==================================================
          PAGE HEADER
      =================================================== */}
      <header className="emergency-header">
        <div className="header-left">
          <div className="header-badge red-badge">
            <span className="live-dot-red" />
            <span>Emergency Operations Center</span>
          </div>
          <h1>Emergency Management</h1>
          <p>Rapid response coordination, team dispatching and incident tracking across the city.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="emergency-secondary-btn"
            onClick={() => fetchEmergencies(true)}
            disabled={refreshing}
            title="Refresh Incidents"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh Feed"}</span>
          </button>

          <button
            type="button"
            className="emergency-primary-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={17} />
            <span>Report Emergency</span>
          </button>
        </div>
      </header>

      {/* ==================================================
          INTERACTIVE STAT CARDS
      =================================================== */}
      <section className="emergency-stats-grid">
        {/* TOTAL */}
        <div
          className={`emg-stat-card card-blue ${statusFilter === "All" ? "active" : ""}`}
          onClick={() => setStatusFilter("All")}
          role="button"
          tabIndex={0}
        >
          <div className="emg-stat-icon">
            <Siren size={22} />
          </div>
          <div className="emg-stat-info">
            <span className="label">Total Incidents</span>
            <strong className="value">{totalCount}</strong>
            <span className="desc">All recorded emergencies</span>
          </div>
        </div>

        {/* ACTIVE */}
        <div
          className={`emg-stat-card card-red ${statusFilter === "Active" ? "active" : ""}`}
          onClick={() => setStatusFilter("Active")}
          role="button"
          tabIndex={0}
        >
          <div className="emg-stat-icon">
            <ShieldAlert size={22} />
          </div>
          <div className="emg-stat-info">
            <div className="label-row">
              <span className="label">Active</span>
              {activeCount > 0 && <span className="emg-pill-red">Needs Response</span>}
            </div>
            <strong className="value">{activeCount}</strong>
            <span className="desc">Awaiting unit assignment</span>
          </div>
        </div>

        {/* RESPONDING */}
        <div
          className={`emg-stat-card card-amber ${statusFilter === "Responding" ? "active" : ""}`}
          onClick={() => setStatusFilter("Responding")}
          role="button"
          tabIndex={0}
        >
          <div className="emg-stat-icon">
            <Clock3 size={22} />
          </div>
          <div className="emg-stat-info">
            <span className="label">Responding</span>
            <strong className="value">{respondingCount}</strong>
            <span className="desc">Units actively dispatched</span>
          </div>
        </div>

        {/* RESOLVED */}
        <div
          className={`emg-stat-card card-emerald ${statusFilter === "Resolved" ? "active" : ""}`}
          onClick={() => setStatusFilter("Resolved")}
          role="button"
          tabIndex={0}
        >
          <div className="emg-stat-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="emg-stat-info">
            <span className="label">Resolved</span>
            <strong className="value">{resolvedCount}</strong>
            <span className="desc">Successfully closed cases</span>
          </div>
        </div>

        {/* CRITICAL */}
        <div
          className={`emg-stat-card card-critical ${statusFilter === "Critical" ? "active" : ""}`}
          onClick={() => setStatusFilter("Critical")}
          role="button"
          tabIndex={0}
        >
          <div className="emg-stat-icon">
            <Flame size={22} />
          </div>
          <div className="emg-stat-info">
            <div className="label-row">
              <span className="label">Critical</span>
              {criticalCount > 0 && <span className="emg-pill-darkred">High Priority</span>}
            </div>
            <strong className="value">{criticalCount}</strong>
            <span className="desc">Maximum urgency</span>
          </div>
        </div>
      </section>

      {/* ==================================================
          MAIN PANEL: TOOLBAR + INCIDENTS TABLE
      =================================================== */}
      <section className="emergency-panel">
        {/* QUICK STATUS TABS */}
        <div className="emg-tabs-bar">
          <div className="emg-tabs">
            <button
              type="button"
              className={`emg-tab ${statusFilter === "All" ? "active" : ""}`}
              onClick={() => setStatusFilter("All")}
            >
              <span>All</span>
              <span className="tab-badge">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`emg-tab tab-red ${statusFilter === "Active" ? "active" : ""}`}
              onClick={() => setStatusFilter("Active")}
            >
              <Siren size={14} />
              <span>Active</span>
              <span className="tab-badge">{activeCount}</span>
            </button>

            <button
              type="button"
              className={`emg-tab tab-amber ${statusFilter === "Responding" ? "active" : ""}`}
              onClick={() => setStatusFilter("Responding")}
            >
              <Clock3 size={14} />
              <span>Responding</span>
              <span className="tab-badge">{respondingCount}</span>
            </button>

            <button
              type="button"
              className={`emg-tab tab-emerald ${statusFilter === "Resolved" ? "active" : ""}`}
              onClick={() => setStatusFilter("Resolved")}
            >
              <CheckCircle2 size={14} />
              <span>Resolved</span>
              <span className="tab-badge">{resolvedCount}</span>
            </button>

            <button
              type="button"
              className={`emg-tab tab-critical ${statusFilter === "Critical" ? "active" : ""}`}
              onClick={() => setStatusFilter("Critical")}
            >
              <Flame size={14} />
              <span>Critical</span>
              <span className="tab-badge">{criticalCount}</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button type="button" className="emg-clear-filters-btn" onClick={clearFilters}>
              <X size={14} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* SEARCH & DROPDOWN FILTERS */}
        <div className="emergency-toolbar">
          <div className="emg-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, emergency type, location or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="emg-filter-dropdowns">
            <div className="emg-filter-group">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option>All Priority</option>
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* INCIDENTS TABLE */}
        <div className="emg-table-wrapper">
          <table className="emg-table">
            <thead>
              <tr>
                <th>Emergency Incident</th>
                <th>Location</th>
                <th>Reported At</th>
                <th>Assigned Response Team</th>
                <th>Priority</th>
                <th>Status (Quick Action)</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmergencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    <div className="emg-empty-state">
                      <Siren size={38} />
                      <h3>No Emergency Incidents Found</h3>
                      <p>
                        {hasActiveFilters
                          ? "No incidents match your filter criteria. Try resetting filters."
                          : "No emergency incidents have been recorded."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="emergency-secondary-btn"
                          onClick={clearFilters}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmergencies.map((emergency) => {
                  const isQuickUpdating = quickUpdatingId === emergency.id;

                  return (
                    <tr key={emergency.id} className="emg-table-row">
                      {/* INCIDENT TYPE & ID */}
                      <td>
                        <div className="emg-incident-cell">
                          <span className="emg-id-badge">
                            {formatEmergencyId(emergency.id)}
                          </span>
                          <strong className="emg-type-title">
                            {emergency.type}
                          </strong>
                          {emergency.citizen_name && (
                            <span className="emg-citizen-tag" title={emergency.citizen_email || ""}>
                              👤 {emergency.citizen_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* LOCATION */}
                      <td>
                        <div className="emg-location-cell">
                          <MapPin size={13} />
                          <span>{emergency.location}</span>
                        </div>
                      </td>

                      {/* REPORTED AT */}
                      <td>
                        <span className="emg-date-cell">
                          {formatDate(emergency.reported_at)}
                        </span>
                      </td>

                      {/* RESPONSE TEAM */}
                      <td>
                        {emergency.team ? (
                          <div className="emg-team-badge">
                            <Users size={12} />
                            <span>{emergency.team}</span>
                          </div>
                        ) : (
                          <span className="emg-unassigned-tag">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* PRIORITY */}
                      <td>
                        <span className={`emg-priority-badge priority-${emergency.priority.toLowerCase()}`}>
                          <span className="priority-pulse-dot" />
                          {emergency.priority}
                        </span>
                      </td>

                      {/* QUICK STATUS SWITCHER */}
                      <td>
                        <div className="quick-status-wrapper">
                          <select
                            className={`emg-status-select emg-select-${emergency.status.toLowerCase().replace(/\s+/g, "-")}`}
                            value={emergency.status}
                            disabled={isQuickUpdating}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                emergency,
                                e.target.value as "Active" | "Responding" | "Resolved"
                              )
                            }
                            title="Click to update emergency response status"
                          >
                            <option value="Active">🚨 Active</option>
                            <option value="Responding">⚡ Responding</option>
                            <option value="Resolved">✅ Resolved</option>
                          </select>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="emg-row-actions">
                          <button
                            type="button"
                            className="emg-action-btn view"
                            title="View Incident Details"
                            onClick={() => {
                              setSelectedEmergency(emergency);
                              setShowViewModal(true);
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            className="emg-action-btn edit"
                            title="Edit Incident Details"
                            onClick={() => {
                              setEditingEmergency(emergency);
                              setShowEditModal(true);
                            }}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            className="emg-action-btn delete"
                            title="Delete Incident Record"
                            onClick={() => setPendingDelete(emergency)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================
            PAGINATION FOOTER
        =================================================== */}
        <footer className="emg-pagination-footer">
          <div className="pagination-info">
            Showing{" "}
            <strong>
              {filteredEmergencies.length === 0
                ? "0"
                : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(
                    currentPage * itemsPerPage,
                    filteredEmergencies.length
                  )}`}
            </strong>{" "}
            of <strong>{filteredEmergencies.length}</strong> incidents
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn nav-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="pagination-ellipsis">…</span>}
                    <button
                      type="button"
                      className={`page-btn ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              className="page-btn nav-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {/* ==================================================
          VIEW INCIDENT MODAL
      =================================================== */}
      {showViewModal && selectedEmergency && (
        <div className="emg-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div
            className="emg-modal-card view-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-top-bar">
              <div className="modal-header-info">
                <span className="modal-badge-id">
                  {formatEmergencyId(selectedEmergency.id)}
                </span>
                <h2>Emergency Incident Details</h2>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowViewModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* QUICK ACTIONS BANNER */}
            <div className="emg-modal-status-banner">
              <div className="banner-left">
                <span className="banner-label">Incident Status:</span>
                <span className={`status-pill pill-${selectedEmergency.status.toLowerCase()}`}>
                  {selectedEmergency.status}
                </span>
                <span className={`emg-priority-badge priority-${selectedEmergency.priority.toLowerCase()}`}>
                  <span className="priority-pulse-dot" />
                  {selectedEmergency.priority} Priority
                </span>
              </div>

              <div className="banner-quick-actions">
                {selectedEmergency.status !== "Responding" && (
                  <button
                    type="button"
                    className="emg-quick-btn dispatch"
                    onClick={() => handleQuickStatusChange(selectedEmergency, "Responding")}
                  >
                    ⚡ Dispatch Team
                  </button>
                )}
                {selectedEmergency.status !== "Resolved" && (
                  <button
                    type="button"
                    className="emg-quick-btn resolve"
                    onClick={() => handleQuickStatusChange(selectedEmergency, "Resolved")}
                  >
                    ✅ Mark Resolved
                  </button>
                )}
                {selectedEmergency.status !== "Active" && (
                  <button
                    type="button"
                    className="emg-quick-btn reopen"
                    onClick={() => handleQuickStatusChange(selectedEmergency, "Active")}
                  >
                    Reopen Incident
                  </button>
                )}
              </div>
            </div>

            <div className="emg-view-details">
              <div className="detail-row full">
                <label>Emergency Type</label>
                <div className="detail-value-highlight">
                  <Siren size={18} />
                  <strong>{selectedEmergency.type}</strong>
                </div>
              </div>

              <div className="detail-row">
                <label>Incident Location</label>
                <div className="detail-value-box">
                  <MapPin size={14} />
                  <span>{selectedEmergency.location}</span>
                </div>
              </div>

              <div className="detail-row">
                <label>Assigned Unit / Team</label>
                <div className="detail-value-box">
                  <Users size={14} />
                  <span>{selectedEmergency.team || "Not Assigned Yet"}</span>
                </div>
              </div>

              <div className="detail-row">
                <label>Reported Timestamp</label>
                <div className="detail-value-box">
                  <Clock3 size={14} />
                  <span>{new Date(selectedEmergency.reported_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="detail-row">
                <label>Urgency Level</label>
                <div className="detail-value-box">
                  <span className={`emg-priority-badge priority-${selectedEmergency.priority.toLowerCase()}`}>
                    {selectedEmergency.priority}
                  </span>
                </div>
              </div>

              <div className="detail-row">
                <label>Reported By (Citizen / Caller)</label>
                <div className="detail-value-box">
                  <Users size={14} />
                  <span>{selectedEmergency.citizen_name || "Emergency Caller (Citizen)"}</span>
                </div>
              </div>

              <div className="detail-row">
                <label>Notification Email</label>
                <div className="detail-value-box">
                  <Mail size={14} />
                  <span>
                    {selectedEmergency.citizen_email ? (
                      <strong>{selectedEmergency.citizen_email}</strong>
                    ) : (
                      <em style={{ color: "#94a3b8" }}>No email registered</em>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="emergency-secondary-btn"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="emergency-primary-btn"
                onClick={() => {
                  setEditingEmergency(selectedEmergency);
                  setShowViewModal(false);
                  setShowEditModal(true);
                }}
              >
                <Pencil size={15} />
                <span>Edit Incident</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          ADD EMERGENCY MODAL
      =================================================== */}
      {showAddModal && (
        <div className="emg-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="emg-modal-card form-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-top-bar">
              <div>
                <h2>Report New Emergency</h2>
                <p className="modal-subtitle">Log an active emergency requiring city emergency dispatch</p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="emg-form">
              <div className="form-grid">
                <div className="form-field full">
                  <label>
                    Emergency Incident Type <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    list="emergency-types"
                    placeholder="e.g. Fire Outbreak, Traffic Accident, Medical Emergency"
                    value={newEmergency.type}
                    onChange={(e) =>
                      setNewEmergency({ ...newEmergency, type: e.target.value })
                    }
                    required
                  />
                  <datalist id="emergency-types">
                    {COMMON_EMERGENCY_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="form-field full">
                  <label>
                    Incident Location <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <MapPin size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Main Highway KM 14, Commercial District"
                      value={newEmergency.location}
                      onChange={(e) =>
                        setNewEmergency({ ...newEmergency, location: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Assign Response Team</label>
                  <input
                    type="text"
                    list="suggested-teams"
                    placeholder="e.g. Emergency Response Team"
                    value={newEmergency.team}
                    onChange={(e) =>
                      setNewEmergency({ ...newEmergency, team: e.target.value })
                    }
                  />
                  <datalist id="suggested-teams">
                    {SUGGESTED_TEAMS.map((team) => (
                      <option key={team} value={team} />
                    ))}
                  </datalist>
                </div>

                <div className="form-field">
                  <label>
                    Priority Level <span className="req">*</span>
                  </label>
                  <select
                    value={newEmergency.priority}
                    onChange={(e) =>
                      setNewEmergency({
                        ...newEmergency,
                        priority: e.target.value as "Critical" | "High" | "Medium",
                      })
                    }
                  >
                    <option value="Critical">🔥 Critical (Life Safety / Severe Hazard)</option>
                    <option value="High">⚠️ High Priority</option>
                    <option value="Medium">⚡ Medium Priority</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Initial Status</label>
                  <select
                    value={newEmergency.status}
                    onChange={(e) =>
                      setNewEmergency({
                        ...newEmergency,
                        status: e.target.value as "Active" | "Responding" | "Resolved",
                      })
                    }
                  >
                    <option value="Active">🚨 Active (Unassigned / Pending)</option>
                    <option value="Responding">⚡ Responding (Units En Route)</option>
                    <option value="Resolved">✅ Resolved (Incident Cleared)</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="emergency-secondary-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="emergency-primary-btn" disabled={saving}>
                  {saving ? "Reporting..." : <>
                    <Plus size={16} /> Log Incident
                  </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          EDIT EMERGENCY MODAL
      =================================================== */}
      {showEditModal && editingEmergency && (
        <div
          className="emg-modal-overlay"
          onClick={() => {
            setShowEditModal(false);
            setEditingEmergency(null);
          }}
        >
          <div
            className="emg-modal-card form-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-top-bar">
              <div>
                <h2>Edit Incident Details</h2>
                <p className="modal-subtitle">
                  Update info for {formatEmergencyId(editingEmergency.id)}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmergency(null);
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="emg-form">
              <div className="form-grid">
                <div className="form-field full">
                  <label>Emergency Type</label>
                  <input
                    type="text"
                    value={editingEmergency.type}
                    onChange={(e) =>
                      setEditingEmergency({
                        ...editingEmergency,
                        type: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-field full">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editingEmergency.location}
                    onChange={(e) =>
                      setEditingEmergency({
                        ...editingEmergency,
                        location: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Response Team</label>
                  <input
                    type="text"
                    list="suggested-teams"
                    value={editingEmergency.team || ""}
                    onChange={(e) =>
                      setEditingEmergency({
                        ...editingEmergency,
                        team: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Priority</label>
                  <select
                    value={editingEmergency.priority}
                    onChange={(e) =>
                      setEditingEmergency({
                        ...editingEmergency,
                        priority: e.target.value as "Critical" | "High" | "Medium",
                      })
                    }
                  >
                    <option value="Critical">🔥 Critical</option>
                    <option value="High">⚠️ High</option>
                    <option value="Medium">⚡ Medium</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    value={editingEmergency.status}
                    onChange={(e) =>
                      setEditingEmergency({
                        ...editingEmergency,
                        status: e.target.value as "Active" | "Responding" | "Resolved",
                      })
                    }
                  >
                    <option value="Active">🚨 Active</option>
                    <option value="Responding">⚡ Responding</option>
                    <option value="Resolved">✅ Resolved</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="emergency-secondary-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmergency(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="emergency-primary-btn" disabled={saving}>
                  {saving ? "Saving..." : <>
                    <ArrowRight size={16} /> Save Changes
                  </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          DELETE CONFIRM MODAL
      =================================================== */}
      {pendingDelete && (
        <ConfirmModal
          title="Delete Emergency Incident?"
          message={
            <>
              Are you sure you want to delete incident{" "}
              <strong>{formatEmergencyId(pendingDelete.id)}</strong> (
              <em>{pendingDelete.type}</em>)?
            </>
          }
          warning="This action cannot be undone and will permanently remove this record from the emergency log."
          confirmLabel="Delete Incident"
          tone="danger"
          loading={saving}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default Emergency;