import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Using Outfit for headings/premium feel if available, else Inter
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
    title: "Jewelry Catalogue & Ordering System",
    description: "Associated with JewelSutra",
};

import { Toaster } from "@/components/ui/sonner";

// ... existing imports

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn(inter.variable, outfit.variable, "font-sans antialiased min-h-screen bg-background")}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
