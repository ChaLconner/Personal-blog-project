import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi } from '@/services/api';
import { useAuth } from '@/contexts/authContext.js';
import { formatShortDate, formatRelativeDate } from '@/utils/dateFormatter';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, postsResponse, commentsResponse] = await Promise.all([
          blogApi.admin.getStats(),
          blogApi.admin.getAllPosts(),
          blogApi.admin.getAllComments()
        ]);

        setStats(statsResponse.data);
        setRecentPosts(postsResponse.data?.slice(0, 5) || []); // Latest 5 posts
        setRecentComments(commentsResponse.data?.slice(0, 5) || []); // Latest 5 comments
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Render immediately and show inline loaders while fetching
  // This removes the blocking fullscreen loader while preserving behavior

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <span className="hidden sm:inline">View Site</span>
                <span className="sm:hidden">Site</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 border border-red-300 rounded">
            {error}
          </div>
        )}

        {/* Warnings banner (subtle) */}
        {stats?.warnings && stats.warnings.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
            <strong className="block font-medium">Partial data</strong>
            <ul className="mt-1 text-sm list-disc pl-5">
              {stats.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Posts</h3>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '—' : stats?.totalPosts ?? '0'}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Comments</h3>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '—' : stats?.totalComments ?? '0'}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Likes</h3>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '—' : stats?.totalLikes ?? '0'}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Categories</h3>
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{loading ? '—' : stats?.totalCategories ?? '0'}</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={() => navigate('/admin/article-management')}
            className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-blue-200"
          >
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900">Articles</h3>
            </div>
            <p className="text-sm text-blue-700 font-medium">Manage blog posts</p>
          </div>
          
          <div
            onClick={() => navigate('/admin/category-management')}
            className="bg-gradient-to-br from-emerald-50 to-teal-100 p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-emerald-200"
          >
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-emerald-900">Categories</h3>
            </div>
            <p className="text-sm text-emerald-700 font-medium">Organize content</p>
          </div>
          
          <div
            onClick={() => navigate('/admin/notifications')}
            className="bg-gradient-to-br from-amber-50 to-orange-100 p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-amber-200"
          >
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-amber-900">Notifications</h3>
            </div>
            <p className="text-sm text-amber-700 font-medium">View activity</p>
          </div>
          
          <div
            onClick={() => navigate('/admin/profile')}
            className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-purple-200"
          >
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-purple-900">Profile</h3>
            </div>
            <p className="text-sm text-purple-700 font-medium">Account settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Recent Posts */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900">Recent Posts</h2>
            </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-start animate-pulse">
                        <div>
                          <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                          <div className="h-3 w-32 bg-gray-200 rounded mb-1" />
                          <div className="h-3 w-20 bg-gray-200 rounded" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-200 rounded" />
                          <div className="h-6 w-12 bg-gray-200 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentPosts.length > 0 ? (
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{post.title}</h3>
                          <p className="text-sm text-gray-600">{post.category || 'Uncategorized'}</p>
                          <p className="text-xs text-gray-500">{formatShortDate(post.date)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/edit-article/${post.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => navigate(`/post/${post.id}`)}
                            className="text-green-600 hover:text-green-800 text-sm cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No posts yet.</p>
                )}
              </div>
          </div>

          {/* Recent Comments */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
              <h2 className="text-lg font-semibold text-green-900">Recent Comments</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border-b border-gray-100 pb-3 last:border-b-0 animate-pulse">
                      <div className="flex justify-between items-start mb-2">
                        <div className="h-4 w-40 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-5/6 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : recentComments.length > 0 ? (
                <div className="space-y-4">
                  {recentComments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm text-gray-900">{comment.name}</h4>
                        <span className="text-xs text-gray-500">
                          {formatRelativeDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{comment.comment}</p>
                      {comment.blog_posts && (
                        <p className="text-xs text-gray-500 mt-1">
                          On: {comment.blog_posts.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
