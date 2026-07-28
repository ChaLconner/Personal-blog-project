import { useState, useEffect, useCallback, useMemo } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";
import { X, User, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { blogApi } from "@/services/api.js";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, fetchUser } = useAuth();
  
  const [profile, setProfile] = useState({
    image: "",
    name: "",
    username: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfile({
          image: state.user?.profile_pic || "",
          name: state.user?.name || "",
          username: state.user?.username || "",
          email: state.user?.email || "",
        });
      } catch {
        toast.custom((t) => (
          <div className="bg-red-500 text-white p-4 rounded-sm flex justify-between items-start">
            <div>
              <h2 className="font-bold text-lg mb-1">
                Failed to fetch profile
              </h2>
              <p className="text-sm">Please try again later.</p>
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        ));
      }
    };

    fetchProfile();
  }, [state.user]);

  useEffect(() => {
    return () => {
      if (profile.image && profile.image.startsWith("blob:")) {
        URL.revokeObjectURL(profile.image);
      }
    };
  }, [profile.image]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.custom((t) => (
        <div className="bg-red-500 text-white p-4 rounded-sm flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg mb-1">Invalid file type</h2>
            <p className="text-sm">
              Please upload a valid image file (JPEG, PNG, GIF, WebP).
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-white hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
      ));
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.custom((t) => (
        <div className="bg-red-500 text-white p-4 rounded-sm flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg mb-1">File too large</h2>
            <p className="text-sm">Please upload an image smaller than 5MB.</p>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-white hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
      ));
      return;
    }

    setImageFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setProfile((prev) => ({
      ...prev,
      image: previewUrl,
    }));

    // Show success message for valid file
    toast.custom((t) => (
      <div className="bg-green-500 text-white p-4 rounded-sm flex justify-between items-start">
        <div>
          <h2 className="font-bold text-lg mb-1">Image selected</h2>
          <p className="text-sm">Click "Save" to upload your new profile picture.</p>
        </div>
        <button
          onClick={() => toast.dismiss(t)}
          className="text-white hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>
    ));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      let imageUrl = profile.image;

      // Upload image if a new file was selected
      if (imageFile) {
        const uploadResponse = await blogApi.uploadProfileImage(imageFile);

        if (uploadResponse.success) {
          // ใช้ URL ที่ได้จาก Supabase Storage โดยตรง
          imageUrl = uploadResponse.url;
        } else {
          throw new Error(uploadResponse.error || 'Failed to upload image');
        }
      }

      // Update profile data
      const updateData = {
        name: profile.name,
        username: profile.username,
      };

      // Include image URL if it was uploaded
      if (imageFile && imageUrl) {
        updateData.imageUrl = imageUrl;
      }

      const response = await blogApi.auth.updateProfile(updateData);

      if (response.success) {
        toast.dismiss();
        toast.success('Saved profile', {
          description: 'Your profile has been successfully updated',
          className: 'custom-alert-toast'
        });

        // Clear the image file since it's now uploaded
        setImageFile(null);

        // Fetch updated user data to sync global state
        await fetchUser();
        
        // Update local profile state with the new image URL
        if (imageUrl) {
          setProfile(prev => ({
            ...prev,
            image: imageUrl
          }));
        }
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }

    } catch (error) {
      toast.custom((t) => (
        <div className="bg-red-500 text-white p-4 rounded-sm flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg mb-1">Failed to update profile</h2>
            <p className="text-sm">
              {error.response?.data?.error || error.message || 'Please try again later.'}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-white hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
      ));
    } finally {
      setIsSaving(false);
    }
  }, [profile.image, profile.name, profile.username, imageFile, fetchUser]);

  const handleResetPassword = useCallback(() => {
    navigate("/reset-password");
  }, [navigate]);

  const avatarSrc = useMemo(() => profile.image || state.user?.profile_pic, [profile.image, state.user?.profile_pic]);
  const displayName = useMemo(() => profile.name || state.user?.name, [profile.name, state.user?.name]);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 md:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center p-6">
            <UserAvatar
              src={avatarSrc}
              name={state.user?.name}
              username={state.user?.username}
              email={state.user?.email}
              size="xl"
              alt="Profile"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold">{displayName}</h1>
            </div>
            <div className="ml-4 font-semibold text-2xl">
              <span className="mr-4">|</span> Profile
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden p-4 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-foreground font-medium cursor-default">
                <User className="h-5 w-5" />
                <span className="text-lg">Profile</span>
              </div>
              <button
                onClick={handleResetPassword}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer text-sm"
              >
                <Lock className="h-4 w-4" />
                Reset password
              </button>
            </div>
            <div className="flex flex-col items-center">
              <UserAvatar
                src={avatarSrc}
                name={state.user?.name}
                username={state.user?.username}
                email={state.user?.email}
                size="xl"
                alt="Profile"
              />
              <h2 className="mt-3 text-xl font-semibold text-center">{displayName}</h2>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 p-6">
              <nav>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-foreground font-medium cursor-default">
                    <User className="h-5 w-5 mb-1" />
                    <span>Profile</span>
                  </div>
                  <button
                    onClick={handleResetPassword}
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  >
                    <Lock className="h-5 w-5 mb-1" />
                    Reset password
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 bg-[#EFEEEB] md:m-2 md:shadow-md md:rounded-lg">
              <div className="hidden md:flex flex-col md:flex-row items-center justify-start md:gap-6 mb-6">
                <UserAvatar
                  src={avatarSrc}
                  name={state.user?.name}
                  username={state.user?.username}
                  email={state.user?.email}
                  size="2xl"
                  alt="Profile"
                  className="mb-5"
                />
                <label className="bg-[#FFFFFF] px-8 py-2 rounded-full text-foreground border-[1px] border-[#75716B] hover:border-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                  Upload profile picture
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
              </div>

              {/* Mobile Upload Button */}
              <div className="md:hidden mb-6">
                <label className="w-full bg-[#FFFFFF] px-6 py-3 rounded-full text-foreground border-[1px] border-[#75716B] hover:border-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer flex items-center justify-center">
                  Upload profile picture
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    className="py-3 px-4 rounded-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <Input
                    id="username"
                    name="username"
                    value={profile.username}
                    onChange={handleInputChange}
                    className="py-3 px-4 rounded-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="py-3 px-4 rounded-lg bg-gray-100"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full md:w-auto px-8 py-3 bg-[#26231E] text-white rounded-full hover:bg-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
