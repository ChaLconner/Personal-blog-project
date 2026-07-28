import { useState, useCallback, useMemo } from "react";
import NavBar from "@/components/layout/NavBar";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/authContext";
import { toast } from "sonner";
import blogApi from "@/services/api.js";

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [emailTaken, setEmailTaken] = useState(false);

    const navigate = useNavigate();
    const { register } = useAuth();

    // Validation functions
    const validateEmail = useCallback((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const validatePassword = useCallback((password) => {
        return password.length >= 6;
    }, []);

    const validateForm = useCallback(() => {
        const errors = {};
        
        if (!formData.name.trim()) {
            errors.name = "Name is required";
        }

        if (!formData.username.trim()) {
            errors.username = "Username is required";
        } else if (formData.username.length < 3) {
            errors.username = "Username must be at least 3 characters";
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!validateEmail(formData.email)) {
            errors.email = "Email must be a valid email address";
        }

        if (!formData.password.trim()) {
            errors.password = "Password is required";
        } else if (!validatePassword(formData.password)) {
            errors.password = "Password must be at least 6 characters";
        }

        setValidationErrors(errors);
        // Also prevent submission if email is already taken
        if (emailTaken) {
            errors.email = "Email is already taken. Please try another email.";
            setValidationErrors(errors);
            return false;
        }

        return Object.keys(errors).length === 0;
    }, [formData, emailTaken, validateEmail, validatePassword]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({...prev, [name]: ""}));
        }
    }, [validationErrors]);

    // Check if email already exists (called on blur)
    const checkEmailExists = useCallback(async () => {
        const email = formData.email || "";
        if (!email.trim()) return;

        try {
            const res = await blogApi.checkEmail(email.trim());
            if (res && res.success) {
                setEmailTaken(!!res.exists);
                if (res.exists) {
                    setValidationErrors(prev => ({ ...prev, email: "Email is already taken. Please try another email." }));
                } else {
                    // clear only the email error if it was the "taken" message
                    setValidationErrors(prev => ({ ...prev, email: prev.email === "Email is already taken. Please try another email." ? "" : prev.email }));
                }
            } else {
                // On error, don't block signup — but log it
                console.warn('checkEmail failed', res.error || res);
            }
        } catch (err) {
            console.warn('checkEmail error', err);
        } finally {
            // intentionally not tracking transient checking state in UI
        }
    }, [formData.email]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError("");
        setValidationErrors({});

        // Validate form first
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await register(formData);
            if (result.success) {
                // แสดงข้อความแจ้งเตือนที่มุมขวาล่าง
                toast.success("Registration successful! Redirecting...", {
                    position: "bottom-right",
                    duration: 2000,
                    className: "auth-toast",
                });

                // เปลี่ยนเส้นทางไปยัง SignUpSuccessPage
                setTimeout(() => {
                    navigate("/signup-success");
                }, 2000);
            } else if (result.error) {
                setError(result.error);
                toast.error(result.error, {
                    position: "bottom-right",
                    duration: 4000,
                    className: "auth-toast",
                });
            }
        } catch (error) {
            const errorMessage = error.message || "Registration failed. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "bottom-right",
                duration: 4000,
                className: "auth-toast",
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateForm, register, navigate]);

    const navigateToLogin = useCallback(() => {
        navigate("/login");
    }, [navigate]);

    const handleEmailBlur = useCallback(() => {
        if (!formData.email.trim() || !validateEmail(formData.email)) {
            setValidationErrors(prev => ({
                ...prev,
                email: !formData.email.trim()
                    ? "Email is required"
                    : "Email must be a valid email address"
            }));
            return;
        }

        // Only check email uniqueness if format looks valid
        checkEmailExists();
    }, [formData.email, validateEmail, checkEmailExists]);

    const handlePasswordBlur = useCallback(() => {
        if (!formData.password.trim() || !validatePassword(formData.password)) {
            setValidationErrors(prev => ({
                ...prev,
                password: !formData.password.trim()
                    ? "Password is required"
                    : "Password must be at least 6 characters"
            }));
        }
    }, [formData.password, validatePassword]);

    // Memoize input classes to prevent unnecessary recalculations
    const nameInputClasses = useMemo(() => {
        return `border rounded w-full py-2 px-3 bg-white transition-colors placeholder:!text-[#75716B] focus:outline-none ${
            validationErrors.name
                ? "!border-[#EB5164] !text-[#EB5164] focus:!border-[#EB5164]"
                : "border-[#DAD6D1] focus:border-blue-500"
        }`;
    }, [validationErrors.name]);

    const usernameInputClasses = useMemo(() => {
        return `border rounded w-full py-2 px-3 bg-white transition-colors placeholder:!text-[#75716B] focus:outline-none ${
            validationErrors.username
                ? "!border-[#EB5164] !text-[#EB5164] focus:!border-[#EB5164]"
                : "border-[#DAD6D1] focus:border-blue-500"
        }`;
    }, [validationErrors.username]);

    const emailInputClasses = useMemo(() => {
        return `border rounded w-full py-2 px-3 bg-white transition-colors placeholder:!text-[#75716B] focus:outline-none ${
            validationErrors.email
                ? "!border-[#EB5164] !text-[#EB5164] focus:!border-[#EB5164]"
                : "border-[#DAD6D1] focus:border-blue-500"
        }`;
    }, [validationErrors.email]);

    const passwordInputClasses = useMemo(() => {
        return `border rounded w-full py-2 px-3 bg-white transition-colors placeholder:!text-[#75716B] focus:outline-none ${
            validationErrors.password
                ? "!border-[#EB5164] !text-[#EB5164] focus:!border-[#EB5164]"
                : "border-[#DAD6D1] focus:border-blue-500"
        }`;
    }, [validationErrors.password]);

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-[#EFEEEB] border border-[#DAD6D1] w-full rounded-2xl shadow-sm gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h1 className="text-[40px] font-semibold">Sign up</h1>

                    <form className="w-full" onSubmit={handleSubmit} autoComplete="off">
                        <div className="mb-6">
                            <label className="block text-brand-secondary mb-1 rounded-lg" htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Name"
                                className={nameInputClasses}
                                value={formData.name}
                                onChange={handleInputChange}
                                autoComplete="off"
                                required
                            />
                            {validationErrors.name && (
                                <p className="text-[#EB5164] text-xs mt-1">{validationErrors.name}</p>
                            )}
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Username"
                                className={usernameInputClasses}
                                value={formData.username}
                                onChange={handleInputChange}
                                autoComplete="off"
                                required
                            />
                            {validationErrors.username && (
                                <p className="text-[#EB5164] text-xs mt-1">{validationErrors.username}</p>
                            )}
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Email"
                                className={emailInputClasses}
                                value={formData.email}
                                onChange={handleInputChange}
                                onBlur={handleEmailBlur}
                                autoComplete="off"
                                required
                            />
                            {validationErrors.email && (
                                <p className="mt-1 text-xs text-[#EB5164]">{validationErrors.email}</p>
                            )}
                            {/* Intentionally hide intermediate 'checking' status per UX request */}
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Password"
                                className={passwordInputClasses}
                                value={formData.password}
                                onChange={handleInputChange}
                                onBlur={handlePasswordBlur}
                                autoComplete="new-password"
                                required
                            />
                            {validationErrors.password && (
                                <p className="mt-1 text-xs text-[#EB5164]">{validationErrors.password}</p>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLoading ? "Signing up..." : "Sign up"}
                            </button>
                            <p className="text-[#75716B]">
                                Already have an account?
                                <button
                                    type="button"
                                    onClick={navigateToLogin}
                                    className="text-black underline ml-2 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    Log in
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
