import { Navigate, useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';

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

  if (isLoading === null || isLoading) {
    // สถานะกำลังโหลดข้อมูลหรือยังไม่มีข้อมูล
    return <LoadingScreen message="Verifying access permissions..." />;
  }

  // ตรวจสอบการเข้าสู่ระบบ
  if (!isAuthenticated) {
    // สร้าง return URL พร้อม query parameters
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    
    // เปลี่ยนเส้นทางไปหน้า login พร้อมเก็บ URL ปัจจุบัน
    return <Navigate 
      to={`/login?redirect=${encodeURIComponent(returnUrl)}`} 
      state={{ from: location }} 
      replace 
    />;
  }

  // ตรวจสอบ role โดยใช้ requireAdmin (backward compatibility)
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ตรวจสอบ role โดยใช้ requiredRole (flexible role checking)
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  // ผู้ใช้มีการยืนยันตัวตนและมีบทบาทที่ถูกต้อง
  return children;
};

export default ProtectedRoute;
