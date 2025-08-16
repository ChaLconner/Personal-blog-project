import { useState } from "react";
import NavBar from "@/components/NavBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext.js";

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    
    const navigate = useNavigate();
    const { register } = useAuth();

    const navigateToLogin = () => {
        navigate("/login");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await register(formData);
            if (result.success) {
                setSuccess(true);
                // Redirect to signup success page or login
                setTimeout(() => {
                    navigate("/signup-success");
                }, 2000);
            } else if (result.error) {
                setError(result.error);
            }
        } catch (error) {
            setError(error.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col min-h-screen">
                <NavBar />
                <div className="flex justify-center items-center flex-grow">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded max-w-md">
                        <p className="font-bold">Registration Successful!</p>
                        <p>Please check your email to verify your account, then log in.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-gray-100 w-full rounded-2xl shadow-md gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h1 className="text-[40px] font-semibold">Sign up</h1>
                    
                    {error && (
                        <div className="w-full p-4 text-red-700 bg-red-100 border border-red-300 rounded">
                            {error}
                        </div>
                    )}
                    
                    <form className="w-full" onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="name">Name</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name"
                                placeholder="Name" 
                                className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" 
                                value={formData.name}
                                onChange={handleInputChange}
                                required 
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="username">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username"
                                placeholder="Username" 
                                className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" 
                                value={formData.username}
                                onChange={handleInputChange}
                                required 
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email"
                                placeholder="Email" 
                                className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" 
                                value={formData.email}
                                onChange={handleInputChange}
                                required 
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="password">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password"
                                placeholder="Password" 
                                className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" 
                                value={formData.password}
                                onChange={handleInputChange}
                                required 
                            />
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