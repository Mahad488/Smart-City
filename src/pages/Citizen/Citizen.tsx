import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Clock3,
  CheckCircle2,
  Search,
  Eye,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";

import { useToast } from "../../components/Toast";
import "./Citizen.css";

type CitizenRecord = {
  id: number;
  citizen_id: string;
  name: string;
  email: string;
  phone?: string;
  area?: string;
  registered_at?: string;
  status?: "Active" | "Pending" | "Inactive";
};

function Citizen() {
  const { showToast } = useToast();
  const [citizens, setCitizens] = useState<CitizenRecord[]>([]);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("All Areas");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [selectedCitizen, setSelectedCitizen] =
    useState<CitizenRecord | null>(null);

  const [deleteCitizen, setDeleteCitizen] =
    useState<CitizenRecord | null>(null);

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
  });

  // ============================
  // FETCH CITIZENS
  // ============================

  const fetchCitizens = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/citizens"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch citizens");
      }

      const data = await response.json();

      setCitizens(data);
    } catch (error) {
      console.error("Error fetching citizens:", error);
    }
  }, []);

  // ============================
  // FETCH STATS
  // ============================

  const fetchCitizenStats = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/citizens/stats/summary"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch citizen statistics");
      }

      const data = await response.json();

      setStats({
        total: Number(data.total) || 0,
        active: Number(data.active) || 0,
        pending: Number(data.pending) || 0,
        inactive: Number(data.inactive) || 0,
      });
    } catch (error) {
      console.error("Error fetching citizen stats:", error);
    }
  }, []);

  // ============================
  // REFRESH
  // ============================

  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchCitizens(),
        fetchCitizenStats(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCitizens, fetchCitizenStats]);

  // ============================
  // ACTIVATE / APPROVE
  // ============================

  const activateCitizen = async (id: number) => {
    try {
      setActionLoading(id);

      const response = await fetch(
        `http://localhost:5000/api/citizens/${id}/activate`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to activate citizen"
        );
      }

      await refreshData();

      if (selectedCitizen?.id === id) {
        setSelectedCitizen(null);
      }

      showToast("Citizen activated successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error ? error.message : "Failed to activate citizen",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================
  // DEACTIVATE
  // ============================

  const deactivateCitizen = async (id: number) => {
    try {
      setActionLoading(id);

      const response = await fetch(
        `http://localhost:5000/api/citizens/${id}/deactivate`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to deactivate citizen"
        );
      }

      await refreshData();

      if (selectedCitizen?.id === id) {
        setSelectedCitizen(null);
      }

      showToast("Citizen deactivated successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to deactivate citizen",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================
  // DELETE
  // ============================

  const handleDeleteCitizen = async () => {
    if (!deleteCitizen) return;

    try {
      setActionLoading(deleteCitizen.id);

      const response = await fetch(
        `http://localhost:5000/api/citizens/${deleteCitizen.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove citizen"
        );
      }

      setDeleteCitizen(null);
      setSelectedCitizen(null);

      await refreshData();
      showToast("Citizen removed successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error ? error.message : "Failed to remove citizen",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================
  // INITIAL LOAD
  // ============================

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // ============================
  // FILTERS
  // ============================

  const filteredCitizens = citizens.filter((citizen) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      citizen.name?.toLowerCase().includes(searchText) ||
      citizen.citizen_id?.toLowerCase().includes(searchText) ||
      citizen.email?.toLowerCase().includes(searchText) ||
      citizen.phone?.toLowerCase().includes(searchText);

    const matchesArea =
      areaFilter === "All Areas" ||
      citizen.area === areaFilter;

    const matchesStatus =
      statusFilter === "All Status" ||
      citizen.status === statusFilter;

    return matchesSearch && matchesArea && matchesStatus;
  });

  return (
    <>
      <div className="citizen-page">

        {/* =========================
            HEADER
        ========================== */}

        <div className="citizen-header">
          <div>
            <h1>Citizen Management</h1>

            <p>
              Review registered citizens and manage portal access.
            </p>
          </div>

          <button
            className="refresh-citizen-btn"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =========================
            STATS
        ========================== */}

        <div className="citizen-stats">

          <div className="citizen-stat blue">
            <div className="citizen-stat-icon">
              <Users size={22} />
            </div>

            <div>
              <span>Total Citizens</span>

              <strong>
                {stats.total.toLocaleString()}
              </strong>

              <small>Registered citizens</small>
            </div>
          </div>

          <div className="citizen-stat green">
            <div className="citizen-stat-icon">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Active Citizens</span>

              <strong>
                {stats.active.toLocaleString()}
              </strong>

              <small>Portal access enabled</small>
            </div>
          </div>

          <div className="citizen-stat purple">
            <div className="citizen-stat-icon">
              <Clock3 size={22} />
            </div>

            <div>
              <span>Pending Citizens</span>

              <strong>
                {stats.pending.toLocaleString()}
              </strong>

              <small>Awaiting approval</small>
            </div>
          </div>

          <div className="citizen-stat orange">
            <div className="citizen-stat-icon">
              <UserX size={22} />
            </div>

            <div>
              <span>Inactive Citizens</span>

              <strong>
                {stats.inactive.toLocaleString()}
              </strong>

              <small>Portal access disabled</small>
            </div>
          </div>

        </div>

        {/* =========================
            MAIN PANEL
        ========================== */}

        <div className="citizen-panel">

          {/* FILTERS */}

          <div className="citizen-toolbar">

            <div className="citizen-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search name, ID, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={areaFilter}
              onChange={(e) =>
                setAreaFilter(e.target.value)
              }
            >
              <option>All Areas</option>
              <option>Central City</option>
              <option>North District</option>
              <option>South District</option>
              <option>East Zone</option>
              <option>West Zone</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
            </select>

          </div>

          {/* =========================
              TABLE
          ========================== */}

          <div className="citizen-table-wrapper">

            <table className="citizen-table">

              <thead>
                <tr>
                  <th>Citizen</th>
                  <th>Citizen ID</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredCitizens.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                      }}
                    >
                      No citizens found.
                    </td>
                  </tr>
                ) : (
                  filteredCitizens.map((citizen) => (

                    <tr key={citizen.id}>

                      {/* CITIZEN */}

                      <td>
                        <div className="citizen-name">

                          <div className="citizen-avatar">
                            {citizen.name?.charAt(0) || "?"}
                          </div>

                          <div>
                            <strong>{citizen.name}</strong>
                            <span>{citizen.email}</span>
                          </div>

                        </div>
                      </td>

                      {/* ID */}

                      <td>
                        <span className="citizen-id">
                          {citizen.citizen_id}
                        </span>
                      </td>

                      {/* CONTACT */}

                      <td>
                        <div className="contact-info">

                          <span>
                            <Phone size={12} />
                            {citizen.phone || "N/A"}
                          </span>

                          <span>
                            <Mail size={12} />
                            {citizen.email}
                          </span>

                        </div>
                      </td>

                      {/* AREA */}

                      <td>
                        <div className="location">
                          <MapPin size={14} />
                          {citizen.area || "N/A"}
                        </div>
                      </td>

                      {/* DATE */}

                      <td>
                        <span className="registered-date">

                          {citizen.registered_at
                            ? new Date(
                                citizen.registered_at
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}

                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`status ${citizen.status?.toLowerCase()}`}
                        >
                          <i />

                          {citizen.status}
                        </span>
                      </td>

                      {/* =====================
                          ACTIONS
                      ====================== */}

                      <td>

                        <div className="admin-citizen-actions">

                          {/* VIEW */}

                          <button
                            className="action-btn view"
                            title="View Citizen"
                            onClick={() =>
                              setSelectedCitizen(citizen)
                            }
                          >
                            <Eye size={16} />
                          </button>

                          {/* PENDING */}

                          {citizen.status === "Pending" && (
                            <button
                              className="action-btn approve"
                              title="Approve Citizen"
                              disabled={
                                actionLoading === citizen.id
                              }
                              onClick={() =>
                                activateCitizen(citizen.id)
                              }
                            >
                              <UserCheck size={16} />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* ACTIVE */}

                          {citizen.status === "Active" && (
                            <button
                              className="action-btn deactivate"
                              title="Deactivate Citizen"
                              disabled={
                                actionLoading === citizen.id
                              }
                              onClick={() =>
                                deactivateCitizen(
                                  citizen.id
                                )
                              }
                            >
                              <UserX size={16} />
                              <span>Deactivate</span>
                            </button>
                          )}

                          {/* INACTIVE */}

                          {citizen.status === "Inactive" && (
                            <button
                              className="action-btn approve"
                              title="Activate Citizen"
                              disabled={
                                actionLoading === citizen.id
                              }
                              onClick={() =>
                                activateCitizen(citizen.id)
                              }
                            >
                              <UserCheck size={16} />
                              <span>Activate</span>
                            </button>
                          )}

                          {/* DELETE */}

                          <button
                            className="action-btn delete"
                            title="Remove Citizen"
                            onClick={() =>
                              setDeleteCitizen(citizen)
                            }
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

          {/* FOOTER */}

          <div className="table-footer">

            <span>
              Showing {filteredCitizens.length} of{" "}
              {stats.total.toLocaleString()} citizens
            </span>

          </div>

        </div>

      </div>

      {/* ==========================================
          VIEW CITIZEN MODAL
      =========================================== */}

      {selectedCitizen && (

        <div className="citizen-modal-overlay">

          <div className="citizen-modal citizen-view-modal">

            <div className="citizen-modal-header">

              <div>
                <h2>Citizen Details</h2>
                <p>Registered citizen information</p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedCitizen(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="citizen-profile">

              <div className="citizen-profile-top">

                <div className="citizen-profile-avatar">
                  {selectedCitizen.name.charAt(0)}
                </div>

                <div>
                  <h3>{selectedCitizen.name}</h3>

                  <span
                    className={`status ${selectedCitizen.status?.toLowerCase()}`}
                  >
                    <i />
                    {selectedCitizen.status}
                  </span>
                </div>

              </div>

              <div className="citizen-details-grid">

                <div>
                  <label>Citizen ID</label>
                  <strong>
                    {selectedCitizen.citizen_id}
                  </strong>
                </div>

                <div>
                  <label>Email</label>
                  <strong>
                    {selectedCitizen.email}
                  </strong>
                </div>

                <div>
                  <label>Phone</label>
                  <strong>
                    {selectedCitizen.phone || "N/A"}
                  </strong>
                </div>

                <div>
                  <label>Area</label>
                  <strong>
                    {selectedCitizen.area || "N/A"}
                  </strong>
                </div>

                <div>
                  <label>Registered</label>

                  <strong>
                    {selectedCitizen.registered_at
                      ? new Date(
                          selectedCitizen.registered_at
                        ).toLocaleString()
                      : "N/A"}
                  </strong>
                </div>

                <div>
                  <label>Portal Access</label>

                  <strong>
                    {selectedCitizen.status === "Active"
                      ? "Allowed"
                      : "Blocked"}
                  </strong>
                </div>

              </div>

              {/* MODAL ACTIONS */}

              <div className="citizen-profile-actions">

                {selectedCitizen.status === "Pending" && (
                  <button
                    className="approve-citizen-btn"
                    onClick={() =>
                      activateCitizen(
                        selectedCitizen.id
                      )
                    }
                  >
                    <UserCheck size={17} />
                    Approve Citizen
                  </button>
                )}

                {selectedCitizen.status === "Inactive" && (
                  <button
                    className="approve-citizen-btn"
                    onClick={() =>
                      activateCitizen(
                        selectedCitizen.id
                      )
                    }
                  >
                    <UserCheck size={17} />
                    Activate Citizen
                  </button>
                )}

                {selectedCitizen.status === "Active" && (
                  <button
                    className="deactivate-citizen-btn"
                    onClick={() =>
                      deactivateCitizen(
                        selectedCitizen.id
                      )
                    }
                  >
                    <UserX size={17} />
                    Deactivate
                  </button>
                )}

                <button
                  className="delete-citizen-btn"
                  onClick={() => {
                    setDeleteCitizen(
                      selectedCitizen
                    );
                  }}
                >
                  <Trash2 size={17} />
                  Remove Citizen
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          DELETE CONFIRM MODAL
      =========================================== */}

      {deleteCitizen && (

        <div className="citizen-modal-overlay delete-overlay">

          <div className="citizen-modal delete-modal">

            <div className="delete-icon">
              <Trash2 size={25} />
            </div>

            <h2>Remove Citizen?</h2>

            <p>
              Are you sure you want to permanently remove{" "}
              <strong>
                {deleteCitizen.name}
              </strong>
              ?
            </p>

            <p className="delete-warning">
              This action cannot be undone.
            </p>

            <div className="delete-modal-actions">

              <button
                className="cancel-btn"
                onClick={() =>
                  setDeleteCitizen(null)
                }
              >
                Cancel
              </button>

              <button
                className="confirm-delete-btn"
                disabled={
                  actionLoading === deleteCitizen.id
                }
                onClick={handleDeleteCitizen}
              >
                <Trash2 size={16} />

                {actionLoading === deleteCitizen.id
                  ? "Removing..."
                  : "Remove Citizen"}
              </button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}

export default Citizen;