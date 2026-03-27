import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { loginAction } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const info = searchParams.get("email")
    ? `Verification email sent to ${searchParams.get("email")}.`
    : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await loginAction({ email, password, rememberMe });
      navigate("/home");
    } catch (error) {
      setMessage(getErrorMessage(error, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">

          <div className="auth-brand">
            <img
              src="https://ik.imagekit.io/ekb0d0it0/avif%20favicon.avif"
              alt="Linear AI"
              className="auth-brand-logo"
            />
            <p className="auth-brand-name">Linear <span>AI</span></p>
          </div>

          <p className="auth-title">Welcome back</p>
          <p className="auth-subtitle">Sign in to your account</p>
          <div className="auth-divider" />

          {info && <div className="alert-info">{info}</div>}
          {message && <div className="alert-error">{message}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group-inline">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe" style={{ textTransform: "none", letterSpacing: 0, fontSize: "0.8rem" }}>
                Remember me
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-link">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
