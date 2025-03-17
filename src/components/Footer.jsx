import { Linkedin, Github, Mail } from "lucide-react";

function Footer() {
    return (
        <footer class="bg-[#EFEEEB] flex flex-col justify-between items-center px-[16px] py-[40px] gap-[24px] sm:flex sm:flex-row sm:px-[120px] sm:py-[60px] sm:gap-[24px]">
            <div className="flex sm:flex-row gap-[24px]">
                <span className="text-500 text-[16px]">
                    Get in touch
                </span>
                <div className="flex space-x-4">
                    <a href="#" className="hover:text-muted-foreground">
                        <Linkedin size={24} />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                    <a href="#" className="hover:text-muted-foreground">
                        <Github size={24} />
                        <span className="sr-only">GitHub</span>
                    </a>
                    <a href="#" className="hover:text-muted-foreground">
                        <Mail size={24} />
                        <span className="sr-only">Email</span>
                    </a>
                </div>
            </div>

            <a href="/" class="underline">
                Home page
            </a>
        </footer>
    )
}

export default Footer