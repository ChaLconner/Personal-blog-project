import { Navigate, useLocation } from "react-router-dom";

function AuthenticationRoute({ isLoading, isAuthenticated, userRole, children }) {
  const location = useLocation();
  
  // ข้าม loading state - ไม่แสดงหน้า checking authentication
  if (isLoading === null || isLoading) {
    // ถ้ายังโหลดอยู่ ให้แสดง children ไปก่อน (หรือ return null หากไม่ต้องการแสดงอะไร)
    return children;
  }

  if (isAuthenticated) {
    // ตรวจสอบว่าเป็น admin route หรือไม่
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    if (isAdminRoute && userRole === 'admin') {
      // ถ้าเป็น admin route และผู้ใช้มี role admin ให้ redirect ไป admin dashboard
      return <Navigate to="/admin/article-management" replace />;
    } else if (isAdminRoute && userRole !== 'admin') {
      // ถ้าเป็น admin route แต่ผู้ใช้ไม่ใช่ admin ให้ redirect ไปหน้าแรก
      return <Navigate to="/" replace />;
    } else if (location.pathname === '/login') {
      // ถ้าเป็นหน้า login ไม่ต้อง redirect ทันที ให้ LoginPage จัดการเอง
      // เพื่อป้องกัน flash ของหน้า profile
      return null;
    } else {
      // สำหรับหน้าอื่นๆ เช่น signup ให้ redirect ไปหน้าโปรไฟล์
      return <Navigate to="/profile" replace />;
    }
  }

  // ผู้ใช้ยังไม่ได้ล็อกอิน สามารถเข้าถึงหน้านี้ได้
  return children;
}

export default AuthenticationRoute;
