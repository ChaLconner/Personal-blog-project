import { UserAvatar } from "@/components/UserAvatar";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useState, useEffect } from "react";
import { blogApi } from "@/services/api";
import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
            <div className="flex h-screen bg-ui-surface">
                <AdminSidebar />
                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <div className="text-center mt-20">Loading notifications...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-ui-surface font-poppins">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main content */}
            <main className="flex-1 p-4 lg:p-8 bg-background overflow-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-xl sm:text-2xl font-semibold">Notifications</h2>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer w-full sm:w-auto"
                        >
                            Mark All as Read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 rounded-lg border",
                                    notification.read
                                        ? 'bg-card border-border'
                                        : 'bg-accent/50 border-accent'
                                )}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex items-start space-x-4">
                                        <UserAvatar
                                            src={notification.trigger_user?.avatar || '/default-avatar.png'}
                                            name={notification.trigger_user?.name}
                                            size="md"
                                            alt={notification.trigger_user?.name || 'User'}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground">
                                                {notification.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {notification.message}
                                            </p>
                                            {notification.post && (
                                                <p className="text-xs text-muted-foreground/80 mt-1">
                                                    Article: {notification.post.title}
                                                </p>
                                            )}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-2">
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                                                </p>
                                                {!notification.read && (
                                                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full self-start sm:self-auto">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        {notification.post && (
                                            <button
                                                onClick={() => window.open(`/post/${notification.post.id}`, '_blank')}
                                                className="text-primary hover:text-primary/80 text-sm underline underline-offset-2 cursor-pointer"
                                            >
                                                View Post
                                            </button>
                                        )}
                                        {!notification.read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2 cursor-pointer"
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