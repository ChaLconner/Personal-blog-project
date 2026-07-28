import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/blog/AdminWebSection";
import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { blogApi } from "@/services/api";
import { useAuth } from "@/contexts/authContext";

export default function AdminResetPasswordPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [valid, setValid] = useState({
        password: true,
        newPassword: true,
        confirmNewPassword: true,
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSubmit = (e) => {
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
    };

    const handleResetPassword = async () => {
        try {
            setLoading(true);
            
            // Call API to reset password
            await blogApi.auth.resetPassword({
                oldPassword: password,
                currentPassword: password,
                newPassword: newPassword
            });
            
            toast.success('Password reset successful. You can now log in with your new password.');
            
            // Clear form
            setPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setIsDialogOpen(false);
            
            // For security, log out and redirect to admin login to sign in with the new password
            try {
                await logout();
            } catch {
                // ignore logout errors
            }
            navigate("/admin/login", { replace: true });
            
        } catch (error) {
            console.error('Error resetting password:', error);
            const errorMessage = error.message || 'Failed to reset password. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex h-screen overflow-hidden bg-ui-surface font-poppins">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main content */}
            <main className="flex-1 p-4 lg:p-8 bg-background overflow-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-xl sm:text-2xl font-semibold">Reset Password</h2>
                    <Button
                        className="px-6 py-2 sm:px-8 sm:py-2 rounded-full text-[#FFFFFF] bg-[#26231E] cursor-pointer w-full sm:w-auto"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </div>

                <div className="space-y-6 sm:space-y-7 max-w-md w-full">
                    <div className="relative">
                        <label
                            htmlFor="current-password"
                            className="block text-sm font-medium text-muted-foreground mb-1"
                        >
                            Current password
                        </label>
                        <Input
                            id="current-password"
                            type="password"
                            placeholder="Current password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`mt-1 w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${!valid.password ? "border-red-500" : ""
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
                            className="block text-sm font-medium text-muted-foreground mb-1"
                        >
                            New password
                        </label>
                        <Input
                            id="new-password"
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`mt-1 w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${!valid.newPassword ? "border-red-500" : ""
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
                            className="block text-sm font-medium text-muted-foreground mb-1"
                        >
                            Confirm new password
                        </label>
                        <Input
                            id="confirm-new-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className={`mt-1 w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${!valid.confirmNewPassword ? "border-red-500" : ""
                                }`}
                        />
                        {!valid.confirmNewPassword && (
                            <p className="text-red-500 text-xs absolute mt-1">
                                Passwords do not match
                            </p>
                        )}
                    </div>
                </div>
            </main>
            <ResetPasswordModal
                dialogState={isDialogOpen}
                setDialogState={setIsDialogOpen}
                resetFunction={handleResetPassword}
            />
        </div>
    );
}

function ResetPasswordModal({ dialogState, setDialogState, resetFunction }) {
    return (
        <AlertDialog open={dialogState} onOpenChange={setDialogState}>
            <AlertDialogContent className="bg-card rounded-md pt-16 pb-6 max-w-[22rem] sm:max-w-md flex flex-col items-center">
                <AlertDialogTitle className="text-3xl font-semibold pb-2 text-center text-foreground">
                    Reset password
                </AlertDialogTitle>
                <AlertDialogDescription className="flex flex-row mb-2 justify-center font-medium text-center text-muted-foreground">
                    Do you want to reset your password?
                </AlertDialogDescription>
                <div className="flex flex-row gap-4">
                    <button
                        onClick={() => setDialogState(false)}
                        className="bg-background px-10 py-4 rounded-full text-foreground border border-border hover:border-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={resetFunction}
                        className="rounded-full text-primary-foreground bg-primary hover:bg-primary/90 transition-colors py-4 text-lg px-10 cursor-pointer"
                    >
                        Reset
                    </button>
                </div>
                <AlertDialogCancel className="absolute right-4 top-2 sm:top-4 p-1 border-none bg-transparent hover:bg-transparent shadow-none dark:bg-transparent cursor-pointer">
                    <X className="h-6 w-6" />
                </AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    );
}
