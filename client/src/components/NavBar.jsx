import { Menu, Bell, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,   
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext.js";

function NavBar() {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();

    const handleLogout = async () => {
        try {
            logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Get user avatar - use profile pic or generate initials
    const getUserAvatar = () => {
        if (user?.profilePic) {
            return user.profilePic;
        }
        
        // Generate initials from name or username
        const name = user?.name || user?.username || user?.email || "";
        const initials = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
        return initials || "U";
    };

    const UserAvatar = ({ size = "w-8 h-8" }) => {
        const avatarData = getUserAvatar();
        
        if (avatarData.startsWith('http')) {
            return (
                <img 
                    src={avatarData} 
                    alt="User Avatar" 
                    className={`${size} rounded-full object-cover border border-gray-300`}
                />
            );
        } else {
            return (
                <div className={`${size} rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-medium border border-gray-300`}>
                    {avatarData}
                </div>
            );
        }
    };

    return (
        <nav className="flex justify-between items-center border-b-[1px] border-[#DAD6D1] sm:py-[16px] sm:px-[120px] h-[48px] sm:h-[80px] py-[12px] px-[24px]">
            <button onClick={() => navigate("/")} className="text-2xl sm:text-[44px] cursor-pointer" >
                <h1>hh<span className="text-[green]">.</span></h1>
            </button>

            <div className="hidden sm:block sm:justify-between sm:gap-[8px]">
                {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">
                            <Bell size={20} />
                            {/* Notification Badge */}
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                3
                            </span>
                        </button>

                        {/* User Avatar Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none cursor-pointer">
                                <UserAvatar />
                                <span className="text-sm text-gray-700 max-w-32 truncate">
                                    {user?.name || user?.username}
                                </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-3 py-2 text-sm text-gray-500">
                                    <div className="font-medium text-gray-900">{user?.name || user?.username}</div>
                                    <div className="truncate">{user?.email}</div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                {user?.role === 'admin' && (
                                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                                        <div className="mr-2 h-4 w-4 bg-orange-400 rounded-sm"></div>
                                        Admin Panel
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <>
                        <button onClick={() => navigate("/login")} className="border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] mr-[8px] cursor-pointer">
                            Log in
                        </button>
                        <button onClick={() => navigate("/signup")} className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] cursor-pointer">
                            Sign up
                        </button>
                    </>
                )}
            </div>
            
            <DropdownMenu>
                <DropdownMenuTrigger className="sm:hidden focus:outline-none cursor-pointer">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            {/* Mobile notification indicator */}
                            <div className="relative">
                                <Bell size={20} />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3"></span>
                            </div>
                            <UserAvatar size="w-6 h-6" />
                        </div>
                    ) : (
                        <Menu />
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sm:hidden w-screen rounded-none mt-4 flex flex-col gap-6 py-10 px-6 bg-white shadow-lg border border-[#DAD6D1]">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                <UserAvatar size="w-12 h-12" />
                                <div>
                                    <div className="font-medium text-gray-900">{user?.name || user?.username}</div>
                                    <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => navigate("/profile")}
                                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                            >
                                <User size={20} />
                                Profile
                            </button>
                            
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => navigate("/admin")}
                                    className="flex items-center gap-3 px-4 py-3 text-left text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <div className="w-5 h-5 bg-orange-400 rounded"></div>
                                    Admin Panel
                                </button>
                            )}
                            
                            <hr className="border-gray-200" />
                            
                            <button
                                onClick={handleLogout}
                                className="px-8 py-4 text-center text-white rounded-full bg-black hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate("/login")}                        
                                className="px-8 py-4 rounded-full text-center text-foreground border border-foreground hover:border-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate("/signup")}
                                className="px-8 py-4 text-center text-white rounded-full bg-black hover:bg-muted-foreground transition-colors cursor-pointer"
                            >
                                Sign up
                            </button>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    );
}

export default NavBar;