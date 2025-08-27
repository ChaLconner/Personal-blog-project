import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                // Use design tokens instead of hardcoded hex values
                "w-full lg:w-[360px] h-12 border border-ui-border bg-white text-brand-secondary rounded-lg px-4 py-2 text-sm",
                "ring-offset-background file:border-0 file:bg-ui-neutral file:text-sm file:font-medium file:text-foreground",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
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