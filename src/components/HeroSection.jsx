function HeroSection() {
  return (

    <div class="flex flex-col sm:flex-row sm:justify-evenly sm:items-center sm:gap-[60px] sm:px-[120px] sm:py-[60px] px-[16px] py-[40px]">

      {/* กล่องซ้าย */}
      <div class="sm:w-[347px] text-center sm:text-right mb-[40px] sm:mb-0">
        <h1 class="text-[#26231E] font-[600] text-[40px] sm:text-[52px] leading-[48px] sm:leading-[60px] mb-[16px] sm:mb-[24px] ">
          Stay <br className="hidden lg:block" /> Informed, <br />Stay Inspired
        </h1>
        <b1 class="text-[#75716B] font-[500] text-[16px] line-hight-[24px] ">
          Discover a World of Knowledge at Your Fingertips. Your Daily Dose of Inspiration and Information.
        </b1>
      </div>

      {/* กล่องกลาง */}
      <div>
        <img src="/src/images/16_9 img.jpg" alt="person with a cat" width="386px" height="529px object-cover" className="mb-[40px] sm:mb-0" />
      </div>

      {/* กล่องขวา */}
      <div class="gap-[12px] w-[347px] ">
        <div class="mb-[12px]">
          <b3 class="text-[#75716B] font-[500] text-[12px] line-hight-[20px] ">-Author</b3>
          <h3 class="font-[600] text-[24px] line-hight-[32px]">Thompson P.</h3>
        </div>

        <b3 class="text-[#75716B] font-[500] text-[16px] line-hight-[24px] ">
          I am a pet enthusiast and freelance writer who specializes in animal behavior and care. With a deep love for cats, I enjoy sharing insights on feline companionship and wellness. <br /> <br />
          When I'm not writing, I spends time volunteering at my local animal shelter, helping cats find loving homes.
        </b3>
      </div>
    </div>
  )
}

export default HeroSection