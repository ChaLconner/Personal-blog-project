import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth.jsx";
import { useAuth } from "@/contexts/authContext.js";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticationRoute from "@/components/AuthenticationRoute";
import LoadingSpinner, { PageLoadingSpinner } from "@/components/LoadingSpinner";

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

  return (
    <div className="App">
      <Suspense fallback={<PageLoadingSpinner />}>
        <Routes>
          {/* เส้นทางสาธารณะที่ทุกคนเข้าถึงได้ */}
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:postId" element={<ViewPostPage />} />
          <Route path="*" element={<NotFoundPage />} />

          {/* เส้นทางที่เฉพาะผู้ที่ยังไม่ล็อกอินเข้าถึงได้ */}
          <Route
            path="/signup"
            element={
              <AuthenticationRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
              >
                <SignUpPage />
              </AuthenticationRoute>
            }
          />
          <Route
            path="/signup-success"
            element={
              <AuthenticationRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
              >
                <SignUpSuccessPage />
              </AuthenticationRoute>
            }
          />
          <Route
            path="/login"
            element={
              <AuthenticationRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
              >
                <LoginPage />
              </AuthenticationRoute>
            }
          />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* เส้นทางที่เฉพาะผู้ใช้ทั่วไปที่ล็อกอินแล้วเข้าถึงได้ */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
              >
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
              >
                <ResetPasswordPage />
              </ProtectedRoute>
            }
          />
          
          {/* เส้นทางที่เฉพาะผู้ดูแลระบบ (admin) เข้าถึงได้ */}
          <Route
            path="/admin/login"
            element={
              <AuthenticationRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
              >
                <AdminLogin />
              </AuthenticationRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminDashboardPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-article"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminCreateArticlePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/article-management"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminArticlePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit-article/:id"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminEditArticlePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-category"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminCreateCategoryPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/category-management"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminCategoryPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit-category/:id"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminEditCategoryPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminNotificationPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminProfilePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reset-password"
            element={
              <ProtectedRoute
                isLoading={state.getUserLoading}
                isAuthenticated={isAuthenticated}
                userRole={state.user?.role}
                requiredRole="admin"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminResetPasswordPage />
                </Suspense>
              </ProtectedRoute>
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
