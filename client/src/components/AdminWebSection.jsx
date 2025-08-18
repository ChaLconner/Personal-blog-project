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
        <aside className="w-64 bg-white shadow-md">
            <div className="p-4">
                <h1 className="text-2xl font-bold">
                    Thomson P<span className="text-green-400">.</span>
                </h1>
                <p className="text-sm text-orange-400">Admin panel</p>
            </div>
            <nav className="mt-6">
                <Link
                    to="/admin"
                    className={`flex items-center px-4 py-2 ${location.pathname === "/admin"
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    <Globe className="mr-3 h-5 w-5" />
                    Dashboard
                </Link>
                <Link
                    to="/admin/article-management"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/article-management") || isActive("/admin/create-article") || isActive("/admin/edit-article")
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    <FileText className="mr-3 h-5 w-5" />
                    Article management
                </Link>
                <Link
                    to="/admin/category-management"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/category-management") || isActive("/admin/create-category") || isActive("/admin/edit-category")
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    <FolderOpen className="mr-3 h-5 w-5" />
                    Category management
                </Link>
                <Link
                    to="/profile"
                    className={`flex items-center px-4 py-2 ${isActive("/profile")
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    <User className="mr-3 h-5 w-5" />
                    Profile
                </Link>
                <Link
                    to="/admin/notifications"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/notification")
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    <Bell className="mr-3 h-5 w-5" />
                    Notification
                </Link>
                <Link
                    to="/admin/reset-password"
                    className={`flex items-center px-4 py-2 ${isActive("/admin/reset-password")
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    <Key className="mr-3 h-5 w-5" />
                    Reset password
                </Link>
            </nav>
            <div className="absolute bottom-0 w-64 border-t border-gray-200 py-2">
                <Link
                    to="/"
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                    <Globe className="mr-3 h-5 w-5" />
                    Go to the website
                </Link>
                <Link
                    to="/"
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Log out
                </Link>
            </div>
        </aside>
    );
}