function HeroSection() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-[60px] w-full max-w-[1200px] mx-auto">

      {/* Left: Headline + Description */}
      <div className="sm:w-[347px] sm:flex-1 text-center sm:text-right mb-10 sm:mb-0">
        <h1 className="font-poppins font-semibold text-[40px] sm:text-[52px] leading-[48px] sm:leading-[60px] text-[#26231E] mb-4 sm:mb-6">
          Stay <br className="hidden lg:block" /> Informed, <br />Stay Inspired
        </h1>
        <p className="font-poppins font-medium text-base leading-6 text-[#75716B]">
          Discover a World of Knowledge at Your Fingertips. Your Daily Dose of Inspiration and Information.
        </p>
      </div>

      {/* Center: Hero Image */}
      <div className="flex-shrink-0">
        <img
          src="https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449784/my-blog-post/xgfy0xnvyemkklcqodkg.jpg"
          alt="person with a cat"
          className="w-full sm:w-[386px] h-auto sm:h-[529px] object-cover rounded-2xl mb-10 sm:mb-0"
        />
      </div>

      {/* Right: Author Info */}
      <div className="sm:w-[347px] sm:flex-1">
        <div className="mb-3">
          <p className="font-poppins font-medium text-xs leading-5 text-[#75716B] mb-1">- Author</p>
          <h3 className="font-poppins font-semibold text-2xl leading-8 text-[#43403B]">Thompson P.</h3>
        </div>
        <p className="font-poppins font-medium text-base leading-6 text-[#75716B]">
          I am a pet enthusiast and freelance writer who specializes in animal behavior and care. With a deep love for cats, I enjoy sharing insights on feline companionship and wellness.
          <br /><br />
          When I'm not writing, I spend time volunteering at my local animal shelter, helping cats find loving homes.
        </p>
      </div>
    </div>
  );
}

export default HeroSection;