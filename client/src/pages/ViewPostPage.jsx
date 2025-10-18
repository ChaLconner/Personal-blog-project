import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ViewPost from "@/components/ViewPost";
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