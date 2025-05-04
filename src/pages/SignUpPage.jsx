import NavBar from "@/components/NavBar";


export default function SignUpPage() {
    const navigateToLogin = () => {
        window.location.href = "/login";
    };

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-gray-100 w-full rounded-2xl shadow-md gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h1 className="text-[40px] font-semibold">Sign up</h1>
                    <form className="w-full">
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="name">Name</label>
                            <input type="text" id="name" placeholder="Name" className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="username">Username</label>
                            <input type="text" id="username" placeholder="Username" className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="email">Email</label>
                            <input type="email" id="email" placeholder="Email" className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[#75716B] mb-1 rounded-[8px]" htmlFor="password">Password</label>
                            <input type="password" id="password" placeholder="Password" className="border-[#DAD6D1] border rounded w-full py-2 px-3 bg-white" required />
                        </div>                        
                    </form>
                    <button type="submit" className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10">Sign up</button>
                    <button onClick={navigateToLogin} className="text-[#75716B]">
                        Already have an account?<span className="text-black underline ml-2">Log in</span>
                    </button>
                </div>
            </div>
        </div>
    );
}