import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/authContext.js";
import { blogApi } from "@/services/api";
import { toast } from "sonner";

export default function AdminProfilePage() {
    const { user, fetchUser } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        bio: ""
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: user.username || "",
                email: user.email || "",
                bio: user.bio || ""
            });
            if (user.profile_image_url) {
                setImagePreview(user.profile_image_url);
            }
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageUpload = async (file) => {
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
            
            // Create preview immediately for better UX
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);

            // Upload to server
            const response = await blogApi.uploadProfileImage(file);
            
            if (response.success) {
                setProfileImage(response.url);
                toast.success('Profile image uploaded successfully');
            } else {
                throw new Error(response.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload profile image');
            setImagePreview(user?.profile_image_url || null);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.email.trim()) {
            toast.error('Name and email are required');
            return;
        }

        try {
            setLoading(true);
            const updateData = {
                ...formData,
                name: formData.name.trim(),
                username: formData.username.trim(),
                email: formData.email.trim(),
                bio: formData.bio.trim()
            };

            if (profileImage) {
                updateData.profile_image_url = profileImage;
            }

            await blogApi.auth.updateProfile(updateData);
            await fetchUser(); // Refresh user data
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-ui-surface">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main content */}
            <main className="flex-1 p-8 bg-background overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Admin Profile</h2>
                    <Button 
                        className="px-8 py-2 rounded-full"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </Button>
                </div>

                <div>
                    <div className="flex items-center mb-6">
                        <Avatar className="w-24 h-24 mr-4">
                            <AvatarImage
                                src={imagePreview || '/default-avatar.png'}
                                alt="Profile picture"
                            />
                            <AvatarFallback>
                                {formData.name ? formData.name.charAt(0).toUpperCase() : 'A'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <Button 
                                variant="outline" 
                                onClick={() => document.getElementById('profile-image-upload').click()}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload Profile Picture'}
                            </Button>
                            <input
                                id="profile-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleImageUpload(file);
                                    }
                                }}
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                JPG, PNG, GIF or WebP. Max 5MB.
                            </p>
                        </div>
                    </div>

                    <form className="space-y-7 max-w-2xl" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                                Name *
                            </label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-1">
                                Username
                            </label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                                placeholder="Enter your username"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                                Email *
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground mb-1">
                                Bio (max 500 characters)
                            </label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                rows={6}
                                maxLength={500}
                                className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                                placeholder="Tell us about yourself..."
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                {formData.bio.length}/500 characters
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-foreground mb-2">Account Information</h3>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p><strong>Role:</strong> {user?.role || 'User'}</p>
                                    <p><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                                    <p><strong>Last Updated:</strong> {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}