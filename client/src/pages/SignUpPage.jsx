import { useState } from "react";
import NavBar from "@/components/NavBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext.js";
import { toast } from "sonner";

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

    const navigate = useNavigate();
    const { register } = useAuth();

    const navigateToLogin = () => {
        navigate("/login");
    };

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
            errors.email = "Email must be a valid email";
        }

        if (!formData.password.trim()) {
            errors.password = "Password is required";
        } else if (!validatePassword(formData.password)) {
            errors.password = "Password must be at least 6 characters";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({...prev, [name]: ""}));
        }
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
            const result = await register(formData);
            if (result.success) {
                // แสดงข้อความแจ้งเตือนที่มุมขวาล่าง
                toast.success("Registration successful! Redirecting...", {
                    position: "bottom-right",
                    duration: 2000,
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
                });
            }
        } catch (error) {
            const errorMessage = error.message || "Registration failed. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage, {
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
                    <h1 className="text-[40px] font-semibold">Sign up</h1>

                    <form className="w-full" onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-brand-secondary mb-1 rounded-lg" htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Name"
                                className={`border rounded w-full py-2 px-3 bg-white ${
                                    validationErrors.name 
                                        ? "border-red-500 focus:border-red-500" 
                                        : "border-ui-border focus:border-blue-500"
                                }`}
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                            {validationErrors.name && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                            )}
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Username"
                                className={`border rounded w-full py-2 px-3 bg-white ${
                                    validationErrors.username 
                                        ? "border-red-500 focus:border-red-500" 
                                        : "border-[#DAD6D1] focus:border-blue-500"
                                }`}
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                            />
                            {validationErrors.username && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
                            )}
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Email"
                                className={`border rounded w-full py-2 px-3 bg-white ${
                                    validationErrors.email 
                                        ? "border-red-500 focus:border-red-500" 
                                        : "border-[#DAD6D1] focus:border-blue-500"
                                }`}
                                value={formData.email}
                                onChange={handleInputChange}
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
                                name="password"
                                placeholder="Password"
                                className={`border rounded w-full py-2 px-3 bg-white ${
                                    validationErrors.password 
                                        ? "border-red-500 focus:border-red-500" 
                                        : "border-[#DAD6D1] focus:border-blue-500"
                                }`}
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            {validationErrors.password && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Signing up..." : "Sign up"}
                            </button>
                            <button
                                type="button"
                                onClick={navigateToLogin}
                                className="text-[#75716B]"
                            >
                                Already have an account?<span className="text-black underline ml-2">Log in</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}