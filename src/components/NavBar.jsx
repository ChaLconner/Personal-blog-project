function NavBar() {
    return (

        <navbar class="flex justify-between items-center border-b-[1px] border-[#DAD6D1] md:{py-[12px] px-[24px]} py-[16px] px-[120px]">
            <a href="/">
                <img src="/src/images/logo.jpg" alt="logo" width="44px" height="44px" />
            </a>

            <nav class="flex justify-between gap-[8px]">
                <a href="/login" class="border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px]">
                    Log in
                </a>
                <a href="/signup" class="bg-[#26231E] text-[#ffffff] border-[1px] border-[#75716B] px-[40px] py-[12px] rounded-[999px] gap-[6px]">
                    Sign up
                </a>
            </nav>
        </navbar>

    )
}

export default NavBar
  