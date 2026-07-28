import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ 
  isLoading,
  isAuthenticated,
  userRole,
  requiredRole,
  children,
  // Backward compatibility props
  requireAdmin = false
}) => {
  const location = useLocation();
  
  // Ensure all props have default values to prevent undefined errors
  const safeIsLoading = isLoading === null || isLoading === undefined ? false : isLoading;
  const safeIsAuthenticated = Boolean(isAuthenticated);
  const safeUserRole = userRole || null;
  const safeRequiredRole = requiredRole || null;
  
  const hasStoredToken = (() => {
    try {
      return Boolean(
        (typeof window !== 'undefined') &&
        (localStorage.getItem('token') || localStorage.getItem('authToken'))
      );
    } catch {
      return false;
    }
  })();

  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (safeIsLoading || (hasStoredToken && !safeIsAuthenticated)) {
      timeoutId = setTimeout(() => {
        setAuthTimeout(true);
      }, 10000); // 10 seconds
    }
    return () => clearTimeout(timeoutId);
  }, [safeIsLoading, hasStoredToken, safeIsAuthenticated]);

  if (authTimeout) {
    // If it takes more than 10 seconds, clear tokens and redirect
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    const isAdminPath = location.pathname.startsWith('/admin');
    const loginPath = isAdminPath ? '/admin/login' : '/login';
    return <Navigate to={`${loginPath}?redirect=${encodeURIComponent(returnUrl)}`} state={{ from: location }} replace />;
  }

  // Avoid redirects while auth is resolving or when a token exists but state hasn't authenticated yet
  if (safeIsLoading || (hasStoredToken && !safeIsAuthenticated)) {
    // แสดง loading แบบ inline แทน LoadingScreen
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // ตรวจสอบการเข้าสู่ระบบ
  if (!safeIsAuthenticated) {
    // สร้าง return URL พร้อม query parameters
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    
    // ตรวจสอบว่า path ปัจจุบันเป็น admin path หรือไม่
    const isAdminPath = location.pathname.startsWith('/admin');
    
    // เปลี่ยนเส้นทางไปหน้า login ที่เหมาะสมตาม role พร้อมเก็บ URL ปัจจุบัน
    const loginPath = isAdminPath ? '/admin/login' : '/login';
    return <Navigate
      to={`${loginPath}?redirect=${encodeURIComponent(returnUrl)}`}
      state={{ from: location }}
      replace
    />;
  }

  // ตรวจสอบ role โดยใช้ requireAdmin (backward compatibility)
  if (requireAdmin && safeUserRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ตรวจสอบ role โดยใช้ requiredRole (flexible role checking)
  if (safeRequiredRole && safeUserRole !== safeRequiredRole) {
    // For role mismatch, send to home instead of login to prevent confusing redirects
    return <Navigate to="/" replace />;
  }

  // ผู้ใช้มีการยืนยันตัวตนและมีบทบาทที่ถูกต้อง
  return children;
};

export default ProtectedRoute;
