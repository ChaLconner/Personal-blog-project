function HeroSection() {
  return (

    <div className="flex flex-col sm:flex-row sm:justify-evenly sm:items-center sm:gap-[60px] sm:px-[120px] sm:py-[60px] px-[16px] py-[40px]">

      
      <div className="sm:w-[347px] text-center sm:text-right mb-[40px] sm:mb-0">
        <h1 className="text-[#26231E] font-[600] text-[40px] sm:text-[52px] leading-[48px] sm:leading-[60px] mb-[16px] sm:mb-[24px] ">
          Stay <br className="hidden lg:block" /> Informed, <br />Stay Inspired
        </h1>
        <p className="text-[#75716B] font-[500] text-[16px] line-hight-[24px] ">
          Discover a World of Knowledge at Your Fingertips. Your Daily Dose of Inspiration and Information.
        </p>
      </div>

      <div>
        <img src="https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449784/my-blog-post/xgfy0xnvyemkklcqodkg.jpg" alt="person with a cat" width="386px" className="h-[529px] object-cover rounded-[16px] mb-[40px] sm:mb-0" />
      </div>

      <div className="gap-[12px] w-[347px] ">
        <div className="mb-[12px]">
          <p className="text-[#75716B] font-[500] text-[12px] line-hight-[20px] ">-Author</p>
          <h3 className="font-[600] text-[24px] line-hight-[32px]">Thompson P.</h3>
        </div>

        <p className="text-[#75716B] font-[500] text-[16px] line-hight-[24px] ">
          I am a pet enthusiast and freelance writer who specializes in animal behavior and care. With a deep love for cats, I enjoy sharing insights on feline companionship and wellness. <br /> <br />
          When I'm not writing, I spends time volunteering at my local animal shelter, helping cats find loving homes.
        </p>
      </div>
    </div>
  )
}

export default HeroSection