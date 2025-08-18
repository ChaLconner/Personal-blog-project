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
import { AdminSidebar } from "@/components/AdminWebSection";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { blogApi } from "@/services/api";
import { toast } from "sonner";

export default function AdminCreateArticlePage() {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        content: "",
        image: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await blogApi.admin.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

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
            setImagePreview(null);
            setImageFile(null);
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
                status: publish ? 'published' : 'draft'
            };

            await blogApi.admin.createPost(postData);
            toast.success(`Article ${publish ? 'published' : 'saved as draft'} successfully`);
            navigate('/admin/article-management');
        } catch (error) {
            console.error('Error creating article:', error);
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
                            <div className="flex justify-center items-center w-full max-w-lg h-64 px-6 py-20 border-2 border-gray-300 border-dashed rounded-md bg-gray-50">
                                {imagePreview ? (
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="max-w-full max-h-full object-contain rounded-md"
                                    />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                            {uploading ? 'Uploading...' : 'No image selected'}
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
                            defaultValue="Thompson P."
                            className="mt-1 max-w-lg"
                            disabled
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