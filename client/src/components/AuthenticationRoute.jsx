import { Navigate, useLocation } from "react-router-dom";

function AuthenticationRoute({ isLoading, isAuthenticated, userRole, children }) {
  const location = useLocation();
  
  // ระหว่างโหลดสถานะ ให้แสดง children ได้ (เสถียรกว่าใน flow ปัจจุบัน)
  if (isLoading === null || isLoading) return children;

  if (isAuthenticated) {
    const isAdminRoute = location.pathname.startsWith('/admin');

    // ถ้าเส้นทางเป็น admin และผู้ใช้เป็น admin -> ไปหน้า dashboard
    if (isAdminRoute && userRole === 'admin') {
      return <Navigate to="/admin/article-management" replace />;
    }
    // ถ้าเป็น admin route แต่ไม่ใช่ admin -> กลับหน้าแรก
    if (isAdminRoute && userRole !== 'admin') {
      return <Navigate to="/" replace />;
    }

    // หากตอนนี้อยู่ที่ /login และล็อกอินแล้ว ให้คำนวณปลายทางและนำทางทันที (เลี่ยงหน้าโล่ง)
    if (location.pathname === '/login') {
      const params = new URLSearchParams(location.search);
      const rawRedirect = params.get('redirect') || params.get('from') || '';
      let target = '/';
      try {
        const decoded = decodeURIComponent(rawRedirect || '');
        if (decoded && decoded.startsWith('/')) target = decoded;
      } catch {
        // ignore invalid redirect param
      }

      // กัน non-admin ถูกส่งไป admin อีกครั้ง
      if (target.startsWith('/admin') && userRole !== 'admin') {
        target = '/';
      }

      // รองรับ state.from หากไม่มี redirect param
      if (target === '/' && location.state?.from?.pathname) {
        target = location.state.from.pathname;
      }

      return <Navigate to={target} replace />;
    }

    // เคสอื่น ๆ (เช่น /signup, /signup-success) -> กลับหน้าแรกหรือโปรไฟล์ตามที่ต้องการ
    return <Navigate to="/" replace />;
  }

  // ผู้ใช้ยังไม่ได้ล็อกอิน สามารถเข้าถึงหน้านี้ได้
  return children;
}

export default AuthenticationRoute;
