import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, User, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";


export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const [formData, setFormData] = useState({
        name: user?.name || "",
        username: user?.username || "",
        email: user?.email || ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [notifications] = useState([
        { id: 1, message: "Welcome to the blog platform!", type: "info", read: false },
        { id: 2, message: "Your profile has been updated", type: "success", read: false },
        { id: 3, message: "New article published", type: "info", read: true }
    ]);

    // Update form data when user data changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: user.username || "",
                email: user.email || ""
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement API call to update user profile
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            
            toast.success("Profile updated successfully!", {
                position: "bottom-right",
                duration: 3000,
            });
        } catch (error) {
            console.error("Update profile error:", error);
            toast.error("Failed to update profile", {
                position: "bottom-right",
                duration: 4000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully", {
                position: "bottom-right",
                duration: 2000,
            });
            navigate("/");
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

    const UserAvatar = ({ size = "w-12 h-12" }) => {
        const avatarData = getUserAvatar();
        
        if (avatarData.startsWith('http')) {
            return (
                <img 
                    src={avatarData} 
                    alt="User Avatar" 
                    className={`${size} rounded-full object-cover border-2 border-gray-300`}
                />
            );
        } else {
            return (
                <div className={`${size} rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-medium border-2 border-gray-300`}>
                    {avatarData}
                </div>
            );
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* Header */}
            

            <header className="flex justify-between items-center border-b-[1px] border-[#DAD6D1] sm:py-[16px] sm:px-[120px] h-[48px] sm:h-[80px] py-[12px] px-[24px]">
                <button onClick={() => navigate("/")} className="text-2xl sm:text-[44px]">
                    <h1>hh<span className="text-[green]">.</span></h1>
                </button>
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full border-[#EFEEEB] border-2 flex items-center justify-center cursor-pointer">
                        <Bell className="w-6 h-6 text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/profile")}>
                        <UserAvatar />
                        <span className="text-sm font-medium">{user?.name || user?.username}</span>
                    </div>
                </div>
            </header>


            <main className="flex flex-col items-center">
                {/* Profile Form */}
                <div className="flex gap-4 items-center mt-[52px] mb-[30px]">
                    <UserAvatar size="w-16 h-16" />
                    <h1 className="text-2xl font-bold">{user?.name || user?.username} | Profile</h1>
                </div>
                <section className="flex px-10">
                    {/* Sidebar */}
                    <aside className="w-64">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 font-semibold text-black">
                                <User className="w-4 h-4" /> Profile
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 hover:text-black cursor-pointer">
                                <Lock className="w-4 h-4" /> Reset password
                            </div>
                        </div>
                    </aside>
                    <div className="p-6 max-w-md bg-[#EFEEEB] space-y-4">

                        {/* Avatar + Upload */}
                        <div className="flex items-center gap-4">
                            <UserAvatar size="w-24 h-24" />
                            <Button variant="outline" className="text-sm bg-white rounded-full border-[#75716B]">
                                Upload profile picture
                            </Button>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input 
                                    name="name"
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Username</label>
                                <Input 
                                    name="username"
                                    value={formData.username} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <Input 
                                    disabled 
                                    value={formData.email} 
                                    className="bg-gray-100" 
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button 
                                className="py-3 px-10 bg-black text-white rounded-[999px] disabled:opacity-50" 
                                onClick={handleSave}
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Save"}
                            </Button>
                            <Button 
                                variant="outline"
                                className="py-3 px-6 border-red-300 text-red-600 rounded-[999px] hover:bg-red-50" 
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </div>
                    </div>                    
                </section>
            </main>
        </div >
    );
}
