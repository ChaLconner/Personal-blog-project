import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/common/UserAvatar";
import { AdminSidebar } from "@/components/blog/AdminWebSection";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/authContext";
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
      if (user.profile_pic) {
        setImagePreview(user.profile_pic);
      }
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadImageToSupabase = async (file) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const response = await blogApi.uploadProfileImage(file);
    
    if (!response.success) {
      throw new Error(response.error || "Failed to upload image");
    }

    return response.url;
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large. Maximum 5MB allowed.");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      const publicUrl = await uploadImageToSupabase(file);

      setProfileImage(publicUrl);
      toast.dismiss();
      toast.success("Profile image uploaded successfully");
    } catch {
      toast.dismiss();
      toast.error("Failed to upload profile image");
      setImagePreview(user?.profile_pic || null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.dismiss();
      toast.error("Name and email are required");
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        ...formData,
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
      };

      if (profileImage) {
        updateData.profile_pic = profileImage;
        // Also include imageUrl for compatibility with server endpoint
        updateData.imageUrl = profileImage;
      }

      await blogApi.auth.updateProfile(updateData);
      await fetchUser();

      if (profileImage) setImagePreview(profileImage);
      setProfileImage(null);
      toast.dismiss();
      toast.success('Saved profile', {
        description: 'Your profile has been successfully updated',
        className: 'custom-alert-toast'
      });
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-poppins">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 bg-background overflow-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Admin Profile</h2>
          <Button
            className="px-6 py-2 sm:px-8 sm:py-2 rounded-full text-[#FFFFFF] bg-[#26231E] cursor-pointer w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 gap-4">
            <UserAvatar
              src={imagePreview || "/default-avatar.png"}
              name={formData.name}
              size="xl"
              alt="Profile picture"
              className="sm:mr-4"
            />
            <div className="flex flex-col items-center sm:items-start">
              <Button
                variant="outline"
                className="cursor-pointer w-full sm:w-auto"
                onClick={() => document.getElementById("profile-image-upload").click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Profile Picture"}
              </Button>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleImageUpload(file);
                }}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center sm:text-left">
                JPG, PNG, GIF or WebP. Max 5MB.
              </p>
            </div>
          </div>

          <form className="space-y-6 sm:space-y-7 max-w-2xl" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-1 w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
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
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="mt-1 w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
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
                disabled
                className="mt-1 w-full py-3 rounded-sm bg-muted/50 cursor-not-allowed placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground mb-1">
                Bio (max 500 characters)
              </label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={6}
                maxLength={500}
                className="mt-1 w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                placeholder="Tell us about yourself..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
