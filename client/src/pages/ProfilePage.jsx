import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/WebSection";
import { useNavigate } from "react-router-dom";
import { X, User, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";
import { blogApi } from "@/services/api.js";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, fetchUser } = useAuth();
  
  // Helper function to generate user initials (consistent with NavBar)
  const getUserInitials = (user) => {
    if (!user) return "U";
    const name = user?.name || user?.username || user?.email || "";
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    return initials || "U";
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
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
  };

  const handleSubmit = async (e) => {
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
        toast.custom((t) => (
          <div className="bg-green-500 text-white p-4 rounded-sm flex justify-between items-start">
            <div>
              <h2 className="font-bold text-lg mb-1">
                Profile updated successfully
              </h2>
              <p className="text-sm">Your profile changes have been saved.</p>
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        ));

        // Clear the image file since it's now uploaded
        setImageFile(null);

        // Fetch updated user data to sync global state
        await fetchUser();
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
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="min-h-screen md:p-8">
        <div className="max-w-4xl mx-auto overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center p-6">
            <Avatar className="h-14 w-14">
              <AvatarImage
                src={profile.image}
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-500 text-white">
                {getUserInitials(state.user)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">{profile.name || state.user?.name}</h1>
            </div>
            <div className="ml-4 font-semibold text-2xl leading-8 tracking-normal" style={{ fontFamily: 'Poppins', fontSize: '24px', lineHeight: '32px' }}>
              <span className="mr-4">|</span> Profile
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden p-4">
            <div className="flex justify-start gap-12 items-center mb-4">
              <div className="flex items-center space-x-2 text-foreground font-medium cursor-default">
                <User className="h-5 w-5 mb-1" />
                <span>Profile</span>
              </div>
              <button
                onClick={() => {
                  console.log('🔍 Navigating to /reset-password');
                  navigate("/reset-password");
                }}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <Lock className="h-5 w-5 mb-1" />
                Reset password
              </button>
            </div>
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={profile.image}
                  alt="Profile"
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-500 text-white">
                  {getUserInitials(state.user)}
                </AvatarFallback>
              </Avatar>
              <h2 className="ml-3 text-xl font-semibold">{profile.name || state.user?.name}</h2>
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
                    onClick={() => {
                      console.log('🔍 Desktop - Navigating to /reset-password');
                      navigate("/reset-password");
                    }}
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  >
                    <Lock className="h-5 w-5 mb-1" />
                    Reset password
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 bg-[#EFEEEB] md:m-2 md:shadow-md md:rounded-lg">
              <div className="flex flex-col md:flex-row items-center justify-start md:gap-6 mb-6">
                <Avatar className="h-28 w-28 mb-5">
                  <AvatarImage
                    src={profile.image}
                    alt="Profile"
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg font-medium bg-gray-500 text-white">
                    {getUserInitials(state.user)}
                  </AvatarFallback>
                </Avatar>
                <label className="bg-background px-8 py-2 rounded-full text-foreground border border-foreground hover:border-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                  Upload profile picture
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username
                  </label>
                  <Input
                    id="username"
                    name="username"
                    value={profile.username}
                    onChange={handleInputChange}
                    className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2 mt-2 bg-[#26231E] text-white rounded-full hover:bg-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </form>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}