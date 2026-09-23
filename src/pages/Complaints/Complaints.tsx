import React, { useEffect, useState } from "react";
import {
  MessageSquareWarning,
  Clock3,
  LoaderCircle,
  CheckCircle2,
  Search,
  MapPin,
  CalendarDays,
  Eye,
  MoreVertical,
} from "lucide-react";

import ConfirmModal from "../../components/ConfirmModal";
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

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [priority, setPriority] = useState("All Priority");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    category: "",
    description: "",
    location: "",
    priority: "Medium" as "Low" | "Medium" | "High",
  });
  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingComplaint, setEditingComplaint] =
    useState<Complaint | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    message: string;
    warning: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);

  // ================================
  // FETCH COMPLAINTS
  // ================================
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/complaints/");

      if (!response.ok) {
        throw new Error("Failed to fetch complaints");
      }

      const data = await response.json();

      setComplaints(data);
    } catch (err) {
      console.error("Fetch complaints error:", err);
      setError("Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchComplaints();
    }, 0);

    return () => window.clearTimeout(fetchTimer);
  }, []);

  // ================================
  // FORMAT COMPLAINT ID
  // ================================
  const formatComplaintId = (id: number) => {
    return `CMP-${String(10000 + id).padStart(5, "0")}`;
  };

  // ================================
  // FORMAT DATE
  // ================================
  const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // ================================
  // FILTER COMPLAINTS
  // ================================
  const filteredComplaints = complaints.filter((complaint) => {
    const searchText = search.toLowerCase();

    const complaintId = formatComplaintId(complaint.id).toLowerCase();

    const matchesSearch =
      complaintId.includes(searchText) ||
      complaint.category.toLowerCase().includes(searchText) ||
      complaint.location.toLowerCase().includes(searchText) ||
      complaint.description.toLowerCase().includes(searchText);

    const matchesCategory =
      category === "All Categories" ||
      complaint.category === category;

    const matchesStatus =
      status === "All Status" ||
      complaint.status === status;

    const matchesPriority =
      priority === "All Priority" ||
      complaint.priority === priority;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesPriority
    );
  });

  // ================================
  // DYNAMIC STATS
  // ================================
  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === "Pending"
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "In Progress"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const resolutionRate =
    totalComplaints > 0
      ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
      : "0.0";

  const handleAddComplaint = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/complaints/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: newComplaint.category,
            description: newComplaint.description,
            location: newComplaint.location,
            priority: newComplaint.priority,
            status: "Pending",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add complaint");
      }

      await fetchComplaints();

      setNewComplaint({
        category: "",
        description: "",
        location: "",
        priority: "Medium",
      });

      setShowAddModal(false);
      setPendingAction(null);
    } catch (error) {
      console.error("Error adding complaint:", error);
    }
  };

  const handleEditComplaint = async () => {
    if (!editingComplaint) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/complaints/${editingComplaint.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: editingComplaint.category,
            description: editingComplaint.description,
            location: editingComplaint.location,
            priority: editingComplaint.priority,
            status: editingComplaint.status,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update complaint");
      }

      await fetchComplaints();

      setShowEditModal(false);
      setEditingComplaint(null);
      setPendingAction(null);
    } catch (error) {
      console.error("Error updating complaint:", error);
    }
  };

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return (
      <div className="complaints-page">
        <div className="no-complaints">
          <LoaderCircle size={35} />
          <p>Loading complaints...</p>
        </div>
      </div>
    );
  }

  // ================================
  // ERROR
  // ================================
  if (error) {
    return (
      <div className="complaints-page">
        <div className="no-complaints">
          <MessageSquareWarning size={35} />
          <p>{error}</p>
          <small>
            Make sure your backend is running on port 5000.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="complaints-page">

      {/* Header */}
      <div className="complaints-header">
        <div>
          <h1>Complaints Management</h1>

          <p>
            Manage citizen complaints, track progress and resolve issues.
          </p>
        </div>

        <button
          type="button"
          className="new-complaint-btn"
          onClick={() => setShowAddModal(true)}
        >
          <MessageSquareWarning size={17} />
          New Complaint
        </button>
      </div>

      {showAddModal && (
        <div className="complaint-form-overlay">
          <div className="complaint-form-modal">
            <div className="complaint-form-header">
              <h2>New Complaint</h2>
              <button
                type="button"
                className="close-form-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPendingAction({
                  title: "Submit Complaint?",
                  message: "Are you sure you want to submit this complaint?",
                  warning: "This will send the complaint for review.",
                  confirmLabel: "Submit Complaint",
                  action: () => {
                    setPendingAction(null);
                    void handleAddComplaint();
                  },
                });
              }}
            >
              <div className="complaint-form-grid">
                <label>
                  Category
                  <select
                    value={newComplaint.category}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="">Select category</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Road Damage">Road Damage</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Street Lights">Street Lights</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Public Safety">Public Safety</option>
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={newComplaint.priority}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        priority: e.target.value as "Low" | "Medium" | "High",
                      })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>

                <label>
                  Location
                  <input
                    type="text"
                    value={newComplaint.location}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        location: e.target.value,
                      })
                    }
                    placeholder="Enter location"
                    required
                  />
                </label>

                <label className="full-width">
                  Description
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the complaint"
                    rows={4}
                    required
                  />
                </label>
              </div>

              <div className="complaint-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="submit-btn">
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="complaint-stats">

        {/* Total */}
        <div className="complaint-stat">
          <div className="complaint-stat-icon blue">
            <MessageSquareWarning size={22} />
          </div>

          <div>
            <span>Total Complaints</span>
            <strong>{totalComplaints.toLocaleString()}</strong>
            <small>From database</small>
          </div>
        </div>

        {/* Pending */}
        <div className="complaint-stat">
          <div className="complaint-stat-icon orange">
            <Clock3 size={22} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingComplaints.toLocaleString()}</strong>
            <small>Needs attention</small>
          </div>
        </div>

        {/* In Progress */}
        <div className="complaint-stat">
          <div className="complaint-stat-icon purple">
            <LoaderCircle size={22} />
          </div>

          <div>
            <span>In Progress</span>
            <strong>{inProgressComplaints.toLocaleString()}</strong>
            <small>Being handled</small>
          </div>
        </div>

        {/* Resolved */}
        <div className="complaint-stat">
          <div className="complaint-stat-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Resolved</span>
            <strong>{resolvedComplaints.toLocaleString()}</strong>
            <small>{resolutionRate}% resolution rate</small>
          </div>
        </div>

      </div>

      {/* Main Panel */}
      <div className="complaints-panel">

        {/* Toolbar */}
        <div className="complaints-toolbar">

          <div className="complaint-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search complaint, category, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Water Supply</option>
            <option>Road Damage</option>
            <option>Waste Management</option>
            <option>Street Lights</option>
            <option>Traffic</option>
            <option>Public Safety</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>All Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

        </div>

        {/* Table */}
        <div className="complaints-table-wrapper">

          <table className="complaints-table">

            <thead>
              <tr>
                <th>Complaint</th>
                <th>Category</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredComplaints.map((complaint) => (

                <tr key={complaint.id}>

                  {/* Complaint */}
                  <td>
                    <div className="complaint-id">

                      <div className="complaint-icon">
                        <MessageSquareWarning size={15} />
                      </div>

                      <div>
                        <strong>
                          {formatComplaintId(complaint.id)}
                        </strong>

                        <span>
                          {complaint.description}
                        </span>
                      </div>

                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="complaint-category">
                      {complaint.category}
                    </span>
                  </td>

                  {/* Location */}
                  <td>
                    <div className="complaint-location">
                      <MapPin size={13} />
                      {complaint.location}
                    </div>
                  </td>

                  {/* Submitted */}
                  <td>
                    <div className="complaint-date">
                      <CalendarDays size={13} />
                      {formatDate(complaint.created_at)}
                    </div>
                  </td>

                  {/* Priority */}
                  <td>
                    <span
                      className={`priority ${complaint.priority.toLowerCase()}`}
                    >
                      {complaint.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`complaint-status ${complaint.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      <i />
                      {complaint.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="complaint-actions">

                      <button
                        type="button"
                        title="View Complaint"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        title="Edit Complaint"
                        onClick={() => {
                          setEditingComplaint(complaint);
                          setShowEditModal(true);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                    </div>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {filteredComplaints.length === 0 && (
            <div className="no-complaints">
              <MessageSquareWarning size={35} />
              <p>No complaints found.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="complaints-footer">

          <span>
            Showing {filteredComplaints.length} of{" "}
            {complaints.length} complaints
          </span>

          <div className="complaint-pagination">
            <button>‹</button>
            <button className="current">1</button>
            <button>2</button>
            <button>3</button>
            <span>...</span>
            <button>›</button>
          </div>

        </div>

      </div>

      {showViewModal && selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Complaint Details</h2>

              <button
                type="button"
                className="close-btn"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="complaint-details">
              <div>
                <strong>Complaint ID</strong>
                <p>CMP-{String(selectedComplaint.id).padStart(5, "0")}</p>
              </div>

              <div>
                <strong>Category</strong>
                <p>{selectedComplaint.category}</p>
              </div>

              <div>
                <strong>Description</strong>
                <p>{selectedComplaint.description}</p>
              </div>

              <div>
                <strong>Location</strong>
                <p>{selectedComplaint.location}</p>
              </div>

              <div>
                <strong>Priority</strong>
                <p>{selectedComplaint.priority}</p>
              </div>

              <div>
                <strong>Status</strong>
                <p>{selectedComplaint.status}</p>
              </div>

              <div>
                <strong>Submitted</strong>
                <p>{new Date(selectedComplaint.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingComplaint && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Complaint</h2>

              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingComplaint(null);
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPendingAction({
                  title: "Update Complaint?",
                  message: "Are you sure you want to update this complaint?",
                  warning: "This will update the complaint details.",
                  confirmLabel: "Update Complaint",
                  action: () => {
                    setPendingAction(null);
                    void handleEditComplaint();
                  },
                });
              }}
              className="edit-complaint-form"
            >
              <label>
                Category
                <select
                  value={editingComplaint.category}
                  onChange={(event) =>
                    setEditingComplaint({
                      ...editingComplaint,
                      category: event.target.value,
                    })
                  }
                  required
                >
                  <option value="Water Supply">Water Supply</option>
                  <option value="Road Damage">Road Damage</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Street Lights">Street Lights</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Public Safety">Public Safety</option>
                </select>
              </label>

              <label>
                Description
                <textarea
                  value={editingComplaint.description}
                  onChange={(event) =>
                    setEditingComplaint({
                      ...editingComplaint,
                      description: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Location
                <input
                  type="text"
                  value={editingComplaint.location}
                  onChange={(event) =>
                    setEditingComplaint({
                      ...editingComplaint,
                      location: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Priority
                <select
                  value={editingComplaint.priority}
                  onChange={(event) =>
                    setEditingComplaint({
                      ...editingComplaint,
                      priority: event.target.value as "Low" | "Medium" | "High",
                    })
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={editingComplaint.status}
                  onChange={(event) =>
                    setEditingComplaint({
                      ...editingComplaint,
                      status: event.target.value as
                        | "Pending"
                        | "In Progress"
                        | "Resolved",
                    })
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </label>

              <button type="submit" className="submit-btn">
                Update Complaint
              </button>
            </form>
          </div>
        </div>
      )}

      {pendingAction && (
        <ConfirmModal
          title={pendingAction.title}
          message={pendingAction.message}
          warning={pendingAction.warning}
          confirmLabel={pendingAction.confirmLabel}
          tone="primary"
          onCancel={() => setPendingAction(null)}
          onConfirm={pendingAction.action}
        />
      )}

    </div>
  );
};

export default Complaints;
