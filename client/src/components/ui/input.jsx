import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            type="text"
            placeholder="Search"
            className={cn(
                "w-full lg:w-[360px] h-12 border border-[#DAD6D1] bg-white text-[#75716B] rounded-lg px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-[#F9F8F6] file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 outline-none",
                className
            )}
            ref={ref}
            {...props}
        />
    );
})
Input.displayName = "Input"

export { Input }