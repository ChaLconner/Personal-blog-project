import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log additional details for ProtectedRoute errors
    if (errorInfo.componentStack.includes('ProtectedRoute')) {
      console.error('ProtectedRoute error details:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const isProtectedRouteError = this.state.error?.message?.includes('ProtectedRoute') ||
                                   this.state.error?.stack?.includes('ProtectedRoute');
      
      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isProtectedRouteError ? 'Authentication Error' : 'Something went wrong'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isProtectedRouteError
                ? 'There was an issue with authentication. Please try logging in again.'
                : 'Failed to load this component. Please try refreshing the page.'
              }
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Refresh Page
              </button>
              {isProtectedRouteError && (
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
