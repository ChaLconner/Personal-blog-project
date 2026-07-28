import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isErrorEmail, setIsErrorEmail] = useState(false);
    const [isErrorPassword, setIsErrorPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    const from = location.state?.from?.pathname || "/admin/article-management";

    const handleSubmit = async (e) => {
        e.preventDefault();

        let hasError = false;
        const emailErr = !email.trim();
        const passErr = !password.trim();

        setIsErrorEmail(emailErr);
        setIsErrorPassword(passErr);

        if (emailErr || passErr) {
            toast.dismiss();
            toast.error("Your password is incorrect or this email doesn't exist", {
                description: "Please try another password or email",
                duration: 4000
            });
            return;
        }

        setIsLoading(true);
        
        try {
            const loginResult = await login({ email, password });
            
            if (loginResult.success) {
                setIsErrorEmail(false);
                setIsErrorPassword(false);
                toast.success("Login Successful", { description: "Welcome back Admin!", duration: 2000 });
                navigate(from, { replace: true });
            } else {
                setIsErrorEmail(true);
                setIsErrorPassword(true);
                toast.dismiss();
                toast.error("Your password is incorrect or this email doesn't exist", {
                    description: "Please try another password or email",
                    duration: 4000
                });
                setIsLoading(false);
            }
        } catch (error) {
            setIsErrorEmail(true);
            setIsErrorPassword(true);
            toast.dismiss();
            toast.error("Your password is incorrect or this email doesn't exist", {
                description: "Please try another password or email",
                duration: 4000
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F9F8F6] font-poppins p-4">
            {/* Loading overlay to prevent flash during login */}
            {isLoading && (
                <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#26231E] border-t-transparent"></div>
                        <p className="mt-4 text-[#26231E] font-medium">Logging in...</p>
                    </div>
                </div>
            )}
            
            <main className="w-full max-w-[798px] bg-[#EFEEEB] rounded-[16px] px-6 sm:px-[120px] py-[60px] my-8 flex flex-col items-center">
                {/* Header */}
                <div className="flex flex-col items-center gap-2 mb-10 text-center">
                    <p className="text-[20px] font-semibold leading-[28px] text-[#F2B68C]">Admin</p>
                    <h2 className="text-[40px] font-semibold leading-[48px] text-[#26231E]">Log in</h2>
                </div>

                <form className="w-full max-w-[558px] flex flex-col items-center gap-7" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="w-full flex flex-col gap-1">
                        <label htmlFor="email" className="block text-[16px] font-medium leading-[24px] text-[#75716B]">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (isErrorEmail) setIsErrorEmail(false);
                            }}
                            disabled={isLoading}
                            style={{
                                borderColor: isErrorEmail ? "#EB5164" : undefined,
                                color: isErrorEmail ? "#EB5164" : undefined,
                                WebkitTextFillColor: isErrorEmail ? "#EB5164" : undefined
                            }}
                            className={`w-full h-[48px] px-4 py-3 bg-white rounded-[8px] text-[16px] font-medium leading-[24px] transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${
                                isErrorEmail
                                    ? "!border-[#EB5164] !text-[#EB5164] focus-visible:!border-[#EB5164]"
                                    : "border border-[#DAD6D1] text-[#26231E] focus-visible:border-[#26231E]"
                            } ${isLoading ? "opacity-50" : ""}`}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="w-full flex flex-col gap-1">
                        <label htmlFor="password" className="block text-[16px] font-medium leading-[24px] text-[#75716B]">
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (isErrorPassword) setIsErrorPassword(false);
                            }}
                            disabled={isLoading}
                            style={{
                                borderColor: isErrorPassword ? "#EB5164" : undefined,
                                color: isErrorPassword ? "#EB5164" : undefined,
                                WebkitTextFillColor: isErrorPassword ? "#EB5164" : undefined
                            }}
                            className={`w-full h-[48px] px-4 py-3 bg-white rounded-[8px] text-[16px] font-medium leading-[24px] transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${
                                isErrorPassword
                                    ? "!border-[#EB5164] !text-[#EB5164] focus-visible:!border-[#EB5164]"
                                    : "border border-[#DAD6D1] text-[#26231E] focus-visible:border-[#26231E]"
                            } ${isLoading ? "opacity-50" : ""}`}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center mt-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-[48px] px-10 py-3 bg-[#26231E] text-white text-[16px] font-medium leading-[24px] rounded-full hover:bg-[#3d3831] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? "Logging in..." : "Log in"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}