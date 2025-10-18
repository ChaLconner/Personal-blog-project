import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth.jsx";
import { useAuth } from "@/contexts/authContext.js";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticationRoute from "@/components/AuthenticationRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load all pages
// Public pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const ViewPostPage = lazy(() => import("@/pages/ViewPostPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Auth pages
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const SignUpSuccessPage = lazy(() => import("@/pages/SignUpSuccessPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));

// User pages
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));

// Admin pages
const AdminLogin = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminCreateArticlePage = lazy(() => import("@/pages/admin/AdminCreateArticle"));
const AdminArticlePage = lazy(() => import("@/pages/admin/AdminArticlePage"));
const AdminNotificationPage = lazy(() => import("@/pages/admin/AdminNotificationPage"));
const AdminCategoryPage = lazy(() => import("@/pages/admin/AdminCategoryPage"));
const AdminCreateCategoryPage = lazy(() => import("@/pages/admin/AdminCreateCategoryPage"));
const AdminEditCategoryPage = lazy(() => import("@/pages/admin/AdminEditCategoryPage"));
const AdminEditArticlePage = lazy(() => import("@/pages/admin/AdminEditArticlePage"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminProfilePage = lazy(() => import("@/pages/admin/AdminProfilePage"));
const AdminResetPasswordPage = lazy(() => import("@/pages/admin/AdminResetPasswordPage"));

function AppContent() {
  const { isAuthenticated, state } = useAuth();

  // Only show loading if we have a token and are checking it
  const hasToken = localStorage.getItem("token") || localStorage.getItem("authToken");
  if (state.getUserLoading === true && hasToken && !state.user && window.location.pathname !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Suspense>
          <Routes>
          {/* เส้นทางสาธารณะที่ทุกคนเข้าถึงได้ */}
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:id" element={<ViewPostPage />} />
          <Route path="*" element={<NotFoundPage />} />
          
          {/* เส้นทางที่เฉพาะผู้ที่ยังไม่ล็อกอินเข้าถึงได้ */}
          <Route
            path="/signup"
            element={
              <ErrorBoundary>
                <AuthenticationRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                >
                  <SignUpPage />
                </AuthenticationRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/signup-success"
            element={
              <ErrorBoundary>
                <AuthenticationRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                >
                  <SignUpSuccessPage />
                </AuthenticationRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={
              <ErrorBoundary>
                <AuthenticationRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                >
                  <LoginPage />
                </AuthenticationRoute>
              </ErrorBoundary>
            }
          />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* เส้นทางที่เฉพาะผู้ใช้ทั่วไปที่ล็อกอินแล้วเข้าถึงได้ */}
          <Route
            path="/profile"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                >
                  <ProfilePage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                >
                  <ResetPasswordPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          
          {/* เส้นทางที่เฉพาะผู้ดูแลระบบ (admin) เข้าถึงได้ */}
          <Route
            path="/admin/login"
            element={
              <ErrorBoundary>
                <AuthenticationRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                >
                  <AdminLogin />
                </AuthenticationRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminDashboardPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/create-article"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminCreateArticlePage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/article-management"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminArticlePage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/edit-article/:id"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminEditArticlePage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/create-category"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminCreateCategoryPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/category-management"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminCategoryPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/edit-category/:id"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminEditCategoryPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminNotificationPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminProfilePage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/reset-password"
            element={
              <ErrorBoundary>
                <ProtectedRoute
                  isLoading={state.getUserLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={state.user?.role}
                  requiredRole="admin"
          >
            <AdminResetPasswordPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          </Routes>
        </Suspense>
        <Toaster
          toastOptions={{
            unstyled: true,
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
