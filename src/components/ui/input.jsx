import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, ...props }, ref) => {
    return (
        (<input
            type={"text"}
            placeholder="Search"
            className={cn(
                "flex w-[343px] h-[48px] mb-[16px] sm:mb-[0px] sm:w-[360px] sm:h-[48px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props} />
        )
    );
})
Input.displayName = "Input"

export { Input }