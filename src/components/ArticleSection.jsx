import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import BlogCard from "./BlogCard";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

export default function ArticleSection() {
    const categories = ["Highlight", "Cat", "Inspiration", "General"];
    const [category, setCategory] = useState("Highlight");
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isCategoryChanging, setIsCategoryChanging] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            if (page === 1 && !isCategoryChanging) {
                setIsLoading(true);
            }

            try {
                const categoryParam = category === "Highlight" ? "" : category;
                const response = await axios.get("https://blog-post-project-api.vercel.app/posts", {
                    params: {
                        page,
                        limit: 6,
                        category: categoryParam,
                    },
                });

                setPosts((prevPosts) => {
                    if (page === 1) {
                        return response.data.posts;
                    } else {
                        return [...prevPosts, ...response.data.posts];
                    }
                });

                setHasMore(response.data.currentPage < response.data.totalPages);
            } catch (error) {
                console.error("Error fetching posts:", error);
            } finally {
                setIsLoading(false);
                setIsCategoryChanging(false);
            }
        };

        fetchPosts();
    }, [page, category, isCategoryChanging]);

    const handleCategoryChange = (newCategory) => {
        if (newCategory !== category) {
            setIsCategoryChanging(true);
            setCategory(newCategory);
            setPage(1);
            setHasMore(true);
            // **ไม่ setPosts([])** ทันที เพื่อให้ยังโชว์ posts เดิมไว้จนกว่าจะโหลดเสร็จ
        }
    };

    const handleLoadMore = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const navigate = useNavigate();

    return (
        <section className="">
            {/* Heading */}
            <div className="gap-8 sm:px-32 sm:py-16">
                <h3 className="font-semibold p-4 text-2xl sm:mb-8">Latest articles</h3>

                {/* Category Selector */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-center bg-[#EFEEEB] p-4 sm:rounded-2xl sm:px-6 sm:py-4 gap-4">

                    {/* Desktop Buttons */}
                    <div className="hidden md:flex space-x-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                disabled={category === cat}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${category === cat ? "bg-gray-600 text-white" : "hover:bg-gray-300"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="w-full relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input/>
                    </div>

                    {/* Mobile Select */}
                    <div className="w-full md:hidden">
                        <h4 className="text-muted-foreground mb-1">Category</h4>
                        <Select
                            value={category}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger className="w-full py-3 text-muted-foreground">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Blog Cards */}
                <div className="px-4 pt-6 pb-20 grid grid-cols-1 gap-8 sm:grid-cols-2">
                    {posts.map((blog) => (
                        <BlogCard
                            id={blog.id}
                            key={blog.id || blog.title}
                            image={blog.image}
                            category={blog.category}
                            title={blog.title}
                            description={blog.description}
                            author={blog.author}
                            date={new Date(blog.date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                            onClick={() => blog.id && navigate(`/Post/${blog.id}`)}
                        />
                    ))}

                    {/* Optional Loader when category changing */}
                    {isCategoryChanging && (
                        <div className="col-span-full text-center text-muted-foreground">
                            Loading new category...
                        </div>
                    )}
                </div>

                {/* Load More */}
                {hasMore && !isCategoryChanging && (
                    <div className="text-center mt-8">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoading}
                            className="font-medium underline hover:text-muted-foreground"
                        >
                            {isLoading ? "Loading..." : "View more"}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}




