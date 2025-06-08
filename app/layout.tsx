import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./ui/NavBar/Nav";
import { AuthProvider } from "./ui/Context/AuthContext";
import ToastProvider from "./ui/providers/ToastProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: 'swap',
    fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: 'swap',
    fallback: ['monospace'],
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export const metadata: Metadata = {
    title: "PersonaPrep - Interview & Job AI Assistant",
    description: "Prepare for interviews with AI-powered practice sessions, track job applications, and get personalized feedback to improve your interview skills.",
    keywords: ["interview preparation", "job search", "AI assistant", "career development", "interview practice"],
    authors: [{ name: "PersonaPrep Team" }],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
            <head>
                <meta name="theme-color" content="#374151" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="PersonaPrep" />
            </head>
            <body className="antialiased bg-gray-700 min-h-screen">
                <AuthProvider>
                    <ToastProvider />

                    <div className="min-h-screen flex flex-col">
                        <div className="fixed top-0 left-0 right-0 z-50 w-full">
                            <Nav />
                        </div>

                        <main className="flex-1 pt-16">
                            {children}
                        </main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}