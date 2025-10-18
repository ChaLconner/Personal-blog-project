import { useState, useEffect, useCallback, useRef } from "react";
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
import { formatShortDate } from "@/utils/dateFormatter";
import useDebounce from '@/hooks/useDebounce';

// Simple skeleton loader for posts
function PostSkeleton() {
    return (
        <div className="animate-pulse bg-gray-200 rounded-xl h-44 w-full mb-4" />
    );
}

export default function ArticleSection() {
    const categories = ["Highlight", "Cat", "Inspiration", "General"];
    const [category, setCategory] = useState("Highlight");
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const firstLoadRef = useRef(true);
    const [isCategoryChanging, setIsCategoryChanging] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const debouncedSearch = useDebounce(searchKeyword, 300);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState(null);

    // Utility function to retry API calls
    const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await apiCall();
            } catch (error) {
                console.warn(`❌ API attempt ${i + 1} failed:`, error.message);
                
                if (i === maxRetries - 1) {
                    throw error; // Throw on last attempt
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    };

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
            }
        }

        return uniquePosts;
    };

    useEffect(() => {
        let skeletonTimeout;
        const fetchPosts = async () => {
            if (page === 1) {
                setIsLoading(true);
                // Don't show skeleton on homepage to avoid loading indicator
                setShowSkeleton(false);
            }

            try {
                let categoryParam;
                let requestLimit = 6;
                if (category === "Highlight") {
                    categoryParam = null;
                    requestLimit = 12;
                } else {
                    categoryParam = category;
                }

                // Use a shorter timeout for first load
                const response = await retryApiCall(async () => {
                    return await blogApi.getPosts({
                        category: categoryParam,
                        limit: requestLimit,
                        offset: (page - 1) * 6,
                        timeout: page === 1 ? 8000 : 15000,
                    });
                });

                const postsData = (response && response.success && Array.isArray(response.posts))
                    ? response.posts
                    : [];

                setPosts((prevPosts) => {
                    if (page === 1) {
                        let newPosts = removeDuplicatePosts(postsData);
                        if (category === "Highlight" && newPosts.length > 6) {
                            newPosts = newPosts.slice(0, 6);
                        }
                        return newPosts;
                    } else {
                        const allPosts = [...prevPosts, ...postsData];
                        let uniquePosts = removeDuplicatePosts(allPosts);
                        if (category === "Highlight") {
                            const targetCount = page * 6;
                            if (uniquePosts.length > targetCount) {
                                uniquePosts = uniquePosts.slice(0, targetCount);
                            }
                        }
                        return uniquePosts;
                    }
                });

                if (category === "Highlight") {
                    const uniqueFromResponse = removeDuplicatePosts(postsData);
                    setHasMore(uniqueFromResponse.length >= 6 || postsData.length === requestLimit);
                } else {
                    setHasMore(postsData.length === 6);
                }
            } catch (error) {
                setError(error.message);
                if (page === 1) {
                    setPosts([]);
                }
                setHasMore(false);
                setTimeout(() => setError(null), 5000);
            } finally {
                setIsLoading(false);
                setIsCategoryChanging(false);
                setShowSkeleton(false);
                if (skeletonTimeout) clearTimeout(skeletonTimeout);
            }
        };

        fetchPosts();
        // Prefetch on first load only
        if (firstLoadRef.current) {
            firstLoadRef.current = false;
            setTimeout(() => {
                blogApi.getPosts({ category: null, limit: 12, offset: 0, timeout: 6000 });
            }, 0);
        }
    }, [page, category]);

    useEffect(() => {
        if (debouncedSearch.length > 0) {
            setIsLoading(true);
                    const fetchSuggestions = async () => {
                    try {
                        const response = await blogApi.getPosts({
                                search: debouncedSearch,
                                limit: 5
                            });

                        // Normalize suggestions shape
                        const postsData = (response && response.success && Array.isArray(response.posts))
                            ? response.posts
                            : [];

                        setSuggestions(postsData);
                        setIsLoading(false);
                    } catch {
                        setSuggestions([]); // Set empty array on error
                        setIsLoading(false);
                    }
            };

            fetchSuggestions();
        } else {
            setSuggestions([]); // Clear suggestions if keyword is empty
        }
    }, [debouncedSearch]);

    const handleCategoryChange = useCallback((newCategory) => {
        if (newCategory !== category) {
            // Clear error state
            setError(null);
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
    }, [category]);

    const handleLoadMore = useCallback(() => setPage((prevPage) => prevPage + 1), []);

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

                    <div className="relative w-full md:w-1/4">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                            className="w-full"
                            placeholder="Search"
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
                            Array.isArray(suggestions) &&
                            suggestions.length > 0 && (
                                <div className="absolute left-0 top-full z-20 w-full mt-2 bg-[#F9F8F6] rounded-sm shadow-lg p-1 max-h-60 overflow-auto scrollbar-hide">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            className="text-start px-4 py-2 block text-sm text-foreground hover:bg-[#EFEEEB] hover:text-muted-foreground hover:rounded-sm w-full"
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

                {/* Error Message */}
                {error && (
                    <div className="px-4 pt-2">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            <p className="text-sm">
                                <strong>Connection Error:</strong> {error}
                            </p>
                            <p className="text-xs mt-1">
                                Please check if the server is running or try refreshing the page.
                            </p>
                        </div>
                    </div>
                )}

                {/* Blog Cards */}
                <div className="px-4 pt-6 pb-20 grid grid-cols-1 gap-8 sm:grid-cols-2">
                    {/* Show loading only when category is changing and no posts */}
                    {isCategoryChanging && posts.length === 0 && !showSkeleton && (
                        <div className="col-span-full text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                            <p className="text-muted-foreground text-lg">Loading {category} posts...</p>
                        </div>
                    )}
                    {/* Show posts */}
                    {posts.map((blog) => (
                        <BlogCard
                            id={blog.id}
                            key={blog.id}
                            image={blog.image}
                            category={blog.category}
                            title={blog.title}
                            description={blog.description}
                            author={blog.author}
                            date={formatShortDate(blog.date)}
                            onClick={() => blog.id && navigate(`/post/${blog.id}`)}
                            style={{ cursor: "pointer" }}
                        />
                    ))}
                    {/* Show "No posts found" when not loading and no posts */}
                    {!isCategoryChanging && !isLoading && posts.length === 0 && !showSkeleton && (
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




