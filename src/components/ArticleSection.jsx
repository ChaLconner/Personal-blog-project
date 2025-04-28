import { useState } from "react";
import { Input } from "@/components/ui/input"
import BlogCard from "./BlogCard";
import { blogPosts } from "@/data/blogPosts";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

function ArticleSection() {
    const categories = ["Highlight", "Cat", "Inspiration", "General"];
    const [category, setCategory] = useState("Highlight");
    return (
        <section className="">
            {/* heading */}
            <div className="gap-[32px] sm:px-[120px] sm:py-[60px]">
                <h3 className="font-600 p-[16px] text-[24px] sm:mb-[32px]">Latest articles</h3>
                <div className="flex sm:justify-between items-center bg-[#EFEEEB] p-[16px] sm:rounded-[16px] sm:px-[24px] sm:py-[16px]" >
                    <div className="hidden md:flex space-x-2">
                        {categories.slice(0).map((Highlight) => {
                            return (
                                <button
                                    key={Highlight}
                                    className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                                        category === Highlight
                                        ? "bg-gray-600 text-white" 
                                            : "hover:bg-gray-300"
                                    }`}
                                    disabled={category === Highlight}
                                    onClick={() => setCategory(Highlight)}
                                >
                                    {Highlight}
                                </button>
                            );
                        })}
                    </div>
                    <div className="gap-[16px] sm:border-[#DAD6D1] sm:border-[1px] sm:rounded-[8px]">
                        <Input />
                        <div className="w-full sm:hidden">
                            <h1 className="text-muted-foreground mb-[4px]">Category</h1>
                            <Select value="category" onValueChange={(value) => setCategory(value)}>
                                <SelectTrigger className="w-full py-3 rounded-sm text-muted-foreground">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => {
                                        return (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="hidden smd:flex space-x-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-4 py-3 transition-colors rounded-sm text-sm text-muted-foreground font-medium ${category === cat ? "bg-[#DAD6D1]" : "hover:bg-muted"
                                        }`}
                                >
                                    {cat}
                                </button>

                            ))}
                        </div>
                    </div>
                </div>

                {/* cards */}
                <div className="px-[16px] pt-[24px] pb-[80px] grid grid-cols-1 gap-8 sm:grid-cols-2">
                    {blogPosts.map((post) =>
                    (<BlogCard
                        key={post.id}
                        image={post.image}
                        category={post.category}
                        title={post.title}
                        description={post.description}
                        author={post.author}
                        date={post.date}
                        likes={post.likes}
                        content={post.content}
                    />))}
                </div>
                <a href="/" className="underline hidden sm:block sm:text-center sm:mb-[120px]">
                    View more
                </a>
            </div>
        </section>
    );
}

export default ArticleSection