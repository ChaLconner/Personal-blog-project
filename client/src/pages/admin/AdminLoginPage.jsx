import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/authContext.js";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isErrorEmail, setIsErrorEmail] = useState(false);
    const [isErrorPassword, setIsErrorPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    const from = location.state?.from?.pathname || "/admin/article-management";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        let valid = true;

        if (!email.trim()) {
            setIsErrorEmail(true);
            valid = false;
        } else {
            setIsErrorEmail(false);
        }

        if (!password.trim()) {
            setIsErrorPassword(true);
            valid = false;
        } else {
            setIsErrorPassword(false);
        }

        if (!valid) return;

        setIsLoading(true);
        
        try {
            const loginResult = await login({ email, password });
            
            if (loginResult.success) {
                // Keep loading state active until navigation completes
                // Don't set loading to false here to prevent flash
                
                // Navigate immediately without delay
                navigate(from, { replace: true });
            } else {
                setError(loginResult.error || "Login failed. Please try again.");
                setIsLoading(false);
            }
        } catch (error) {
            const errorMessage = error.message || "Login failed. Please try again.";
            setError(errorMessage);
            setIsLoading(false);
        }
        // Note: Don't set isLoading to false in success case to prevent flash
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            {/* Loading overlay to prevent flash during login */}
            {isLoading && (
                <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#26231E] border-t-transparent"></div>
                        <p className="mt-4 text-[#26231E] font-medium">Logging in...</p>
                    </div>
                </div>
            )}
            
            <main className="w-full max-w-2xl bg-[#EFEEEB] rounded-sm shadow-md px-3 sm:px-20 py-14 m-4">
                <p className="text-md text-[#F2B68C] text-center mb-4">Admin panel</p>
                <h2 className="text-4xl font-semibold text-center mb-6 text-foreground">Log in</h2>

                {error && (
                    <div className="w-full p-4 text-red-700 bg-red-100 border border-red-300 rounded mb-6">
                        {error}
                    </div>
                )}

                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="relative space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-muted-foreground ">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className={`mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${isErrorEmail ? "border-red-500" : ""
                                } ${isLoading ? "opacity-50" : ""}`}
                        />
                        {isErrorEmail && (
                            <p className="text-red-500 text-xs absolute">Please enter a valid email.</p>
                        )}
                    </div>
                    <div className="relative space-y-1">
                        <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className={`mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground ${isErrorPassword ? "border-red-500" : ""
                                } ${isLoading ? "opacity-50" : ""}`}
                        />
                        {isErrorPassword && (
                            <p className="text-red-500 text-xs absolute">Please enter your password.</p>
                        )}
                    </div>
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-2 bg-foreground text-white rounded-full hover:bg-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#26231E]"
                        >
                            {isLoading ? "Logging in..." : "Log in"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}