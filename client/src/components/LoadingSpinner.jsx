import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ className = "" }) {
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="mt-2 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// Page loading spinner for full page loads
export function PageLoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <div className="flex flex-col items-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading page...</p>
      </div>
    </div>
  );
}
