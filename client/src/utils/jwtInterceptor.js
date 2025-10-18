import axios from "axios";

function jwtInterceptor() {
  axios.interceptors.request.use((req) => {
    const hasToken = Boolean(window.localStorage.getItem("token"));

    if (hasToken) {
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${window.localStorage.getItem("token")}`,
      };
    }

    return req;
  });

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (
        error.response &&
        error.response.status === 401 &&
        error.response.data?.error?.includes("Unauthorized")
      ) {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("authToken");
        
        // Only redirect to login if the user is currently on a protected route
        // Don't redirect if they're just on the homepage
        const currentPath = window.location.pathname;
        const isProtectedRoute = currentPath.startsWith('/profile') ||
                                currentPath.startsWith('/admin') ||
                                currentPath.startsWith('/reset-password');
        
        if (isProtectedRoute) {
          window.location.replace("/login");
        }
      }
      return Promise.reject(error);
    }
  );
}

export default jwtInterceptor;
