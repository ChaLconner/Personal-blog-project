import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProtectedAction = ({ 
  children, 
  requireAuth = true,
  fallback = null,
  action = "perform this action" // เพิ่ม prop สำหรับอธิบาย action
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleUnauthorizedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // แสดง toast แนะนำให้ล็อกอิน
    toast.error(`Please log in to ${action}`, {
      position: "bottom-right",
      duration: 3000,
      action: {
        label: "Login",
        onClick: () => {
          // นำผู้ใช้ไปหน้า login โดยเก็บ current page ไว้
          const currentPath = window.location.pathname;
          navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
        },
      },
    });
  };

  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    // Return a wrapper that shows login prompt on click
    return (
      <div onClick={handleUnauthorizedClick} className="cursor-pointer">
        {children}
      </div>
    );
  }

  // User is authenticated, render children normally
  return children;
};

export default ProtectedAction;
