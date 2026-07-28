import { PenSquare, Trash2, Plus, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
import { AdminSidebar } from "@/components/blog/AdminWebSection";
import { useNavigate } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { blogApi } from "@/services/api";
import { toast } from "sonner";
import { DeleteArticleModal } from "@/components/common/DeleteArticleModal";

export default function AdminCategoryManagementPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
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
            
            if (aValue === undefined) aValue = '';
            if (bValue === undefined) bValue = '';
            
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

    const handleDeleteCategory = (categoryId, categoryName) => {
        setCategoryToDelete({ id: categoryId, name: categoryName });
        setDeleteModalOpen(true);
    };

    const handleConfirmDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            setIsDeleting(true);
            await blogApi.admin.deleteCategory(categoryToDelete.id);
            toast.success('Category deleted successfully');
            setDeleteModalOpen(false);
            setCategoryToDelete(null);
            fetchCategories(); // Refresh the list
        } catch (error) {
            console.error('Error deleting category:', error);
            const errorMessage = error.message || 'Failed to delete category';
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
                    <div className="text-center mt-20 text-[#75716B]">Loading categories...</div>
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
                {/* Top Header Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pr-14 lg:pr-0">
                    <h2 className="text-2xl font-semibold text-[#26231E]">Category management</h2>
                    <Button
                        className="px-6 py-2.5 rounded-full text-white bg-[#26231E] hover:bg-[#3d3831] transition-colors cursor-pointer"
                        onClick={() => navigate("/admin/create-category")}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        <span>Create category</span>
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="w-full sm:w-[360px] relative">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#75716B]" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 py-3 bg-white border border-[#DAD6D1] rounded-[8px] text-sm text-[#43403B] placeholder:text-[#75716B] focus-visible:ring-1 focus-visible:ring-[#26231E]"
                        />
                    </div>
                </div>

                {/* Results count */}
                <div className="mb-3 text-sm text-[#75716B]">
                    Showing {paginatedCategories.length} of {processedCategories.length} categories
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-[8px] border border-[#DAD6D1] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-[#F9F8F6] border-b border-[#DAD6D1]">
                                <TableRow className="border-b border-[#DAD6D1]">
                                    <TableHead
                                        className="py-3.5 px-6 text-[#75716B] font-normal cursor-pointer hover:text-[#26231E]"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Category
                                            {sortField === "name" && (
                                                <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="py-3.5 px-6 text-right text-[#75716B] font-normal">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCategories.map((category, index) => (
                                    <TableRow
                                        key={category.id}
                                        className={`border-b border-[#DAD6D1] ${index % 2 === 1 ? "bg-[#EFEEEB]" : "bg-white"} hover:bg-[#DAD6D1]/30 transition-colors`}
                                    >
                                        <TableCell className="py-4 px-6 font-medium text-[#43403B]">{category.name}</TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <button
                                                    className="p-1 text-[#75716B] hover:text-[#26231E] transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/admin/edit-category/${category.id}`)}
                                                    title="Edit category"
                                                >
                                                    <PenSquare className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="p-1 text-[#75716B] hover:text-red-600 transition-colors cursor-pointer"
                                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                                    title="Delete category"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedCategories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-[#75716B] py-12">
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
                        <div className="text-sm text-[#75716B]">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="border-[#DAD6D1] text-[#26231E] hover:bg-[#EFEEEB] cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">Previous</span>
                            </Button>
                            
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
                                            className={`w-8 h-8 p-0 cursor-pointer ${
                                                currentPage === pageNum
                                                    ? "bg-[#26231E] text-white"
                                                    : "border-[#DAD6D1] text-[#26231E] hover:bg-[#EFEEEB]"
                                            }`}
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
                                className="border-[#DAD6D1] text-[#26231E] hover:bg-[#EFEEEB] cursor-pointer"
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
                        setCategoryToDelete(null);
                    }}
                    onConfirm={handleConfirmDeleteCategory}
                    title="Delete category"
                    description="Do you want to delete this category?"
                    isLoading={isDeleting}
                />
            </main>
        </div>
    );
}
