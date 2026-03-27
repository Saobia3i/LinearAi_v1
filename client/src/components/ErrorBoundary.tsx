import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ opacity: 0.6, maxWidth: "400px", textAlign: "center" }}>{this.state.message || "An unexpected error occurred. Please refresh the page."}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
