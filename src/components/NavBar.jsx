import { Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavBar() {
    return (

        <nav className="flex justify-between items-center border-b-[1px] border-[#DAD6D1] sm:py-[16px] sm:px-[120px] py-[12px] px-[24px]">
            <a className="text-[44px] " href="/">
                <h1>hh<span className="text-[green]">.</span></h1>
            </a>

            <div className="hidden sm:block sm:justify-between sm:gap-[8px]">
                <a href="/login" className="border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px]">
                    Log in
                </a>
                <a href="/signup" className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px]">
                    Sign up
                </a>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="sm:hidden focus:outline-none">
                    <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sm:hidden w-screen rounded-none mt-4 flex flex-col gap-6 py-10 px-6">
                    <a
                        href="/login"
                        className="px-8 py-4 rounded-full text-center text-foreground border border-foreground hover:border-muted-foreground hover:text-muted-foreground transition-colors"
                    >
                        Log in
                    </a>
                    <a
                        href="/signup"
                        className="px-8 py-4 bg-foreground text-center text-white rounded-full hover:bg-muted-foreground transition-colors"
                    >
                        Sign up
                    </a>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>

    )
}

export default NavBar