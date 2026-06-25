/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a user-friendly error message
 * Prevents the entire app from crashing
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error Boundary caught an error:', error);
    console.error('   Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service (if available)
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '2rem auto',
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details open style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f3f4f6',
              borderRadius: '8px',
              textAlign: 'left',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Error Details (Development Only) - Click to expand
              </summary>
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Error Message:</strong>
                <pre style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  color: '#dc2626',
                  background: '#fff',
                  padding: '0.5rem',
                  borderRadius: '4px',
                }}>
                  {this.state.error.toString()}
                </pre>
                {this.state.error.stack && (
                  <>
                    <strong style={{ display: 'block', marginTop: '0.5rem' }}>Stack Trace:</strong>
                    <pre style={{
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      color: '#6b7280',
                      background: '#fff',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      maxHeight: '200px',
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </>
                )}
                {this.state.errorInfo?.componentStack && (
                  <>
                    <strong style={{ display: 'block', marginTop: '0.5rem' }}>Component Stack:</strong>
                    <pre style={{
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      color: '#6b7280',
                      background: '#fff',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      maxHeight: '200px',
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              marginLeft: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
