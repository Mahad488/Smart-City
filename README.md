# Smart City Portal

A modern smart city administration and citizen engagement platform built with **React + TypeScript + Vite** on the frontend and **Node.js + Express + MySQL** on the backend.

---

## 📁 Project Structure (Folder Organization)

```text
Smart-City-main/
├── backend/                  # Node.js + Express API Backend
│   ├── config/              # Database connection pool (db.js)
│   ├── routes/              # Express API Routes (admin, complaints, emergencies, etc.)
│   ├── utils/               # Helper utilities (mailer, etc.)
│   ├── .env                 # Environment variables (MySQL & Port config)
│   ├── .env.example         # Example environment config
│   ├── server.js            # Express server entry point
│   └── package.json         # Backend dependencies & scripts
│
├── frontend/                 # React + TypeScript + Vite Frontend
│   ├── src/                 # React source code
│   │   ├── components/      # UI components (Header, Sidebar, Modals, etc.)
│   │   ├── pages/           # Pages (Dashboard, Complaints, GIS, Citizens, etc.)
│   │   ├── config/api.ts    # Centralized API base URL config
│   │   ├── App.tsx          # Router and application shell
│   │   └── main.tsx         # React root mounting
│   ├── index.html           # Single page application HTML template
│   ├── vite.config.ts       # Vite build & plugin configuration
│   └── package.json         # Frontend dependencies & scripts
│
└── package.json             # Root runner scripts
```

---

## 🚀 Running the Project

### Option A: From Root Directory

- **Run Frontend:**
  ```powershell
  npm run dev
  # or: npm run frontend
  ```
- **Run Backend:**
  ```powershell
  npm run server
  # or: npm run backend
  ```

### Option B: From Individual Folders

- **Frontend (`frontend/`):**
  ```powershell
  cd frontend
  npm run dev
  ```
- **Backend (`backend/`):**
  ```powershell
  cd backend
  npm start
  ```

---

## ⚙️ Environment Configuration

Backend configuration file is located at `backend/.env`:

```env
PORT=5000
MYSQLHOST=127.0.0.1
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=your_password
MYSQLDATABASE=smart_city

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_city
```

---

## 🌐 Localhost URLs

- **Frontend Web App:** [http://localhost:5174/](http://localhost:5174/) (or [http://localhost:5173/](http://localhost:5173/))
- **Backend API:** [http://localhost:5000/](http://localhost:5000/)
- **API Health Check:** [http://localhost:5000/health](http://localhost:5000/health)
