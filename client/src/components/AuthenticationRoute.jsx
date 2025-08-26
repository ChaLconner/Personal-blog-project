import { Navigate } from "react-router-dom";

function AuthenticationRoute({ isLoading, isAuthenticated, children }) {
  // ข้าม loading state - ไม่แสดงหน้า checking authentication
  if (isLoading === null || isLoading) {
    // ถ้ายังโหลดอยู่ ให้แสดง children ไปก่อน (หรือ return null หากไม่ต้องการแสดงอะไร)
    return children;
  }

  if (isAuthenticated) {
    // ถ้าผู้ใช้ล็อกอินแล้ว ให้เปลี่ยนเส้นทางไปหน้าโปรไฟล์
    return <Navigate to="/profile" replace />;
  }

  // ผู้ใช้ยังไม่ได้ล็อกอิน สามารถเข้าถึงหน้านี้ได้
  return children;
}

export default AuthenticationRoute;
