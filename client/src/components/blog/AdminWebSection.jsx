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
    LayoutDashboard,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/authContext";

export function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        {
            to: "/admin",
            icon: LayoutDashboard,
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
                className="lg:hidden fixed top-4 right-4 z-50 p-2 text-[#26231E] cursor-pointer hover:opacity-75 transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar */}
            <aside className={`fixed lg:relative inset-y-0 right-0 lg:right-auto lg:left-0 z-40 w-[280px] shrink-0 bg-[#EFEEEB] border-r border-[#DAD6D1] font-poppins h-full flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            }`}>
                <div className="flex-1 overflow-y-auto py-6">
                    <div className="px-6 mb-8">
                        <button onClick={() => navigate("/")} className="text-left cursor-pointer focus:outline-none">
                            <h1 className="text-3xl font-semibold text-[#26231E] tracking-tight">
                                hh<span className="text-[#12B379]">.</span>
                            </h1>
                            <p className="text-xs text-[#F2B68C] font-medium tracking-wide mt-1 uppercase">Admin Panel</p>
                        </button>
                    </div>
                    <nav className="space-y-1.5 px-3">
                        {menuItems.map((item) => {
                            const active = isMenuItemActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center px-4 h-12 rounded-xl text-sm font-medium transition-all duration-150 ${
                                        active
                                            ? "bg-[#DAD6D1] text-[#26231E] shadow-sm font-semibold"
                                            : "text-[#75716B] hover:bg-[#F9F8F6]/80 hover:text-[#26231E]"
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Icon className={`mr-3.5 h-5 w-5 ${active ? "text-[#26231E]" : "text-[#75716B]"}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="w-[280px] border-t border-[#DAD6D1] p-3 shrink-0 bg-[#EFEEEB] space-y-1">
                    <Link
                        to="/"
                        className="flex items-center px-4 h-11 rounded-xl text-sm text-[#75716B] hover:bg-[#F9F8F6]/80 hover:text-[#26231E] transition-all duration-150"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <Globe className="mr-3.5 h-4 w-4 text-[#75716B]" />
                        <span className="font-medium">Homepage</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 h-11 rounded-xl text-sm text-[#75716B] hover:bg-red-50 hover:text-red-600 text-left transition-all duration-150 cursor-pointer"
                    >
                        <LogOut className="mr-3.5 h-4 w-4 text-[#75716B]" />
                        <span className="font-medium">Log out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}

export default AdminSidebar;
