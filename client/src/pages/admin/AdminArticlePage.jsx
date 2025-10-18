import { PenSquare, Trash2, Plus, Filter, ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { blogApi } from "@/services/api";
import { toast } from "sonner";


export default function AdminArticleManagementPage() {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortField, setSortField] = useState("title");
    const [sortDirection, setSortDirection] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    // Memoize filtered and sorted articles to prevent unnecessary recalculations
    const processedArticles = useMemo(() => {
        let filtered = [...articles];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(article =>
                (article.status || 'published') === statusFilter
            );
        }
        
        // Apply category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter(article =>
                article.category === categoryFilter
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];
            
            // Handle undefined values
            if (aValue === undefined) aValue = '';
            if (bValue === undefined) bValue = '';
            
            // Convert to lowercase for string comparison
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            
            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return filtered;
    }, [articles, searchTerm, statusFilter, categoryFilter, sortField, sortDirection]);

    // Pagination - fixed at 10 items per page
    const ITEMS_PER_PAGE = 10;
    const paginatedArticles = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [processedArticles, currentPage]);

    const totalPages = Math.ceil(processedArticles.length / ITEMS_PER_PAGE);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, categoryFilter, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [articlesResponse, categoriesResponse] = await Promise.all([
                blogApi.admin.getAllPosts(),
                blogApi.admin.getCategories()
            ]);
            
            setArticles(articlesResponse.data || []);
            setCategories(categoriesResponse.data || []);
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            toast.error('Failed to fetch articles');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteArticle = async (articleId, articleTitle) => {
        if (window.confirm(`Are you sure you want to delete "${articleTitle}"?`)) {
            try {
                await blogApi.admin.deletePost(articleId);
                toast.success('Article deleted successfully');
                fetchData(); // Refresh the list
            } catch (error) {
                console.error('Error deleting article:', error);
                const errorMessage = error.message || 'Failed to delete article';
                toast.error(errorMessage);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-background">
                <AdminSidebar />
                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <div className="text-center mt-20">Loading articles...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background font-poppins">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main content */}
            <main className="flex-1 p-4 lg:p-8 overflow-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold">Article management</h2>
                    <Button
                        className="px-8 py-3 rounded-full text-[#FFFFFF] bg-[#26231E] cursor-pointer"
                        onClick={() => navigate("/admin/create-article")}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create article</span>
                        <span className="sm:hidden">Create</span>
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-card mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px] py-3 rounded-sm text-muted-foreground focus:ring-0 focus:ring-offset-0 focus:border-muted-foreground">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px] py-3 rounded-sm text-muted-foreground focus:ring-0 focus:ring-offset-0 focus:border-muted-foreground">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <div className="mb-4 text-sm text-muted-foreground">
                    Showing {paginatedArticles.length} of {processedArticles.length} articles
                </div>

                {/* Table */}
                <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="w-[40%] cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort("title")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Article title
                                            {sortField === "title" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort("author")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Author
                                            {sortField === "author" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort("category")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Category
                                            {sortField === "category" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedArticles.map((article) => (
                                    <TableRow key={article.id}>
                                        <TableCell className="font-medium">{article.title}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{article.author || 'Admin'}</TableCell>
                                        <TableCell>{article.category || 'Uncategorized'}</TableCell>
                                        <TableCell className="text-center">{(() => {
                                            const status = article.status || 'published';
                                            const isPublished = status === 'published';
                                            const isDraft = status === 'draft';
                                            
                                            return (
                                                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-ui-surface ${
                                                    isPublished ? 'text-[#12B279]' : 'text-[#75716B]'
                                                }`}>
                                                    <span
                                                        className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${
                                                            isPublished ? 'bg-[#12B279]' : 'bg-[#75716B]'
                                                        }`}
                                                    />
                                                    {isDraft ? 'Draft' : 'Published'}
                                                </span>
                                            );
                                        })()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => navigate(`/admin/edit-article/${article.id}`)}
                                                >
                                                    <PenSquare className="h-4 w-4 hover:text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => handleDeleteArticle(article.id, article.title)}
                                                >
                                                    <Trash2 className="h-4 w-4 hover:text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedArticles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                                                ? 'No articles found matching your filters'
                                                : 'No articles yet. Create your first article!'
                                            }
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">Previous</span>
                            </Button>
                            
                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className="cursor-pointer w-8 h-8 p-0"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="cursor-pointer"
                            >
                                <span className="hidden sm:inline mr-1">Next</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Extract status badge component for better reusability and readability
function ArticleStatusBadge({ status }) {
    const isPublished = status === 'published';
    const colorClass = isPublished ? 'text-[#12B279]' : 'text-[#75716B]';
    const bgColorClass = 'bg-ui-surface';
    
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${bgColorClass} ${colorClass}`}>
            <span
                className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${
                    isPublished ? 'bg-[#12B279]' : 'bg-[#75716B]'
                }`}
            />
            {isPublished ? 'Published' : 'Draft'}
        </span>
    );
}