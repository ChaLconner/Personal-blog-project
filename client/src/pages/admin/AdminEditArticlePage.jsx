import { ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminSidebar } from "@/components/AdminWebSection";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blogApi } from "@/services/api";
import { toast } from "sonner";

export default function AdminEditArticlePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        content: "",
        image: "",
        author: "", // เพิ่ม author
        status: "published" // เปลี่ยนจาก "publish" เป็น "published"
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingPost, setFetchingPost] = useState(true);
    const [dragActive, setDragActive] = useState(false);

    const fetchPost = async () => {
        try {
            setFetchingPost(true);
            console.log('🔍 Fetching post with ID:', id);
            
            const response = await blogApi.admin.getPost(id);
            console.log('📝 Post response:', response);
            
            if (response.success) {
                const post = response.data;
                console.log('📋 Post data:', post);
                
                setFormData({
                    title: post.title || "",
                    category: post.category || "",
                    description: post.description || "",
                    content: post.content || "",
                    image: post.image || "",
                    author: post.author || "Admin", // เพิ่ม author
                    status: post.status || "published" // เปลี่ยนจาก "publish" เป็น "published"
                });
                
                if (post.image) {
                    setImagePreview(post.image.startsWith('http') ? post.image : `http://localhost:3001${post.image}`);
                }
                
                console.log('✅ Form data set successfully');
            } else {
                console.error('❌ Response not successful:', response);
                toast.error('Failed to fetch article data');
                navigate('/admin/article-management');
            }
        } catch (error) {
            console.error('❌ Error fetching post:', error);
            toast.error('Failed to fetch article');
            navigate('/admin/article-management');
        } finally {
            setFetchingPost(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await blogApi.admin.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        }
    };

    useEffect(() => {
        console.log('📝 AdminEditArticlePage mounted with ID:', id);
        if (id) {
            fetchPost();
            fetchCategories();
        } else {
            console.error('❌ No article ID provided in URL params');
            toast.error('Invalid article ID');
            navigate('/admin/article-management');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Check for duplicate file
        if (imageFile && imageFile.name === file.name && imageFile.size === file.size) {
            toast.info('This image is already selected');
            return;
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size too large. Maximum 5MB allowed.');
            return;
        }

        try {
            setUploading(true);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);

            // Upload to server
            const response = await blogApi.uploadImage(file);
            
            if (response.success) {
                setImageFile(file);
                handleInputChange('image', response.url);
                toast.success('Image uploaded successfully');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
            setImagePreview(formData.image ? (formData.image.startsWith('http') ? formData.image : `http://localhost:3001${formData.image}`) : null);
            setImageFile(null);
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            handleFileUpload(file);
        }
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImagePreview(null);
        handleInputChange('image', '');
        toast.success('Image removed');
    };

    const handleSaveAsDraft = async (e) => {
        e.preventDefault();
        await handleSubmit('draft');
    };

    const handleSaveAndPublish = async (e) => {
        e.preventDefault();
        await handleSubmit('publish');
    };

    const handleSubmit = async (status = 'publish') => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Title and content are required');
            return;
        }

        try {
            setLoading(true);
            console.log('💾 Updating post with ID:', id);
            console.log('📋 Post data to update:', formData);
            
            const postData = {
                ...formData,
                title: formData.title.trim(),
                description: formData.description.trim(),
                content: formData.content.trim(),
                status: status
            };

            console.log('📤 Sending update data:', postData);
            const response = await blogApi.admin.updatePost(id, postData);
            console.log('📥 Update response:', response);
            
            if (response.success) {
                toast.success(`Article ${status === 'publish' ? 'published' : 'saved as draft'} successfully`);
                navigate('/admin/article-management');
            } else {
                console.error('❌ Update failed:', response);
                const errorMessage = response.error || 'Failed to update article';
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('❌ Error updating article:', error);
            const errorMessage = error.message || 'Failed to update article';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteArticle = async () => {
        if (window.confirm(`Are you sure you want to delete "${formData.title}"?`)) {
            try {
                setLoading(true);
                await blogApi.admin.deletePost(id);
                toast.success('Article deleted successfully');
                navigate('/admin/article-management');
            } catch (error) {
                console.error('Error deleting article:', error);
                const errorMessage = error.message || 'Failed to delete article';
                toast.error(errorMessage);
                setLoading(false);
            }
        }
    };

    if (fetchingPost) {
        return (
            <div className="flex h-screen bg-gray-100">
                <AdminSidebar />
                <main className="flex-1 p-8 bg-gray-50 overflow-auto">
                    <div className="text-center mt-20">Loading article...</div>
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
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-semibold">Edit article</h2>
                        {formData.status && (
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                                formData.status === 'publish' 
                                    ? 'bg-ui-surface text-brand-primary' 
                                    : 'bg-ui-surface text-brand-secondary'
                            }`}>
                                <span 
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                        formData.status === 'publish' 
                                            ? 'bg-brand-accent' 
                                            : 'bg-brand-secondary'
                                    }`}
                                />
                                {formData.status === 'draft' ? 'Draft' : 'Published'}
                            </span>
                        )}
                    </div>
                    <div className="space-x-2">
                        <Button 
                            className="px-8 py-2 rounded-full" 
                            variant="outline"
                            onClick={handleSaveAsDraft}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save as draft'}
                        </Button>
                        <Button 
                            className="px-8 py-2 rounded-full"
                            onClick={handleSaveAndPublish}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                <form className="space-y-7 max-w-4xl">
                    <div>
                        <label
                            htmlFor="thumbnail"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Thumbnail image
                        </label>
                        <div className="flex items-start space-x-4">
                            <div 
                                className={`flex justify-center items-center w-full max-w-lg h-64 px-6 py-4 border-2 border-dashed rounded-md transition-colors ${
                                    dragActive 
                                        ? 'border-blue-400 bg-blue-50' 
                                        : imagePreview 
                                            ? 'border-gray-300 bg-gray-50' 
                                            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                                } ${uploading ? 'opacity-50' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => !uploading && !imagePreview && document.getElementById('file-upload-edit').click()}
                                style={{ cursor: !uploading && !imagePreview ? 'pointer' : 'default' }}
                            >
                                {imagePreview ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleImageRemove();
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg"
                                            disabled={uploading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">
                                                {uploading ? 'Uploading...' : 'Drop image here or click to browse'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                JPEG, PNG, GIF, WebP up to 5MB
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col space-y-2">
                                <label
                                    htmlFor="file-upload-edit"
                                    className={`px-6 py-2 bg-background rounded-full text-foreground border border-foreground hover:border-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer text-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="text-sm font-medium">
                                        {uploading ? 'Uploading...' : 'Browse files'}
                                    </span>
                                    <input
                                        id="file-upload-edit"
                                        name="file-upload-edit"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        disabled={uploading}
                                        className="sr-only"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                handleFileUpload(file);
                                            }
                                        }}
                                    />
                                </label>
                                
                                {imageFile && (
                                    <div className="bg-gray-100 p-3 rounded-md max-w-xs">
                                        <p className="text-sm text-gray-700 font-medium truncate">
                                            {imageFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                )}
                                
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={handleImageRemove}
                                        className="px-4 py-2 text-red-600 border border-red-300 rounded-full hover:bg-red-50 transition-colors text-sm font-medium"
                                        disabled={uploading}
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="category">Category</label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                            <SelectTrigger className="max-w-lg mt-1 py-3 rounded-sm text-muted-foreground focus:ring-0 focus:ring-offset-0 focus:border-muted-foreground">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label htmlFor="author">Author name</label>
                        <Input
                            id="author"
                            placeholder="Enter author name"
                            value={formData.author}
                            onChange={(e) => handleInputChange('author', e.target.value)}
                            className="mt-1 max-w-lg py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                        />
                    </div>

                    <div>
                        <label htmlFor="title">Title</label>
                        <Input
                            id="title"
                            placeholder="Article title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                        />
                    </div>

                    <div>
                        <label htmlFor="description">Description (max 120 letters)</label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the article"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                            maxLength={120}
                        />
                    </div>

                    <div>
                        <label htmlFor="content">Content</label>
                        <Textarea
                            id="content"
                            placeholder="Write your article content here..."
                            value={formData.content}
                            onChange={(e) => handleInputChange('content', e.target.value)}
                            rows={20}
                            className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                        />
                    </div>
                </form>
                
                <button 
                    onClick={handleDeleteArticle}
                    disabled={loading}
                    className="underline underline-offset-2 hover:text-muted-foreground text-sm font-medium flex items-center gap-1 mt-4 disabled:opacity-50"
                >
                    <Trash2 className="h-5 w-5" />
                    {loading ? 'Deleting...' : 'Delete article'}
                </button>
            </main>
        </div>
    );
}