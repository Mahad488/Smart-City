import React, { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Layers,
  Building2,
  AlertTriangle,
  Truck,
  LocateFixed,
  CircleAlert,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "../../components/Toast";
import "./GIS.css";

interface Department {
  id: number;
  name: string;
  category: string;
  officer: string;
  phone: string;
  email: string;
  cases: number;
  performance: number;
  status: "Active" | "Under Review";
  latitude: number | null;
  longitude: number | null;
}

interface Asset {
  id: number;
  name: string;
  department: string;
  location: string;
  status: "Active" | "Maintenance" | "Available";
  condition_status: "Good" | "Fair" | "Needs Repair";
  latitude: number | null;
  longitude: number | null;
}

interface Emergency {
  id: number;
  type: string;
  location: string;
  team: string | null;
  priority: "Critical" | "High" | "Medium";
  status: "Active" | "Responding" | "Resolved";
  reported_at: string;
  latitude: number | null;
  longitude: number | null;
}

interface Complaint {
  id: number;
  category: string;
  description: string;
  location: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Resolved";
  latitude: number | null;
  longitude: number | null;
}

interface LocationItem {
  id: string;
  name: string;
  type: "department" | "asset" | "emergency" | "complaint";
  location: string;
  lat: number;
  lng: number;
}

interface NearbyLocation {
  id: number;
  name?: string;
  type: "department" | "asset" | "emergency" | "complaint";
  location?: string;
  latitude: number | null;
  longitude: number | null;
  distance_km?: number | string | null;
  category?: string;
  department?: string;
  status?: string;
  priority?: string;
  description?: string;
}

const defaultCenter: [number, number] = [33.6844, 73.0479];

const createCategoryIcon = (color: string, icon: string) =>
  L.divIcon({
    className: "category-map-marker",
    html: `
      <div
        class="category-marker-pin"
        style="--marker-color: ${color};"
      >
        <div class="category-marker-icon">
          ${icon}
        </div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -45],
  });

const departmentIcon = createCategoryIcon(
  "#16a34a",
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
    <path d="M3 21h18"/>
    <path d="M5 21V5l7-3 7 3v16"/>
    <path d="M9 9h1"/>
    <path d="M14 9h1"/>
    <path d="M9 13h1"/>
    <path d="M14 13h1"/>
  </svg>`
);

const assetIcon = createCategoryIcon(
  "#2563eb",
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
    <path d="M5 17h14"/>
    <path d="M6 17V9h12v8"/>
    <path d="M8 9V6h8v3"/>
    <circle cx="8" cy="18" r="2"/>
    <circle cx="16" cy="18" r="2"/>
  </svg>`
);

const emergencyIcon = createCategoryIcon(
  "#f97316",
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
    <path d="M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>`
);

const complaintIcon = createCategoryIcon(
  "#dc2626",
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
    <path d="M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>`
);

const currentLocationIcon = L.divIcon({
  className: "current-location-marker",
  html: `
    <div class="current-location-dot">
      <div class="current-location-pulse"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapControllerProps {
  location: [number, number] | null;
}

interface MapBoundsControllerProps {
  locations: LocationItem[];
}

const MapController: React.FC<MapControllerProps> = ({
  location,
}) => {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo(location, 15, {
        duration: 1.5,
      });
    }
  }, [location, map]);

  return null;
};

const MapBoundsController: React.FC<MapBoundsControllerProps> = ({
  locations,
}) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    const bounds = L.latLngBounds(
      locations.map((item) => [item.lat, item.lng] as [number, number])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 13,
    });
  }, [locations, map]);

  return null;
};

const GIS: React.FC = () => {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [activeLayer, setActiveLayer] = useState("All");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepartments, setShowDepartments] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showComplaints, setShowComplaints] = useState(true);
  const [showCurrentLocation, setShowCurrentLocation] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  const [userLocation, setUserLocation] =
    useState<[number, number] | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(false);
  const [nearbyLocations, setNearbyLocations] =
    useState<NearbyLocation[]>([]);

  useEffect(() => {
    const fetchGISData = async () => {
      try {
        setLoading(true);

        const [
          departmentsRes,
          assetsRes,
          emergenciesRes,
          complaintsRes,
        ] = await Promise.all([
          fetch("http://localhost:5000/api/departments"),
          fetch("http://localhost:5000/api/assets"),
          fetch("http://localhost:5000/api/emergencies"),
          fetch("http://localhost:5000/api/complaints"),
        ]);

        if (!departmentsRes.ok) {
          throw new Error("Failed to fetch departments");
        }

        if (!assetsRes.ok) {
          throw new Error("Failed to fetch assets");
        }

        if (!emergenciesRes.ok) {
          throw new Error("Failed to fetch emergencies");
        }

        if (!complaintsRes.ok) {
          throw new Error("Failed to fetch complaints");
        }

        const departmentsData = await departmentsRes.json();
        const assetsData = await assetsRes.json();
        const emergenciesData = await emergenciesRes.json();
        const complaintsData = await complaintsRes.json();

        setDepartments(departmentsData);
        setAssets(assetsData);
        setEmergencies(emergenciesData);
        setComplaints(complaintsData);
      } catch (error) {
        console.error("GIS data loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchGISData();
  }, []);

  const locations: LocationItem[] = [
    ...departments
      .filter(
        (item) => item.latitude !== null && item.longitude !== null
      )
      .map((item) => ({
        id: `department-${item.id}`,
        name: item.name,
        type: "department" as const,
        location: item.category || "Department",
        lat: Number(item.latitude),
        lng: Number(item.longitude),
      })),
    ...assets
      .filter(
        (item) => item.latitude !== null && item.longitude !== null
      )
      .map((item) => ({
        id: `asset-${item.id}`,
        name: item.name,
        type: "asset" as const,
        location: item.location,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
      })),
    ...emergencies
      .filter(
        (item) => item.latitude !== null && item.longitude !== null
      )
      .map((item) => ({
        id: `emergency-${item.id}`,
        name: item.type,
        type: "emergency" as const,
        location: item.location,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
      })),
    ...complaints
      .filter(
        (item) => item.latitude !== null && item.longitude !== null
      )
      .map((item) => ({
        id: `complaint-${item.id}`,
        name: item.category,
        type: "complaint" as const,
        location: item.location,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
      })),
  ];

  if (loading) {
    return (
      <div className="gis-page">
        <div className="gis-no-results">Loading map locations...</div>
      </div>
    );
  }

  const filteredLocations = locations.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());

    const matchesLayer =
      activeLayer === "All" || item.type === activeLayer;

    return matchesSearch && matchesLayer;
  });

  const filteredLocationIds = new Set(
    filteredLocations.map((item) => item.id)
  );

  const shouldShowMarker = (
    type: LocationItem["type"],
    id: number
  ) => {
    const visibleByLayer =
      type === "department"
        ? showDepartments
        : type === "asset"
        ? showAssets
        : type === "emergency"
        ? showEmergencies
        : showComplaints;

    return visibleByLayer && filteredLocationIds.has(`${type}-${id}`);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLocation([lat, lng]);

        try {
          const response = await fetch(
            `http://localhost:5000/api/gis/nearby?lat=${lat}&lng=${lng}&radius=5`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch nearby locations");
          }

          const data = await response.json();
          console.log("Nearby GIS locations:", data);
          setNearbyLocations(data.locations || []);
        } catch (error) {
          console.error("Nearby GIS error:", error);
          setNearbyLocations([]);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        setLocationLoading(false);

        if (error.code === 1) {
          showToast(
            "Location permission was denied. Please allow location access.",
            "error"
          );
        } else if (error.code === 2) {
          showToast(
            "Your location is currently unavailable.",
            "error"
          );
        } else if (error.code === 3) {
          showToast(
            "Location request timed out. Please try My Location again.",
            "error"
          );
        } else {
          showToast("Unable to get your location.", "error");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="gis-page">
      <div className="gis-header">
        <div>
          <h1>GIS & City Map</h1>
          <p>
            Explore and monitor city locations, assets and
            services
          </p>
        </div>

        <button
          className="manage-layers-btn"
          onClick={() => setShowLayerPanel(!showLayerPanel)}
        >
          <Layers size={16} />
          Manage Layers
        </button>

        {showLayerPanel && (
          <div className="layers-panel">
            <div className="layers-panel-header">
              <div>
                <h3>Manage Layers</h3>
                <span>Choose what appears on the map</span>
              </div>

              <button
                type="button"
                className="layers-close-btn"
                onClick={() => setShowLayerPanel(false)}
              >
                ✕
              </button>
            </div>

            <div className="layer-option">
              <label>
                <input
                  type="checkbox"
                  checked={showDepartments}
                  onChange={(event) => setShowDepartments(event.target.checked)}
                />
                <Building2 size={16} />
                <span>Departments</span>
              </label>
            </div>

            <div className="layer-option">
              <label>
                <input
                  type="checkbox"
                  checked={showAssets}
                  onChange={(event) => setShowAssets(event.target.checked)}
                />
                <Truck size={16} />
                <span>Assets</span>
              </label>
            </div>

            <div className="layer-option">
              <label>
                <input
                  type="checkbox"
                  checked={showEmergencies}
                  onChange={(event) => setShowEmergencies(event.target.checked)}
                />
                <AlertTriangle size={16} />
                <span>Emergencies</span>
              </label>
            </div>

            <div className="layer-option">
              <label>
                <input
                  type="checkbox"
                  checked={showComplaints}
                  onChange={(event) =>
                    setShowComplaints(event.target.checked)
                  }
                />

                <CircleAlert size={16} />

                <span>Complaints</span>
              </label>
            </div>

            <div className="layer-option">
              <label>
                <input
                  type="checkbox"
                  checked={showCurrentLocation}
                  onChange={(event) =>
                    setShowCurrentLocation(event.target.checked)
                  }
                />
                <LocateFixed size={16} />
                <span>Current Location</span>
              </label>
            </div>

            <div className="layers-actions">
              <button
                type="button"
                onClick={() => {
                  setShowDepartments(true);
                  setShowAssets(true);
                  setShowEmergencies(true);
                  setShowComplaints(true);
                  setShowCurrentLocation(true);
                }}
              >
                Show All
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDepartments(false);
                  setShowAssets(false);
                  setShowEmergencies(false);
                  setShowComplaints(false);
                  setShowCurrentLocation(false);
                }}
              >
                Hide All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="gis-stats">
        <div className="gis-stat">
          <div className="gis-stat-icon blue">
            <MapPin size={20} />
          </div>

          <div>
            <span>Mapped Locations</span>
            <strong>{locations.length}</strong>
            <small>City locations</small>
          </div>
        </div>

        <div className="gis-stat">
          <div className="gis-stat-icon green">
            <Building2 size={20} />
          </div>

          <div>
            <span>Departments</span>
            <strong>
              {
                locations.filter(
                  (item) => item.type === "department"
                ).length
              }
            </strong>
            <small>Mapped departments</small>
          </div>
        </div>

        <div className="gis-stat">
          <div className="gis-stat-icon orange">
            <Truck size={20} />
          </div>

          <div>
            <span>Assets</span>
            <strong>
              {
                locations.filter(
                  (item) => item.type === "asset"
                ).length
              }
            </strong>
            <small>Mapped assets</small>
          </div>
        </div>

        <div className="gis-stat">
          <div className="gis-stat-icon red">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>Incidents</span>
            <strong>
              {
                locations.filter(
                  (item) => item.type === "emergency"
                ).length
              }
            </strong>
            <small>Active locations</small>
          </div>
        </div>
      </div>

      <div className="gis-panel">
        <div className="gis-toolbar">
          <div className="gis-search">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search location..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="gis-filters">
            {[
              "All",
              "emergency",
              "complaint",
              "asset",
              "department",
            ].map((layer) => (
              <button
                key={layer}
                className={
                  activeLayer === layer
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveLayer(layer)
                }
              >
                {layer === "All"
                  ? layer
                  : layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="gis-content">
          <div className="gis-map">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="real-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                location={userLocation}
              />

              <MapBoundsController locations={locations} />

              {departments
                  .filter(
                    (item) =>
                      item.latitude !== null &&
                      item.longitude !== null &&
                      shouldShowMarker("department", item.id)
                  )
                  .map((item) => (
                    <Marker
                      key={`department-${item.id}`}
                      position={[Number(item.latitude), Number(item.longitude)]}
                      icon={departmentIcon}
                    >
                      <Popup>
                        <div className="gis-popup">
                          <div className="gis-popup-title">
                            <Building2 size={18} />
                            <strong>{item.name}</strong>
                          </div>

                          <div className="gis-popup-type">Department</div>

                          <div className="gis-popup-row">
                            <span>Category</span>
                            <strong>{item.category}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Officer</span>
                            <strong>{item.officer}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Phone</span>
                            <strong>{item.phone}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Status</span>
                            <strong className="popup-status active">
                              {item.status}
                            </strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Performance</span>
                            <strong>{item.performance}%</strong>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

              {assets
                  .filter(
                    (item) =>
                      item.latitude !== null &&
                      item.longitude !== null &&
                      shouldShowMarker("asset", item.id)
                  )
                  .map((item) => (
                    <Marker
                      key={`asset-${item.id}`}
                      position={[Number(item.latitude), Number(item.longitude)]}
                      icon={assetIcon}
                    >
                      <Popup>
                        <div className="gis-popup">
                          <div className="gis-popup-title">
                            <Truck size={18} />
                            <strong>{item.name}</strong>
                          </div>

                          <div className="gis-popup-type">City Asset</div>

                          <div className="gis-popup-row">
                            <span>Department</span>
                            <strong>{item.department}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Location</span>
                            <strong>{item.location}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Condition</span>
                            <strong>{item.condition_status}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Status</span>
                            <strong className="popup-status active">
                              {item.status}
                            </strong>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

              {emergencies
                  .filter(
                    (item) =>
                      item.latitude !== null &&
                      item.longitude !== null &&
                      shouldShowMarker("emergency", item.id)
                  )
                  .map((item) => (
                    <Marker
                      key={`emergency-${item.id}`}
                      position={[Number(item.latitude), Number(item.longitude)]}
                      icon={emergencyIcon}
                    >
                      <Popup>
                        <div className="gis-popup">
                          <div className="gis-popup-title emergency-popup-title">
                            <AlertTriangle size={18} />
                            <strong>{item.type}</strong>
                          </div>

                          <div className="gis-popup-type">Emergency Incident</div>

                          <div className="gis-popup-row">
                            <span>Location</span>
                            <strong>{item.location}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Priority</span>
                            <strong className="popup-priority">
                              {item.priority}
                            </strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Status</span>
                            <strong className="popup-status active">
                              {item.status}
                            </strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Response Team</span>
                            <strong>{item.team || "Not assigned"}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Reported</span>
                            <strong>{item.reported_at}</strong>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

              {complaints
                  .filter(
                    (item) =>
                      item.latitude !== null &&
                      item.longitude !== null &&
                      shouldShowMarker("complaint", item.id)
                  )
                  .map((item) => (
                    <Marker
                      key={`complaint-${item.id}`}
                      position={[
                        Number(item.latitude),
                        Number(item.longitude),
                      ]}
                      icon={complaintIcon}
                    >
                      <Popup>
                        <div className="gis-popup">
                          <div className="gis-popup-title complaint-popup-title">
                            <CircleAlert size={18} />
                            <strong>{item.category}</strong>
                          </div>

                          <div className="gis-popup-type">Citizen Complaint</div>

                          <div className="gis-popup-row">
                            <span>Location</span>
                            <strong>{item.location}</strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Priority</span>
                            <strong className="popup-priority">
                              {item.priority}
                            </strong>
                          </div>

                          <div className="gis-popup-row">
                            <span>Status</span>
                            <strong className="popup-status">
                              {item.status}
                            </strong>
                          </div>

                          <div className="gis-popup-description">
                            <span>Description</span>
                            <p>{item.description}</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

              {nearbyLocations
                .filter(
                  (item) =>
                    item.latitude !== null &&
                    item.longitude !== null
                )
                .map((item) => (
                  <Marker
                    key={`nearby-${item.type}-${item.id}`}
                    position={[
                      Number(item.latitude),
                      Number(item.longitude),
                    ]}
                    icon={
                      item.type === "department"
                        ? departmentIcon
                        : item.type === "asset"
                        ? assetIcon
                        : item.type === "emergency"
                        ? emergencyIcon
                        : complaintIcon
                    }
                  >
                    <Popup>
                      <div className="gis-popup">
                        <div className="gis-popup-title">
                          <strong>{item.name || item.type}</strong>
                        </div>
                        <div className="gis-popup-type">
                          Nearby {item.type}
                        </div>
                        <div className="gis-popup-row">
                          <span>Location</span>
                          <strong>{item.location || "N/A"}</strong>
                        </div>
                        <div className="gis-popup-row">
                          <span>Distance</span>
                          <strong>
                            {item.distance_km !== undefined
                              ? `${Number(item.distance_km).toFixed(2)} km`
                              : "Within 5 km"}
                          </strong>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {showCurrentLocation && userLocation && (
                <Marker
                  position={userLocation}
                  icon={currentLocationIcon}
                >
                  <Popup>
                    <strong>Your Current Location</strong>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            <button
              className="gis-location-btn"
              onClick={getCurrentLocation}
              title="Show my current location"
              disabled={locationLoading}
            >
              <LocateFixed size={17} />

              {locationLoading
                ? "Locating..."
                : "My Location"}
            </button>
          </div>

          <div className="gis-sidebar">
            <div className="gis-sidebar-header">
              <h3>Locations</h3>
              <span>
                {filteredLocations.length}
              </span>
            </div>

            <div className="gis-location-list">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((item) => (
                  <div
                    className="gis-location"
                    key={item.id}
                  >
                    <div
                      className={`location-icon ${item.type.toLowerCase()}`}
                    >
                      {item.type === "emergency" && (
                        <AlertTriangle size={15} />
                      )}

                      {item.type === "complaint" && (
                        <CircleAlert size={15} />
                      )}

                      {item.type === "asset" && (
                        <Truck size={15} />
                      )}

                      {item.type === "department" && (
                        <Building2 size={15} />
                      )}
                    </div>

                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.location}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="gis-no-results">
                  No locations found
                </div>
              )}
            </div>

            <div className="gis-legend">
              <h3>Map Legend</h3>

              <div>
                <i className="legend hospital"></i>
                Hospital
              </div>

              <div>
                <i className="legend emergency"></i>
                Emergency
              </div>

              <div>
                <i className="legend asset"></i>
                Asset
              </div>

              <div>
                <i className="legend complaint"></i>
                Complaint
              </div>

              <div>
                <i className="legend department"></i>
                Department
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GIS;