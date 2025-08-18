import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ViewPostPage from "./pages/ViewPostPage";
import { Toaster } from "./components/ui/sonner";
import NotFoundPage from "./pages/NotFoundPage";
import SignUpPage from "./pages/SignUpPage";
import SignUpSuccessPage from "./pages/SignUpSuccessPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import AdminLogin from "./pages/admin/AdminLoginPage";
import AdminCreateArticlePage from "./pages/admin/AdminCreateArticle";
import AdminArticlePage from "./pages/admin/AdminArticlePage";
import AdminNotificationPage from "./pages/admin/AdminNotificationPage";
import AdminCategoryPage from "./pages/admin/AdminCategoryPage";
import AdminCreateCategoryPage from "./pages/admin/AdminCreateCategoryPage";
import AdminEditCategoryPage from "./pages/admin/AdminEditCategoryPage";
import AdminEditArticlePage from "./pages/admin/AdminEditArticlePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import { AuthProvider } from "./contexts/auth.jsx";
import { useAuth } from "./contexts/authContext.js";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticationRoute from "./components/AuthenticationRoute";

function AppContent() {
  const { isAuthenticated, state } = useAuth();

  return (
    <div className="App">
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
            >
              <LoginPage />
            </AuthenticationRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthenticationRoute
              isLoading={state.getUserLoading}
              isAuthenticated={isAuthenticated}
            >
              <ResetPasswordPage />
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
        
        {/* เส้นทางที่เฉพาะผู้ดูแลระบบ (admin) เข้าถึงได้ */}
        <Route
          path="/admin/login"
          element={
            <AuthenticationRoute
              isLoading={state.getUserLoading}
              isAuthenticated={isAuthenticated}
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
              <AdminDashboardPage />
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
              <AdminCreateArticlePage />
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
              <AdminArticlePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-article/:postId"
          element={
            <ProtectedRoute
              isLoading={state.getUserLoading}
              isAuthenticated={isAuthenticated}
              userRole={state.user?.role}
              requiredRole="admin"
            >
              <AdminEditArticlePage />
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
              <AdminCreateCategoryPage />
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
              <AdminCategoryPage />
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
              <AdminEditCategoryPage />
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
              <AdminNotificationPage />
            </ProtectedRoute>
          }
        />
      </Routes>
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
