import NavBar from '@/components/NavBar';
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function SignUpSuccessPage() {
    const location = useLocation();
    const { email, verificationRequired, message, verificationLink } = location.state || {};

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex justify-center rounded-2xl mt-10 mx-4 sm:mt-15 sm:mx-40">
                <div className="bg-gray-100 w-full rounded-2xl shadow-md gap-6 flex flex-col items-center p-6 sm:py-15 sm:px-30">
                    
                    {verificationRequired ? (
                        // แสดงข้อความสำหรับการยืนยันอีเมล
                        <>
                            <div className="text-center mb-4">
                                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-2">Check Your Email</h3>
                                <p className="text-gray-600 mb-4">
                                    {message || "We've sent a verification link to your email address."}
                                </p>
                                {email && (
                                    <p className="text-sm text-gray-500 mb-6">
                                        Verification email sent to: <span className="font-semibold">{email}</span>
                                    </p>
                                )}
                                
                                {/* Development mode - show verification link directly */}
                                {verificationLink && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                        <h4 className="font-semibold text-yellow-800 mb-2">
                                            🚧 Development Mode
                                        </h4>
                                        <p className="text-sm text-yellow-700 mb-3">
                                            Email sending is not configured yet. Use this link to verify manually:
                                        </p>
                                        <a 
                                            href={verificationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Verify Email Now
                                        </a>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-4 w-full max-w-sm">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">What's next?</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• {verificationLink ? 'Click "Verify Email Now" button above' : 'Check your email inbox'}</li>
                                        <li>• {verificationLink ? 'Or check your email for the verification link' : 'Click the verification link'}</li>
                                        <li>• Return to login page after verification</li>
                                    </ul>
                                </div>
                                
                                <div className="flex justify-center gap-4">
                                    <Link 
                                        to="/login" 
                                        className="bg-[#26231E] text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        Go to Login
                                    </Link>
                                    <Link 
                                        to="/" 
                                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-400 transition-colors"
                                    >
                                        Back to Home
                                    </Link>
                                </div>
                                
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    Didn't receive an email? In development mode, check server console for verification link.
                                </p>
                            </div>
                        </>
                    ) : (
                        // แสดงข้อความแบบเดิม (สำหรับกรณีไม่ต้องยืนยันอีเมล)
                        <>
                            <div className="mx-auto w-16 h-16 bg-[#12B279] rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold">Registration success</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    // ตรวจสอบ referrer ว่ามาจาก /article หรือไม่
                                    try {
                                        const ref = document.referrer;
                                        if (ref) {
                                            const url = new URL(ref);
                                            if (url.pathname.startsWith('/article')) {
                                                window.location.href = ref;
                                                return;
                                            }
                                        }
                                    } catch {
                                        // intentionally ignored
                                    }
                                    window.location.href = '/';
                                }}
                                className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px] sm:my-10"
                            >
                                Continue
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}