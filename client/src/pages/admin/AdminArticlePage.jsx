import { PenSquare, Trash2 } from "lucide-react";
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
import { AdminSidebar } from "@/components/AdminWebSection";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { blogApi } from "@/services/api";
import { toast } from "sonner";


export default function AdminArticleManagementPage() {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [filteredArticles, setFilteredArticles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Filter articles based on search term, status, and category
        let filtered = articles;
        
        if (searchTerm) {
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (statusFilter !== "all") {
            filtered = filtered.filter(article => 
                (article.status || 'published') === statusFilter
            );
        }
        
        if (categoryFilter !== "all") {
            filtered = filtered.filter(article => 
                article.category === categoryFilter
            );
        }
        
        setFilteredArticles(filtered);
    }, [searchTerm, statusFilter, categoryFilter, articles]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [articlesResponse, categoriesResponse] = await Promise.all([
                blogApi.admin.getAllPosts(),
                blogApi.admin.getCategories()
            ]);
            
            const articles = articlesResponse.data || [];
            const categories = categoriesResponse.data || [];
            
            // Debug logging สำหรับตรวจสอบข้อมูลที่ได้รับ
            console.log('📚 Fetched Articles Response:', articlesResponse);
            console.log('📝 Total Articles:', articles.length);
            
            // แสดงสถานะของแต่ละบทความ
            articles.forEach((article, index) => {
                const status = article.status || 'published';
                console.log(`📄 Article ${index + 1}: "${article.title}" - Status: "${status}" (${status === 'draft' ? 'DRAFT 🟤' : 'PUBLISHED 🟢'})`);
            });
            
            setArticles(articles);
            setCategories(categories);
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
            <div className="flex h-screen bg-gray-100">
                <AdminSidebar />
                <main className="flex-1 p-8 overflow-auto">
                    <div className="text-center mt-20">Loading articles...</div>
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
                    <h2 className="text-2xl font-semibold">Article management</h2>
                    <Button
                        className="px-8 py-2 rounded-full"
                        onClick={() => navigate("/admin/create-article")}
                    >
                        <PenSquare className="mr-2 h-4 w-4" /> Create article
                    </Button>
                </div>

                <div className="flex space-x-4 mb-6">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-3 rounded-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] py-3 rounded-sm text-muted-foreground focus:ring-0 focus:ring-offset-0 focus:border-muted-foreground">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px] py-3 rounded-sm text-muted-foreground focus:ring-0 focus:ring-offset-0 focus:border-muted-foreground">
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

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Article title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredArticles.map((article) => (
                            <TableRow key={article.id}>
                                <TableCell className="font-medium">{article.title}</TableCell>
                                <TableCell className="text-sm text-gray-600">{article.author || 'Admin'}</TableCell>
                                <TableCell>{article.category || 'Uncategorized'}</TableCell>
                                <TableCell className="text-center">{(() => {
                                        // Debug logging เพื่อตรวจสอบสถานะ
                                        const status = article.status || 'published';
                                        const isPublished = status === 'published';
                                        const isDraft = status === 'draft';
                                        
                                        console.log(`📄 Article: ${article.title}, Status: ${status}, isPublished: ${isPublished}, isDraft: ${isDraft}`);
                                        
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
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            console.log('🔍 Navigating to edit article with ID:', article.id);
                                            navigate(`/admin/edit-article/${article.id}`);
                                        }}
                                    >
                                        <PenSquare className="h-4 w-4 hover:text-muted-foreground" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteArticle(article.id, article.title)}
                                    >
                                        <Trash2 className="h-4 w-4 hover:text-muted-foreground" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredArticles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                    {searchTerm || statusFilter !== "all" || categoryFilter !== "all" 
                                        ? 'No articles found matching your filters' 
                                        : 'No articles yet. Create your first article!'
                                    }
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </main>
        </div>
    );
}