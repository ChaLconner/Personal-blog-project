function HeroSection() {
  return (

    <div class="flex justify-evenly items-center gap-[60px] px-[120px] py-[60px] ">

      {/* กล่องซ้าย */}
      <div class="w-[347px] h-[276px] text-right">
        <h1 class="text-[#26231E] font-[600] text-[52px] line-hight-[60px] mb-[24px]">
          Stay <br /> Informed, <br /> Stay Inspired
        </h1>
        <b1 class="text-[#75716B] font-[500] text-[16px] line-hight-[24px] ">
          Discover a World of Knowledge at Your Fingertips. Your Daily Dose of Inspiration and Information.
        </b1>
      </div>

      {/* กล่องกลาง */}
      <div>
        <img src="/src/images/16_9 img.jpg" alt="person with a cat" width="386px" height="530px object-cover" />
      </div>

      {/* กล่องขวา */}
      <div class="gap-[12px] w-[347px] h-[284px]">

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