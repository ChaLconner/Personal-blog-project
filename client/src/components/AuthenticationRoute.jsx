import { Navigate } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";

function AuthenticationRoute({ isLoading, isAuthenticated, children }) {
  if (isLoading === null || isLoading) {
    // สถานะกำลังโหลดข้อมูลหรือยังไม่มีข้อมูล
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (isAuthenticated) {
    // ถ้าผู้ใช้ล็อกอินแล้ว ให้เปลี่ยนเส้นทางไปหน้าหลัก
    return <Navigate to="/" replace />;
  }

  // ผู้ใช้ยังไม่ได้ล็อกอิน สามารถเข้าถึงหน้านี้ได้
  return children;
}

export default AuthenticationRoute;
