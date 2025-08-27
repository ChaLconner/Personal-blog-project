import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useState, useEffect } from "react";
import { blogApi } from "@/services/api";
import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";

export default function AdminNotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                if (user?.id) {
                    const response = await blogApi.notifications.getAll(user.id);
                    setNotifications(response.data || []);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                toast.error('Failed to fetch notifications');
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [user?.id]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await blogApi.notifications.markAsRead(notificationId);
            // Update the notification in local state
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, read: true, read_at: new Date().toISOString() }
                        : notif
                )
            );
            toast.success('Notification marked as read');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            if (user?.id) {
                await blogApi.notifications.markAllAsRead(user.id);
                setNotifications(prev =>
                    prev.map(notif => ({
                        ...notif,
                        read: true,
                        read_at: new Date().toISOString()
                    }))
                );
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast.error('Failed to mark all notifications as read');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-100">
                <AdminSidebar />
                <main className="flex-1 p-8 overflow-auto">
                    <div className="text-center mt-20">Loading notifications...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main content */}
            <main className="flex-1 p-8 bg-gray-50 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Notifications</h2>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Mark All as Read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id}
                                className={`p-4 rounded-lg border ${
                                    notification.read 
                                        ? 'bg-white border-gray-200' 
                                        : 'bg-blue-50 border-blue-200'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage
                                                src={notification.trigger_user?.avatar || '/default-avatar.png'}
                                                alt={notification.trigger_user?.name || 'User'}
                                            />
                                            <AvatarFallback>
                                                {(notification.trigger_user?.name || 'U').charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {notification.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            {notification.post && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Article: {notification.post.title}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs text-orange-400">
                                                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                                                </p>
                                                {!notification.read && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {notification.post && (
                                            <button 
                                                onClick={() => window.open(`/post/${notification.post.id}`, '_blank')}
                                                className="text-blue-600 hover:text-blue-800 text-sm underline underline-offset-2"
                                            >
                                                View Post
                                            </button>
                                        )}
                                        {!notification.read && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="text-gray-600 hover:text-gray-800 text-sm underline underline-offset-2"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}