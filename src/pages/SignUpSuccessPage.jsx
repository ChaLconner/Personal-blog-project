import NavBar from '@/components/NavBar';
import React from 'react';
// import { useNavigate } from 'react-router-dom';


export default function SignUpSuccessPage() {
    // const navigate = useNavigate();

    // const handleLoginRedirect = () => {
    //     navigate('/login'); //เปลี่ยนไปหน้า member
    // };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-gray-100 w-full rounded-2xl shadow-md gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h3 className="text-2xl font-semibold">Registration success</h3>
                    <button type="submit" className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10">Continue</button>
                </div>
            </div>
        </div>
    );
}