import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
    return (
        (<textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-lg border-2 border-[#DAD6D1] bg-white text-brand-secondary px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props} />)
    );
})
Textarea.displayName = "Textarea"

export { Textarea }