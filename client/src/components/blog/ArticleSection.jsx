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
import { useNavigate } from "react-router";
import { blogApi } from "@/services/api";
import { formatShortDate } from "@/utils/dateFormatter";
import useDebounce from '@/hooks/useDebounce';

export default function ArticleSection() {
    const [categories, setCategories] = useState(["Highlight", "Cat", "Inspiration", "General"]);
    const [category, setCategory] = useState("Highlight");
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const [isCategoryChanging, setIsCategoryChanging] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const debouncedSearch = useDebounce(searchKeyword, 300);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState(null);
    const [apiStatus, setApiStatus] = useState("checking");
    const [hasCachedPosts, setHasCachedPosts] = useState(false);
    const [connectionAttempt, setConnectionAttempt] = useState(0);

    // Drag-to-scroll for categories bar using Pointer Events
    const categoryScrollRef = useRef(null);
    const isPointerDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const hasDraggedRef = useRef(false);

    const handlePointerDown = (e) => {
        if (!categoryScrollRef.current) return;
        isPointerDownRef.current = true;
        hasDraggedRef.current = false;
        startXRef.current = e.clientX;
        scrollLeftRef.current = categoryScrollRef.current.scrollLeft;
    };

    const handlePointerMove = (e) => {
        if (!isPointerDownRef.current || !categoryScrollRef.current) return;
        const container = categoryScrollRef.current;
        const deltaX = e.clientX - startXRef.current;
        if (Math.abs(deltaX) > 5) {
            hasDraggedRef.current = true;
        }
        if (hasDraggedRef.current) {
            const targetScroll = scrollLeftRef.current - deltaX;
            const maxScroll = container.scrollWidth - container.clientWidth;
            container.scrollLeft = Math.max(0, Math.min(targetScroll, maxScroll));
        }
    };

    const handlePointerUp = () => {
        if (isPointerDownRef.current) {
            isPointerDownRef.current = false;
            setTimeout(() => {
                hasDraggedRef.current = false;
            }, 50);
        }
    };

    // Wake the free Render service once, then let data requests share its ready state.
    useEffect(() => {
        const controller = new AbortController();
        const staleCategories = blogApi.getStaleCategories();
        const stalePosts = blogApi.getStalePosts({
            category: null,
            limit: 12,
            offset: 0,
        });

        const categoryList = staleCategories?.categories || staleCategories?.data || [];
        const categoryNames = categoryList
            .map((item) => (typeof item === "string" ? item : item?.name))
            .filter(Boolean);
        if (categoryNames.length > 0) {
            setCategories(Array.from(new Set(["Highlight", ...categoryNames])));
        }

        if (Array.isArray(stalePosts?.posts) && stalePosts.posts.length > 0) {
            setPosts(stalePosts.posts.slice(0, 6));
            setHasCachedPosts(true);
        }

        setApiStatus("checking");
        setError(null);
        blogApi.waitUntilReady({
            signal: controller.signal,
            onStatus: setApiStatus,
        }).catch((wakeError) => {
            if (
                wakeError?.name === "AbortError" ||
                wakeError?.name === "CanceledError" ||
                wakeError?.code === "ERR_CANCELED"
            ) {
                return;
            }
            setApiStatus("failed");
            setError(wakeError.message);
        });

        return () => controller.abort();
    }, [connectionAttempt]);

    // Fetch categories dynamically after the API and database are ready.
    useEffect(() => {
        if (apiStatus !== "ready") return undefined;

        const controller = new AbortController();
        const fetchCategories = async () => {
            try {
                const response = await blogApi.getCategories({
                    signal: controller.signal,
                });
                const categoryList = response?.categories || response?.data || [];
                const names = categoryList
                    .map((c) => (typeof c === 'string' ? c : c?.name))
                    .filter(Boolean);

                if (names.length > 0) {
                    const uniqueCategories = Array.from(new Set(["Highlight", ...names]));
                    setCategories(uniqueCategories);
                }
            } catch (err) {
                if (
                    err?.name === "AbortError" ||
                    err?.name === "CanceledError" ||
                    err?.code === "ERR_CANCELED"
                ) {
                    return;
                }
                console.error("❌ Failed to fetch categories in ArticleSection:", err);
                setError(err.message);
            }
        };

        fetchCategories();
        return () => controller.abort();
    }, [apiStatus]);

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
        if (apiStatus !== "ready") return undefined;

        const controller = new AbortController();
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

                const response = await blogApi.getPosts({
                    category: categoryParam,
                    limit: requestLimit,
                    offset: (page - 1) * 6,
                }, {
                    signal: controller.signal,
                });

                if (!response?.success || !Array.isArray(response.posts)) {
                    throw new Error(response?.error || "Invalid posts response");
                }
                const postsData = response.posts;
                setError(null);
                setHasCachedPosts(false);

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
                if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
                setError(error.message);
                setHasMore(false);
            } finally {
                setIsLoading(false);
                setIsCategoryChanging(false);
                setShowSkeleton(false);
            }
        };

        fetchPosts();
        return () => controller.abort();
    }, [page, category, apiStatus]);

    useEffect(() => {
        if (debouncedSearch.length > 0 && apiStatus === "ready") {
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
            setIsLoading(false);
        }
    }, [debouncedSearch, apiStatus]);

    const handleCategoryChange = useCallback((newCategory) => {
        if (newCategory !== category) {
            // Clear error state
            setError(null);
            setIsCategoryChanging(true);
            setCategory(newCategory);
            setPage(1);
            setHasMore(true);
            setPosts([]); // Clear posts immediately เพื่อป้องกัน confusion
            setHasCachedPosts(false);

            // Clear any relevant cache for immediate refresh
            if (typeof blogApi.clearCache === 'function') {
                blogApi.clearCache();
            }
        }
    }, [category]);

    const handleLoadMore = useCallback(() => setPage((prevPage) => prevPage + 1), []);
    const retryConnection = useCallback(() => {
        setError(null);
        setConnectionAttempt((attempt) => attempt + 1);
    }, []);

    const navigate = useNavigate();
    const isWakingServer = apiStatus === "checking" || apiStatus === "waking";

    return (
        <section className="w-full max-w-[1200px] mx-auto flex flex-col gap-12">
            {/* Heading + Category Selector (Frame 427321545: gap 32px) */}
            <div className="flex flex-col gap-8">
                <h3 className="font-poppins font-semibold text-2xl leading-8 text-[#26231E]">Latest articles</h3>

                {/* Category Selector */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-center bg-[#EFEEEB] p-4 sm:rounded-2xl sm:px-6 sm:py-4 gap-4 sm:gap-6">

                    {/* Desktop Buttons */}
                    <div
                        ref={categoryScrollRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className="hidden md:flex gap-2 overflow-x-auto flex-1 scrollbar-hide items-center select-none touch-pan-x"
                        style={{ overscrollBehaviorX: "none", scrollBehavior: "auto" }}
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={(e) => {
                                    if (hasDraggedRef.current) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                    }
                                    handleCategoryChange(cat);
                                }}
                                className={`px-5 py-3 rounded-lg font-poppins font-medium text-base leading-6 transition-colors cursor-pointer shrink-0 max-w-[200px] truncate ${
                                    category === cat
                                        ? "bg-[#DAD6D1] text-[#43403B]"
                                        : "text-[#75716B] hover:bg-[#DAD6D1]/50 hover:text-[#43403B]"
                                }`}
                                title={cat}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-[360px] md:flex-shrink-0">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#75716B] pointer-events-none" size={20} />
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

                {isWakingServer && (
                    <div className="px-4 pt-2" role="status" aria-live="polite">
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
                            <p className="text-sm font-medium">
                                Server is waking up. This can take up to one minute on the free plan.
                            </p>
                            {hasCachedPosts && (
                                <p className="text-xs mt-1">
                                    Showing saved articles while fresh data loads.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="px-4 pt-2">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            <p className="text-sm">
                                <strong>Connection Error:</strong> {error}
                            </p>
                            <p className="text-xs mt-1">
                                Saved articles remain visible when available.
                            </p>
                            <button
                                type="button"
                                onClick={retryConnection}
                                className="text-sm font-medium underline mt-2"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {/* Blog Cards + View More wrapper (Frame 427321480: gap 48px) */}
                <div className="flex flex-col items-start gap-12">
                    {/* Blog Cards */}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 w-full">
                        {/* Show loading when loading/changing category and no posts */}
                        {(isLoading || isCategoryChanging || isWakingServer) && posts.length === 0 && !showSkeleton && (
                            <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] py-12">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                                <p className="text-muted-foreground text-lg">
                                    {isWakingServer ? "Waking server..." : `Loading ${category} posts...`}
                                </p>
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
                        {apiStatus === "ready" && !error && !isCategoryChanging && !isLoading && posts.length === 0 && !showSkeleton && (
                            <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] py-12">
                                <p className="text-muted-foreground text-lg">No posts found for {category} category.</p>
                            </div>
                        )}
                    </div>

                    {/* View More */}
                    {hasMore && apiStatus === "ready" && !isCategoryChanging && (
                        <div className="w-full flex justify-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoading}
                                className="font-poppins font-medium text-base leading-6 underline text-[#26231E] hover:text-[#75716B] transition-colors"
                                style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
                            >
                                {isLoading ? "Loading..." : "View more"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}




