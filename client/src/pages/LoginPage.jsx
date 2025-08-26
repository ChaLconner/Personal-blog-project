import { useState } from "react";
import NavBar from "@/components/NavBar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [, setError] = useState("");
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const navigate = useNavigate();
    const location = useLocation();
    const { login, resendVerification } = useAuth();

    // Get the page user was trying to visit from URL params or location state
    const getRedirectPath = () => {
        // Check URL parameters first (from query string)
        const urlParams = new URLSearchParams(location.search);
        const redirectParam = urlParams.get('redirect') || urlParams.get('from');

        if (redirectParam) {
            // Decode and validate the redirect path
            try {
                const decodedPath = decodeURIComponent(redirectParam);
                // Ensure it's a valid internal path
                if (decodedPath.startsWith('/')) {
                    return decodedPath;
                }
            } catch (error) {
                // Log decode errors for debugging (avoids empty catch block)
                // Invalid redirect params will be ignored and fallback path will be used
                console.warn('Failed to decode redirect parameter:', error);
            }
        }

        // Check location state (from navigation)
        const fromState = location.state?.from?.pathname;
        if (fromState) {
            return fromState;
        }

        // Check document.referrer for article pages
        try {
            const referrer = document.referrer;
            if (referrer) {
                const referrerUrl = new URL(referrer);
                // If same origin, use the path
                if (referrerUrl.origin === window.location.origin) {
                    const path = referrerUrl.pathname;
                    // If it's an article page, return to it
                    if (path.startsWith('/post/') || path.startsWith('/Post/')) {
                        return path;
                    }
                }
            }
        } catch (error) {
            // Log errors when parsing referrer to aid debugging in some browsers/environments
            console.warn('Failed to read document.referrer:', error);
        }

        // Default to home page
        return "/";
    };

    const from = getRedirectPath();

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const validateForm = () => {
        const errors = {};
        
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!validateEmail(email)) {
            errors.email = "Email must be a valid email";
        }

        if (!password.trim()) {
            errors.password = "Password is required";
        } else if (!validatePassword(password)) {
            errors.password = "Password must be at least 6 characters";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSignupClick = () => {
        navigate("/signup");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setValidationErrors({});

        // Validate form first
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await login({ email, password });
            if (result.success) {
                // Show success toast
                toast.success("Login successful! Welcome back!", {
                    position: "bottom-right",
                    duration: 2000,
                });

                // Redirect to homepage after successful login, or to the page they were trying to visit
                const redirectPath = from === "/" ? "/" : from;

                // Use shorter delay and ensure navigation happens
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 500);
            } else if (result.error) {
                setError(result.error);
                
                // Check if it's an authentication error and show appropriate message
                const authErrorMessage = result.error.toLowerCase();
                if (authErrorMessage.includes('invalid') || 
                    authErrorMessage.includes('wrong') || 
                    authErrorMessage.includes('incorrect') ||
                    authErrorMessage.includes('not found') ||
                    authErrorMessage.includes('password') ||
                    authErrorMessage.includes('email')) {
                    toast.error("Your password is incorrect or this email doesn't exist", {
                        position: "bottom-right",
                        duration: 4000,
                    });
                } else if (result.requiresVerification) {
                    setRequiresVerification(true);
                    toast.error("Please verify your email before logging in", {
                        position: "bottom-right",
                        duration: 4000,
                    });
                } else {
                    toast.error(result.error, {
                        position: "bottom-right",
                        duration: 4000,
                    });
                }
                
                setRequiresVerification(Boolean(result.requiresVerification));
            }
        } catch (error) {
            const errorMessage = error.message || "Login failed. Please try again.";
            setError(errorMessage);
            setRequiresVerification(false);
            
            // Show generic authentication error message
            toast.error("Your password is incorrect or this email doesn't exist", {
                position: "bottom-right",
                duration: 4000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-gray-100 w-full rounded-2xl shadow-md gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h1 className="text-[40px] font-semibold">Log in</h1>
                    <form className="w-full" onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Email"
                                className={`border rounded w-full py-2 px-3 bg-white ${
                                    validationErrors.email 
                                        ? "border-red-500 focus:border-red-500" 
                                        : "border-[#DAD6D1] focus:border-blue-500"
                                }`}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    // Clear validation error when user starts typing
                                    if (validationErrors.email) {
                                        setValidationErrors(prev => ({...prev, email: ""}));
                                    }
                                }}
                                required
                            />
                            {validationErrors.email && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                            )}
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Password"
                                className={`border rounded w-full py-2 px-3 bg-white ${
                                    validationErrors.password 
                                        ? "border-red-500 focus:border-red-500" 
                                        : "border-[#DAD6D1] focus:border-blue-500"
                                }`}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    // Clear validation error when user starts typing
                                    if (validationErrors.password) {
                                        setValidationErrors(prev => ({...prev, password: ""}));
                                    }
                                }}
                                required
                            />
                            {validationErrors.password && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                            )}
                        </div>

                        {requiresVerification && (
                            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
                                <p className="text-sm">กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ</p>
                                <button
                                    type="button"
                                    className="mt-2 text-sm underline"
                                    onClick={async () => {
                                        const res = await resendVerification(email);
                                        if (res.success) {
                                            toast.success(res.message, { position: "bottom-right" });
                                        } else {
                                            toast.error(res.error || "ไม่สามารถส่งอีเมลยืนยันได้", { position: "bottom-right" });
                                        }
                                    }}
                                >
                                    ส่งอีเมลยืนยันอีกครั้ง
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Logging in..." : "Log in"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSignupClick}
                                className="text-[#75716B]"
                            >
                                Don't have any account?<span className="text-black underline ml-2">Sign up</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
