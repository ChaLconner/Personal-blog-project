import { useEffect, useState, Suspense, lazy } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
    Facebook,
    Linkedin,
    Twitter,
    SmilePlus,
    Copy,
    Loader2,
    X,
    Heart,
    MessageCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { blogApi, API_BASE_URL } from "@/services/api";
import { formatDateTimeAt } from "@/utils/dateFormatter";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { PageLoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/common/UserAvatar";

// Lazy load ReactMarkdown (heavy dependency)
const ReactMarkdown = lazy(() => import("react-markdown"));

export default function ViewPost() {
    const [img, setImg] = useState("");
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [content, setContent] = useState("");
    const [likes, setLikes] = useState(0);
    // like status handled in Share component; no local isLiked required
    const [author, setAuthor] = useState({ name: "Admin", image: null, id: 1, username: "admin" }); // เพิ่ม author state
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [postComments, setPostComments] = useState([]);

    const param = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, state } = useAuth(); // เพิ่ม useAuth hook

    useEffect(() => {
        getPost();
        getComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, state.user, param.id]);

    const getComments = async () => {
        try {
            const response = await blogApi.getComments({ postId: param.id });
            // API returns { success, data: [...], count }
            const list = Array.isArray(response?.data) ? response.data : response?.data?.data;
            setPostComments(Array.isArray(list) ? list : []);
        } catch {
            // Error handled by component error boundary
        }
    };

    // ตรวจสอบว่าผู้ใช้ได้กดไลก์โพสต์นี้แล้วหรือยัง

    // Comment sending is handled inside the Comment component

    const getPost = async () => {
        setIsLoading(true);
        try {
            const response = await blogApi.getPost(param.id);
            const post = response.data || response.post || response;

            // Handle image URL properly
            let imageUrl = post.image;
            if (imageUrl && !imageUrl.startsWith('http') && imageUrl.startsWith('/uploads/')) {
                imageUrl = `${API_BASE_URL}${imageUrl}`;
            }

            setImg(imageUrl || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&h=600&fit=crop&auto=format&q=60');
            setTitle(post.title || 'Untitled');
            setDate(post.date || new Date().toISOString());
            setDescription(post.description || 'No description available');
            setCategory(post.category || 'General');

            // Process content to handle literal \n characters
            let processedContent = post.content || 'No content available';

            // Replace literal \\n with actual line breaks (double backslash case)
            if (typeof processedContent === 'string') {
                processedContent = processedContent
                    .replace(/\\\\n/g, '\n')  // Replace \\n with actual line breaks
                    .replace(/\\n/g, '\n')    // Replace \n with actual line breaks  
                    .replace(/\\\n/g, '\n')   // Handle escaped newlines
                    .trim();                  // Remove extra whitespace
            }
            setContent(processedContent);

            // Enhanced author handling with better type checking
            if (post.author && typeof post.author === 'object') {
                setAuthor(post.author);
            } else if (post.author) {
                setAuthor({ name: post.author, image: null, id: 1, username: post.author });
            } else {
                setAuthor({ name: "Admin", image: null, id: 1, username: "admin" });
            }

            setLikes(post.likes_count || post.likes || 0);
            setIsLoading(false);
        } catch {
            setIsLoading(false);
            navigate("*");
        }
    };

    if (isLoading) {
        return <PageLoadingSpinner />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 container md:px-8 pb-20 md:pb-28 md:pt-8 lg:pt-16">
            <div className="space-y-4 md:px-4">
                <img
                    src={(img && img.trim()) || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&h=600&fit=crop&auto=format&q=60'}
                    alt={title}
                    className="md:rounded-lg object-cover w-full h-[260px] sm:h-[340px] md:h-[587px]"
                    onLoad={() => {
                        // Image loaded successfully
                    }}
                    onError={(e) => {
                        // Fallback to default image if loading fails
                        e.target.src = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&h=600&fit=crop&auto=format&q=60';
                    }}
                    loading="lazy"
                />
            </div>
            <div className="flex flex-col xl:flex-row gap-6 mb-10">
                <div className="xl:w-3/4 space-y-8">
                    <article className="px-4">
                        <div className="flex">
                            <span className="bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-600 mb-2">
                                {category}
                            </span>
                            <span className="px-3 py-1 text-sm font-normal text-muted-foreground">
                                {new Date(date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold">{title}</h1>
                        <p className="mt-4 mb-10 text-lg text-gray-600 leading-relaxed">{description}</p>
                        <div className="markdown-content text-gray-700 leading-relaxed">
                            <Suspense fallback={
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                                </div>
                            }>
                                <ReactMarkdown
                                    components={{
                                        // Headings with proper hierarchy
                                        h1: ({ children }) => (
                                            <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900 border-b-2 border-gray-200 pb-3 first:mt-0">
                                                {children}
                                            </h1>
                                        ),
                                        h2: ({ children }) => (
                                            <h2 className="text-2xl font-bold mb-4 mt-8 text-gray-900 border-b border-gray-200 pb-2">
                                                {children}
                                            </h2>
                                        ),
                                        h3: ({ children }) => (
                                            <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-900">
                                                {children}
                                            </h3>
                                        ),
                                        h4: ({ children }) => (
                                            <h4 className="text-lg font-semibold mb-2 mt-4 text-gray-900">
                                                {children}
                                            </h4>
                                        ),

                                        // Paragraphs with better spacing
                                        p: ({ children }) => (
                                            <p className="mb-6 leading-7 text-gray-700 tracking-wide text-base">
                                                {children}
                                            </p>
                                        ),

                                        // Lists
                                        ul: ({ children }) => (
                                            <ul className="mb-6 pl-6 space-y-2 list-disc text-gray-700">
                                                {children}
                                            </ul>
                                        ),
                                        ol: ({ children }) => (
                                            <ol className="mb-6 pl-6 space-y-2 list-decimal text-gray-700">
                                                {children}
                                            </ol>
                                        ),
                                        li: ({ children }) => (
                                            <li className="leading-relaxed text-base">
                                                {children}
                                            </li>
                                        ),

                                        // Blockquote
                                        blockquote: ({ children }) => (
                                            <blockquote className="border-l-4 border-green-500 pl-6 py-4 my-8 italic text-gray-600 bg-gray-50 rounded-r-lg">
                                                {children}
                                            </blockquote>
                                        ),

                                        // Code
                                        code: ({ inline, children }) => {
                                            if (inline) {
                                                return (
                                                    <code className="bg-gray-100 text-green-600 px-2 py-1 rounded text-sm font-mono border">
                                                        {children}
                                                    </code>
                                                );
                                            } else {
                                                return (
                                                    <pre className="bg-gray-900 text-white p-6 rounded-lg overflow-x-auto font-mono text-sm my-6 shadow-lg">
                                                        <code>{children}</code>
                                                    </pre>
                                                );
                                            }
                                        },

                                        // Pre (for code blocks)
                                        pre: ({ children }) => (
                                            <pre className="bg-gray-900 text-white p-6 rounded-lg overflow-x-auto font-mono text-sm my-6 shadow-lg">
                                                {children}
                                            </pre>
                                        ),

                                        // Links
                                        a: ({ href, children }) => (
                                            <a
                                                href={href}
                                                className="text-green-600 font-medium hover:text-green-700 hover:underline transition-colors duration-200"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {children}
                                            </a>
                                        ),

                                        // Images
                                        img: ({ src, alt }) => (
                                            <div className="my-8">
                                                <img
                                                    src={src}
                                                    alt={alt}
                                                    className="w-full rounded-lg shadow-lg border border-gray-200 max-w-full h-auto"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                {alt && (
                                                    <p className="text-sm text-gray-500 italic mt-2 text-center">
                                                        {alt}
                                                    </p>
                                                )}
                                            </div>
                                        ),

                                        // Horizontal rule
                                        hr: () => (
                                            <hr className="border-t-2 border-gray-200 my-12 w-24 mx-auto" />
                                        ),

                                        // Tables
                                        table: ({ children }) => (
                                            <div className="overflow-x-auto my-6 rounded-lg shadow-sm border border-gray-200">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        thead: ({ children }) => (
                                            <thead className="bg-gray-50">
                                                {children}
                                            </thead>
                                        ),
                                        tbody: ({ children }) => (
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {children}
                                            </tbody>
                                        ),
                                        th: ({ children }) => (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {children}
                                            </th>
                                        ),
                                        td: ({ children }) => (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {children}
                                            </td>
                                        ),

                                        // Strong and em
                                        strong: ({ children }) => (
                                            <strong className="font-semibold text-gray-900">
                                                {children}
                                            </strong>
                                        ),
                                        em: ({ children }) => (
                                            <em className="italic text-gray-800">
                                                {children}
                                            </em>
                                        ),
                                    }}
                                    // Handle line breaks properly
                                    remarkPlugins={[]}
                                    rehypePlugins={[]}
                                >
                                    {content}
                                </ReactMarkdown>
                            </Suspense>
                        </div>
                    </article>

                    <Share postId={param.id} likesAmount={likes} setDialogState={setIsDialogOpen} />
                </div>

                <div className="hidden xl:block xl:w-1/4">
                    <div className="sticky top-6">
                        <AuthorBio author={author} />
                    </div>
                </div>
            </div>

            <div className="xl:hidden px-4">
                <AuthorBio author={author} />
            </div>

            <div className="xl:w-3/4">
                <Comment
                    postId={param.id}
                    setDialogState={setIsDialogOpen}
                    postComments={postComments}
                    addComment={(c) => setPostComments((prev) => [...prev, c])}
                />
            </div>
            <CreateAccountModal
                dialogState={isDialogOpen}
                setDialogState={setIsDialogOpen}
            />
        </div>
    );
}

function HappyLight({ className = "w-[24px] h-[24px]" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="9.5" r="1.25" fill="currentColor" />
            <circle cx="15" cy="9.5" r="1.25" fill="currentColor" />
            <path d="M8 13.5C8 15.7 9.8 17.5 12 17.5C14.2 17.5 16 15.7 16 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function SadLight({ className = "w-[24px] h-[24px]" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="9.5" r="1.25" fill="currentColor" />
            <circle cx="15" cy="9.5" r="1.25" fill="currentColor" />
            <path d="M8 16.5C8 14.3 9.8 12.5 12 12.5C14.2 12.5 16 14.3 16 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function Share({ postId, likesAmount, setDialogState }) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [localLikes, setLocalLikes] = useState(likesAmount || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        setLocalLikes(likesAmount || 0);
    }, [likesAmount]);

    // Initialize hasLiked for authenticated users
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            if (!isAuthenticated || !postId) return;
            try {
                const res = await blogApi.hasLiked(postId);
                if (mounted && res && res.success) {
                    setHasLiked(!!res.hasLiked);
                }
            } catch {
                // ignore silently
            }
        };
        init();
        return () => { mounted = false; };
    }, [isAuthenticated, postId]);

    const handleLikeClick = async () => {
        if (!isAuthenticated) {
            setDialogState(true);
            return;
        }
        if (isPending) return;
        setIsPending(true);

        // Toggle like/unlike with optimistic UI and server sync
        const next = !hasLiked;
        setHasLiked(next);
        setLocalLikes((n) => Math.max(0, n + (next ? 1 : -1)));
        try {
            const res = await blogApi.toggleLike(postId, next ? 'like' : 'unlike');
            if (res && res.success) {
                // Trust server count if provided
                if (typeof res.likes === 'number') {
                    setLocalLikes(res.likes);
                }
                toast.success(next ? 'Liked' : 'Unliked', { duration: 1200 });
            } else {
                throw new Error(res?.error || 'Failed to update like');
            }
        } catch (err) {
            // rollback
            setHasLiked(!next);
            setLocalLikes((n) => Math.max(0, n + (next ? -1 : 1)));
            
            // Handle authentication errors specifically
            if (err?.message === 'Unauthorized' || err?.message?.includes('401')) {
                toast.error('Your session has expired. Please log in again.');
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                toast.error(`Unable to update like. ${err?.message || 'Please try again.'}`);
            }
        } finally {
            setIsPending(false);
        }
    };
    const shareLink = encodeURI(window.location.href);

    return (
        <div className="md:px-4">
            <div className="bg-[#EFEEEB] py-4 px-4 md:rounded-sm flex flex-col space-y-4 md:gap-16 md:flex-row md:items-center md:space-y-0 md:justify-between">
                <button
                    onClick={handleLikeClick}
                    disabled={isPending}
                    className={`flex items-center justify-center gap-[6px] px-[40px] py-[12px] min-w-[135px] h-[48px] rounded-full border bg-white text-[#26231E] transition-all group cursor-pointer ${
                        isPending ? "opacity-80" : ""
                    } ${
                        hasLiked
                            ? "border-[#26231E]"
                            : "border-[#75716B]"
                    }`}
                    aria-pressed={hasLiked}
                    title={hasLiked ? "Unlike post" : "Like post"}
                >
                    {hasLiked ? (
                        <HappyLight className="w-[24px] h-[24px] text-[#26231E] transition-colors" />
                    ) : (
                        <SadLight className="w-[24px] h-[24px] text-[#26231E] transition-colors" />
                    )}
                    <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-[#26231E] transition-colors">
                        {localLikes}
                    </span>
                </button>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(shareLink);
                            toast.custom((t) => (
                                <div className="bg-green-500 text-white p-4 rounded-sm flex justify-between items-start max-w-md w-full cursor-pointer">
                                    <div>
                                        <h2 className="font-bold text-lg mb-1">Copied!</h2>
                                        <p className="text-sm">
                                            This article has been copied to your clipboard.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toast.dismiss(t)}
                                        className="text-white hover:text-gray-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ));
                        }}
                        className="bg-white flex flex-1 items-center justify-center space-x-2 px-11 py-3 rounded-full text-foreground border border-foreground hover:border-muted-foreground hover:text-muted-foreground transition-colors group cursor-pointer"
                    >
                        <Copy className="w-5 h-5 text-foreground transition-colors group-hover:text-muted-foreground" />
                        <span className="text-foreground font-medium transition-colors group-hover:text-muted-foreground">
                            Copy
                        </span>
                    </button>
                    <a
                        href={`https://www.facebook.com/share.php?u=${shareLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#1877F2] p-3 rounded-full text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                        <Facebook className="h-6 w-6 text-white" />
                    </a>
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#0077B5] p-3 rounded-full text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                        <Linkedin className="h-6 w-6 text-white" />
                    </a>
                    <a
                        href={`https://www.twitter.com/share?&url=${shareLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#55ACEE] p-3 rounded-full text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                        <Twitter className="h-6 w-6 text-white" />
                    </a>
                </div>
            </div>
        </div>
    );
}

function Comment({ postId, setDialogState, postComments, addComment }) {
    const { state, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [comment, setComment] = useState("");
    const [isError, setIsError] = useState(false);

    // Ensure avatar URLs are absolute when coming from server uploads
    const resolveImageUrl = (url) => {
        const fallback = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60';
        if (!url || typeof url !== 'string') return fallback;
        const trimmed = url.trim();
        if (!trimmed) return fallback;
        if (trimmed.startsWith('http')) return trimmed;
        if (trimmed.startsWith('/uploads/')) {
            return `${API_BASE_URL}${trimmed}`;
        }
        return trimmed;
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            setIsError(true);
            return;
        }

        if (!isAuthenticated) {
            // Gate unauthenticated users
            setDialogState(true);
            return;
        }

        try {
            setIsError(false);
            const payload = {
                post_id: Number(postId),
                comment_text: comment.trim(),
                user_id: state.user?.id || null,
                name: state.user?.name || state.user?.username,
                image: state.user?.profile_pic || undefined,
            };

            const res = await blogApi.createComment(payload);
            const data = res?.data || res?.comment || res;

            const createdAt = data?.created_at || new Date().toISOString();
            const uiComment = {
                id: data?.id || Date.now(),
                post_id: Number(postId),
                name: data?.name || payload.name,
                comment: data?.comment || data?.comment_text || payload.comment_text,
                image: resolveImageUrl(data?.image || payload.image),
                created_at: createdAt,
            };

            addComment?.(uiComment);
            setComment("");
            toast.success('Comment posted');
        } catch (err) {
            // Handle authentication errors specifically
            if (err?.message === 'Unauthorized' || err?.message?.includes('401')) {
                toast.error('Your session has expired. Please log in again.');
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                toast.error(err?.message || 'Failed to post comment');
            }
        }
    };

    return (
        <div>
            <div className="space-y-4 px-4 mb-16">
                <h3 className="text-lg font-semibold">Comment</h3>
                <ProtectedAction action="comment on this post">
                    <form className="space-y-2" onSubmit={handleSendComment}>
                        <Textarea
                            value={comment}
                            onFocus={() => {
                                setIsError(false);
                                if (!isAuthenticated) setDialogState(true);
                            }}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What are your thoughts?"
                            className={`w-full p-4 h-24 resize-none py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 ${isError ? "border-red-500" : "border-muted-foreground"
                                }`}
                        /> {isError && (
                            <p className="text-red-500 text-sm">
                                Please type something before sending.
                            </p>
                        )}
                        <div className="flex justify-end">
                            <button type="submit"
                                className="px-10 py-3 bg-[#26231E] text-white rounded-full hover:bg-muted-foreground transition-colors cursor-pointer"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </ProtectedAction>
            </div>
            <div className="space-y-6 px-4">
                {postComments.map((comment, index) => (
                    <div key={comment.id || index} className="flex flex-col gap-2 mb-4">
                        <div className="flex space-x-4">
                            <div className="flex-shrink-0">
                                <UserAvatar
                                    src={resolveImageUrl(comment.image)}
                                    name={comment.name}
                                    size="md"
                                    alt={comment.name}
                                />
                            </div>
                            <div className="flex-grow">
                                <div className="flex flex-col items-start justify-between">
                                    <h4 className="font-semibold">{comment.name}</h4>
                                    <span className="text-sm text-gray-500">{formatDateTimeAt(comment.created_at || Date.now())}</span>
                                </div>
                            </div>
                        </div>
                        <p className=" text-gray-600">{comment.comment}</p>
                        {index < postComments.length - 1 && (
                            <hr className="border-gray-300 my-4" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function AuthorBio({ author = { name: "Admin", image: null, id: 1, username: "admin" } }) {
    // Ensure author is always an object
    const safeAuthor = author && typeof author === 'object' ? author : { name: author || "Admin", image: null, id: 1, username: "admin" };

    return (
        <div className="bg-[#EFEEEB] rounded-3xl p-6">
            <div className="flex items-center mb-4">
                <UserAvatar
                    src={(safeAuthor.image && safeAuthor.image.trim && safeAuthor.image.trim()) || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face&auto=format&q=60"}
                    name={safeAuthor.name || safeAuthor}
                    username={safeAuthor.username}
                    size="xl"
                    alt={safeAuthor.name || safeAuthor}
                    className="mr-4"
                />
                <div>
                    <p className="text-sm">Author</p>
                    <h3 className="text-2xl font-bold">{safeAuthor.name || safeAuthor}</h3>
                </div>
            </div>
            <hr className="border-gray-300 mb-4" />
            <div className="text-muted-foreground space-y-4">
                <p>
                    I am a pet enthusiast and freelance writer who specializes in animal
                    behavior and care. With a deep love for cats, I enjoy sharing insights
                    on feline companionship and wellness.
                </p>
                <p>
                    When I&apos;m not writing, I spend time volunteering at my local animal shelter, helping cats find loving homes.
                </p>
            </div>
        </div>
    );
}

function CreateAccountModal({ dialogState, setDialogState }) {
    const navigate = useNavigate();

    React.useEffect(() => {
        if (dialogState && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }, [dialogState]);

    return (
        <AlertDialog open={dialogState} onOpenChange={setDialogState}>
            <AlertDialogContent className="bg-white rounded-md pt-16 pb-6 max-w-[26rem] sm:max-w-lg flex flex-col items-center">
                <AlertDialogTitle className="text-3xl font-semibold pb-2 text-center">
                    Create an account to continue
                </AlertDialogTitle>
                <button
                    onClick={() => {
                        setDialogState(false);
                        navigate("/signup");
                    }}
                    className="rounded-full text-white bg-black hover:bg-muted-foreground transition-colors py-4 text-lg w-52"
                >
                    Create account
                </button>
                <AlertDialogDescription className="flex flex-row gap-1 justify-center font-medium text-center pt-2 text-muted-foreground">
                    Already have an account?
                    <button
                        onClick={() => {
                            setDialogState(false);
                            navigate("/login");
                        }}
                        className="text-foreground hover:text-muted-foreground transition-colors underline font-semibold cursor-pointer"
                    >
                        Log in
                    </button>
                </AlertDialogDescription>
                <AlertDialogCancel className="absolute right-4 top-2 sm:top-4 p-1 border-none bg-transparent hover:bg-transparent shadow-none dark:bg-transparent cursor-pointer">
                    <X className="h-6 w-6" />
                </AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// removed local LoadingScreen in favor of shared PageLoadingSpinner