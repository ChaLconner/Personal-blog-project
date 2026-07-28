import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { blogApi } from '@/services/api';
import { useAuth } from '@/contexts/authContext';
import { formatShortDate, formatRelativeDate } from '@/utils/dateFormatter';
import { AdminSidebar } from '@/components/blog/AdminWebSection';
import { Button } from '@/components/ui/button';
import {
  FileText,
  FolderOpen,
  MessageSquare,
  ThumbsUp,
  Plus,
  PenSquare,
  Eye,
  ArrowRight,
  ChevronRight,
  User,
  Bell,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, postsResponse, commentsResponse] = await Promise.all([
          blogApi.admin.getStats(),
          blogApi.admin.getAllPosts(),
          blogApi.admin.getAllComments(),
        ]);

        setStats(statsResponse.data);
        setRecentPosts(postsResponse.data?.slice(0, 5) || []);
        setRecentComments(commentsResponse.data?.slice(0, 5) || []);
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#EFEEEB] font-poppins text-[#26231E]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-10 bg-[#EFEEEB] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pr-14 lg:pr-0">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#26231E]">Admin Dashboard</h2>
            <p className="text-sm text-[#75716B] mt-1 font-medium">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="px-6 py-3 rounded-full text-white bg-[#26231E] hover:bg-[#43403B] transition-all shadow-sm cursor-pointer border border-[#26231E] font-medium"
              onClick={() => navigate('/admin/create-article')}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Create article</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-50 border border-red-200 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Warnings banner */}
        {stats?.warnings && stats.warnings.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm">
            <strong className="block font-medium">Partial data warning</strong>
            <ul className="mt-1 list-disc pl-5">
              {stats.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#F9F8F6] p-6 rounded-2xl border border-[#DAD6D1] shadow-xs flex items-center justify-between min-w-0 transition-all hover:border-[#75716B]/40">
            <div className="min-w-0 mr-2">
              <p className="text-xs sm:text-sm font-medium text-[#75716B] truncate" title="Total Articles">
                Total Articles
              </p>
              <p className="text-3xl font-bold text-[#26231E] mt-2">
                {loading ? '—' : stats?.totalPosts ?? '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#EFEEEB] rounded-2xl flex items-center justify-center shrink-0 border border-[#DAD6D1]/60">
              <FileText className="w-6 h-6 text-[#26231E]" />
            </div>
          </div>

          <div className="bg-[#F9F8F6] p-6 rounded-2xl border border-[#DAD6D1] shadow-xs flex items-center justify-between min-w-0 transition-all hover:border-[#75716B]/40">
            <div className="min-w-0 mr-2">
              <p className="text-xs sm:text-sm font-medium text-[#75716B] truncate" title="Categories">
                Categories
              </p>
              <p className="text-3xl font-bold text-[#26231E] mt-2">
                {loading ? '—' : stats?.totalCategories ?? '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#EFEEEB] rounded-2xl flex items-center justify-center shrink-0 border border-[#DAD6D1]/60">
              <FolderOpen className="w-6 h-6 text-[#26231E]" />
            </div>
          </div>

          <div className="bg-[#F9F8F6] p-6 rounded-2xl border border-[#DAD6D1] shadow-xs flex items-center justify-between min-w-0 transition-all hover:border-[#75716B]/40">
            <div className="min-w-0 mr-2">
              <p className="text-xs sm:text-sm font-medium text-[#75716B] truncate" title="Total Comments">
                Total Comments
              </p>
              <p className="text-3xl font-bold text-[#26231E] mt-2">
                {loading ? '—' : stats?.totalComments ?? '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#EFEEEB] rounded-2xl flex items-center justify-center shrink-0 border border-[#DAD6D1]/60">
              <MessageSquare className="w-6 h-6 text-[#26231E]" />
            </div>
          </div>

          <div className="bg-[#F9F8F6] p-6 rounded-2xl border border-[#DAD6D1] shadow-xs flex items-center justify-between min-w-0 transition-all hover:border-[#12B379]/40">
            <div className="min-w-0 mr-2">
              <p className="text-xs sm:text-sm font-medium text-[#75716B] truncate" title="Total Likes">
                Total Likes
              </p>
              <p className="text-3xl font-bold text-[#26231E] mt-2">
                {loading ? '—' : stats?.totalLikes ?? '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#D2EAE0]/50 rounded-2xl flex items-center justify-center shrink-0 border border-[#12B379]/20">
              <ThumbsUp className="w-6 h-6 text-[#12B379]" />
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div
            onClick={() => navigate('/admin/article-management')}
            className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#DAD6D1] shadow-xs hover:border-[#12B379] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group min-w-0"
          >
            <div className="flex items-center space-x-3.5 min-w-0 mr-2">
              <div className="p-3 bg-[#EFEEEB] rounded-xl shrink-0 group-hover:bg-[#12B379] group-hover:text-white transition-all">
                <FileText className="w-5 h-5 text-[#26231E] group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[#26231E] text-sm group-hover:text-[#12B379] transition-colors truncate">
                  Articles
                </h3>
                <p className="text-xs text-[#75716B] truncate">Manage blog posts</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#75716B] group-hover:text-[#12B379] group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          <div
            onClick={() => navigate('/admin/category-management')}
            className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#DAD6D1] shadow-xs hover:border-[#12B379] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group min-w-0"
          >
            <div className="flex items-center space-x-3.5 min-w-0 mr-2">
              <div className="p-3 bg-[#EFEEEB] rounded-xl shrink-0 group-hover:bg-[#12B379] group-hover:text-white transition-all">
                <FolderOpen className="w-5 h-5 text-[#26231E] group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[#26231E] text-sm group-hover:text-[#12B379] transition-colors truncate">
                  Categories
                </h3>
                <p className="text-xs text-[#75716B] truncate">Organize content</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#75716B] group-hover:text-[#12B379] group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          <div
            onClick={() => navigate('/admin/notifications')}
            className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#DAD6D1] shadow-xs hover:border-[#12B379] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group min-w-0"
          >
            <div className="flex items-center space-x-3.5 min-w-0 mr-2">
              <div className="p-3 bg-[#EFEEEB] rounded-xl shrink-0 group-hover:bg-[#12B379] group-hover:text-white transition-all">
                <Bell className="w-5 h-5 text-[#26231E] group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[#26231E] text-sm group-hover:text-[#12B379] transition-colors truncate">
                  Notifications
                </h3>
                <p className="text-xs text-[#75716B] truncate">View activity</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#75716B] group-hover:text-[#12B379] group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          <div
            onClick={() => navigate('/admin/profile')}
            className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#DAD6D1] shadow-xs hover:border-[#12B379] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group min-w-0"
          >
            <div className="flex items-center space-x-3.5 min-w-0 mr-2">
              <div className="p-3 bg-[#EFEEEB] rounded-xl shrink-0 group-hover:bg-[#12B379] group-hover:text-white transition-all">
                <User className="w-5 h-5 text-[#26231E] group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[#26231E] text-sm group-hover:text-[#12B379] transition-colors truncate">
                  Profile
                </h3>
                <p className="text-xs text-[#75716B] truncate">Account settings</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#75716B] group-hover:text-[#12B379] group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Recent Posts */}
          <div className="bg-[#F9F8F6] rounded-2xl border border-[#DAD6D1] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DAD6D1] flex justify-between items-center bg-[#EFEEEB]/50">
              <h3 className="font-semibold text-base text-[#26231E]">Recent Posts</h3>
              <button
                onClick={() => navigate('/admin/article-management')}
                className="text-xs font-semibold text-[#12B379] hover:text-[#0e9464] flex items-center cursor-pointer transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-start animate-pulse">
                      <div>
                        <div className="h-4 w-48 bg-[#DAD6D1]/50 rounded mb-2" />
                        <div className="h-3 w-32 bg-[#DAD6D1]/30 rounded mb-1" />
                        <div className="h-3 w-20 bg-[#DAD6D1]/30 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-[#DAD6D1]/40 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPosts.length > 0 ? (
                <div className="divide-y divide-[#DAD6D1]/60">
                  {recentPosts.map((post, idx) => (
                    <div
                      key={post.id}
                      className={`flex justify-between items-center ${
                        idx === 0 ? 'pb-3.5' : idx === recentPosts.length - 1 ? 'pt-3.5' : 'py-3.5'
                      }`}
                    >
                      <div className="min-w-0 pr-4">
                        <h4 className="font-medium text-sm text-[#26231E] truncate">{post.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-[#12B379] bg-[#D2EAE0]/60 px-2 py-0.5 rounded-md">
                            {post.category || 'Uncategorized'}
                          </span>
                          <span className="text-xs text-[#75716B]">•</span>
                          <span className="text-xs text-[#75716B]">
                            {formatShortDate(post.date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer h-8 w-8 p-0 text-[#75716B] hover:text-[#26231E] hover:bg-[#EFEEEB] rounded-lg transition-colors"
                          onClick={() => navigate(`/admin/edit-article/${post.id}`)}
                          title="Edit article"
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer h-8 w-8 p-0 text-[#75716B] hover:text-[#12B379] hover:bg-[#EFEEEB] rounded-lg transition-colors"
                          onClick={() => navigate(`/post/${post.id}`)}
                          title="View post"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#75716B] py-6 text-center">No posts yet.</p>
              )}
            </div>
          </div>

          {/* Recent Comments */}
          <div className="bg-[#F9F8F6] rounded-2xl border border-[#DAD6D1] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DAD6D1] flex justify-between items-center bg-[#EFEEEB]/50">
              <h3 className="font-semibold text-base text-[#26231E]">Recent Comments</h3>
              <button
                onClick={() => navigate('/admin/notifications')}
                className="text-xs font-semibold text-[#12B379] hover:text-[#0e9464] flex items-center cursor-pointer transition-colors"
              >
                View activity <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 w-32 bg-[#DAD6D1]/50 rounded" />
                      <div className="h-3 w-full bg-[#DAD6D1]/30 rounded" />
                    </div>
                  ))}
                </div>
              ) : recentComments.length > 0 ? (
                <div className="divide-y divide-[#DAD6D1]/60">
                  {recentComments.map((comment, idx) => (
                    <div
                      key={comment.id}
                      className={`${
                        idx === 0 ? 'pb-3.5' : idx === recentComments.length - 1 ? 'pt-3.5' : 'py-3.5'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-sm text-[#26231E]">{comment.name}</h4>
                        <span className="text-xs text-[#75716B]">
                          {formatRelativeDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-[#75716B] line-clamp-2">{comment.comment}</p>
                      {(comment.posts || comment.blog_posts) && (
                        <p className="text-xs text-[#75716B] mt-1 font-medium">
                          On: <span className="text-[#26231E]">{(comment.posts || comment.blog_posts).title}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#75716B] py-6 text-center">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

