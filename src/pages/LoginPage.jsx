import NavBar from "@/components/NavBar";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    
    const navigate = useNavigate();

    const handleSignupClick = () => {
        navigate("/signup");
    };

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-gray-100 w-full rounded-2xl shadow-md gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h1 className="text-[40px] font-semibold">Log in</h1>
                    <form className="w-full">
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input type="email" id="email" placeholder="Email" className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white " required />
                        </div>
                        <div className="">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="password">Password</label>
                            <input type="password" id="password" placeholder="Password" className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white " required />
                        </div>
                    </form>
                    <button type="submit" className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10">Log up</button>
                    <button onClick={handleSignupClick} className="text-[#75716B]">
                        Don't have any account?<span className="text-black underline ml-2">Sign up</span>
                    </button>
                </div>
            </div>
        </div>
    );
}