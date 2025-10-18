import { Suspense, lazy, memo } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

// Lazy load heavy components
const HeroSection = lazy(() => import("@/components/HeroSection"));
const ArticlesSection = lazy(() => import("@/components/ArticleSection"));

const HomePageContent = memo(() => (
    <div className="flex-grow">
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