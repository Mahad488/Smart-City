import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import "./AdminAuth.css";

const readJsonResponse = async (response: Response) => {
  const responseText = await response.text();

  try {
    return responseText ? (JSON.parse(responseText) as Record<string, any>) : {};
  } catch {
    throw new Error(
      response.ok
        ? "Server returned an invalid response."
        : `Login API error (${response.status}). Please restart the backend server.`
    );
  }
};

function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("https://smart-city-backend-16ly-qaxrjy16l-m-92de.vercel.app/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Admin login failed");
      }

      if (!data.admin) {
        throw new Error("Admin information was not returned by the server");
      }

      localStorage.setItem("admin", JSON.stringify(data.admin));
      window.location.href = "/";
    } catch (error) {
      console.error("Admin login error:", error);
      setMessage(
        error instanceof Error ? error.message : "Unable to login as admin"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <div className="admin-auth-icon">
          <ShieldCheck size={30} />
        </div>
        <h1>Admin Login</h1>
        <p>Sign in to manage Smart City services.</p>

        <form onSubmit={handleLogin}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@smartcity.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          {message && <p className="admin-auth-error">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminAuth;
