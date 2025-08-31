import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";

// Simple local validators (avoid depending on a missing utils/validation file)
const validateEmail = (email) => /\S+@\S+\.\S+/.test(String(email).toLowerCase());
const validatePassword = (password) => typeof password === 'string' && password.trim().length >= 6;

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });
    const [validationErrors, setValidationErrors] = useState({});
    const [, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isWakingServer, setIsWakingServer] = useState(false);
    const [requiresVerification, setRequiresVerification] = useState(false);

    const passwordCheckTimeoutRef = useRef(null);
    const wakeTimeoutRef = useRef(null);
    const navigate = useNavigate();
    const { login, resendVerification } = useAuth();

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (passwordCheckTimeoutRef.current) {
                clearTimeout(passwordCheckTimeoutRef.current);
            }
            if (wakeTimeoutRef.current) {
                clearTimeout(wakeTimeoutRef.current);
            }
        };
    }, []);

    // Check if email exists
    const checkEmailExists = async (emailToCheck) => {
        try {
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001');
            let exists = false;
            let res, data;
            try {
                res = await fetch(apiUrl + '/auth/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailToCheck })
                });
                data = await res.json();
                exists = !!(data && data.exists);
            } catch {
                // fallback to login with dummy password
                res = await fetch(apiUrl + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailToCheck, password: '___dummy___' })
                });
                data = await res.json();
                exists = !(data && (data.error?.toLowerCase().includes('not found') || data.error?.toLowerCase().includes('email')));
            }
            if (!exists) {
                setFieldErrors(prev => ({ ...prev, email: true }));
                toast.dismiss();
                toast.error("Your password is incorrect or this email doesn’t exist. Please try another password or email", { duration: 4000 });
            } else {
                setFieldErrors(prev => ({ ...prev, email: false }));
            }
        } catch {
            setFieldErrors(prev => ({ ...prev, email: true }));
                toast.dismiss();
                toast.error("Your password is incorrect or this email doesn’t exist. Please try another password or email", { duration: 4000 });
        }
    };

    // Real-time password+email check (as before)
    const checkCredentials = async (emailToCheck, passwordToCheck) => {
        if (!validateEmail(emailToCheck) || !validatePassword(passwordToCheck)) return;
        try {
            const res = await fetch(
                (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/auth/login',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailToCheck, password: passwordToCheck })
                }
            );
            const data = await res.json();
            if (!res.ok || !data.success || !data.access_token) {
                setFieldErrors(prev => ({ ...prev, password: true, email: prev.email }));
                toast.dismiss();
                toast.error("Your email doesn’t exist. Please try another email", { duration: 4000 });
            } else {
                setFieldErrors(prev => ({ ...prev, password: false, email: prev.email }));
            }
        } catch {
            setFieldErrors(prev => ({ ...prev, password: true, email: prev.email }));
            toast.dismiss();
            toast.error("Your password is incorrect or this email doesn’t exist", { duration: 4000 });
        }
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

        if (!validateForm()) {
            if (!validateEmail(email)) {
                setFieldErrors(prev => ({ ...prev, email: true }));
                toast.dismiss();
                toast.error("Your password is incorrect or this email doesn't exist", { duration: 4000 });
            }
            return;
        }

        setIsLoading(true);
        setIsWakingServer(false);

        // Show 'waking up server' if login takes >1.2s
        wakeTimeoutRef.current = setTimeout(() => {
            setIsWakingServer(true);
        }, 1200);

        try {
            const result = await login({ email, password });
            clearTimeout(wakeTimeoutRef.current);
            setIsWakingServer(false);
            if (result.success) {
                toast.success("Login successful! Welcome back!", { duration: 1500 });
            } else if (result.error) {
                setError(result.error);
                const authErrorMessage = result.error.toLowerCase();
                if (
                    authErrorMessage.includes('invalid') ||
                    authErrorMessage.includes('wrong') ||
                    authErrorMessage.includes('incorrect') ||
                    authErrorMessage.includes('not found') ||
                    authErrorMessage.includes('password') ||
                    authErrorMessage.includes('email')
                ) {
                    toast.dismiss();
                    toast.error("Your password is incorrect or this email doesn't exist", { duration: 4000 });
                } else if (result.requiresVerification) {
                    setRequiresVerification(true);
                    toast.error("Please verify your email before logging in", { duration: 4000 });
                } else {
                    toast.error(result.error, { duration: 4000 });
                }
                setRequiresVerification(Boolean(result.requiresVerification));
            }
        } catch (error) {
            clearTimeout(wakeTimeoutRef.current);
            setIsWakingServer(false);
            const errorMessage = error.message || "Login failed. Please try again.";
            setError(errorMessage);
            setRequiresVerification(false);
            toast.dismiss();
            toast.error("Your password is incorrect or this email doesn't exist", { duration: 4000 });
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
                                    fieldErrors.email
                                        ? "border-[#EB5164] text-[#EB5164] placeholder-[#EB5164] focus:border-[#EB5164]"
                                        : validationErrors.email
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-[#DAD6D1] "
                                }`}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setFieldErrors(prev => ({ ...prev, email: false }));
                                    if (validationErrors.email) {
                                        setValidationErrors(prev => ({...prev, email: ""}));
                                    }
                                }}
                                onBlur={() => checkEmailExists(email)}
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
                                    fieldErrors.password
                                        ? "border-[#EB5164] text-[#EB5164] focus:border-[#EB5164]"
                                        : validationErrors.password
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-[#DAD6D1]"
                                }`}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setFieldErrors(prev => ({ ...prev, password: false }));
                                    if (validationErrors.password) {
                                        setValidationErrors(prev => ({...prev, password: ""}));
                                    }
                                }}
                                onBlur={() => {
                                    // Debounce password+email check after blur
                                    if (passwordCheckTimeoutRef.current) {
                                        clearTimeout(passwordCheckTimeoutRef.current);
                                    }
                                    if (!fieldErrors.email && !validationErrors.email && email && validateEmail(email)) {
                                        passwordCheckTimeoutRef.current = setTimeout(() => {
                                            checkCredentials(email, password);
                                        }, 600); // 600ms delay after blur
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
                                            toast.success(res.message, { duration: 4000 });
                                        } else {
                                            toast.error(res.error || "ไม่สามารถส่งอีเมลยืนยันได้", { duration: 4000 });
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
                                {isLoading
                                    ? isWakingServer
                                        ? "Log in"
                                        : "Logging in..."
                                    : "Log in"}
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

export default LoginPage;
