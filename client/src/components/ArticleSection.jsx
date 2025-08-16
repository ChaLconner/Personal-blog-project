import { useState, useEffect } from "react";
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
import { blogApi } from "@/services/api";

export default function ArticleSection() {
    const categories = ["Highlight", "Cat", "Inspiration", "General"];
    const [category, setCategory] = useState("Highlight");
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isCategoryChanging, setIsCategoryChanging] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Utility function to remove duplicate posts by ID, title, and content
    const removeDuplicatePosts = (posts) => {
        const seen = new Map(); // Use Map to track by multiple criteria
        const uniquePosts = [];

        for (const post of posts) {
            // Create a unique key based on title and first 100 characters of content
            const uniqueKey = `${post.title}_${(post.content || post.description || '').substring(0, 100)}`;

            if (!seen.has(uniqueKey)) {
                seen.set(uniqueKey, true);
                uniquePosts.push(post);
            } else {
                console.log(`Duplicate content detected: "${post.title}" (ID: ${post.id})`);
            }
        }

        console.log(`Filtered ${posts.length - uniquePosts.length} duplicate posts`);
        return uniquePosts;
    };

    useEffect(() => {
        const fetchPosts = async () => {
            if (page === 1) {
                setIsLoading(true);
            }

            try {
                let categoryParam;
                let requestLimit = 6; // Default limit

                if (category === "Highlight") {
                    categoryParam = null; // Show all posts for Highlight
                    requestLimit = 12; // Request more to ensure we get at least 6 unique after dedup
                } else {
                    categoryParam = category; // Use exact category name
                }

                console.log('Current category:', category);
                console.log('Current page:', page);
                console.log('Fetching posts with category:', categoryParam);
                console.log('API request params:', {
                    category: categoryParam,
                    limit: requestLimit,
                    offset: (page - 1) * 6  // Keep offset based on 6 for consistent pagination
                });

                const response = await blogApi.getPosts({
                    category: categoryParam,
                    limit: requestLimit,
                    offset: (page - 1) * 6, // Keep offset calculation consistent
                });

                console.log('API Response:', response);
                console.log('Posts received from API:', response.data?.length || 0);
                console.log('Raw post IDs:', response.data?.map(p => p.id) || []);

                setPosts((prevPosts) => {
                    console.log('=== STATE UPDATE ===');
                    console.log('Previous posts count:', prevPosts.length);
                    console.log('Previous post IDs:', prevPosts.map(p => p.id));

                    if (page === 1) {
                        // For new category, replace all posts and remove any duplicates
                        let newPosts = removeDuplicatePosts(response.data || []);

                        // For Highlight, ensure we show exactly 6 posts on first load
                        if (category === "Highlight" && newPosts.length > 6) {
                            newPosts = newPosts.slice(0, 6);
                        }

                        console.log('Page 1: After dedup and limit:', newPosts.length, 'posts');
                        console.log('Final post IDs for page 1:', newPosts.map(p => p.id));
                        return newPosts;
                    } else {
                        // For load more, combine and remove duplicates
                        const allPosts = [...prevPosts, ...(response.data || [])];
                        console.log('Combined posts before dedup:', allPosts.length);
                        console.log('Combined post IDs:', allPosts.map(p => p.id));

                        let uniquePosts = removeDuplicatePosts(allPosts);

                        // For Highlight pagination, limit to 6 posts per page increment
                        if (category === "Highlight") {
                            const targetCount = page * 6;
                            if (uniquePosts.length > targetCount) {
                                uniquePosts = uniquePosts.slice(0, targetCount);
                            }
                        }

                        console.log('Load more: After dedup and limit:', uniquePosts.length, 'posts');
                        console.log('Final post IDs after load more:', uniquePosts.map(p => p.id));
                        return uniquePosts;
                    }
                });

                // Determine if there are more posts available
                if (category === "Highlight") {
                    // For Highlight, check if we have more unique posts available
                    const uniqueFromResponse = removeDuplicatePosts(response.data || []);
                    setHasMore(uniqueFromResponse.length >= 6 || (response.data || []).length === requestLimit);
                } else {
                    setHasMore((response.data || []).length === 6);
                }
            } catch (error) {
                console.error("Error fetching posts:", error);
                setPosts([]);
            } finally {
                setIsLoading(false);
                setIsCategoryChanging(false);
            }
        };

        fetchPosts();
    }, [page, category]);

    useEffect(() => {
        if (searchKeyword.length > 0) {
            setIsLoading(true);
            const fetchSuggestions = async () => {
                try {
                    const response = await blogApi.getPosts({
                        search: searchKeyword,
                        limit: 5
                    });
                    setSuggestions(response.data); // Set search suggestions
                    setIsLoading(false);
                } catch (error) {
                    console.log(error);
                    setIsLoading(false);
                }
            };

            fetchSuggestions();
        } else {
            setSuggestions([]); // Clear suggestions if keyword is empty
        }
    }, [searchKeyword]);

    const handleCategoryChange = (newCategory) => {
        if (newCategory !== category) {
            setIsCategoryChanging(true);
            setCategory(newCategory);
            setPage(1);
            setHasMore(true);
            setPosts([]); // Clear posts immediately เพื่อป้องกัน confusion

            // Clear any relevant cache for immediate refresh
            if (typeof blogApi.clearCache === 'function') {
                blogApi.clearCache();
            }
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
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer ${category === cat ? "bg-gray-600 text-white" : "hover:bg-gray-300"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-auto">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                            className="w-full"
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => {
                                setTimeout(() => {
                                    setShowDropdown(false);
                                }, 200);
                            }}
                            style={{ cursor: "text" }}
                        />
                        {!isLoading &&
                            showDropdown &&
                            searchKeyword &&
                            suggestions.length > 0 && (
                                <div className="absolute left-0 top-full z-20 w-full mt-2 bg-background rounded-sm shadow-lg p-1 max-h-60 overflow-auto">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            className="text-start px-4 py-2 block text-sm text-foreground hover:bg-[#EFEEEB] hover:text-muted-foreground hover:rounded-sm"
                                            onMouseDown={() => navigate(`/post/${suggestion.id}`)}
                                            type="button"
                                        >
                                            {suggestion.title}
                                        </button>
                                    ))}
                                </div>
                            )}
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
                    {/* Show loading when category is changing and no posts */}
                    {isCategoryChanging && posts.length === 0 && (
                        <div className="col-span-full text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <p className="text-muted-foreground">Loading {category} posts...</p>
                        </div>
                    )}

                    {/* Show posts */}
                    {posts.map((blog) => (
                        <BlogCard
                            id={blog.id}
                            key={blog.id} // Use only ID as key since we ensure uniqueness
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
                            style={{ cursor: "pointer" }}
                        />
                    ))}

                    {/* Show "No posts found" when not loading and no posts */}
                    {!isCategoryChanging && !isLoading && posts.length === 0 && (
                        <div className="col-span-full text-center py-8">
                            <p className="text-muted-foreground">No posts found for {category} category.</p>
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
                            style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
                        >
                            {isLoading ? "Loading..." : "View more"}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}




