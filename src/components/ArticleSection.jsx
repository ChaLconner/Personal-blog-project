import { Input } from "@/components/ui/input"


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
                <div className="md:hidden w-full">

                </div>

                {/* cards */}
                <div>

                </div>
            </div>
        </section>
    );
}

export default ArticleSection