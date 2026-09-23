import React, { useEffect, useState } from "react";
import {
  Package,
  CheckCircle2,
  Wrench,
  Search,
  MapPin,
  Eye,
  MoreVertical,
  X,
} from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";
import "./Assets.css";

interface Asset {
  id: string | number;
  name: string;
  department: string;
  location: string;
  status: "Active" | "Maintenance" | "Available";
  condition: "Good" | "Fair" | "Needs Repair";
  condition_status?: "Good" | "Fair" | "Needs Repair";
}

interface AssetApiItem {
  id?: string | number;
  name?: string;
  department?: string;
  location?: string;
  status?: "Active" | "Maintenance" | "Available";
  condition?: "Good" | "Fair" | "Needs Repair";
  condition_status?: "Good" | "Fair" | "Needs Repair";
}

const initialAssets: Asset[] = [
  {
    id: "AST-001",
    name: "Garbage Collection Truck",
    department: "Waste Management",
    location: "Sector F-8",
    status: "Active",
    condition: "Good",
  },
  {
    id: "AST-002",
    name: "Street Cleaning Vehicle",
    department: "Sanitation",
    location: "Sector G-9",
    status: "Maintenance",
    condition: "Needs Repair",
  },
  {
    id: "AST-003",
    name: "Water Tanker",
    department: "Water Management",
    location: "Sector I-10",
    status: "Available",
    condition: "Good",
  },
  {
    id: "AST-004",
    name: "Road Maintenance Truck",
    department: "Roads & Infrastructure",
    location: "Sector H-8",
    status: "Active",
    condition: "Good",
  },
  {
    id: "AST-005",
    name: "Emergency Response Vehicle",
    department: "Emergency Services",
    location: "Blue Area",
    status: "Active",
    condition: "Fair",
  },
];

const Assets: React.FC = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    department: "",
    location: "",
    status: "Available" as Asset["status"],
    condition: "Good" as Asset["condition"],
  });
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    message: string;
    warning: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);

  const fetchAssets = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/assets");

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

      const data: AssetApiItem[] = await response.json();
      const mappedAssets: Asset[] = data.map((item) => ({
        id: item.id ?? "",
        name: item.name ?? "Unknown Asset",
        department: item.department ?? "Unknown Department",
        location: item.location ?? "Unknown Location",
        status: item.status ?? "Available",
        condition: item.condition_status ?? item.condition ?? "Good",
        condition_status: item.condition_status ?? item.condition ?? "Good",
      }));

      setAssets(mappedAssets);
    } catch (error) {
      console.error("Fetch assets error:", error);
      setAssets(initialAssets);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadAssets = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/assets");

        if (!response.ok) {
          throw new Error("Failed to fetch assets");
        }

        const data: AssetApiItem[] = await response.json();
        const mappedAssets: Asset[] = data.map((item) => ({
          id: item.id ?? "",
          name: item.name ?? "Unknown Asset",
          department: item.department ?? "Unknown Department",
          location: item.location ?? "Unknown Location",
          status: item.status ?? "Available",
          condition: item.condition_status ?? item.condition ?? "Good",
          condition_status: item.condition_status ?? item.condition ?? "Good",
        }));

        if (isActive) {
          setAssets(mappedAssets);
        }
      } catch (error) {
        console.error("Fetch assets error:", error);

        if (isActive) {
          setAssets(initialAssets);
        }
      }
    };

    loadAssets();

    return () => {
      isActive = false;
    };
  }, []);

  const handleDeleteAsset = async (id: number | string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/assets/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to delete asset");
        return;
      }

      fetchAssets();
      setPendingDelete(null);
    } catch (error) {
      console.error("Delete asset error:", error);
    }
  };

  const handleEditAsset = async () => {
    if (!editingAsset) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/assets/${editingAsset.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingAsset.name,
            department: editingAsset.department,
            location: editingAsset.location,
            status: editingAsset.status,
            condition_status:
              editingAsset.condition_status ?? editingAsset.condition,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to update asset");
        return;
      }

      setEditingAsset(null);
      setPendingAction(null);
      fetchAssets();
    } catch (error) {
      console.error("Update asset error:", error);
    }
  };

  const handleAddAsset = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newAsset.name,
          department: newAsset.department,
          location: newAsset.location,
          status: newAsset.status,
          condition_status: newAsset.condition,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to create asset");
        return;
      }

      setNewAsset({
        name: "",
        department: "",
        location: "",
        status: "Available",
        condition: "Good",
      });
      setIsAddModalOpen(false);
      setPendingAction(null);
      fetchAssets();
    } catch (error) {
      console.error("Create asset error:", error);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      String(asset.id).toLowerCase().includes(search.toLowerCase()) ||
      asset.department.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      status === "All Status" || asset.status === status;

    return matchesSearch && matchesStatus;
  });

  const totalAssets = assets.length;
  const activeAssets = assets.filter(
    (asset) => asset.status === "Active"
  ).length;
  const maintenanceAssets = assets.filter(
    (asset) => asset.status === "Maintenance"
  ).length;
  const availableAssets = assets.filter(
    (asset) => asset.status === "Available"
  ).length;

  return (
    <div className="assets-page">
      <div className="assets-header">
        <div>
          <h1>Assets Management</h1>
          <p>Manage and monitor city assets and equipment</p>
        </div>

        <button
          className="add-asset-btn"
          onClick={() => setIsAddModalOpen(true)}
          type="button"
        >
          <Package size={16} />
          Add Asset
        </button>
      </div>

      <div className="asset-stats">
        <div className="asset-stat">
          <div className="asset-stat-icon blue">
            <Package size={21} />
          </div>
          <div>
            <span>Total Assets</span>
            <strong>{totalAssets}</strong>
            <small>Registered assets</small>
          </div>
        </div>

        <div className="asset-stat">
          <div className="asset-stat-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Active Assets</span>
            <strong>{activeAssets}</strong>
            <small>Currently in use</small>
          </div>
        </div>

        <div className="asset-stat">
          <div className="asset-stat-icon orange">
            <Wrench size={21} />
          </div>
          <div>
            <span>Maintenance</span>
            <strong>{maintenanceAssets}</strong>
            <small>Under maintenance</small>
          </div>
        </div>

        <div className="asset-stat">
          <div className="asset-stat-icon purple">
            <Package size={21} />
          </div>
          <div>
            <span>Available</span>
            <strong>{availableAssets}</strong>
            <small>Ready for use</small>
          </div>
        </div>
      </div>

      <div className="assets-panel">
        <div className="assets-toolbar">
          <div className="asset-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search assets..."
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
            <option>Maintenance</option>
            <option>Available</option>
          </select>
        </div>

        <div className="assets-table-wrapper">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Department</th>
                <th>Location</th>
                <th>Status</th>
                <th>Condition</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={String(asset.id)}>
                    <td>
                      <div className="asset-name">
                        <div className="asset-icon">
                          <Package size={16} />
                        </div>

                        <div>
                          <strong>{asset.name}</strong>
                          <span>{asset.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{asset.department}</td>

                    <td>
                      <div className="asset-location">
                        <MapPin size={13} />
                        {asset.location}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`asset-status ${asset.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        <i></i>
                        {asset.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`asset-condition ${asset.condition
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {asset.condition}
                      </span>
                    </td>

                    <td>
                      <div className="asset-actions">
                        <button
                          title="View"
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          title="Edit"
                          onClick={() => setEditingAsset(asset)}
                        >
                          <MoreVertical size={14} />
                        </button>

                        <button
                          title="Delete"
                          className="delete-btn"
                          onClick={() => setPendingDelete(asset)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="no-assets">
                      <Package size={28} />
                      <p>No assets found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="assets-footer">
          <span>
            Showing {filteredAssets.length} of {totalAssets} assets
          </span>

          <div className="asset-pagination">
            <button>‹</button>
            <button className="current">1</button>
            <button>›</button>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div
          className="asset-modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="asset-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="asset-modal-header">
              <div>
                <h2>Add Asset</h2>
                <p>Create a new asset record</p>
              </div>

              <button
                className="asset-modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPendingAction({
                  title: "Add Asset?",
                  message: `Are you sure you want to add ${newAsset.name}?`,
                  warning: "This will add a new asset to the system.",
                  confirmLabel: "Add Asset",
                  action: () => {
                    setPendingAction(null);
                    void handleAddAsset();
                  },
                });
              }}
            >
              <div className="asset-form-group">
                <label>Asset Name</label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="asset-form-row">
                <div className="asset-form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={newAsset.department}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        department: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="asset-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newAsset.location}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, location: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="asset-form-row">
                <div className="asset-form-group">
                  <label>Status</label>
                  <select
                    value={newAsset.status}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        status: e.target.value as Asset["status"],
                      })
                    }
                  >
                    <option>Available</option>
                    <option>Active</option>
                    <option>Maintenance</option>
                  </select>
                </div>

                <div className="asset-form-group">
                  <label>Condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        condition: e.target.value as Asset["condition"],
                      })
                    }
                  >
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Needs Repair</option>
                  </select>
                </div>
              </div>

              <div className="asset-modal-actions">
                <button
                  type="button"
                  className="asset-cancel-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="asset-save-btn">
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAsset && (
        <div
          className="asset-modal-overlay"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="asset-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="asset-modal-header">
              <div>
                <h2>{selectedAsset.name}</h2>
                <p>
                  AST-
                  {String(selectedAsset.id).padStart(3, "0")}
                </p>
              </div>

              <button
                className="asset-modal-close"
                onClick={() => setSelectedAsset(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="asset-details">
              <div className="asset-detail-item">
                <span>Department</span>
                <strong>{selectedAsset.department}</strong>
              </div>

              <div className="asset-detail-item">
                <span>Location</span>
                <strong>{selectedAsset.location}</strong>
              </div>

              <div className="asset-detail-item">
                <span>Status</span>
                <strong>{selectedAsset.status}</strong>
              </div>

              <div className="asset-detail-item">
                <span>Condition</span>
                <strong>
                  {selectedAsset.condition_status ?? selectedAsset.condition}
                </strong>
              </div>
            </div>

            <div className="asset-modal-actions">
              <button
                type="button"
                className="asset-cancel-btn"
                onClick={() => setSelectedAsset(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAsset && (
        <div
          className="asset-modal-overlay"
          onClick={() => setEditingAsset(null)}
        >
          <div
            className="asset-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="asset-modal-header">
              <div>
                <h2>Edit Asset</h2>
                <p>
                  AST-
                  {String(editingAsset.id).padStart(3, "0")}
                </p>
              </div>

              <button
                className="asset-modal-close"
                onClick={() => setEditingAsset(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPendingAction({
                  title: "Update Asset?",
                  message: `Are you sure you want to update ${editingAsset.name}?`,
                  warning: "This will update the asset details.",
                  confirmLabel: "Update Asset",
                  action: () => {
                    setPendingAction(null);
                    void handleEditAsset();
                  },
                });
              }}
            >
              <div className="asset-form-group">
                <label>Asset Name</label>

                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) =>
                    setEditingAsset({
                      ...editingAsset,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="asset-form-row">
                <div className="asset-form-group">
                  <label>Department</label>

                  <input
                    type="text"
                    value={editingAsset.department}
                    onChange={(e) =>
                      setEditingAsset({
                        ...editingAsset,
                        department: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="asset-form-group">
                  <label>Location</label>

                  <input
                    type="text"
                    value={editingAsset.location}
                    onChange={(e) =>
                      setEditingAsset({
                        ...editingAsset,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="asset-form-row">
                <div className="asset-form-group">
                  <label>Status</label>

                  <select
                    value={editingAsset.status}
                    onChange={(e) =>
                      setEditingAsset({
                        ...editingAsset,
                        status: e.target.value as Asset["status"],
                      })
                    }
                  >
                    <option>Available</option>
                    <option>Active</option>
                    <option>Maintenance</option>
                  </select>
                </div>

                <div className="asset-form-group">
                  <label>Condition</label>

                  <select
                    value={
                      editingAsset.condition_status ?? editingAsset.condition
                    }
                    onChange={(e) =>
                      setEditingAsset({
                        ...editingAsset,
                        condition: e.target.value as Asset["condition"],
                        condition_status:
                          e.target.value as Asset["condition"],
                      })
                    }
                  >
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Needs Repair</option>
                  </select>
                </div>
              </div>

              <div className="asset-modal-actions">
                <button
                  type="button"
                  className="asset-cancel-btn"
                  onClick={() => setEditingAsset(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="asset-save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete Asset?"
          message={<>Are you sure you want to permanently delete <strong>{pendingDelete.name}</strong>?</>}
          warning="This action cannot be undone."
          confirmLabel="Delete Asset"
          tone="danger"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleDeleteAsset(pendingDelete.id)}
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

export default Assets;