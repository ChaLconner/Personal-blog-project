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
import { useState, useEffect } from "react";
import { blogApi } from "@/services/api.js";

function NavBar() {
    const navigate = useNavigate();
    const { state, logout, isAuthenticated } = useAuth();
    const { user } = state;
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch notifications from Supabase
    const fetchNotifications = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await blogApi.getNotifications(user.id);
            if (response.success) {
                setNotifications(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchNotifications();
            // Set up polling for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id]);

    // Get unread notification count
    const unreadCount = notifications.filter(notif => !notif.read).length;

    const handleMarkAsRead = async (notificationId) => {
        try {
            const response = await blogApi.markNotificationAsRead(notificationId);
            if (response.success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId ? { ...notif, read: true } : notif
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length === 0) return;

            const response = await blogApi.markAllNotificationsAsRead(user.id);
            if (response.success) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, read: true }))
                );
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Helper function to format notification time
    const formatNotificationTime = (timestamp) => {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;

        const diffInMonths = Math.floor(diffInDays / 30);
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    };

    const handleLogout = async () => {
        try {
            logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Get user avatar - use profile pic or generate initials
    const getUserAvatar = () => {
        if (user?.profile_pic) {
            return user.profile_pic;
        }

        // Generate initials from name or username
        const name = user?.name || user?.username || user?.email || "";
        const initials = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
        return initials || "U";
    };

    const UserAvatar = ({ size = "w-12 h-12", showName = false, nameClass = "ml-2 text-sm text-muted-foreground max-w-32 truncate" }) => {
        const avatarData = getUserAvatar();

        return (
            <div className="flex items-center">
                {avatarData.startsWith('http') ? (
                    <img
                        src={avatarData}
                        alt="User Avatar"
                        className={`${size} rounded-full object-cover border border-border opacity-100`}
                    />
                ) : (
                    <div
                        className={`${size} rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium border border-border opacity-100`}
                    >
                        {avatarData}
                    </div>
                )}
                {showName && (
                    <span className={nameClass}>
                        {user?.name || user?.username}
                    </span>
                )}
            </div>
        );
    };

    return (
        <nav className="flex justify-between items-center border-b border-ui-border sm:py-4 sm:px-[120px] h-12 sm:h-20 py-3 px-6">
            <button onClick={() => navigate("/")} className="text-2xl sm:text-[44px] cursor-pointer" >
                <h1 className="text-foreground">hh<span className="text-brand-accent">.</span></h1>
            </button>

            <div className="hidden sm:block sm:justify-between sm:gap-2">
                {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#EFEEEB] focus:outline-none hover:border-gray-300 transition-colors">
                                    <Bell size={20} className="text-gray-600 hover:text-gray-800 transition-colors" />
                                    {/* Notification Badge */}
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[362px] h-[200px] p-0 border-none shadow-[2px_2px_16px_rgba(0,0,0,0.1)] rounded-xl bg-[#F9F8F6] overflow-hidden"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    padding: '24px 16px',
                                    gap: '16px'
                                }}
                            >
                                {/* Notification Header */}
                                <div className="flex items-center justify-between w-full">
                                    <h3 className="font-semibold text-lg text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                {/* Notification List */}
                                <div className="flex-1 w-full overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                            Loading notifications...
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                            No notifications
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {notifications.slice(0, 3).map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${notification.read
                                                            ? 'bg-white border-gray-200 text-gray-600'
                                                            : 'bg-blue-50 border-blue-200 text-gray-900'
                                                        }`}
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium truncate">
                                                                {notification.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                {notification.message}
                                                            </p>
                                                            <span className="text-xs text-gray-400 mt-1">
                                                                {formatNotificationTime(notification.created_at)}
                                                            </span>
                                                        </div>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none cursor-pointer">
                                <UserAvatar />
                                {/* แสดงชื่อจริงจากตาราง users คอลัมน์ name */}
                                <span className="text-sm text-gray-700 max-w-32 truncate">
                                    {user?.name}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                                    <path d="M12 6L8 10L4 6" stroke="#75716B" />
                                </svg>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[220px] w-auto rounded-lg bg-[#F9F8F6] shadow-lg border-none mt-2 flex flex-col gap-2 p-3">
                                <DropdownMenuItem
                                    onClick={() => navigate(user?.role === 'admin' ? "/admin/profile" : "/profile")}
                                    className="cursor-pointer"
                                >
                                    <svg width="24" height="24" fill="none" className="flex-shrink-0 mr-3">
                                        <path d="M19.7274 20.4471C19.2716 19.1713 18.2672 18.0439 16.8701 17.2399C15.4729 16.4358 13.7611 16 12 16C10.2389 16 8.52706 16.4358 7.12991 17.2399C5.73276 18.0439 4.72839 19.1713 4.27259 20.4471" stroke="#75716B" strokeWidth="1.2" strokeLinecap="round" />
                                        <circle cx="12" cy="8" r="4" stroke="#75716B" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>

                                    Profile
                                </DropdownMenuItem>
                                {user?.role === 'admin' && (
                                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                                        <svg width="24" height="24" fill="none" className="flex-shrink-0 mr-3">
                                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" stroke="#75716B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Admin Panel
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigate("/admin/reset-password")} className="cursor-pointer">
                                    <svg width="24" height="24" fill="none" className="flex-shrink-0 mr-3">
                                        <path d="M14 15L10 19L14 23" stroke="#75716B" />
                                        <path d="M5.93782 15.5C5.14475 14.1264 4.84171 12.5241 5.07833 10.9557C5.31495 9.38734 6.07722 7.94581 7.24024 6.86729C8.40327 5.78877 9.8981 5.13721 11.4798 5.01935C13.0616 4.90149 14.6365 5.32432 15.9465 6.21856C17.2565 7.1128 18.224 8.42544 18.6905 9.94144C19.1569 11.4574 19.0947 13.0869 18.5139 14.5629C17.9332 16.0389 16.8684 17.2739 15.494 18.0656C14.1196 18.8573 12.517 19.1588 10.9489 18.9206" stroke="#75716B" strokeLinecap="round" />
                                    </svg>

                                    Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} ><svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 12L1.60957 11.6877L1.35969 12L1.60957 12.3123L2 12ZM11 12.5C11.2761 12.5 11.5 12.2761 11.5 12C11.5 11.7239 11.2761 11.5 11 11.5V12.5ZM5.60957 6.68765L1.60957 11.6877L2.39043 12.3123L6.39043 7.31235L5.60957 6.68765ZM1.60957 12.3123L5.60957 17.3123L6.39043 16.6877L2.39043 11.6877L1.60957 12.3123ZM2 12.5H11V11.5H2V12.5Z" fill="#75716B" />
                                    <path d="M10 8.13193V7.38851C10 5.77017 10 4.961 10.474 4.4015C10.9479 3.84201 11.7461 3.70899 13.3424 3.44293L15.0136 3.1644C18.2567 2.62388 19.8782 2.35363 20.9391 3.25232C22 4.15102 22 5.79493 22 9.08276V14.9172C22 18.2051 22 19.849 20.9391 20.7477C19.8782 21.6464 18.2567 21.3761 15.0136 20.8356L13.3424 20.5571C11.7461 20.291 10.9479 20.158 10.474 19.5985C10 19.039 10 18.2298 10 16.6115V16.066" stroke="#75716B" />
                                </svg>

                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <>
                        <button onClick={() => navigate("/login")} className="border border-[#75716B] px-10 py-3 rounded-full gap-1.5 mr-2 cursor-pointer">
                            Log in
                        </button>
                        <button onClick={() => navigate("/signup")} className="bg-[#26231E] text-white border border-[#75716B] px-10 py-3 rounded-full gap-1.5 cursor-pointer">
                            Sign up
                        </button>
                    </>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="sm:hidden flex items-center gap-2 focus:outline-none cursor-pointer">
                    <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sm:hidden min-w-[220px] w-auto rounded-lg bg-[#F9F8F6] shadow-lg border-none mt-2 flex flex-col gap-3 p-3">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                <UserAvatar size="w-12 h-12" showName={true} nameClass="ml-2 text-sm text-gray-700 max-w-32 truncate" />
                                <div>
                                    <div className="font-medium text-gray-900">{user?.name || user?.full_name || user?.username}</div>
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
                            <DropdownMenuSeparator />
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