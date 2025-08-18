import { PenSquare, Trash2 } from "lucide-react";
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
import { AdminSidebar } from "@/components/AdminWebSection";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { blogApi } from "@/services/api";
import { toast } from "sonner";

export default function AdminCategoryManagementPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredCategories, setFilteredCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        // Filter categories based on search term
        if (searchTerm) {
            setFilteredCategories(
                categories.filter(category =>
                    category.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredCategories(categories);
        }
    }, [searchTerm, categories]);

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
                <main className="flex-1 p-8 overflow-auto">
                    <div className="text-center mt-20">Loading categories...</div>
                </main>
            </div>
        );
    }
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main content */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Category management</h2>
                    <Button
                        className="px-8 py-2 rounded-full"
                        onClick={() => navigate("/admin/category-management/create")}
                    >
                        <PenSquare className="mr-2 h-4 w-4" /> Create category
                    </Button>
                </div>

                <div className="mb-6">
                    <Input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                    />
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-full">Category</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCategories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="text-right flex">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => navigate(`/admin/edit-category/${category.id}`)}
                                    >
                                        <PenSquare className="h-4 w-4 hover:text-muted-foreground" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteCategory(category.id, category.name)}
                                    >
                                        <Trash2 className="h-4 w-4 hover:text-muted-foreground" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredCategories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                                    {searchTerm ? 'No categories found matching your search' : 'No categories found'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </main>
        </div>
    );
}