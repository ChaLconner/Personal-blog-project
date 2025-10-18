import { PenSquare, Trash2, Plus, Filter, ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { blogApi } from "@/services/api";
import { toast } from "sonner";

export default function AdminCategoryManagementPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    // Memoize filtered and sorted categories to prevent unnecessary recalculations
    const processedCategories = useMemo(() => {
        let filtered = [...categories];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(category =>
                category.name.toLowerCase().includes(searchTerm.toLowerCase())
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
    }, [categories, searchTerm, sortField, sortDirection]);

    // Pagination - fixed at 10 items per page
    const ITEMS_PER_PAGE = 10;
    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [processedCategories, currentPage]);

    const totalPages = Math.ceil(processedCategories.length / ITEMS_PER_PAGE);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await blogApi.admin.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            try {
                await blogApi.admin.deleteCategory(categoryId);
                toast.success('Category deleted successfully');
                fetchCategories(); // Refresh the list
            } catch (error) {
                console.error('Error deleting category:', error);
                const errorMessage = error.message || 'Failed to delete category';
                toast.error(errorMessage);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-100">
                <AdminSidebar />
                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <div className="text-center mt-20">Loading categories...</div>
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
                    <h2 className="text-2xl font-semibold">Category management</h2>
                    <Button
                        className="px-4 py-2 rounded-full text-[#FFFFFF] bg-[#26231E] cursor-pointer"
                        onClick={() => navigate("/admin/create-category")}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create category</span>
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
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <div className="mb-4 text-sm text-muted-foreground">
                    Showing {paginatedCategories.length} of {processedCategories.length} categories
                </div>

                {/* Table */}
                <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Category
                                            {sortField === "name" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCategories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => navigate(`/admin/edit-category/${category.id}`)}
                                                >
                                                    <PenSquare className="h-4 w-4 hover:text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                                >
                                                    <Trash2 className="h-4 w-4 hover:text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedCategories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                                            {searchTerm ? 'No categories found matching your search' : 'No categories found'}
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