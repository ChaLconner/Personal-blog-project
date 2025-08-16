import { useState } from "react";
import NavBar from "@/components/NavBar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/authContext.js";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    // Get the page user was trying to visit, or default to home
    const from = location.state?.from?.pathname || "/";

    const handleSignupClick = () => {
        navigate("/signup");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await login({ email, password });
            if (result.success) {
                // Redirect to the page they were trying to visit
                navigate(from, { replace: true });
            } else if (result.error) {
                setError(result.error);
            }
        } catch (error) {
            setError(error.message || "Login failed. Please try again.");
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
                    
                    {error && (
                        <div className="w-full p-4 text-red-700 bg-red-100 border border-red-300 rounded">
                            {error}
                        </div>
                    )}
                    
                    <form className="w-full" onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="Email" 
                                className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="password">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                placeholder="Password" 
                                className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                        </div>
                        
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