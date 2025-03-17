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
    return (
        <section class="">
            {/* heading */}
            <div class="gap-[32px] sm:px-[120px] sm:py-[60px]">
                <h3 class="font-600 p-[16px] text-[24px] sm:mb-[32px]">Latest articles</h3>
                <div className="flex sm:justify-between items-center bg-[#EFEEEB] p-[16px] sm:rounded-[16px] sm:px-[24px] sm:py-[16px]" >
                    <div className="hidden md:flex space-x-2">
                        <button className="px-4 py-3 transition-colors rounded-sm text-sm text-muted-foreground font-medium bg-[#DAD6D1]">Highlight</button>
                        <button className="px-4 py-3 transition-colors rounded-sm text-sm text-muted-foreground font-medium bg-[muted]">Cat</button>
                        <button className="px-4 py-3 transition-colors rounded-sm text-sm text-muted-foreground font-medium bg-[muted]">Inspiration</button>
                        <button className="px-4 py-3 transition-colors rounded-sm text-sm text-muted-foreground font-medium bg-[muted]">General</button>
                    </div>
                    <div className="gap-[16px] sm:border-[#DAD6D1] sm:border-[1px] sm:rounded-[8px]">
                        <Input />
                        <div className="w-full sm:hidden">
                            <h1 className="text-muted-foreground mb-[4px]">Category</h1>
                            <Select value="highlight">
                                <SelectTrigger className="w-full py-3 rounded-sm text-muted-foreground">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="highlight">Highlight</SelectItem>
                                    <SelectItem value="cat">Cat</SelectItem>
                                    <SelectItem value="inspiration">Inspiration</SelectItem>
                                    <SelectItem value="general">General</SelectItem>
                                </SelectContent>
                            </Select>
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
                <a href="/" class="underline hidden sm:block sm:text-center sm:mb-[120px]">
                    View more
                </a>
            </div>
        </section>
    );
}

export default ArticleSection