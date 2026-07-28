import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatShortDate } from "@/utils/dateFormatter";
import UserAvatar from "@/components/common/UserAvatar";
import { API_BASE_URL } from "@/services/api";

function BlogCard({ id, image, category, title, description, author, date }) {
  const navigate = useNavigate();

  // Memoize computed image URL to avoid recalculation on re-renders
  const imageUrl = useMemo(() => {
    if (!image || (typeof image === 'string' && image.trim() === '')) {
      return 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&h=600&fit=crop&auto=format&q=60';
    }

    if (typeof image === 'string' && image.startsWith('http')) {
      return image;
    }

    if (typeof image === 'string' && image.startsWith('/uploads/')) {
      return `${API_BASE_URL}${image}`;
    }

    return image;
  }, [image]);

  const handleNavigate = useCallback(() => navigate(`/post/${id}`), [navigate, id]);

  const authorName = typeof author === 'object' ? (author?.name || 'Admin') : (author || 'Admin');
  const authorImg = typeof author === 'object' ? author?.image : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Image */}
      <button
        onClick={handleNavigate}
        className="relative h-[212px] sm:h-[360px] cursor-pointer overflow-hidden rounded-2xl group"
        type="button"
      >
        <img
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={imageUrl}
          srcSet={`${imageUrl} 1x, ${imageUrl}?dpr=2 2x`}
          loading="lazy"
          decoding="async"
          alt={title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&h=600&fit=crop&auto=format&q=60';
          }}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
      </button>

      {/* Content */}
      <div className="flex flex-col gap-6">
        {/* Tag + Title + Description */}
        <div className="flex flex-col gap-3">
          {/* Tag */}
          <div className="flex">
            <span className="bg-[#D7F2E9] rounded-full px-3 py-1 font-poppins font-medium text-sm leading-[22px] text-[#12B379]">
              {category}
            </span>
          </div>

          {/* Title + Description */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleNavigate}
              className="cursor-pointer text-start"
              type="button"
            >
              <h2 className="font-poppins font-semibold text-xl leading-7 text-[#26231E] line-clamp-2 hover:underline">
                {title}
              </h2>
            </button>
            <p className="font-poppins font-medium text-sm leading-[22px] text-[#75716B] line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* Author + Date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserAvatar
              src={authorImg}
              name={authorName}
              size="sm"
            />
            <span className="font-poppins font-medium text-sm leading-[22px] text-[#43403B]">{authorName}</span>
          </div>
          <span className="h-[18px] w-px bg-[#DAD6D1]" />
          <span className="font-poppins font-medium text-sm leading-[22px] text-[#75716B]">{formatShortDate(date)}</span>
        </div>
      </div>
    </div>
  );
}

export default BlogCard;