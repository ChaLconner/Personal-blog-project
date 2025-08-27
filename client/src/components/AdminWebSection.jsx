import {
    Bell,
    FileText,
    FolderOpen,
    Key,
    LogOut,
    User,
    Globe,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

export function AdminSidebar() {
    const location = useLocation();

    // Helper function to check if the current path starts with the base path
    const isActive = (basePath) => location.pathname.startsWith(basePath);

    return (
        <aside className="w-64 bg-card shadow-md">
            <div className="p-4">
                <h1 className="text-2xl font-bold text-foreground">
                    Thomson P<span className="text-brand-accent">.</span>
                </h1>
                <p className="text-sm text-brand-secondary">Admin panel</p>
            </div>
            <nav className="mt-6">
                <Link
                    to="/admin"
                    className={`flex items-center px-4 py-2 ${location.pathname === "/admin"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                >
                    <Globe className="mr-3 h-5 w-5" />
                    Dashboard
                </Link>
                <Link
                    to="/admin/article-management"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/article-management") || isActive("/admin/create-article") || isActive("/admin/edit-article")
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                >
                    <FileText className="mr-3 h-5 w-5" />
                    Article management
                </Link>
                <Link
                    to="/admin/category-management"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/category-management") || isActive("/admin/create-category") || isActive("/admin/edit-category")
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                >
                    <FolderOpen className="mr-3 h-5 w-5" />
                    Category management
                </Link>
                <Link
                    to="/admin/profile"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/profile")
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                >
                    <User className="mr-3 h-5 w-5" />
                    Profile
                </Link>
                <Link
                    to="/admin/notifications"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/notifications")
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                >
                    <Bell className="mr-3 h-5 w-5" />
                    Notification
                </Link>
                <Link
                    to="/admin/reset-password"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/reset-password")
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                >
                    <Key className="mr-3 h-5 w-5" />
                    Reset password
                </Link>
            </nav>
            <div className="absolute bottom-0 w-64 border-t border-border py-2">
                <Link
                    to="/"
                    className="flex items-center px-4 py-2 text-muted-foreground hover:bg-muted/50"
                >
                    <Globe className="mr-3 h-5 w-5" />
                    Go to the website
                </Link>
                <Link
                    to="/"
                    className="flex items-center px-4 py-2 text-muted-foreground hover:bg-muted/50"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Log out
                </Link>
            </div>
        </aside>
    );
}