import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                // Use design tokens instead of hardcoded hex values
                "w-full lg:w-full h-12 border border-[#DAD6D1] bg-white text-[#43403B] rounded-lg pl-4 pr-3 py-3 font-poppins font-medium text-base leading-6",
                "ring-offset-background file:border-0 file:bg-ui-neutral file:text-sm file:font-medium file:text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus-visible:outline-none focus:border-transparent",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    );
})
Input.displayName = "Input"

export { Input }