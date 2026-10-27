const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1");

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (isLocalhost
    ? "http://localhost:5000/api"
    : "https://smart-city-production-c48b.up.railway.app/api");

export default API_BASE_URL;
