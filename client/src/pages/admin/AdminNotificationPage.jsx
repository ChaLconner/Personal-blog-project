import { UserAvatar } from "@/components/common/UserAvatar";
import { AdminSidebar } from "@/components/blog/AdminWebSection";
import { useState, useEffect } from "react";
import { blogApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatRelativeDate } from "@/utils/dateFormatter";

export default function AdminNotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                if (user?.id) {
                    try {
                        const adminRes = await blogApi.admin.getNotifications();
                        if (adminRes.success && Array.isArray(adminRes.data)) {
                            setNotifications(adminRes.data);
                        } else {
                            const response = await blogApi.notifications.getAll(user.id);
                            setNotifications(response.data || []);
                        }
                    } catch {
                        const response = await blogApi.notifications.getAll(user.id);
                        setNotifications(response.data || []);
                    }
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

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Unknown time';
        return formatRelativeDate(dateStr);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#F9F8F6] font-poppins">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                {/* Header */}
                <header className="h-[96px] shrink-0 border-b border-[#DAD6D1] px-6 lg:px-[60px] flex items-center justify-between bg-[#F9F8F6]">
                    <h1 className="text-[24px] font-semibold text-[#26231E] leading-[32px]">
                        Notification
                    </h1>
                </header>

                {/* Main Content */}
                <main className="flex-1 px-6 lg:px-[60px] py-10 overflow-y-auto">
                    <div className="max-w-[1040px]">
                        {loading ? (
                            <div className="py-12 text-center text-[#75716B]">Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center text-[#75716B] text-[16px]">
                                No notifications found
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {notifications.map((notification, index) => {
                                    const userName = notification.trigger_user?.name || notification.trigger_user?.username || notification.actor_name || 'User';
                                    const isComment = notification.type === 'comment' || (notification.message && notification.message.trim().length > 0);
                                    const articleTitle = notification.post?.title || notification.article_title || 'article';
                                    const messageText = notification.message ? notification.message.trim() : '';
                                    const timeStr = formatTimeAgo(notification.created_at);

                                    return (
                                        <div key={notification.id || index}>
                                            <div className="py-6 flex items-start justify-between gap-6 lg:gap-10">
                                                {/* Left: Avatar + Details */}
                                                <div className="flex items-start gap-3 lg:gap-3.5 flex-1 min-w-0">
                                                    <UserAvatar
                                                        src={notification.trigger_user?.profile_pic || notification.trigger_user?.avatar || '/default-avatar.png'}
                                                        name={userName}
                                                        size="lg"
                                                        className="w-[48px] h-[48px] shrink-0 rounded-full"
                                                    />
                                                    <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                                                        <div className="text-[16px] leading-[24px] text-[#43403B]">
                                                            <span className="font-bold">{userName}</span>{" "}
                                                            <span className="font-normal">
                                                                {isComment ? "Commented on your article:" : "liked your article:"}
                                                            </span>{" "}
                                                            <span className="font-normal">{articleTitle}</span>
                                                        </div>

                                                        {isComment && messageText && (
                                                            <p className="text-[16px] leading-[24px] font-normal text-[#43403B]">
                                                                {messageText.startsWith('“') || messageText.startsWith('"')
                                                                    ? messageText
                                                                    : `“${messageText}”`}
                                                            </p>
                                                        )}

                                                        <p className="text-[14px] leading-[22px] font-medium text-[#F2B68C]">
                                                            {timeStr}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Action */}
                                                <button
                                                    onClick={() => {
                                                        const postId = notification.post?.id || notification.post_id;
                                                        if (postId) window.open(`/post/${postId}`, '_blank');
                                                    }}
                                                    className="text-[16px] leading-[24px] font-medium text-[#26231E] underline hover:opacity-80 transition-opacity cursor-pointer shrink-0 pt-0.5"
                                                >
                                                    View
                                                </button>
                                            </div>

                                            {/* Line divider */}
                                            {index < notifications.length - 1 && (
                                                <div className="border-b border-[#DAD6D1] w-full" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}