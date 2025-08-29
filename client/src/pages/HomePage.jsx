import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ArticleSection from "@/components/ArticleSection";

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div className="flex-grow">
                <HeroSection />
                <ArticleSection />
            </div>
            <Footer />
        </div>
    );
}