import { Link, useSearchParams } from "react-router-dom";

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const message = searchParams.get("message");

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card text-center">
          {isSuccess ? (
            <>
              <div className="success-icon">✅</div>
              <h3>Email Verified Successfully!</h3>
              <p>Your account is now active.</p>
              <Link to="/login" className="btn-primary inline-btn">
                Login Now
              </Link>
            </>
          ) : (
            <>
              <div className="error-icon">❌</div>
              <h3>Verification Failed</h3>
              <p>{message ?? "The link has expired or is invalid. Please contact support for a new link."}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
