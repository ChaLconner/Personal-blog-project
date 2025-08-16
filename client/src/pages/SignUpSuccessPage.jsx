import NavBar from '@/components/NavBar';
import React from 'react';
// import { useNavigate } from 'react-router-dom';


export default function SignUpSuccessPage() {
    // const navigate = useNavigate();

    // const handleLoginRedirect = () => {
    //     navigate('/login'); //เปลี่ยนไปหน้า member
    // };

    const handleContinue = () => {
        const params = new URLSearchParams(window.location.search);
        let postId = params.get('postId') || params.get('post') || params.get('redirect');

        if (!postId) {
            // พยายามดึง postId จาก document.referrer (เช่น /post/123)
            try {
                const ref = document.referrer;
                const match = ref && ref.match(/\/post\/([^/?#]+)/);
                if (match) postId = match[1];
            } catch (err) {
                console.warn('Unable to extract postId from document.referrer', err);
            }
        }

        if (postId) {
            // ไปยังโพสที่ต้องการ (escape safety)
            window.location.href = `/post/${encodeURIComponent(postId)}`;
            return;
        }

        // ถ้าไม่มี postId ให้กลับไปยัง referrer ถ้าเป็น same-origin, ถ้าไม่ก็ไปหน้าแรก
        try {
            const ref = document.referrer;
            if (ref && new URL(ref).origin === window.location.origin) {
                window.location.href = ref;
                return;
            }
        } catch {
            // ignore URL parsing errors
        }

        window.location.href = '/';
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-gray-100 w-full rounded-2xl shadow-md gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    <h3 className="text-2xl font-semibold">Registration success</h3>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}