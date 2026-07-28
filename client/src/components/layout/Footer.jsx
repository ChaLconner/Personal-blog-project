import { Link } from "react-router";

function LinkedinIcon({ className = "w-[24px] h-[24px]" }) {
    return (
        <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="12" cy="12" r="12" fill="#43403B" />
            <circle cx="7.2" cy="7.2" r="1.3" fill="white" />
            <rect x="5.9" y="9.8" width="2.6" height="8" rx="0.3" fill="white" />
            <path 
                d="M11 9.8h2.5v1.1h.04c.35-.66 1.2-1.36 2.48-1.36 2.65 0 3.14 1.74 3.14 4.01v4.25h-2.62v-3.77c0-.9-.02-2.06-1.25-2.06-1.26 0-1.45.98-1.45 1.99v3.84H11V9.8z" 
                fill="white" 
            />
        </svg>
    );
}

function GithubIcon({ className = "w-[24px] h-[24px]" }) {
    return (
        <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" 
                fill="#43403B" 
                transform="translate(-2.4, -2.4) scale(1.2)"
            />
        </svg>
    );
}

function GoogleIcon({ className = "w-[24px] h-[24px]" }) {
    return (
        <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12ZM11.9827 8.81067C12.9577 8.81067 13.6154 9.23244 13.9904 9.58489L15.4559 8.152C14.5559 7.31422 13.3847 6.8 11.9827 6.8C9.95184 6.8 8.19793 7.96711 7.34405 9.66578L9.02296 10.9716C9.44413 9.71778 10.6096 8.81067 11.9827 8.81067ZM16.9675 12.1156C16.9675 11.688 16.9329 11.376 16.8579 11.0524H11.9827V12.9822H14.8443C14.7866 13.4618 14.4751 14.184 13.7827 14.6693L15.4213 15.9404C16.4021 15.0333 16.9675 13.6987 16.9675 12.1156ZM9.02873 13.0284C8.91911 12.7049 8.85565 12.3582 8.85565 12C8.85565 11.6418 8.91911 11.2951 9.02296 10.9716L7.34405 9.66578C6.99212 10.3707 6.79019 11.1622 6.79019 12C6.79019 12.8378 6.99212 13.6293 7.34405 14.3342L9.02873 13.0284ZM11.9827 17.2C13.3847 17.2 14.5616 16.7378 15.4213 15.9404L13.7827 14.6693C13.3443 14.9756 12.7558 15.1893 11.9827 15.1893C10.6096 15.1893 9.44413 14.2822 9.02873 13.0284L7.34982 14.3342C8.2037 16.0329 9.95184 17.2 11.9827 17.2Z" 
                fill="#43403B" 
            />
        </svg>
    );
}

function Footer() {
    return (
        <footer className="bg-[#EFEEEB] flex flex-col justify-between items-center px-4 py-10 gap-6 sm:flex-row sm:px-[120px] sm:py-[60px]">
            <div className="flex sm:flex-row gap-[24px] items-center">
                <span className="text-[#43403B] text-[16px]">
                    Get in touch
                </span>
                <div className="flex flex-row items-center p-0 gap-[16px] w-[104px] h-[24px] flex-none order-1 flex-grow-0">
                    <a 
                        href="https://www.linkedin.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:opacity-80 flex-none order-0 flex-grow-0 w-[24px] h-[24px]"
                    >
                        <LinkedinIcon className="w-[24px] h-[24px]" />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                    <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:opacity-80 flex-none order-1 flex-grow-0 w-[24px] h-[24px]"
                    >
                        <GithubIcon className="w-[24px] h-[24px]" />
                        <span className="sr-only">GitHub</span>
                    </a>
                    <a 
                        href="https://www.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:opacity-80 flex-none order-2 flex-grow-0 w-[24px] h-[24px]"
                    >
                        <GoogleIcon className="w-[24px] h-[24px]" />
                        <span className="sr-only">Google</span>
                    </a>
                </div>
            </div>

            <Link to="/" className="font-poppins font-medium text-base leading-6 underline text-[#26231E] hover:text-[#75716B] transition-colors">
                Home page
            </Link>
        </footer>
    )
}

export default Footer
