import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar/Sidebar";
import Header from "./components/Header/Header";

import Dashboard from "./pages/Dashboard/Dashboard";
import Departments from "./pages/Departments/Departments";
import Citizen from "./pages/Citizen/Citizen";
import Complaints from "./pages/Complaints/Complaints";
import Assets from "./pages/Assets/Assets";
import Emergency from "./pages/Emergency/Emergency";
import GIS from "./pages/GIS/GIS";
import Analytics from "./pages/Analytics/Analytics";
import Notifications from "./pages/Notifications/Notifications";
import Settings from "./pages/Settings/Settings";

import CitizenAuth from "./pages/Citizen/CitizenAuth";
import CitizenPortal from "./pages/Citizen/CitizenPortal";
import AdminAuth from "./pages/AdminAuth/AdminAuth";
import { ToastProvider } from "./components/Toast";

import "./App.css";

function AdminLayout() {
  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Header />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/citizens" element={<Citizen />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/gis" element={<GIS />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/admin-login" element={<AdminAuth />} />
          <Route path="/citizen-login" element={<CitizenAuth />} />
          <Route path="/citizen-portal" element={<CitizenPortal />} />
          <Route path="*" element={<AdminLayout />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;