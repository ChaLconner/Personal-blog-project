import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatShortDate } from "../utils/dateFormatter";

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
      return `https://personal-blog-project-server.onrender.com${image}`;
    }

    return image;
  }, [image]);

  const handleNavigate = useCallback(() => navigate(`/post/${id}`), [navigate, id]);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleNavigate}
        className="relative h-[212px] sm:h-[360px] cursor-pointer overflow-hidden rounded-md group"
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
      <div className="flex flex-col">
        <div className="flex">
          <span className="bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-600 mb-2">
            {category}
          </span>
        </div>
        <button
          onClick={handleNavigate}
          className="cursor-pointer text-start"
          type="button"
        >
          <h2 className="font-bold text-xl mb-2 line-clamp-2 hover:underline">
            {title}
          </h2>
        </button>
        <p className="text-muted-foreground text-sm mb-4 flex-grow line-clamp-3">
          {description}
        </p>
        <div className="flex items-center text-sm">
          <img
            className="w-8 h-8 rounded-full mr-2"
            src={(author?.image && author.image.trim && author.image.trim()) || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&h=600&fit=crop&auto=format&q=60'}
            alt={`${author?.name || author} profile picture`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&h=600&fit=crop&auto=format&q=60';
            }}
          />
          <span>{author?.name || author}</span>
          <span className="mx-2 text-gray-300">|</span>
          <span>{formatShortDate(date)}</span>
        </div>
      </div>
    </div>
  );
}

export default BlogCard