import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import ViewPost from "@/components/blog/ViewPost";
import { memo } from "react";

const PageContent = memo(() => (
    <div className="flex-grow">
        <ViewPost />
    </div>
));

PageContent.displayName = "PageContent";

export default function ViewPostPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <PageContent />
            <Footer />
        </div>
    );
}