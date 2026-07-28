import { Menu, Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/authContext";
import { useState, useEffect } from "react";
import { blogApi } from "@/services/api.js";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
    subscribeToNotifications,
    unsubscribeFromNotifications,
    isSubscribedToNotifications
} from "@/services/realtimeNotifications.js";

// UserAvatar wrapper for NavBar to maintain showName functionality
const NavBarUserAvatar = ({ user, size = "md", showName = false, nameClass = "ml-2 text-sm text-muted-foreground max-w-32 truncate" }) => {
    return (
        <div className="flex items-center">
            <UserAvatar
                src={user?.profile_pic}
                name={user?.name}
                username={user?.username}
                email={user?.email}
                size={size}
                alt="User Avatar"
            />
            {showName && (
                <span className={nameClass}>
                    {user?.name || user?.username}
                </span>
            )}
        </div>
    );
};

function NavBar() {
    const navigate = useNavigate();
    const { state, logout, isAuthenticated } = useAuth();
    const { user } = state;
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMobileNotificationOpen, setIsMobileNotificationOpen] = useState(false);

    // Fetch notifications from Supabase
    const fetchNotifications = async () => {
        if (!user?.id || !isAuthenticated) return;

        try {
            setLoading(true);
            const response = await blogApi.getNotifications(user.id);
            
            if (response && response.success) {
                setNotifications(response.data || []);
            } else {
                console.warn('Failed to fetch notifications:', response?.error || 'Unknown error');
                setNotifications([]); // Set empty array on failure
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Handle real-time notification
    const handleRealtimeNotification = (newNotification) => {
        console.log('Real-time notification received:', newNotification);
        
        // Add the new notification to the beginning of the list
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show browser notification if permission is granted
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(newNotification.title, {
                body: newNotification.message,
                icon: "/favicon.ico",
                tag: newNotification.id,
            });
        }
    };

    // Set up real-time notifications
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            // Initial fetch
            fetchNotifications();
            
            // Set up real-time subscription
            if (!isSubscribedToNotifications(user.id)) {
                subscribeToNotifications(user.id, handleRealtimeNotification);
            }
            
            // Request notification permission
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
            
            // Cleanup function
            return () => {
                unsubscribeFromNotifications(user.id);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = document.getElementById('notification-dropdown');
            const mobileDropdown = document.getElementById('mobile-notification-dropdown');
            const button = event.target.closest('button');
            
            if (dropdown && !dropdown.contains(event.target) && (!button || !button.querySelector('.bell-icon'))) {
                setIsNotificationOpen(false);
            }
            
            if (mobileDropdown && !mobileDropdown.contains(event.target) && (!button || !button.parentElement.parentElement.contains(button))) {
                setIsMobileNotificationOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Ensure notifications is an array (defensive guard) and get unread notification count
    const safeNotifications = Array.isArray(notifications) ? notifications : (notifications ? [notifications] : []);
    const unreadCount = safeNotifications.filter(notif => !notif.read).length;

    const handleMarkAsRead = async (notificationId) => {
        try {
            const response = await blogApi.markNotificationAsRead(notificationId);
            if (response && response.success) {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId ? { ...notif, read: true } : notif
                    )
                );
            } else {
                console.error('Failed to mark notification as read:', response?.error);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }
        const postId = notification.post_id || notification.post?.id || notification.target_id;
        if (postId) {
            setIsNotificationOpen(false);
            setIsMobileNotificationOpen(false);
            navigate(`/post/${postId}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length === 0) return;
            
            const response = await blogApi.markAllNotificationsAsRead(user.id);
            if (response && response.success) {
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                );
            } else {
                console.error('Failed to mark all notifications as read:', response?.error);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Helper function to create test notification (development only)
    // Renamed to start with '_' so unused declaration is allowed by lint rules
    const _createTestNotification = async () => {
        if (import.meta.env.PROD || !user?.id) return;

        try {
            const testTypes = ['comment', 'like', 'system', 'mention'];
            const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
            
            const testMessages = {
                comment: 'Someone commented on your post!',
                like: 'Your post received a new like!',
                system: 'System notification: Welcome to our platform!',
                mention: 'You were mentioned in a comment!'
            };

            await blogApi.notifications.createTest(user.id, {
                type: randomType,
                title: `Test ${randomType} notification`,
                message: testMessages[randomType]
            });

            // Refresh notifications
            fetchNotifications();
        } catch (error) {
            console.error('Error creating test notification:', error);
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
            navigate(user?.role === 'admin' ? "/admin/login" : "/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };



    return (
        <nav className="flex justify-between items-center border-b border-[#DAD6D1] bg-[#F9F8F6] sm:py-4 sm:px-[120px] h-16 sm:h-[80px] py-3 px-6">
            <button onClick={() => navigate("/")} className="cursor-pointer" >
                <h1 className="font-poppins text-[#43403B] text-2xl sm:text-[28px] leading-[44px]">hh<span className="text-brand-accent">.</span></h1>
            </button>

            <div className="hidden sm:block sm:justify-between sm:gap-2">
                {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#EFEEEB] focus:outline-none hover:border-gray-300 transition-colors cursor-pointer"
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            >
                                <Bell size={20} className="text-gray-600 hover:text-gray-800 transition-colors bell-icon" />
                                {/* Notification Badge */}
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Custom Notification Dropdown */}
                            <div
                                id="notification-dropdown"
                                className={`absolute right-0 top-full mt-2 w-[362px] max-h-[400px] p-0 border-none shadow-[2px_2px_16px_rgba(0,0,0,0.1)] rounded-xl bg-[#F9F8F6] overflow-hidden z-50 ${isNotificationOpen ? 'block' : 'hidden'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Notification Header */}
                                <div className="flex items-center justify-between w-full p-4">
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
                                <div className="flex-1 w-full overflow-y-auto max-h-[300px] px-4 pb-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                            Loading notifications...
                                        </div>
                                    ) : safeNotifications.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                            No notifications
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {safeNotifications.slice(0, 3).map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${notification.read
                                                            ? 'bg-white border-gray-200 text-gray-600'
                                                            : 'bg-blue-50 border-blue-200 text-gray-900'
                                                        }`}
                                                    onClick={() => handleNotificationClick(notification)}
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
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none cursor-pointer">
                                <NavBarUserAvatar user={user} size="md" />
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
                                <DropdownMenuItem onClick={() => navigate(user?.role === 'admin' ? "/admin/reset-password" : "/reset-password")} className="cursor-pointer">
                                    <svg width="24" height="24" fill="none" className="flex-shrink-0 mr-3">
                                        <path d="M14 15L10 19L14 23" stroke="#75716B" />
                                        <path d="M5.93782 15.5C5.14475 14.1264 4.84171 12.5241 5.07833 10.9557C5.31495 9.38734 6.07722 7.94581 7.24024 6.86729C8.40327 5.78877 9.8981 5.13721 11.4798 5.01935C13.0616 4.90149 14.6365 5.32432 15.9465 6.21856C17.2565 7.1128 18.224 8.42544 18.6905 9.94144C19.1569 11.4574 19.0947 13.0869 18.5139 14.5629C17.9332 16.0389 16.8684 17.2739 15.494 18.0656C14.1196 18.8573 12.517 19.1588 10.9489 18.9206" stroke="#75716B" strokeLinecap="round" />
                                    </svg>

                                    Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
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
                        <button onClick={() => navigate("/login")} className="font-poppins font-medium text-base leading-6 text-[#26231E] bg-white border border-[#75716B] px-10 py-3 rounded-full mr-2 cursor-pointer hover:bg-gray-50 transition-colors">
                            Log in
                        </button>
                        <button onClick={() => navigate("/signup")} className="font-poppins font-medium text-base leading-6 text-white bg-[#26231E] px-10 py-3 rounded-full cursor-pointer hover:bg-[#43403B] transition-colors">
                            Sign up
                        </button>
                    </>
                )}
                
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="sm:hidden flex items-center gap-2 focus:outline-none cursor-pointer">
                    <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    align="end" 
                    className={`sm:hidden border-none bg-[#F9F8F6] shadow-[2px_2px_16px_rgba(0,0,0,0.1)] flex flex-col ${isAuthenticated ? 'p-4 rounded-lg' : 'justify-center items-center py-[40px] px-[24px] gap-[24px] w-[375px] max-w-full h-[200px] rounded-lg'}`} 
                    style={{
                        width: '375px',
                        height: isAuthenticated ? 'auto' : '200px',
                        boxShadow: '2px 2px 16px rgba(0, 0, 0, 0.1)',
                        zIndex: 20
                    }}
                >
                    {isAuthenticated ? (
                        <>
                            {/* User Profile Section */}
                            <div className="flex items-center justify-between pb-4 mb-2">
                                <div className="flex items-center gap-4">
                                    <NavBarUserAvatar user={user} size="lg" />
                                    <div>
                                        <div className="font-medium text-gray-900 text-base">{user?.name || user?.full_name || user?.username}</div>
                                    </div>
                                </div>
                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#EFEEEB] focus:outline-none hover:border-gray-300 transition-colors cursor-pointer"
                                        onClick={() => setIsMobileNotificationOpen(!isMobileNotificationOpen)}
                                    >
                                        <Bell size={18} className="text-gray-600 hover:text-gray-800 transition-colors" />
                                        {/* Notification Badge */}
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    
                                    {/* Mobile Notification Dropdown */}
                                    <div
                                        id="mobile-notification-dropdown"
                                        className={`absolute right-0 top-full mt-2 w-[320px] max-h-[300px] p-0 border-none shadow-[2px_2px_16px_rgba(0,0,0,0.1)] rounded-xl bg-[#F9F8F6] overflow-hidden z-50 ${isMobileNotificationOpen ? 'block' : 'hidden'}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Notification Header */}
                                        <div className="flex items-center justify-between w-full p-3">
                                            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>

                                        {/* Notification List */}
                                        <div className="flex-1 w-full overflow-y-auto max-h-[220px] px-3 pb-3">
                                            {loading ? (
                                                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                                                    Loading notifications...
                                                </div>
                                            ) : safeNotifications.length === 0 ? (
                                                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                                                    No notifications
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {safeNotifications.slice(0, 3).map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${notification.read
                                                                    ? 'bg-white border-gray-200 text-gray-600'
                                                                    : 'bg-blue-50 border-blue-200 text-gray-900'
                                                                }`}
                                                            onClick={() => handleNotificationClick(notification)}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-xs font-medium truncate">
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
                                    </div>
                                </div>
                            </div>

                            <div className="py-2 space-y-1">
                                <DropdownMenuItem
                                    onClick={() => navigate(user?.role === 'admin' ? "/admin/profile" : "/profile")}
                                    className="cursor-pointer py-3 px-2 rounded-md hover:bg-gray-50"
                                >
                                    <svg width="20" height="20" fill="none" className="flex-shrink-0 mr-3">
                                        <path d="M19.7274 20.4471C19.2716 19.1713 18.2672 18.0439 16.8701 17.2399C15.4729 16.4358 13.7611 16 12 16C10.2389 16 8.52706 16.4358 7.12991 17.2399C5.73276 18.0439 4.72839 19.1713 4.27259 20.4471" stroke="#75716B" strokeWidth="1.2" strokeLinecap="round" />
                                        <circle cx="12" cy="8" r="4" stroke="#75716B" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>

                                    Profile
                                </DropdownMenuItem>
                                {user?.role === 'admin' && (
                                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer py-3 px-2 rounded-md hover:bg-gray-50">
                                        <svg width="20" height="20" fill="none" className="flex-shrink-0 mr-3">
                                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" stroke="#75716B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Admin Panel
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigate(user?.role === 'admin' ? "/admin/reset-password" : "/reset-password")} className="cursor-pointer py-3 px-2 rounded-md hover:bg-gray-50">
                                    <svg width="20" height="20" fill="none" className="flex-shrink-0 mr-3">
                                        <path d="M14 15L10 19L14 23" stroke="#75716B" />
                                        <path d="M5.93782 15.5C5.14475 14.1264 4.84171 12.5241 5.07833 10.9557C5.31495 9.38734 6.07722 7.94581 7.24024 6.86729C8.40327 5.78877 9.8981 5.13721 11.4798 5.01935C13.0616 4.90149 14.6365 5.32432 15.9465 6.21856C17.2565 7.1128 18.224 8.42544 18.6905 9.94144C19.1569 11.4574 19.0947 13.0869 18.5139 14.5629C17.9332 16.0389 16.8684 17.2739 15.494 18.0656C14.1196 18.8573 12.517 19.1588 10.9489 18.9206" stroke="#75716B" strokeLinecap="round" />
                                    </svg>

                                    Reset Password
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-3 px-2 rounded-md hover:bg-gray-50" ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 12L1.60957 11.6877L1.35969 12L1.60957 12.3123L2 12ZM11 12.5C11.2761 12.5 11.5 12.2761 11.5 12C11.5 11.7239 11.2761 11.5 11 11.5V12.5ZM5.60957 6.68765L1.60957 11.6877L2.39043 12.3123L6.39043 7.31235L5.60957 6.68765ZM1.60957 12.3123L5.60957 17.3123L6.39043 16.6877L2.39043 11.6877L1.60957 12.3123ZM2 12.5H11V11.5H2V12.5Z" fill="#75716B" />
                                <path d="M10 8.13193V7.38851C10 5.77017 10 4.961 10.474 4.4015C10.9479 3.84201 11.7461 3.70899 13.3424 3.44293L15.0136 3.1644C18.2567 2.62388 19.8782 2.35363 20.9391 3.25232C22 4.15102 22 5.79493 22 9.08276V14.9172C22 18.2051 22 19.849 20.9391 20.7477C19.8782 21.6464 18.2567 21.3761 15.0136 20.8356L13.3424 20.5571C11.7461 20.291 10.9479 20.158 10.474 19.5985C10 19.039 10 18.2298 10 16.6115V16.066" stroke="#75716B" />
                            </svg>

                                Log out
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <div className="flex flex-col justify-center items-center gap-[24px] w-full">
                            <button
                                onClick={() => navigate("/login")}
                                className="flex flex-row justify-center items-center px-[40px] py-[12px] gap-[6px] w-[327px] max-w-full h-[48px] bg-white border border-[#75716B] rounded-[999px] font-poppins font-medium text-[16px] leading-[24px] text-[#26231E] hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate("/signup")}
                                className="flex flex-row justify-center items-center px-[40px] py-[12px] gap-[6px] w-[327px] max-w-full h-[48px] bg-[#26231E] rounded-[999px] font-poppins font-medium text-[16px] leading-[24px] text-white hover:bg-[#43403B] transition-colors cursor-pointer"
                            >
                                Sign up
                            </button>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    );
}

export default NavBar;
