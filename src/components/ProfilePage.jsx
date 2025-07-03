import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { Bell, LogOut, User, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarDemo from './ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel';


export default function ProfilePage() {
    const [name, setName] = useState("Moodeng ja");
    const [username, setUsername] = useState("moodeng.cute");

    const navigate = useNavigate();

    const handleSave = () => {
        alert("ข้อมูลถูกบันทึกเรียบร้อยแล้ว!");
        // หรือเรียก API เพื่ออัปเดตข้อมูล
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* Header */}
            

            <header className="flex justify-between items-center border-b-[1px] border-[#DAD6D1] sm:py-[16px] sm:px-[120px] h-[48px] sm:h-[80px] py-[12px] px-[24px]">
                <button onClick={() => navigate("/")} className="text-2xl sm:text-[44px]">
                    <h1>hh<span className="text-[green]">.</span></h1>
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full border-[#EFEEEB] border-1 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer">
                        <AvatarDemo />
                        <span className="text-sm font-medium">MicheL</span>
                    </div>
                </div>
            </header >


            <main className="flex flex-col items-center">
                {/* Profile Form */}
                <div className="flex gap-4 items-center mt-[52px] mb-[30px]">
                    <AvatarDemo />
                    <h1 className="text-2xl font-bold">MicheL | Profile</h1>
                </div>
                <section className="flex px-10">
                    {/* Sidebar */}
                    <aside className="w-64">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 font-semibold text-black">
                                <User className="w-4 h-4" /> Profile
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 hover:text-black cursor-pointer">
                                <Lock className="w-4 h-4" /> Reset password
                            </div>
                        </div>
                    </aside>
                    <div className="p-6 max-w-md bg-[#EFEEEB] space-y-4">

                        {/* Avatar + Upload */}
                        <div className="flex items-center">
                            <Avatar className="w-24 h-24 mb-2">
                                <AvatarImage src="/dog-profile.jpg" />
                                <AvatarFallback>MJ</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" className="text-sm bg-white rounded-full border-[#75716B]">Upload profile picture</Button>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Username</label>
                                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <Input disabled value="moodeng.cute@gmail.com" className="bg-gray-100" />
                            </div>
                        </div>

                        {/* Save Button */}
                        <Button 
                            className="py-3 px-10 bg-black text-white rounded-[999px]" 
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </div>                    
                </section>
            </main>
        </div >
    );
}
