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
import { AdminSidebar } from "@/components/blog/AdminWebSection";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { blogApi } from "@/services/api";
import { toast } from "sonner";


import { DeleteArticleModal } from "@/components/common/DeleteArticleModal";


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
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleDeleteArticle = (articleId, articleTitle) => {
        setArticleToDelete({ id: articleId, title: articleTitle });
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!articleToDelete) return;
        try {
            setIsDeleting(true);
            await blogApi.admin.deletePost(articleToDelete.id);
            toast.success('Article deleted successfully');
            setDeleteModalOpen(false);
            setArticleToDelete(null);
            fetchData(); // Refresh the list
        } catch (error) {
            console.error('Error deleting article:', error);
            const errorMessage = error.message || 'Failed to delete article';
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen overflow-hidden bg-[#F9F8F6]">
                <AdminSidebar />
                <main className="flex-1 p-6 lg:p-10 overflow-auto">
                    <div className="text-center mt-20 text-[#75716B]">Loading articles...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#F9F8F6] font-poppins text-[#26231E]">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main content */}
            <main className="flex-1 p-6 lg:p-10 overflow-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pr-14 lg:pr-0">
                    <h2 className="text-2xl font-semibold text-[#26231E]">Article management</h2>
                    <Button
                        className="px-6 py-2.5 rounded-full text-white bg-[#26231E] hover:bg-[#3d3831] transition-colors cursor-pointer"
                        onClick={() => navigate("/admin/create-article")}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        <span>Create article</span>
                    </Button>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#75716B]" />
                            <Input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 py-3 bg-white border border-[#DAD6D1] rounded-[8px] text-sm text-[#43403B] placeholder:text-[#75716B] focus-visible:ring-1 focus-visible:ring-[#26231E]"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border border-[#DAD6D1] rounded-[8px] text-[#43403B] focus:ring-1 focus:ring-[#26231E]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-[#DAD6D1]">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border border-[#DAD6D1] rounded-[8px] text-[#43403B] focus:ring-1 focus:ring-[#26231E]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-[#DAD6D1]">
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
                <div className="mb-3 text-sm text-[#75716B]">
                    Showing {paginatedArticles.length} of {processedArticles.length} articles
                </div>

                {/* Table */}
                <div className="bg-white rounded-[8px] border border-[#DAD6D1] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-[#F9F8F6] border-b border-[#DAD6D1]">
                                <TableRow className="border-b border-[#DAD6D1]">
                                    <TableHead
                                        className="w-[40%] py-3.5 px-6 text-[#75716B] font-normal cursor-pointer hover:text-[#26231E]"
                                        onClick={() => handleSort("title")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Article title
                                            {sortField === "title" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="py-3.5 px-6 text-[#75716B] font-normal cursor-pointer hover:text-[#26231E]"
                                        onClick={() => handleSort("author")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Author
                                            {sortField === "author" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="py-3.5 px-6 text-[#75716B] font-normal cursor-pointer hover:text-[#26231E]"
                                        onClick={() => handleSort("category")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Category
                                            {sortField === "category" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="py-3.5 px-6 text-center text-[#75716B] font-normal">Status</TableHead>
                                    <TableHead className="py-3.5 px-6 text-right text-[#75716B] font-normal">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedArticles.map((article, index) => (
                                    <TableRow
                                        key={article.id}
                                        className={`border-b border-[#DAD6D1] ${index % 2 === 1 ? "bg-[#EFEEEB]" : "bg-white"} hover:bg-[#DAD6D1]/30 transition-colors`}
                                    >
                                        <TableCell className="py-4 px-6 font-medium text-[#43403B]">{article.title}</TableCell>
                                        <TableCell className="py-4 px-6 text-sm text-[#75716B]">{article.author || 'Admin'}</TableCell>
                                        <TableCell className="py-4 px-6 text-sm text-[#43403B]">{article.category || 'Uncategorized'}</TableCell>
                                        <TableCell className="py-4 px-6 text-center">{(() => {
                                            const status = article.status || 'published';
                                            const isPublished = status === 'published';
                                            const isDraft = status === 'draft';
                                            
                                            return (
                                                <span className={`inline-flex items-center gap-2 text-xs font-medium ${
                                                    isPublished ? 'text-[#12B379]' : 'text-[#75716B]'
                                                }`}>
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                            isPublished ? 'bg-[#12B379]' : 'bg-[#75716B]'
                                                        }`}
                                                    />
                                                    {isDraft ? 'Draft' : 'Published'}
                                                </span>
                                            );
                                        })()}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <button
                                                    className="p-1 text-[#75716B] hover:text-[#26231E] transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/admin/edit-article/${article.id}`)}
                                                    title="Edit article"
                                                >
                                                    <PenSquare className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="p-1 text-[#75716B] hover:text-red-600 transition-colors cursor-pointer"
                                                    onClick={() => handleDeleteArticle(article.id, article.title)}
                                                    title="Delete article"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedArticles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-[#75716B] py-12">
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
                
                <DeleteArticleModal
                    isOpen={deleteModalOpen}
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setArticleToDelete(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    isLoading={isDeleting}
                />
            </main>
        </div>
    );
}

// Extract status badge component for better reusability and readability
function ArticleStatusBadge({ status }) {
    const isPublished = status === 'published';
    const colorClass = isPublished ? 'text-[#12B279]' : 'text-[#75716B]';
    return (
        <span className={`inline-flex items-center gap-2 text-xs font-medium ${colorClass}`}>
            <span
                className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${
                    isPublished ? 'bg-[#12B279]' : 'bg-[#75716B]'
                }`}
            />
            {isPublished ? 'Published' : 'Draft'}
        </span>
    );
}