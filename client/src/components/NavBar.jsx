import { Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,   
    DropdownMenuTrigger,
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

    return (
        <nav className="flex justify-between items-center border-b-[1px] border-[#DAD6D1] sm:py-[16px] sm:px-[120px] h-[48px] sm:h-[80px] py-[12px] px-[24px]">
            <button onClick={() => navigate("/")} className="text-2xl sm:text-[44px] cursor-pointer" >
                <h1>hh<span className="text-[green]">.</span></h1>
            </button>

            <div className="hidden sm:block sm:justify-between sm:gap-[8px]">
                {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            Welcome, {user?.name || user?.username}
                        </span>
                        {user?.role === 'admin' && (
                            <button 
                                onClick={() => navigate("/admin")} 
                                className="border-[1px] border-orange-400 text-orange-600 px-[20px] py-[8px] rounded-[999px] text-sm cursor-pointer"
                            >
                                Admin
                            </button>
                        )}
                        <button 
                            onClick={handleLogout} 
                            className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] cursor-pointer"
                        >
                            Log out
                        </button>
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
                    <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sm:hidden w-screen rounded-none mt-4 flex flex-col gap-6 py-10 px-6 bg-white shadow-lg border border-[#DAD6D1]">
                    {isAuthenticated ? (
                        <>
                            <div className="text-center text-gray-600 mb-4">
                                Welcome, {user?.name || user?.username}
                            </div>
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => navigate("/admin")}
                                    className="px-8 py-4 rounded-full text-center text-orange-600 border border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer"
                                >
                                    Admin Panel
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="px-8 py-4 text-center text-white rounded-full bg-black hover:bg-muted-foreground transition-colors cursor-pointer"
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