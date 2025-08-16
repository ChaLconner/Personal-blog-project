// ตัวอย่างการใช้งาน Protected Routes แบบต่างๆ

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthenticationRoute from '@/components/AuthenticationRoute';
import { useAuth } from '@/contexts/authContext.js';

export default function ExampleRoutes() {
  const { isAuthenticated, state } = useAuth();

  return (
    <Routes>
      {/* 1. หน้าที่ต้องการให้เฉพาะผู้ที่ยังไม่ได้ล็อกอิน */}
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

      {/* 2. หน้าที่ต้องการให้เฉพาะผู้ที่ล็อกอินแล้ว */}
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

      {/* 3. หน้าที่ต้องการให้เฉพาะ Admin (แบบใหม่) */}
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

      {/* 4. หน้าที่ต้องการให้เฉพาะ Admin (แบบเก่า - Backward compatibility) */}
      <Route
        path="/admin-old"
        element={
          <ProtectedRoute
            isLoading={state.getUserLoading}
            isAuthenticated={isAuthenticated}
            userRole={state.user?.role}
            requireAdmin={true}
          >
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 5. หน้าที่ต้องการให้เฉพาะ role อื่นๆ เช่น moderator */}
      <Route
        path="/moderator"
        element={
          <ProtectedRoute
            isLoading={state.getUserLoading}
            isAuthenticated={isAuthenticated}
            userRole={state.user?.role}
            requiredRole="moderator"
          >
            <ModeratorPage />
          </ProtectedRoute>
        }
      />

      {/* 6. หน้าที่ต้องการให้เฉพาะ user ทั่วไป */}
      <Route
        path="/user-dashboard"
        element={
          <ProtectedRoute
            isLoading={state.getUserLoading}
            isAuthenticated={isAuthenticated}
            userRole={state.user?.role}
            requiredRole="user"
          >
            <UserDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Mock components for examples
const LoginPage = () => <div>Login Page</div>;
const ProfilePage = () => <div>Profile Page</div>;
const AdminDashboardPage = () => <div>Admin Dashboard</div>;
const ModeratorPage = () => <div>Moderator Page</div>;
const UserDashboardPage = () => <div>User Dashboard</div>;
