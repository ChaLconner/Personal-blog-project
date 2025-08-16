import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi } from '@/services/api';
import { useAuth } from '@/contexts/authContext.js';

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
        setRecentPosts(postsResponse.data.slice(0, 5)); // Latest 5 posts
        setRecentComments(commentsResponse.data.slice(0, 5)); // Latest 5 comments
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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 border border-red-300 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Posts</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Comments</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalComments}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Likes</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLikes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Categories</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/create-article')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <h3 className="font-semibold">Create Post</h3>
            <p className="text-sm opacity-90">Write a new blog post</p>
          </button>
          <button
            onClick={() => navigate('/admin/create-category')}
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            <h3 className="font-semibold">Manage Categories</h3>
            <p className="text-sm opacity-90">Add or edit categories</p>
          </button>
          <button
            onClick={() => navigate('/admin/notifications')}
            className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-sm opacity-90">View recent activity</p>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <h3 className="font-semibold">Profile</h3>
            <p className="text-sm opacity-90">Edit your profile</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            </div>
            <div className="p-6">
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{post.title}</h3>
                        <p className="text-sm text-gray-600">{post.category || 'Uncategorized'}</p>
                        <p className="text-xs text-gray-500">{post.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admin/edit-article/${post.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/post/${post.id}`)}
                          className="text-green-600 hover:text-green-800 text-sm"
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
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Comments</h2>
            </div>
            <div className="p-6">
              {recentComments.length > 0 ? (
                <div className="space-y-4">
                  {recentComments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm text-gray-900">{comment.name}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
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
