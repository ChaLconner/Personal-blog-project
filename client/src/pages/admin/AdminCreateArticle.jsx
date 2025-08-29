import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { blogApi } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext.js";

export default function AdminCreateArticlePage() {
    const { user } = useAuth(); // เพิ่มการใช้งาน useAuth
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        content: "",
        image: "",
        author: "" // เพิ่ม author ใน formData
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
        // ตั้งค่าชื่อ author เริ่มต้นจากข้อมูล user ที่ล็อกอิน
        if (user?.name) {
            setFormData(prev => ({
                ...prev,
                author: user.name
            }));
        }
    }, [user]);

    const fetchCategories = async () => {
        try {
            const response = await blogApi.admin.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImagePreview(null);
        handleInputChange('image', '');
        toast.success('Image removed successfully');
    };

    const resetImageState = () => {
        setImageFile(null);
        setImagePreview(null);
        setUploading(false);
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
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const openFilePicker = () => {
        document.getElementById('file-upload').click();
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Prevent duplicate upload
        if (uploading) {
            toast.error('Upload in progress, please wait...');
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

        // Check if same file is already uploaded
        if (imageFile && imageFile.name === file.name && imageFile.size === file.size) {
            toast.error('This image is already uploaded.');
            return;
        }

        try {
            setUploading(true);
            
            // Create preview immediately for better UX
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);

            // Upload to server
            const response = await blogApi.uploadImage(file);
            
            if (response.success) {
                setImageFile(file);
                handleInputChange('image', response.url);
                toast.success('Image uploaded successfully');
            } else {
                throw new Error(response.error || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Upload error:', error);
            toast.error('Failed to upload image');
            resetImageState(); // Use the reset function
        } finally {
            setUploading(false);
        }
    };

    const handleSaveAsDraft = async (e) => {
        e.preventDefault();
        await handleSubmit(false);
    };

    const handleSaveAndPublish = async (e) => {
        e.preventDefault();
        await handleSubmit(true);
    };

    const handleSubmit = async (publish = false) => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Title and content are required');
            return;
        }

        try {
            setLoading(true);
            const postData = {
                ...formData,
                title: formData.title.trim(),
                description: formData.description.trim(),
                content: formData.content.trim(),
                author: formData.author.trim() || user?.name || 'Admin', // ส่ง author ไปด้วย
                status: publish ? 'published' : 'draft' // แก้ไขให้ใช้ 'published' แทน 'publish'
            };

            await blogApi.admin.createPost(postData);
            toast.success(`Article ${publish ? 'published' : 'saved as draft'} successfully`);
            
            // Reset form and image state after successful creation
            setFormData({
                title: "",
                category: "",
                description: "",
                content: "",
                image: "",
                author: user?.name || "" // รีเซ็ต author กลับเป็นชื่อ user
            });
            resetImageState(); // Clear image state
            
            navigate('/admin/article-management');
        } catch (error) {
            console.error('❌ Error creating article:', error);
            const errorMessage = error.message || 'Failed to create article';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main content */}
            <main className="flex-1 p-8 bg-gray-50 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Create article</h2>
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
                            {loading ? 'Publishing...' : 'Save and publish'}
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
                        <div className="flex items-end space-x-4">
                            <div 
                                className={`flex justify-center items-center w-full max-w-lg h-64 px-6 py-20 border-2 border-dashed rounded-md bg-gray-50 relative transition-colors ${
                                    dragActive 
                                        ? 'border-blue-400 bg-blue-50' 
                                        : 'border-gray-300'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={!imagePreview ? openFilePicker : undefined}
                                style={{ cursor: !imagePreview ? 'pointer' : 'default' }}
                            >
                                {imagePreview ? (
                                    <>
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="max-w-full max-h-full object-contain rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleImageRemove}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                            title="Remove image"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                            {uploading 
                                                ? 'Uploading...' 
                                                : dragActive 
                                                    ? 'Drop image here' 
                                                    : 'Drag & drop image here or click to browse'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="file-upload"
                                className={`px-8 py-2 bg-background rounded-full text-foreground border border-foreground hover:border-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span>{uploading ? 'Uploading...' : 'Upload thumbnail image'}</span>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    accept="image/*"
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
                        </div>
                        
                        {/* Display selected file information */}
                        {imageFile && (
                            <div className="mt-3 p-3 bg-gray-100 rounded-md">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-700">{imageFile.name}</span>
                                        <span className="text-xs text-gray-500">
                                            ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleImageRemove}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="category">Category</label>
                        <Select onValueChange={(value) => handleInputChange('category', value)}>
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
                        <p className="text-sm text-gray-500 mt-1">
                            Default: {user?.name || 'Admin'}
                        </p>
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
                        <label htmlFor="introduction">Description (max 120 letters)</label>
                        <Textarea
                            id="introduction"
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
            </main>
        </div>
    );
}