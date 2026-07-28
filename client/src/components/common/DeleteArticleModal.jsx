import React from 'react';
import { X } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogOverlay,
    AlertDialogPortal,
} from '@/components/ui/alert-dialog';

export function DeleteArticleModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete article",
    description = "Do you want to delete this article?",
    isLoading = false,
}) {
    React.useEffect(() => {
        if (isOpen && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }, [isOpen]);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogPortal>
                <AlertDialogOverlay className="fixed inset-0 z-50 bg-transparent data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-[477px] bg-[#F9F8F6] rounded-[16px] px-6 pt-4 pb-10 flex flex-col items-center gap-6 shadow-xl border-none font-poppins duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    {/* Frame 427321539: Close Button Header */}
                    <div className="w-full flex justify-end items-center h-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-0 text-[#26231E] hover:opacity-70 transition-opacity cursor-pointer border-none bg-transparent"
                            aria-label="Close"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Frame 427321540: Main Content Container */}
                    <div className="flex flex-col items-center gap-6 w-full">
                        {/* Title */}
                        <AlertDialogTitle className="font-poppins font-semibold text-[24px] leading-[32px] text-[#26231E] text-center m-0">
                            {title}
                        </AlertDialogTitle>
                        
                        {/* Description */}
                        <AlertDialogDescription className="font-poppins font-medium text-[16px] leading-[24px] text-[#75716B] text-center m-0 max-w-[295px]">
                            {description}
                        </AlertDialogDescription>

                        {/* Frame 427321541: Buttons Container */}
                        <div className="flex flex-row justify-center items-center gap-2 w-full pt-0">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="py-3 px-10 rounded-full bg-white border border-[#75716B] text-[#26231E] font-poppins font-medium text-[16px] leading-[24px] hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 min-w-[138px]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="py-3 px-10 rounded-full bg-[#26231E] text-white font-poppins font-medium text-[16px] leading-[24px] hover:bg-[#3d3831] transition-colors cursor-pointer disabled:opacity-50 min-w-[132px]"
                            >
                                {isLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialogPortal>
        </AlertDialog>
    );
}

export default DeleteArticleModal;
