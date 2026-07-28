import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import NavBar from "@/components/layout/NavBar";
import { useAuth } from "@/contexts/authContext";
import blogApi from "@/services/api.js";
import { toast } from "sonner";

const validateEmail = (email) => /\S+@\S+\.\S+/.test(String(email).toLowerCase());
const validatePassword = (password) => typeof password === "string" && password.trim().length >= 6;

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });
    const [ERROR, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [IS_WAKING_SERVER, setIsWakingServer] = useState(false);
    const [requiresVerification, setRequiresVerification] = useState(false);
    const passwordCheckTimeoutRef = useRef(null);
    const wakeTimeoutRef = useRef(null);
    const lastWakeRef = useRef(0);
    const navigate = useNavigate();
    const { login, resendVerification } = useAuth();

    useEffect(() => {
        const passwordCheckTimeout = passwordCheckTimeoutRef.current;
        const wakeTimeout = wakeTimeoutRef.current;
        return () => {
            if (passwordCheckTimeout) clearTimeout(passwordCheckTimeout);
            if (wakeTimeout) clearTimeout(wakeTimeout);
        };
    }, []);

    const validateForm = useCallback(() => {
        let valid = true;
        const newFieldErrors = { email: false, password: false };
        let errorMessage = "";

        if (!email.trim() || !validateEmail(email)) {
            newFieldErrors.email = true;
            valid = false;
            errorMessage = email.trim() ? "Please enter a valid email address" : "Email is required";
        }
        if (!password.trim() || !validatePassword(password)) {
            newFieldErrors.password = true;
            valid = false;
            if (errorMessage) {
                errorMessage += " and password";
            } else {
                errorMessage = password.trim() ? "Password must be at least 6 characters long" : "Password is required";
            }
        }

        setFieldErrors(newFieldErrors);

        if (!valid) {
            toast.dismiss();
            toast.error("Validation Error", { description: errorMessage, duration: 4000, className: "auth-toast" });
        }

        return valid;
    }, [email, password]);

    const wakeServer = useCallback(() => {
        try {
            const now = Date.now();
            if (now - lastWakeRef.current < 10000) return;
            lastWakeRef.current = now;
            setIsWakingServer(true);

            blogApi.healthCheck()
                .then(() => { })
                .catch(() => { })
                .finally(() => {
                    setTimeout(() => setIsWakingServer(false), 300);
                });
        } catch {
            setTimeout(() => setIsWakingServer(false), 300);
        }
    }, []);

    const handleSignupClick = useCallback(() => navigate("/signup"), [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!validateForm()) return;

        wakeServer();

        setIsLoading(true);
        setRequiresVerification(false);

        try {
            const result = await login({ email: email.trim(), password });
            setRequiresVerification(Boolean(result?.requiresVerification));
            clearTimeout(wakeTimeoutRef.current);
            setIsWakingServer(false);

            if (result.success) {
                setFieldErrors({ email: false, password: false });
                toast.success("Login Successful", { description: "Welcome back!", duration: 2000, className: "auth-toast" });
            } else if (result.requiresVerification) {
                const verificationMessage = result.message || "Please verify your email before logging in.";
                setError(verificationMessage);
                setFieldErrors({ email: false, password: false });
                toast.dismiss();
                toast.error("Email Verification Required", {
                    description: verificationMessage,
                    duration: 5000,
                    className: "auth-toast"
                });
            } else if (result.error) {
                setError(result.error);
                setFieldErrors({ email: true, password: true });
                toast.dismiss();
                toast.error("Your password is incorrect or this email doesn't exist", {
                    description: "Please try another password or email",
                    duration: 4000,
                    className: "auth-toast"
                });
            }
        } catch (error) {
            clearTimeout(wakeTimeoutRef.current);
            setIsWakingServer(false);
            setError(error.message || "Login failed. Please try again.");
            setFieldErrors({ email: true, password: true });
            toast.dismiss();
            toast.error("Login Error", { description: "Network error. Please check your connection and try again", duration: 4000, className: "auth-toast" });
        } finally {
            setIsLoading(false);
        }
    };

    const emailInputClasses = useMemo(() => {
        return `border-2 rounded w-full py-2 px-3 bg-white ring-0 transition-colors duration-150 focus:outline-none focus:ring-0 placeholder:!text-[#75716B] ${
            fieldErrors.email
                ? "!border-[#EB5164] !text-[#EB5164] focus:!border-[#EB5164]"
                : "border-[#DAD6D1]"
        }`;
    }, [fieldErrors.email]);

    const passwordInputClasses = useMemo(() => {
        return `border-2 rounded w-full py-2 px-3 bg-white ring-0 transition-colors duration-150 focus:outline-none focus:ring-0 placeholder:!text-[#75716B] ${
            fieldErrors.password
                ? "!border-[#EB5164] !text-[#EB5164] focus:!border-[#EB5164]"
                : "border-[#DAD6D1]"
        }`;
    }, [fieldErrors.password]);

    const handleEmailChange = useCallback((e) => {
        setEmail(e.target.value);
        setFieldErrors((prev) => ({ ...prev, email: false }));
    }, []);

    const handleEmailBlur = useCallback(() => {
        if (!email.trim() || !validateEmail(email)) {
            setFieldErrors((prev) => ({ ...prev, email: true }));
            toast.dismiss();
            toast.error(email.trim() ? "Please enter a valid email address" : "Email is required", { duration: 3000, className: "auth-toast" });
        }
    }, [email]);

    const handlePasswordChange = useCallback((e) => {
        setPassword(e.target.value);
        setFieldErrors((prev) => ({ ...prev, password: false }));
    }, []);

    const handlePasswordBlur = useCallback(() => {
        if (!password.trim() || !validatePassword(password)) {
            setFieldErrors((prev) => ({ ...prev, password: true }));
            toast.dismiss();
            toast.error(password.trim() ? "Password must be at least 6 characters long" : "Password is required", { duration: 3000, className: "auth-toast" });
        }
    }, [password]);

    const handleResendVerification = useCallback(async () => {
        const res = await resendVerification(email);
        if (res.success) toast.success(res.message, { duration: 4000, className: "auth-toast" });
        else toast.error(res.error || "Unable to send verification email.", { duration: 4000, className: "auth-toast" });
    }, [email, resendVerification]);

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-[#EFEEEB] border border-[#DAD6D1] w-full rounded-2xl shadow-sm gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h1 className="text-[40px] font-semibold">Log in</h1>
                    <form className="w-full" onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Email"
                                className={emailInputClasses}
                                style={{
                                    borderColor: fieldErrors.email ? "#EB5164" : undefined,
                                    color: fieldErrors.email ? "#EB5164" : undefined,
                                    WebkitTextFillColor: fieldErrors.email ? "#EB5164" : undefined
                                }}
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Password"
                                className={passwordInputClasses}
                                style={{
                                    borderColor: fieldErrors.password ? "#EB5164" : undefined,
                                    color: fieldErrors.password ? "#EB5164" : undefined,
                                    WebkitTextFillColor: fieldErrors.password ? "#EB5164" : undefined
                                }}
                                value={password}
                                onChange={handlePasswordChange}
                                onBlur={handlePasswordBlur}
                                required
                            />
                        </div>

                        {requiresVerification && (
                            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
                                <p className="text-sm">Please verify your email.</p>
                                <button
                                    type="button"
                                    className="mt-2 text-sm underline"
                                    onClick={handleResendVerification}
                                >
                                    Resend verification email
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                onMouseDown={wakeServer}
                                onFocus={wakeServer}
                                className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Log in
                            </button>
                            <p className="text-[#75716B]">
                                Don't have an account?
                                <button
                                    type="button"
                                    onClick={handleSignupClick}
                                    className="text-black underline ml-2 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    Sign up
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


