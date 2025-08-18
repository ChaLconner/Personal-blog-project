import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blogApi } from "@/services/api";
import { toast } from "sonner";

export default function AdminEditCategoryPage() {
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setInitialLoading(true);
                const response = await blogApi.admin.getCategories();
                const category = response.data.find(cat => cat.id === parseInt(id));
                if (category) {
                    setCategoryName(category.name);
                } else {
                    toast.error('Category not found');
                    navigate('/admin/category-management');
                }
            } catch (error) {
                console.error('Error fetching category:', error);
                toast.error('Failed to fetch category');
                navigate('/admin/category-management');
            } finally {
                setInitialLoading(false);
            }
        };

        if (id) {
            fetchCategory();
        }
    }, [id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!categoryName.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            setLoading(true);
            await blogApi.admin.updateCategory(id, { name: categoryName.trim() });
            toast.success('Category updated successfully');
            navigate('/admin/category-management');
        } catch (error) {
            console.error('Error updating category:', error);
            const errorMessage = error.message || 'Failed to update category';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            try {
                setLoading(true);
                await blogApi.admin.deleteCategory(id);
                toast.success('Category deleted successfully');
                navigate('/admin/category-management');
            } catch (error) {
                console.error('Error deleting category:', error);
                const errorMessage = error.message || 'Failed to delete category';
                toast.error(errorMessage);
                setLoading(false);
            }
        }
    };

    if (initialLoading) {
        return (
            <div className="flex h-screen bg-gray-100">
                <AdminSidebar />
                <main className="flex-1 p-8 bg-gray-50 overflow-auto">
                    <div className="text-center mt-20">Loading category...</div>
                </main>
            </div>
        );
    }
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main content */}
            <main className="flex-1 p-8 bg-gray-50 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Edit Category</h2>
                    <div className="space-x-2">
                        <Button 
                            type="button"
                            variant="outline"
                            className="px-8 py-2 rounded-full"
                            onClick={() => navigate('/admin/category-management')}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            form="category-form"
                            className="px-8 py-2 rounded-full"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
                
                <form id="category-form" onSubmit={handleSubmit} className="space-y-7 max-w-md">
                    <div className="relative">
                        <label
                            htmlFor="category-name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Category Name
                        </label>
                        <Input
                            id="category-name"
                            type="text"
                            placeholder="Category name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="mt-1 py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                            required
                        />
                    </div>
                </form>
                
                <button 
                    onClick={handleDelete}
                    disabled={loading}
                    className="underline underline-offset-2 hover:text-muted-foreground text-sm font-medium flex items-center gap-1 mt-6 disabled:opacity-50"
                >
                    <Trash2 className="h-5 w-5" />
                    {loading ? 'Deleting...' : 'Delete Category'}
                </button>
            </main>
        </div>
    );
}