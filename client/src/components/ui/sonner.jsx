import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ toastOptions, ...props }) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast font-sans data-[custom=true]:bg-transparent data-[custom=true]:border-none data-[custom=true]:shadow-none",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    ...toastOptions?.classNames,
                },
                ...toastOptions,
            }}
            {...props}
        />
    );
}

export { Toaster }