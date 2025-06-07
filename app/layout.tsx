import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./ui/NavBar/Nav";
import { AuthProvider } from "./ui/Context/AuthContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "resuMate - Interview Assistant",
    description: "AI-powered interview preparation platform",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
            <body className="antialiased bg-gray-700 min-h-screen">
                <AuthProvider>
                    <div className="min-h-screen flex flex-col">
                        <Nav />
                        <main className="flex-1">
                            {children}
                        </main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}