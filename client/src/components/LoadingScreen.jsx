const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-gray-600 text-lg font-medium">{message}</p>
    </div>
  </div>
);

export default LoadingScreen;
