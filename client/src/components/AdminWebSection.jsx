import {
    Bell,
    FileText,
    FolderOpen,
    Key,
    LogOut,
    User,
    Globe,
    Menu,
    X,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/authContext.js";

export function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        {
            to: "/admin",
            icon: Globe,
            label: "Dashboard",
            exact: true
        },
        {
            to: "/admin/article-management",
            icon: FileText,
            label: "Article management",
            paths: ["/admin/article-management", "/admin/create-article", "/admin/edit-article"]
        },
        {
            to: "/admin/category-management",
            icon: FolderOpen,
            label: "Category management",
            paths: ["/admin/category-management", "/admin/create-category", "/admin/edit-category"]
        },
        {
            to: "/admin/profile",
            icon: User,
            label: "Profile"
        },
        {
            to: "/admin/notifications",
            icon: Bell,
            label: "Notification"
        },
        {
            to: "/admin/reset-password",
            icon: Key,
            label: "Reset password"
        }
    ];

    const isMenuItemActive = (item) => {
        if (item.exact) {
            return location.pathname === item.to;
        }
        return item.paths ? item.paths.some(path => location.pathname.startsWith(path)) : location.pathname.startsWith(item.to);
    };

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                className="lg:hidden fixed top-4 right-4 z-50 p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X className="h-6 w-6 text-black" /> : <Menu className="h-6 w-6 text-black" />}
            </button>

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 right-0 lg:left-0 z-40 w-64 bg-[#F9F8F6] shadow-xl font-sans transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            }`}>
                <div className="p-4">
                    <h1 className="text-2xl font-base text-black font-poppins">
                        hh<span className="text-brand-accent">.</span>
                    </h1>
                    <p className="text-sm text-[#F2B68C] font-poppins">Admin panel</p>
                </div>
                <nav className="mt-6">
                    {menuItems.map((item) => {
                        const active = isMenuItemActive(item);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center px-4 py-3 relative transition-all duration-200 ${
                                    active
                                        ? "bg-brand-accent text-black before:absolute before:left-0 before:top-0 before:bottom-0 font-bold"
                                        : "text-black hover:bg-gray-400 hover:text-black hover:font-semibold hover:pl-6"
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Icon className={`mr-3 h-5 w-5 transition-all duration-200 ${active ? "text-black" : "text-black"}`} />
                                <span className={`font-medium text-sm transition-all duration-200 ${active ? "text-black font-bold" : "text-black"}`}>{item.label}</span>
                                {active && (
                                    <div className="absolute right-4 w-2 h-2 bg-black rounded-full"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-0 w-64 border-t border-gray-600 py-2">
                    <Link
                        to="/"
                        className="flex items-center px-4 py-3 text-black hover:bg-gray-400 hover:text-black hover:font-semibold hover:pl-6 transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <Globe className="mr-3 h-5 w-5 text-black transition-all duration-200" />
                        <span className="font-medium text-sm transition-all duration-200">Go to the website</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-black hover:bg-gray-400 hover:text-black hover:font-semibold hover:pl-6 text-left transition-all duration-200"
                    >
                        <LogOut className="mr-3 h-5 w-5 text-black transition-all duration-200" />
                        <span className="font-medium text-sm transition-all duration-200">Log out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-background bg-opacity-95 z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}