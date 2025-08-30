import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import { Loader2 } from "lucide-react";

// HOC for wrapping lazy components
export function withLazyLoading(Component, fallback = (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    <span className="ml-2 text-sm text-gray-500">Loading...</span>
  </div>
)) {
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
