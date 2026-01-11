import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" data-surface="error">
          <div className="error-boundary-content">
            <div className="error-sigil" aria-hidden="true">⚠</div>
            <h1 className="error-title">The Ritual Has Failed</h1>
            <p className="error-message">
              A disturbance in the aetheric field has disrupted the arcane interface.
            </p>

            {this.props.showDetails && this.state.error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button
                type="button"
                className="grimoire-button"
                onClick={this.handleReset}
              >
                <span className="button-sigil">↻</span>
                Return to Sanctuary
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
