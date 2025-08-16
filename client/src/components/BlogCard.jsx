import { useNavigate } from "react-router-dom";
import { formatShortDate } from "../utils/dateFormatter";

function BlogCard({ id, image, category, title, description, author, date }) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate(`/post/${id}`)}
        className="relative h-[212px] sm:h-[360px] cursor-pointer"
        type="button"
      >
        <img
          className="w-full h-full object-cover rounded-md"
          src={image}
          alt={title}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format&q=60';
          }}
        />
      </button>
      <div className="flex flex-col">
        <div className="flex">
          <span className="bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-600 mb-2">
            {category}
          </span>
        </div>
        <button
          onClick={() => navigate(`/post/${id}`)}
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
            src={author?.image}
            alt={`${author?.name || author} profile picture`}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60';
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