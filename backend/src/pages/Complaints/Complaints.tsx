import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquareWarning,
  Clock3,
  LoaderCircle,
  CheckCircle2,
  Search,
  MapPin,
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
} from "lucide-react";

import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../components/Toast";
import "./Complaints.css";

interface Complaint {
  id: number;
  category: string;
  description: string;
  location: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Resolved";
  created_at: string;
}

const CATEGORIES = [
  "Water Supply",
  "Road Damage",
  "Waste Management",
  "Street Lights",
  "Traffic",
  "Public Safety",
  "Other",
];

const Complaints: React.FC = () => {
  const { showToast } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Complaint | null>(null);

  const [saving, setSaving] = useState(false);
  const [quickUpdatingId, setQuickUpdatingId] = useState<number | null>(null);

  const [newComplaint, setNewComplaint] = useState({
    category: "",
    description: "",
    location: "",
    priority: "Medium" as "Low" | "Medium" | "High",
  });

  const API_BASE = "https://smart-city-production-c48b.up.railway.app/api/complaints";

  // ================================
  // FETCH COMPLAINTS
  // ================================
  const fetchComplaints = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await fetch(`${API_BASE}/`);

      if (!response.ok) {
        throw new Error("Failed to load complaints");
      }

      const data = await response.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch complaints error:", err);
      setError("Unable to connect to server to fetch complaints.");
      showToast("Failed to load complaints.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchComplaints();
  }, [fetchComplaints]);

  // ================================
  // FORMATTERS
  // ================================
  const formatComplaintId = (id: number) => {
    return `CMP-${String(10000 + id).padStart(5, "0")}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // ================================
  // METRICS
  // ================================
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "Pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "In Progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(0) : "0";

  // ================================
  // FILTERING
  // ================================
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const q = search.toLowerCase().trim();
      const cId = formatComplaintId(complaint.id).toLowerCase();

      const matchesSearch =
        !q ||
        cId.includes(q) ||
        complaint.category?.toLowerCase().includes(q) ||
        complaint.location?.toLowerCase().includes(q) ||
        complaint.description?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" || complaint.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All Categories" || complaint.category === categoryFilter;

      const matchesPriority =
        priorityFilter === "All Priority" || complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, priorityFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(start, start + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    categoryFilter !== "All Categories" ||
    priorityFilter !== "All Priority";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All Categories");
    setPriorityFilter("All Priority");
  };

  // ================================
  // QUICK STATUS UPDATE
  // ================================
  const handleQuickStatusChange = async (
    complaint: Complaint,
    nextStatus: "Pending" | "In Progress" | "Resolved"
  ) => {
    if (complaint.status === nextStatus) return;

    try {
      setQuickUpdatingId(complaint.id);

      const response = await fetch(`${API_BASE}/${complaint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: complaint.category,
          description: complaint.description,
          location: complaint.location,
          priority: complaint.priority,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id ? { ...c, status: nextStatus } : c))
      );

      if (selectedComplaint?.id === complaint.id) {
        setSelectedComplaint({ ...selectedComplaint, status: nextStatus });
      }

      showToast(`Complaint moved to ${nextStatus}`, "success");
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Failed to update status", "error");
    } finally {
      setQuickUpdatingId(null);
    }
  };

  // ================================
  // ADD COMPLAINT
  // ================================
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComplaint.category || !newComplaint.description || !newComplaint.location) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newComplaint.category,
          description: newComplaint.description,
          location: newComplaint.location,
          priority: newComplaint.priority,
          status: "Pending",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add complaint");
      }

      await fetchComplaints(true);

      setNewComplaint({
        category: "",
        description: "",
        location: "",
        priority: "Medium",
      });

      setShowAddModal(false);
      showToast("Complaint registered successfully!", "success");
    } catch (err) {
      console.error("Add complaint error:", err);
      showToast("Error creating complaint", "error");
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // EDIT COMPLAINT
  // ================================
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingComplaint) return;

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/${editingComplaint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editingComplaint.category,
          description: editingComplaint.description,
          location: editingComplaint.location,
          priority: editingComplaint.priority,
          status: editingComplaint.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update complaint");
      }

      await fetchComplaints(true);

      setShowEditModal(false);
      setEditingComplaint(null);
      showToast("Complaint updated successfully!", "success");
    } catch (err) {
      console.error("Edit complaint error:", err);
      showToast("Error updating complaint", "error");
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // DELETE COMPLAINT
  // ================================
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete complaint");
      }

      setComplaints((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);

      if (selectedComplaint?.id === deleteTarget.id) {
        setShowViewModal(false);
        setSelectedComplaint(null);
      }

      showToast("Complaint deleted successfully.", "success");
    } catch (err) {
      console.error("Delete complaint error:", err);
      showToast("Failed to delete complaint", "error");
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // LOADING STATE
  // ================================
  if (loading) {
    return (
      <div className="complaints-page">
        <div className="complaints-loading-state">
          <LoaderCircle size={38} className="spin-icon" />
          <p>Loading complaints dashboard...</p>
        </div>
      </div>
    );
  }

  // ================================
  // ERROR STATE
  // ================================
  if (error && complaints.length === 0) {
    return (
      <div className="complaints-page">
        <div className="complaints-error-state">
          <MessageSquareWarning size={42} />
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button className="primary-btn" onClick={() => fetchComplaints()}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="complaints-page">
      {/* ==================================================
          PAGE HEADER
      =================================================== */}
      <header className="complaints-header">
        <div className="header-left">
          <div className="header-badge">
            <span className="live-dot" />
            <span>Admin Center</span>
          </div>
          <h1>Complaints Management</h1>
          <p>Track, investigate, and resolve citizen municipal complaints with real-time updates.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => fetchComplaints(true)}
            disabled={refreshing}
            title="Refresh Complaints Data"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={17} />
            <span>New Complaint</span>
          </button>
        </div>
      </header>

      {/* ==================================================
          STATISTICS CARDS (CLICKABLE FILTERS)
      =================================================== */}
      <section className="complaints-stats-grid">
        {/* TOTAL */}
        <div
          className={`stat-card stat-card-blue ${statusFilter === "All" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("All")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper">
            <MessageSquareWarning size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Complaints</span>
            <strong className="stat-value">{totalCount.toLocaleString()}</strong>
            <span className="stat-desc">All recorded cases</span>
          </div>
        </div>

        {/* PENDING */}
        <div
          className={`stat-card stat-card-amber ${statusFilter === "Pending" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("Pending")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper">
            <Clock3 size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label-row">
              <span className="stat-label">Pending</span>
              {pendingCount > 0 && <span className="stat-pill-amber">Needs Action</span>}
            </div>
            <strong className="stat-value">{pendingCount.toLocaleString()}</strong>
            <span className="stat-desc">Awaiting investigation</span>
          </div>
        </div>

        {/* IN PROGRESS */}
        <div
          className={`stat-card stat-card-indigo ${statusFilter === "In Progress" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("In Progress")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper">
            <LoaderCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">In Progress</span>
            <strong className="stat-value">{inProgressCount.toLocaleString()}</strong>
            <span className="stat-desc">Currently being handled</span>
          </div>
        </div>

        {/* RESOLVED */}
        <div
          className={`stat-card stat-card-emerald ${statusFilter === "Resolved" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("Resolved")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrapper">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label-row">
              <span className="stat-label">Resolved</span>
              <span className="stat-pill-emerald">{resolutionRate}% Rate</span>
            </div>
            <strong className="stat-value">{resolvedCount.toLocaleString()}</strong>
            <span className="stat-desc">Successfully resolved</span>
          </div>
        </div>
      </section>

      {/* ==================================================
          MAIN PANEL: TOOLBAR + TABLE
      =================================================== */}
      <section className="complaints-panel">
        {/* STATUS TABS */}
        <div className="status-tabs-bar">
          <div className="status-tabs">
            <button
              type="button"
              className={`status-tab ${statusFilter === "All" ? "active" : ""}`}
              onClick={() => setStatusFilter("All")}
            >
              <span>All</span>
              <span className="tab-badge">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`status-tab tab-amber ${statusFilter === "Pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("Pending")}
            >
              <Clock3 size={14} />
              <span>Pending</span>
              <span className="tab-badge">{pendingCount}</span>
            </button>

            <button
              type="button"
              className={`status-tab tab-indigo ${statusFilter === "In Progress" ? "active" : ""}`}
              onClick={() => setStatusFilter("In Progress")}
            >
              <LoaderCircle size={14} />
              <span>In Progress</span>
              <span className="tab-badge">{inProgressCount}</span>
            </button>

            <button
              type="button"
              className={`status-tab tab-emerald ${statusFilter === "Resolved" ? "active" : ""}`}
              onClick={() => setStatusFilter("Resolved")}
            >
              <CheckCircle2 size={14} />
              <span>Resolved</span>
              <span className="tab-badge">{resolvedCount}</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button type="button" className="clear-filters-btn" onClick={clearFilters}>
              <X size={14} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* SEARCH & DROPDOWN FILTERS */}
        <div className="complaints-toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, category, location or description..."
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

          <div className="filter-dropdowns">
            <div className="filter-group">
              <Filter size={14} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option>All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option>All Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Category</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Priority</th>
                <th>Status (Quick Action)</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    <div className="empty-state">
                      <MessageSquareWarning size={40} />
                      <h3>No Complaints Found</h3>
                      <p>
                        {hasActiveFilters
                          ? "No complaints match your selected filters. Try clearing your search or filter."
                          : "No complaints have been submitted yet."}
                      </p>
                      {hasActiveFilters && (
                        <button type="button" className="secondary-btn" onClick={clearFilters}>
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((complaint) => {
                  const isQuickUpdating = quickUpdatingId === complaint.id;

                  return (
                    <tr key={complaint.id} className="table-row">
                      {/* COMPLAINT ID & DESCRIPTION */}
                      <td>
                        <div className="complaint-cell-info">
                          <span className="complaint-id-tag">
                            {formatComplaintId(complaint.id)}
                          </span>
                          <p className="complaint-description-snippet" title={complaint.description}>
                            {complaint.description}
                          </p>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td>
                        <span className={`category-pill cat-${complaint.category.toLowerCase().replace(/\s+/g, "-")}`}>
                          {complaint.category}
                        </span>
                      </td>

                      {/* LOCATION */}
                      <td>
                        <div className="location-cell">
                          <MapPin size={13} />
                          <span>{complaint.location || "N/A"}</span>
                        </div>
                      </td>

                      {/* DATE */}
                      <td>
                        <div className="date-cell">
                          <CalendarDays size={13} />
                          <span>{formatDate(complaint.created_at)}</span>
                        </div>
                      </td>

                      {/* PRIORITY */}
                      <td>
                        <span className={`priority-badge priority-${complaint.priority?.toLowerCase()}`}>
                          <span className="priority-dot" />
                          {complaint.priority}
                        </span>
                      </td>

                      {/* QUICK STATUS CHANGER */}
                      <td>
                        <div className="quick-status-wrapper">
                          <select
                            className={`status-select status-select-${complaint.status?.toLowerCase().replace(/\s+/g, "-")}`}
                            value={complaint.status}
                            disabled={isQuickUpdating}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                complaint,
                                e.target.value as "Pending" | "In Progress" | "Resolved"
                              )
                            }
                            title="Click to quickly change complaint status"
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="In Progress">🔄 In Progress</option>
                            <option value="Resolved">✅ Resolved</option>
                          </select>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="row-action-buttons">
                          <button
                            type="button"
                            className="icon-action-btn view"
                            title="View Complaint Details"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowViewModal(true);
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn edit"
                            title="Edit Complaint"
                            onClick={() => {
                              setEditingComplaint(complaint);
                              setShowEditModal(true);
                            }}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn delete"
                            title="Delete Complaint"
                            onClick={() => setDeleteTarget(complaint)}
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
            WORKING PAGINATION FOOTER
        =================================================== */}
        <footer className="table-pagination-footer">
          <div className="pagination-info">
            Showing{" "}
            <strong>
              {filteredComplaints.length === 0
                ? "0"
                : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(
                    currentPage * itemsPerPage,
                    filteredComplaints.length
                  )}`}
            </strong>{" "}
            of <strong>{filteredComplaints.length}</strong> complaints
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
                // Show current, first, last, and immediate siblings
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
          VIEW COMPLAINT MODAL
      =================================================== */}
      {showViewModal && selectedComplaint && (
        <div className="complaint-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div
            className="complaint-modal-card view-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-top-bar">
              <div className="modal-header-info">
                <span className="modal-badge-id">
                  {formatComplaintId(selectedComplaint.id)}
                </span>
                <h2>Complaint Overview</h2>
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

            {/* QUICK STATUS SWITCHER INSIDE VIEW MODAL */}
            <div className="modal-status-banner">
              <div className="banner-left">
                <span className="banner-label">Current Status:</span>
                <span className={`status-pill pill-${selectedComplaint.status.toLowerCase().replace(/\s+/g, "-")}`}>
                  {selectedComplaint.status}
                </span>
                <span className={`priority-badge priority-${selectedComplaint.priority.toLowerCase()}`}>
                  <span className="priority-dot" />
                  {selectedComplaint.priority} Priority
                </span>
              </div>

              <div className="banner-quick-actions">
                {selectedComplaint.status !== "In Progress" && (
                  <button
                    type="button"
                    className="quick-action-btn in-progress"
                    onClick={() => handleQuickStatusChange(selectedComplaint, "In Progress")}
                  >
                    Move to In Progress
                  </button>
                )}
                {selectedComplaint.status !== "Resolved" && (
                  <button
                    type="button"
                    className="quick-action-btn resolved"
                    onClick={() => handleQuickStatusChange(selectedComplaint, "Resolved")}
                  >
                    Mark as Resolved
                  </button>
                )}
                {selectedComplaint.status !== "Pending" && (
                  <button
                    type="button"
                    className="quick-action-btn pending"
                    onClick={() => handleQuickStatusChange(selectedComplaint, "Pending")}
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="complaint-view-details">
              <div className="detail-row full">
                <label>Description</label>
                <div className="detail-description-box">
                  {selectedComplaint.description}
                </div>
              </div>

              <div className="detail-row">
                <label>Category</label>
                <div className="detail-value-box">
                  <span className={`category-pill cat-${selectedComplaint.category.toLowerCase().replace(/\s+/g, "-")}`}>
                    {selectedComplaint.category}
                  </span>
                </div>
              </div>

              <div className="detail-row">
                <label>Location</label>
                <div className="detail-value-box">
                  <MapPin size={14} />
                  <span>{selectedComplaint.location}</span>
                </div>
              </div>

              <div className="detail-row">
                <label>Submitted Date</label>
                <div className="detail-value-box">
                  <CalendarDays size={14} />
                  <span>{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="detail-row">
                <label>Priority Level</label>
                <div className="detail-value-box">
                  <span>{selectedComplaint.priority}</span>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-actions-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setEditingComplaint(selectedComplaint);
                  setShowViewModal(false);
                  setShowEditModal(true);
                }}
              >
                <Pencil size={15} />
                <span>Edit Complaint</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          ADD COMPLAINT MODAL
      =================================================== */}
      {showAddModal && (
        <div className="complaint-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="complaint-modal-card form-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-top-bar">
              <div>
                <h2>Create New Complaint</h2>
                <p className="modal-subtitle">Register a new citizen concern into the city system</p>
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

            <form onSubmit={handleAddSubmit} className="complaint-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>
                    Category <span className="req">*</span>
                  </label>
                  <select
                    value={newComplaint.category}
                    onChange={(e) =>
                      setNewComplaint({ ...newComplaint, category: e.target.value })
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Priority <span className="req">*</span>
                  </label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        priority: e.target.value as "Low" | "Medium" | "High",
                      })
                    }
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                <div className="form-field full">
                  <label>
                    Location / Area <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <MapPin size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Sector F-7, Street 14, Main Avenue"
                      value={newComplaint.location}
                      onChange={(e) =>
                        setNewComplaint({ ...newComplaint, location: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-field full">
                  <label>
                    Complaint Description <span className="req">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide details of the citizen issue or complaint..."
                    value={newComplaint.description}
                    onChange={(e) =>
                      setNewComplaint({ ...newComplaint, description: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <LoaderCircle size={16} className="spin-icon" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Create Complaint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          EDIT COMPLAINT MODAL
      =================================================== */}
      {showEditModal && editingComplaint && (
        <div
          className="complaint-modal-overlay"
          onClick={() => {
            setShowEditModal(false);
            setEditingComplaint(null);
          }}
        >
          <div
            className="complaint-modal-card form-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-top-bar">
              <div>
                <h2>Edit Complaint</h2>
                <p className="modal-subtitle">
                  Update details for {formatComplaintId(editingComplaint.id)}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingComplaint(null);
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="complaint-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>Category</label>
                  <select
                    value={editingComplaint.category}
                    onChange={(e) =>
                      setEditingComplaint({
                        ...editingComplaint,
                        category: e.target.value,
                      })
                    }
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Priority</label>
                  <select
                    value={editingComplaint.priority}
                    onChange={(e) =>
                      setEditingComplaint({
                        ...editingComplaint,
                        priority: e.target.value as "Low" | "Medium" | "High",
                      })
                    }
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    value={editingComplaint.status}
                    onChange={(e) =>
                      setEditingComplaint({
                        ...editingComplaint,
                        status: e.target.value as "Pending" | "In Progress" | "Resolved",
                      })
                    }
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="In Progress">🔄 In Progress</option>
                    <option value="Resolved">✅ Resolved</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editingComplaint.location}
                    onChange={(e) =>
                      setEditingComplaint({
                        ...editingComplaint,
                        location: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-field full">
                  <label>Description</label>
                  <textarea
                    rows={4}
                    value={editingComplaint.description}
                    onChange={(e) =>
                      setEditingComplaint({
                        ...editingComplaint,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingComplaint(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <LoaderCircle size={16} className="spin-icon" /> Updating...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          DELETE CONFIRM MODAL
      =================================================== */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Complaint?"
          message={
            <>
              Are you sure you want to permanently delete complaint{" "}
              <strong>{formatComplaintId(deleteTarget.id)}</strong>?
            </>
          }
          warning="This action cannot be undone and will remove all records associated with this complaint."
          confirmLabel="Delete Complaint"
          tone="danger"
          loading={saving}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default Complaints;
