import { useState, useCallback } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/common/UserAvatar";
import { User, Lock, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { blogApi } from "@/services/api.js";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [valid, setValid] = useState({
    password: true,
    newPassword: true,
    confirmNewPassword: true,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { state, logout } = useAuth();

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const isValidPassword = password.trim() !== "";
    const isValidNewPassword = newPassword.trim() !== "" && newPassword.length >= 6;
    const isValidConfirmPassword =
      confirmNewPassword.trim() !== "" && confirmNewPassword === newPassword;

    setValid({
      password: isValidPassword,
      newPassword: isValidNewPassword,
      confirmNewPassword: isValidConfirmPassword,
    });

    if (isValidPassword && isValidNewPassword && isValidConfirmPassword) {
      setIsDialogOpen(true);
    }
  }, [password, newPassword, confirmNewPassword]);

  const handleResetPassword = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsDialogOpen(false);

      const response = await blogApi.auth.resetPassword({
        oldPassword: password,
        newPassword: newPassword,
      });

      if (response.success) {
        toast.custom((t) => (
          <div className="bg-green-500 text-white p-4 rounded-sm flex justify-between items-start">
            <div>
              <h2 className="font-bold text-lg mb-1">Success!</h2>
              <p className="text-sm">
                Password reset successful. You can now log in with your new
                password.
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

        // Clear form fields after successful reset
        setPassword("");
        setNewPassword("");
        setConfirmNewPassword("");

        // For security, log out and redirect to login to sign in with the new password
        const userRole = state.user?.role;
        try {
          await logout();
        } catch {
          // ignore logout errors
        }
        // Check if user is admin and redirect to appropriate login page
        const loginPath = userRole === 'admin' ? "/admin/login" : "/login";
        const redirectPath = userRole === 'admin' ? "/admin" : "/profile";
        navigate(`${loginPath}?redirect=${redirectPath}`, { replace: true });
      } else {
        throw new Error(response.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.custom((t) => (
        <div className="bg-red-500 text-white p-4 rounded-sm flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg mb-1">Error</h2>
            <p className="text-sm">
              {error.response?.data?.error ||
                error.message ||
                "Something went wrong. Please try again."}
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
      setIsLoading(false);
    }
  }, [password, newPassword, logout, navigate, state]);

  const handleNavigateToProfile = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  const handleNewPasswordChange = useCallback((e) => {
    setNewPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e) => {
    setConfirmNewPassword(e.target.value);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="min-h-screen md:p-8">
        <div className="max-w-4xl w-full md:mx-auto overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center p-6">
            <UserAvatar
              src={state.user?.profile_pic}
              name={state.user?.name}
              username={state.user?.username}
              email={state.user?.email}
              size="xl"
              alt="Profile"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold">{state.user?.name}</h1>
            </div>
            <div className="ml-4 font-semibold text-2xl">
              <span className="mr-4">|</span> Reset Password
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden p-4">
            <div className="flex justify-start gap-12 items-center mb-4">
              <a
                onClick={handleNavigateToProfile}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <User className="h-5 w-5 mb-1" />
                Profile
              </a>
              <div className="flex items-center space-x-2 text-foreground font-medium cursor-default">
                <Lock className="h-5 w-5 mb-1" />
                <span>Reset password</span>
              </div>
            </div>
            <div className="flex items-center">
              <UserAvatar
                src={state.user?.profile_pic}
                name={state.user?.name}
                username={state.user?.username}
                email={state.user?.email}
                size="md"
                alt="Profile"
              />
              <h2 className="ml-3 text-xl font-semibold">{state.user?.name}</h2>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 p-6">
              <nav>
                <div className="space-y-3">
                  <a
                    onClick={handleNavigateToProfile}
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  >
                    <User className="h-5 w-5 mb-1" />
                    Profile
                  </a>
                  <div className="flex items-center space-x-2 text-foreground font-medium cursor-default">
                    <Lock className="h-5 w-5 mb-1" />
                    <span>Reset password</span>
                  </div>
                </div>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 bg-[#EFEEEB] md:m-2 md:shadow-md md:rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="relative">
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current password
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Current password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${
                      !valid.password ? "border-red-500" : ""
                    }`}
                  />
                  {!valid.password && (
                    <p className="text-red-500 text-xs absolute mt-1">
                      This field is required
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    className={`mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${
                      !valid.newPassword ? "border-red-500" : ""
                    }`}
                  />
                  {!valid.newPassword && (
                    <p className="text-red-500 text-xs absolute mt-1">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label
                    htmlFor="confirm-new-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm new password
                  </label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${
                      !valid.confirmNewPassword ? "border-red-500" : ""
                    }`}
                  />
                  {!valid.confirmNewPassword && (
                    <p className="text-red-500 text-xs absolute mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-8 py-2 bg-[#26231E] text-white rounded-full hover:bg-muted-foreground transition-colors"
                >
                  Reset password
                </button>
              </form>
            </main>
          </div>
        </div>
      </div>
      <Footer />
      <ResetPasswordModal
        dialogState={isDialogOpen}
        setDialogState={setIsDialogOpen}
        resetFunction={handleResetPassword}
        isLoading={isLoading}
      />
    </div>
  );
}

const ResetPasswordModal = ({ dialogState, setDialogState, resetFunction, isLoading }) => {
  const handleCancel = useCallback(() => {
    setDialogState(false);
  }, [setDialogState]);

  return (
    <AlertDialog open={dialogState} onOpenChange={setDialogState}>
      <AlertDialogContent className="bg-white rounded-md pt-16 pb-6 max-w-[22rem] sm:max-w-md flex flex-col items-center">
        <AlertDialogTitle className="text-3xl font-semibold pb-2 text-center">
          Reset password
        </AlertDialogTitle>
        <AlertDialogDescription className="flex flex-row mb-2 justify-center font-medium text-center text-muted-foreground">
          Do you want to reset your password?
        </AlertDialogDescription>
        <div className="flex flex-row gap-4">
          <button
            onClick={handleCancel}
            className="bg-background px-10 py-4 rounded-full text-foreground border border-foreground hover:border-muted-foreground hover:text-muted-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={resetFunction}
            disabled={isLoading}
            className="rounded-full text-white bg-foreground hover:bg-muted-foreground transition-colors py-4 text-lg px-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting..." : "Reset"}
          </button>
        </div>
        <AlertDialogCancel className="absolute right-4 top-2 sm:top-4 p-1 border-none bg-transparent hover:bg-transparent shadow-none dark:bg-transparent cursor-pointer">
          <X className="h-6 w-6" />
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};
