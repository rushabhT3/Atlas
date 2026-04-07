import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

/**
 * Error boundary component for catching React errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div style={{
    padding: '20px',
    margin: '20px',
    border: '1px solid #ff6b6b',
    borderRadius: '4px',
    backgroundColor: '#ffe0e0',
    color: '#d63031'
  }}>
    <h2 style={{ margin: '0 0 10px 0', color: '#d63031' }}>
      Something went wrong
    </h2>
    <details style={{ marginBottom: '10px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
        Error details
      </summary>
      <pre style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        overflow: 'auto'
      }}>
        {error?.stack || 'Unknown error'}
      </pre>
    </details>
    <button
      onClick={() => window.location.reload()}
      style={{
        padding: '8px 16px',
        backgroundColor: '#d63031',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Reload Page
    </button>
  </div>
);
