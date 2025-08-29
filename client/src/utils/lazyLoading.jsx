import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import LoadingSpinner from "./LoadingSpinner";

// HOC for wrapping lazy components
export function withLazyLoading(Component, fallback = <LoadingSpinner />) {
  return function LazyWrapper(props) {
    return (
      <ErrorBoundary>
        <React.Suspense fallback={fallback}>
          <Component {...props} />
        </React.Suspense>
      </ErrorBoundary>
    );
  };
}
