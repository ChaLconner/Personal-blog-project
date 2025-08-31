import { Loader2 } from "lucide-react";

// Page loading spinner for full page loads
export function PageLoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <div className="flex flex-col items-center">
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading page...</p>
      </div>
    </div>
  );
}
