import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api, { saveToken } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const body = new URLSearchParams();
      body.append("username", formData.username);
      body.append("password", formData.password);

      const response = await api.post("/login", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      saveToken(response.data.access_token);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to log in.");
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">LeafLogic</p>
          <h1>Log in</h1>
          <p className="muted">Track manual plant care data and spot useful trends over time.</p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Username
            <input name="username" value={formData.username} onChange={handleChange} required />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="icon-button"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit">Log in</button>
        </form>

        <p className="muted">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
