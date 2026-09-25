import React, { useEffect, useState } from "react";
import {
  Building2,
  Search,
  Users,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  ArrowUpRight,
  X,
} from "lucide-react";

import ConfirmModal from "../../components/ConfirmModal";
import "./Departments.css";

interface Department {
  id: number;
  name: string;
  category: string;
  officer: string;
  phone: string;
  email: string;
  cases: number;
  performance: number;
  description?: string;
  status: "Active" | "Under Review";
  created_at?: string;
}

interface DepartmentForm {
  name: string;
  category: string;
  officer: string;
  phone: string;
  email: string;
  cases: number;
  performance: number;
  description: string;
  status: "Active" | "Under Review";
}

const emptyForm: DepartmentForm = {
  name: "",
  category: "Utilities",
  officer: "",
  phone: "",
  email: "",
  cases: 0,
  performance: 0,
  description: "",
  status: "Active",
};

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [detailDepartment, setDetailDepartment] =
    useState<Department | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    title: string;
    message: string;
    warning?: string;
    confirmLabel: string;
    tone: "danger" | "primary";
    action: () => void;
  } | null>(null);

  // Fetch departments from MySQL through backend
  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/departments"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }

      const data = await response.json();

      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadDepartments = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/departments"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch departments");
        }

        const data = await response.json();

        if (!ignore) {
          setDepartments(data);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadDepartments();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, confirmed = false) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const isEditMode = selectedDepartment !== null;

    if (!confirmed) {
      setPendingConfirmation({
        title: isEditMode ? "Update Department?" : "Add Department?",
        message: isEditMode
          ? `Are you sure you want to update ${form.name}?`
          : `Are you sure you want to add ${form.name}?`,
        warning: isEditMode
          ? "This will update the department details."
          : "This will add a new department to the system.",
        confirmLabel: isEditMode ? "Update Department" : "Add Department",
        tone: "primary",
        action: () => {
          void handleSubmit(e, true);
        },
      });
      return;
    }

    try {
      setSaving(true);

      const url = isEditMode
        ? `https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/departments/${selectedDepartment.id}`
        : "https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/departments";

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          officer: form.officer,
          phone: form.phone,
          email: form.email,
          cases: Number(form.cases),
          performance: Number(form.performance),
          description: form.description,
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditMode
              ? "Failed to update department"
              : "Failed to create department")
        );
      }

      setShowModal(false);
      setSelectedDepartment(null);
      setForm(emptyForm);
      setPendingConfirmation(null);

      // Refresh departments from MySQL
      await fetchDepartments();
    } catch (error) {
      console.error(
        selectedDepartment !== null
          ? "Error updating department:"
          : "Error creating department:",
        error
      );

    } finally {
      setSaving(false);
    }
  };

  // Delete department
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/departments/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete department");
      }

      setDepartments((prev) =>
        prev.filter((department) => department.id !== id)
      );

      setSelectedDepartment(null);
      setPendingConfirmation(null);
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };

  const handleEdit = (department: Department) => {
    setForm({
      name: department.name,
      category: department.category,
      officer: department.officer || "",
      phone: department.phone || "",
      email: department.email || "",
      cases: Number(department.cases || 0),
      performance: Number(department.performance || 0),
      description: department.description || "",
      status: department.status,
    });

    setDetailDepartment(null);
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const filteredDepartments = departments.filter((department) => {
    const matchesSearch =
      department.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (department.officer || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      category === "All Categories" ||
      department.category === category;

    return matchesSearch && matchesCategory;
  });

  const totalDepartments = departments.length;

  const activeDepartments = departments.filter(
    (department) => department.status === "Active"
  ).length;

  const activeCases = departments.reduce(
    (total, department) => total + Number(department.cases || 0),
    0
  );

  const underReview = departments.filter(
    (department) => department.status === "Under Review"
  ).length;

  return (
    <div className="departments-page">

      {/* Header */}
      <div className="departments-header">
        <div>
          <h1>Government Departments</h1>
          <p>
            Manage city departments, officers and departmental performance.
          </p>
        </div>

        <button
          className="add-department-btn"
          onClick={() => {
            setDetailDepartment(null);
            setSelectedDepartment(null);
            setForm(emptyForm);
            setShowModal(true);
          }}
        >
          <Building2 size={17} />
          Add Department
        </button>
      </div>

      {/* Statistics */}
      <div className="department-stats">

        <div className="department-stat">
          <div className="stat-icon blue">
            <Building2 size={22} />
          </div>

          <div>
            <span>Total Departments</span>
            <strong>{totalDepartments}</strong>
            <small>Across the city</small>
          </div>
        </div>

        <div className="department-stat">
          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Active Departments</span>
            <strong>{activeDepartments}</strong>
            <small>
              {totalDepartments > 0
                ? `${((activeDepartments / totalDepartments) * 100).toFixed(1)}% active`
                : "0% active"}
            </small>
          </div>
        </div>

        <div className="department-stat">
          <div className="stat-icon purple">
            <ClipboardList size={22} />
          </div>

          <div>
            <span>Active Cases</span>
            <strong>{activeCases}</strong>
            <small>Currently open</small>
          </div>
        </div>

        <div className="department-stat">
          <div className="stat-icon orange">
            <AlertCircle size={22} />
          </div>

          <div>
            <span>Under Review</span>
            <strong>{underReview}</strong>
            <small>Needs attention</small>
          </div>
        </div>

      </div>

      {/* Main Panel */}
      <div className="departments-panel">

        {/* Toolbar */}
        <div className="departments-toolbar">

          <div className="department-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search department or officer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Utilities</option>
            <option>Public Safety</option>
            <option>Environment</option>
            <option>Public Services</option>
            <option>Healthcare</option>
            <option>Development</option>
            <option>Education</option>
          </select>

        </div>

        {/* Department Cards */}
        <div className="department-grid">

          {loading ? (
            <div className="no-departments">
              <p>Loading departments...</p>
            </div>
          ) : (
            filteredDepartments.map((department) => (
              <div
                className="department-card"
                key={department.id}
              >

                <div className="department-card-top">

                  <div className="department-icon">
                    <Building2 size={21} />
                  </div>

                  <span
                    className={`department-status ${department.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    <i />
                    {department.status}
                  </span>

                </div>

                <div className="department-info">

                  <span className="department-category">
                    {department.category}
                  </span>

                  <h2>{department.name}</h2>

                  <div className="department-officer">
                    <Users size={14} />
                    <span>
                      {department.officer || "No officer assigned"}
                    </span>
                  </div>

                </div>

                <div className="department-contact">

                  <span>
                    <Phone size={13} />
                    {department.phone || "No phone"}
                  </span>

                  <span>
                    <Mail size={13} />
                    {department.email || "No email"}
                  </span>

                </div>

                <div className="department-metrics">

                  <div>
                    <span>Active Cases</span>
                    <strong>{department.cases}</strong>
                  </div>

                  <div>
                    <span>Performance</span>
                    <strong>{department.performance}%</strong>
                  </div>

                </div>

                <div className="performance-bar">
                  <div
                    style={{
                      width: `${department.performance}%`,
                    }}
                  />
                </div>

                <div className="department-card-actions">
                  <button
                    className="view-department-btn"
                    onClick={() => {
                      setDetailDepartment(department);
                      setSelectedDepartment(null);
                      setShowModal(false);
                    }}
                  >
                    View Details
                    <ArrowUpRight size={14} />
                  </button>

                  <button
                    className="edit-department-btn"
                    onClick={() => handleEdit(department)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-department-btn"
                    onClick={() =>
                      setPendingConfirmation({
                        title: "Delete Department?",
                        message: `Are you sure you want to permanently delete ${department.name}?`,
                        warning: "This action cannot be undone.",
                        confirmLabel: "Delete Department",
                        tone: "danger",
                        action: () => {
                          void handleDelete(department.id);
                        },
                      })
                    }
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))
          )}

        </div>

        {!loading && filteredDepartments.length === 0 && (
          <div className="no-departments">
            <Building2 size={35} />
            <p>No departments found.</p>
          </div>
        )}

        {/* Footer */}
        <div className="departments-footer">
          Showing {filteredDepartments.length} of {totalDepartments} departments
        </div>

      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div
          className="department-modal-overlay"
          onClick={() => {
            setSelectedDepartment(null);
            setForm(emptyForm);
            setShowModal(false);
          }}
        >
          <div
            className="department-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="department-modal-header">
              <div>
                <h2>{selectedDepartment ? "Edit Department" : "Add Department"}</h2>
                <p>
                  {selectedDepartment
                    ? "Update department information."
                    : "Create a new government department."}
                </p>
              </div>

              <button
                className="department-modal-close"
                onClick={() => {
                  setSelectedDepartment(null);
                  setForm(emptyForm);
                  setShowModal(false);
                }}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="department-form-grid">

                <div className="department-form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Transport Department"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="department-form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>Utilities</option>
                    <option>Public Safety</option>
                    <option>Environment</option>
                    <option>Public Services</option>
                    <option>Healthcare</option>
                    <option>Development</option>
                    <option>Education</option>
                  </select>
                </div>

                <div className="department-form-group">
                  <label>Officer</label>
                  <input
                    type="text"
                    placeholder="Officer name"
                    value={form.officer}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        officer: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="department-form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="department-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="department@city.gov"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="department-form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as
                          | "Active"
                          | "Under Review",
                      })
                    }
                  >
                    <option>Active</option>
                    <option>Under Review</option>
                  </select>
                </div>

                <div className="department-form-group">
                  <label>Active Cases</label>
                  <input
                    type="number"
                    min="0"
                    value={form.cases}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cases: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="department-form-group">
                  <label>Performance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.performance}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        performance: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="department-form-group full">
                  <label>Description</label>
                  <textarea
                    placeholder="Department description..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

              </div>

              <div className="department-form-actions">

                <button
                  type="button"
                  className="department-cancel-btn"
                  onClick={() => {
                    setSelectedDepartment(null);
                    setForm(emptyForm);
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="department-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : selectedDepartment
                    ? "Update Department"
                    : "Create Department"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {detailDepartment && (
        <div
          className="department-modal-overlay"
          onClick={() => setDetailDepartment(null)}
        >
          <div
            className="department-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="department-modal-header">
              <div>
                <h2>{detailDepartment.name}</h2>
                <p>Department Details</p>
              </div>

              <button
                className="department-modal-close"
                onClick={() => setDetailDepartment(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="department-details">

              <div className="department-detail-item">
                <span>Category</span>
                <strong>{detailDepartment.category}</strong>
              </div>

              <div className="department-detail-item">
                <span>Status</span>
                <strong>{detailDepartment.status}</strong>
              </div>

              <div className="department-detail-item">
                <span>Officer</span>
                <strong>{detailDepartment.officer || "Not assigned"}</strong>
              </div>

              <div className="department-detail-item">
                <span>Phone</span>
                <strong>{detailDepartment.phone || "Not available"}</strong>
              </div>

              <div className="department-detail-item">
                <span>Email</span>
                <strong>{detailDepartment.email || "Not available"}</strong>
              </div>

              <div className="department-detail-item">
                <span>Active Cases</span>
                <strong>{detailDepartment.cases}</strong>
              </div>

              <div className="department-detail-item">
                <span>Performance</span>
                <strong>{detailDepartment.performance}%</strong>
              </div>

              <div className="department-detail-description">
                <span>Description</span>
                <p>
                  {detailDepartment.description ||
                    "No description available."}
                </p>
              </div>

            </div>

            <div className="department-form-actions">
              <button
                type="button"
                className="department-cancel-btn"
                onClick={() => setDetailDepartment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingConfirmation && (
        <ConfirmModal
          title={pendingConfirmation.title}
          message={pendingConfirmation.message}
          warning={pendingConfirmation.warning}
          confirmLabel={pendingConfirmation.confirmLabel}
          tone={pendingConfirmation.tone}
          loading={saving}
          onCancel={() => setPendingConfirmation(null)}
          onConfirm={pendingConfirmation.action}
        />
      )}

    </div>
  );
};

export default Departments;