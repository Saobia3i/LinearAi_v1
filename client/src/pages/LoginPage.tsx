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
          <div className="brand">
            <h2>
              Linear <span className="accent">AI</span>
            </h2>
          </div>
          <h3>Login</h3>

          {info ? <div className="alert-info">{info}</div> : null}
          {message ? <div className="alert-error">{message}</div> : null}

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
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group-inline">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{" "}
                Remember Me
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="auth-link">
            New user? <Link to="/signup">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
