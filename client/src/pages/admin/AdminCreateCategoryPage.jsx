import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/AdminWebSection";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { blogApi } from "@/services/api";
import { toast } from "sonner";

export default function AdminCreateCategoryPage() {
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!categoryName.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            setLoading(true);
            await blogApi.admin.createCategory({ name: categoryName.trim() });
            toast.success('Category created successfully');
            navigate('/admin/category-management');
        } catch (error) {
            console.error('Error creating category:', error);
            const errorMessage = error.message || 'Failed to create category';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex h-screen bg-gray-100 font-poppins">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main content */}
            <main className="flex-1 p-4 lg:p-8 bg-gray-50 overflow-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-xl sm:text-2xl font-semibold">Create Category</h2>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            className="px-6 py-2 sm:px-10 sm:py-3 rounded-full cursor-pointer"
                            onClick={() => navigate('/admin/category-management')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="category-form"
                            className="bg-black text-white px-6 py-2 sm:px-10 sm:py-3 rounded-full cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
                
                <form id="category-form" onSubmit={handleSubmit} className="space-y-6 sm:space-y-7 max-w-md w-full">
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
                            placeholder="Enter category name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="mt-1 w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                            required
                        />
                    </div>
                </form>
            </main>
        </div>
    );
}