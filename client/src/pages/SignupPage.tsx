import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

export function SignupPage() {
  const { signupAction } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await signupAction({ fullName, email, password, confirmPassword });
      navigate(`/register-success?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setMessage(getErrorMessage(error, "Signup failed"));
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

          <p className="auth-title">Create your account</p>
          <p className="auth-subtitle">Join the automation store</p>
          <div className="auth-divider" />

          {message && <div className="alert-error">{message}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                className="form-input"
                placeholder="Your full name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                className="form-input"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
