// Page loading spinner for full page loads
export function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default PageLoadingSpinner;


