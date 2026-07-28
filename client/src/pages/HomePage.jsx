import { Suspense, lazy, memo } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

// Lazy load heavy components
const HeroSection = lazy(() => import("@/components/blog/HeroSection"));
const ArticlesSection = lazy(() => import("@/components/blog/ArticleSection"));

const HomePageContent = memo(() => (
    <div className="flex flex-col gap-10 sm:gap-[80px] px-4 sm:px-[120px] pt-10 sm:pt-[60px] pb-10 sm:pb-[120px] w-full max-w-[1440px] mx-auto">
        <Suspense fallback={null}>
            <HeroSection />
        </Suspense>
        <Suspense fallback={null}>
            <ArticlesSection />
        </Suspense>
    </div>
));

HomePageContent.displayName = 'HomePageContent';

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <HomePageContent />
            <Footer />
        </div>
    );
}