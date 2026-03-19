import { Link, useSearchParams } from "react-router-dom";

export function RegisterSuccessPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card text-center">
          <div className="success-icon">✉️</div>
          <h3>Email Verification Sent</h3>
          <p>
            We sent a confirmation link to <strong>{email ?? "your email"}</strong>.
          </p>
          <p>Check your email and click the link to verify your account.</p>
          <Link to="/login" className="btn-primary inline-btn">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
