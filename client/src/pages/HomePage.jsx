import { Suspense, lazy } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load heavy components
const HeroSection = lazy(() => import("@/components/HeroSection"));
const ArticlesSection = lazy(() => import("@/components/ArticleSection"));

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                    <HeroSection />
                </Suspense>
                <Suspense fallback={<LoadingSpinner />}>
                    <ArticlesSection />
                </Suspense>
            </div>
            <Footer />
        </div>
    );
}