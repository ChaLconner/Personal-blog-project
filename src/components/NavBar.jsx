import HamburgerMenu from "./ui/hamburgerMenu"

function NavBar() {
    return (

        <nav className="flex justify-between items-center border-b-[1px] border-[#DAD6D1] sm:py-[16px] sm:px-[120px] py-[12px] px-[24px]">
            <a className="text-[44px] " href="/">
                <h1>hh<span className="text-[green]">.</span></h1>
            </a>
            <HamburgerMenu />

            <nav className="hidden sm:block sm:flex sm:justify-between sm:gap-[8px]">
                <a href="/login" className="border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px]">
                    Log in
                </a>
                <a href="/signup" className="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px]">
                    Sign up
                </a>
            </nav>
        </nav>

    )
}

export default NavBar