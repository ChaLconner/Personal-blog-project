import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";

const ProtectedAction = ({ 
  children, 
  requireAuth = true, 
  action = "perform this action",
  fallback = null 
}) => {
  const { isAuthenticated } = useAuth();

  const handleUnauthorizedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error(`Please log in to ${action}`, {
        position: "bottom-right",
        duration: 4000,
        action: {
          label: "Login",
          onClick: () => {
            // Get current page URL for redirect after login
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      });
    }
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
