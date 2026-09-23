import React, { useEffect, useState } from "react";
import {
  Siren,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Search,
  MapPin,
  Eye,
  MoreVertical,
  Trash2,
} from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";
import "./Emergency.css";

interface Emergency {
  id: number;
  type: string;
  location: string;
  team: string | null;
  priority: "Critical" | "High" | "Medium";
  status: "Active" | "Responding" | "Resolved";
  reported_at: string;
}

const Emergency: React.FC = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [priority, setPriority] = useState("All Priority");
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmergency, setNewEmergency] = useState({
    type: "",
    location: "",
    team: "",
    priority: "Medium" as "Critical" | "High" | "Medium",
    status: "Active" as "Active" | "Responding" | "Resolved",
  });
  const [selectedEmergency, setSelectedEmergency] =
    useState<Emergency | null>(null);
  const [editingEmergency, setEditingEmergency] =
    useState<Emergency | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Emergency | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    message: string;
    warning: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);

  const fetchEmergencies = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/emergencies/"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch emergencies");
      }

      const data = await response.json();

      setEmergencies(data);
    } catch (error) {
      console.error("Error fetching emergencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmergency = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/emergencies/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEmergency),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add emergency");
      }

      await fetchEmergencies();

      setNewEmergency({
        type: "",
        location: "",
        team: "",
        priority: "Medium",
        status: "Active",
      });

      setShowAddModal(false);
      setPendingAction(null);
    } catch (error) {
      console.error("Error adding emergency:", error);
    }
  };

  const handleEditEmergency = async () => {
    if (!editingEmergency) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/emergencies/${editingEmergency.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: editingEmergency.type,
            location: editingEmergency.location,
            team: editingEmergency.team,
            priority: editingEmergency.priority,
            status: editingEmergency.status,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update emergency");
      }

      await fetchEmergencies();

      setShowEditModal(false);
      setEditingEmergency(null);
      setPendingAction(null);
    } catch (error) {
      console.error("Error updating emergency:", error);
    }
  };

  const handleDeleteEmergency = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/emergencies/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete emergency");
      }

      await fetchEmergencies();
  setPendingDelete(null);
    } catch (error) {
      console.error("Error deleting emergency:", error);
    }
  };

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchEmergencies();
    }, 0);

    return () => window.clearTimeout(fetchTimer);
  }, []);

  const formatEmergencyId = (id: number) => {
    return `EMG-${String(id).padStart(3, "0")}`;
  };

  const filteredEmergencies = emergencies.filter((emergency) => {
    const emergencyId = formatEmergencyId(emergency.id);

    const matchesSearch =
      emergencyId.toLowerCase().includes(search.toLowerCase()) ||
      emergency.type.toLowerCase().includes(search.toLowerCase()) ||
      emergency.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      status === "All Status" || emergency.status === status;

    const matchesPriority =
      priority === "All Priority" || emergency.priority === priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalEmergencies = emergencies.length;

  const activeEmergencies = emergencies.filter(
    (item) => item.status === "Active"
  ).length;

  const respondingEmergencies = emergencies.filter(
    (item) => item.status === "Responding"
  ).length;

  const resolvedEmergencies = emergencies.filter(
    (item) => item.status === "Resolved"
  ).length;

  const criticalEmergencies = emergencies.filter(
    (item) => item.priority === "Critical"
  ).length;

  if (loading) {
    return (
      <div className="emergency-page">
        <div className="no-emergencies">
          <Siren size={28} />
          <p>Loading emergencies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <div>
          <h1>Emergency Management</h1>
          <p>Monitor and manage city emergency incidents</p>
        </div>

        <button
          type="button"
          className="report-emergency-btn"
          onClick={() => setShowAddModal(true)}
        >
          <Siren size={16} />
          Report Emergency
        </button>
      </div>

      <div className="emergency-stats">
        <div className="emergency-stat">
          <div className="emergency-stat-icon blue">
            <Siren size={21} />
          </div>

          <div>
            <span>Total Emergencies</span>
            <strong>{totalEmergencies}</strong>
            <small>All incidents</small>
          </div>
        </div>

        <div className="emergency-stat">
          <div className="emergency-stat-icon red">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>Active</span>
            <strong>{activeEmergencies}</strong>
            <small>Require attention</small>
          </div>
        </div>

        <div className="emergency-stat">
          <div className="emergency-stat-icon orange">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Responding</span>
            <strong>{respondingEmergencies}</strong>
            <small>Teams dispatched</small>
          </div>
        </div>

        <div className="emergency-stat">
          <div className="emergency-stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Resolved</span>
            <strong>{resolvedEmergencies}</strong>
            <small>Completed incidents</small>
          </div>
        </div>

        <div className="emergency-stat">
          <div className="emergency-stat-icon red">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>Critical</span>
            <strong>{criticalEmergencies}</strong>
            <small>High-priority incidents</small>
          </div>
        </div>
      </div>

      <div className="emergency-panel">
        <div className="emergency-toolbar">
          <div className="emergency-search">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search emergencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Responding</option>
            <option>Resolved</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>All Priority</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
          </select>
        </div>

        <div className="emergency-table-wrapper">
          <table className="emergency-table">
            <thead>
              <tr>
                <th>Emergency</th>
                <th>Location</th>
                <th>Reported</th>
                <th>Response Team</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmergencies.length > 0 ? (
                filteredEmergencies.map((emergency) => (
                  <tr key={emergency.id}>
                    <td>
                      <div className="emergency-name">
                        <div className="emergency-icon">
                          <Siren size={16} />
                        </div>

                        <div>
                          <strong>{emergency.type}</strong>
                          <span>{formatEmergencyId(emergency.id)}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="emergency-location">
                        <MapPin size={13} />
                        {emergency.location}
                      </div>
                    </td>

                    <td>
                      {new Date(emergency.reported_at).toLocaleString()}
                    </td>

                    <td>{emergency.team}</td>

                    <td>
                      <span
                        className={`emergency-priority ${emergency.priority.toLowerCase()}`}
                      >
                        {emergency.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`emergency-status ${emergency.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        <i></i>
                        {emergency.status}
                      </span>
                    </td>

                    <td>
                      <div className="emergency-actions">
                        <button
                          type="button"
                          title="View"
                          onClick={() => {
                            setSelectedEmergency(emergency);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          title="Edit"
                          onClick={() => {
                            setEditingEmergency(emergency);
                            setShowEditModal(true);
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>

                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setPendingDelete(emergency)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="no-emergencies">
                      <Siren size={28} />
                      <p>No emergencies found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="emergency-footer">
          <span>
            Showing {filteredEmergencies.length} of {totalEmergencies} emergencies
          </span>

          <div className="emergency-pagination">
            <button>‹</button>
            <button className="current">1</button>
            <button>›</button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="emergency-modal-overlay">
          <div className="emergency-modal-content">
            <div className="emergency-modal-header">
              <h2>Report Emergency</h2>

              <button
                type="button"
                className="emergency-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <form
              className="emergency-form"
              onSubmit={(event) => {
                event.preventDefault();
                setPendingAction({
                  title: "Add Emergency?",
                  message: `Are you sure you want to report ${newEmergency.type || "this emergency"}?`,
                  warning: "This will create a new emergency incident.",
                  confirmLabel: "Add Emergency",
                  action: () => {
                    setPendingAction(null);
                    void handleAddEmergency();
                  },
                });
              }}
            >
              <label>
                Emergency Type
                <input
                  type="text"
                  value={newEmergency.type}
                  onChange={(event) =>
                    setNewEmergency({
                      ...newEmergency,
                      type: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Location
                <input
                  type="text"
                  value={newEmergency.location}
                  onChange={(event) =>
                    setNewEmergency({
                      ...newEmergency,
                      location: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Response Team
                <input
                  type="text"
                  value={newEmergency.team}
                  onChange={(event) =>
                    setNewEmergency({
                      ...newEmergency,
                      team: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Priority
                <select
                  value={newEmergency.priority}
                  onChange={(event) =>
                    setNewEmergency({
                      ...newEmergency,
                      priority: event.target.value as
                        | "Critical"
                        | "High"
                        | "Medium",
                    })
                  }
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={newEmergency.status}
                  onChange={(event) =>
                    setNewEmergency({
                      ...newEmergency,
                      status: event.target.value as
                        | "Active"
                        | "Responding"
                        | "Resolved",
                    })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Responding">Responding</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </label>

              <div className="emergency-form-actions">
                <button
                  type="button"
                  className="emergency-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="emergency-submit-btn">
                  Add Emergency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedEmergency && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Emergency Details</h2>

              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEmergency(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="emergency-details">
              <div>
                <strong>Emergency ID</strong>
                <p>{formatEmergencyId(selectedEmergency.id)}</p>
              </div>

              <div>
                <strong>Emergency Type</strong>
                <p>{selectedEmergency.type}</p>
              </div>

              <div>
                <strong>Location</strong>
                <p>{selectedEmergency.location}</p>
              </div>

              <div>
                <strong>Response Team</strong>
                <p>{selectedEmergency.team || "Not Assigned"}</p>
              </div>

              <div>
                <strong>Priority</strong>
                <p>{selectedEmergency.priority}</p>
              </div>

              <div>
                <strong>Status</strong>
                <p>{selectedEmergency.status}</p>
              </div>

              <div>
                <strong>Reported At</strong>
                <p>{new Date(selectedEmergency.reported_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingEmergency && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Emergency</h2>

              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmergency(null);
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPendingAction({
                  title: "Update Emergency?",
                  message: `Are you sure you want to update ${editingEmergency.type}?`,
                  warning: "This will update the emergency details.",
                  confirmLabel: "Update Emergency",
                  action: () => {
                    setPendingAction(null);
                    void handleEditEmergency();
                  },
                });
              }}
              className="emergency-edit-form"
            >
              <label>
                Emergency Type
                <input
                  type="text"
                  value={editingEmergency.type}
                  onChange={(event) =>
                    setEditingEmergency({
                      ...editingEmergency,
                      type: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Location
                <input
                  type="text"
                  value={editingEmergency.location}
                  onChange={(event) =>
                    setEditingEmergency({
                      ...editingEmergency,
                      location: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Response Team
                <input
                  type="text"
                  value={editingEmergency.team || ""}
                  onChange={(event) =>
                    setEditingEmergency({
                      ...editingEmergency,
                      team: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Priority
                <select
                  value={editingEmergency.priority}
                  onChange={(event) =>
                    setEditingEmergency({
                      ...editingEmergency,
                      priority: event.target.value as
                        | "Critical"
                        | "High"
                        | "Medium",
                    })
                  }
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={editingEmergency.status}
                  onChange={(event) =>
                    setEditingEmergency({
                      ...editingEmergency,
                      status: event.target.value as
                        | "Active"
                        | "Responding"
                        | "Resolved",
                    })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Responding">Responding</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </label>

              <button type="submit" className="emergency-submit-btn">
                Update Emergency
              </button>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete Emergency?"
          message={<>Are you sure you want to permanently delete <strong>{pendingDelete.type}</strong>?</>}
          warning="This action cannot be undone."
          confirmLabel="Delete Emergency"
          tone="danger"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleDeleteEmergency(pendingDelete.id)}
        />
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

export default Emergency;