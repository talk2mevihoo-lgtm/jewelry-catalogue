import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartProvider } from "@/components/providers/cart-provider";
import { CartSheet } from "@/components/shop/cart-sheet";
import { prisma } from "@/lib/prisma";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default async function DistributorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch collections for menu
    const collections = await (prisma as any).collection.findMany({
        where: { isVisible: true },
        orderBy: { name: 'asc' }
    });

    return (
        <CartProvider>
            <div className="flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="w-full flex h-16 items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <Link href="/distributor" className="flex items-center gap-2">
                                <span className="text-xl font-bold font-serif text-primary">Jewelry Catalogue</span>
                                <span className="text-xs text-muted-foreground hidden sm:inline-block">/ Member Portal</span>
                            </Link>
                        </div>

                        <nav className="flex items-center gap-6">
                            <Link href="/distributor" className="text-sm font-medium transition-colors hover:text-primary">
                                Dashboard
                            </Link>
                            <Link href="/distributor/shop" className="text-sm font-medium transition-colors hover:text-primary">
                                Shop All
                            </Link>

                            {/* My Collections Dropdown */}
                            {collections.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary outline-none">
                                        My Collections <ChevronDown className="h-3 w-3" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {collections.map((col: any) => (
                                            <DropdownMenuItem key={col.id} asChild>
                                                <Link href={`/distributor/collections/${encodeURIComponent(col.name)}`}>
                                                    {col.name}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <Link href="/distributor/orders" className="text-sm font-medium transition-colors hover:text-primary">
                                My Orders
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            <CartSheet />
                            <Button size="sm" variant="outline">
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 w-full px-6 py-6">
                    {children}
                </main>

                {/* Minimal Footer */}
                <footer className="border-t py-6 md:py-0">
                    <div className="w-full flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-6">
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            © 2024 JewelSutra. All rights reserved.
                        </p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Contact: +91 81413 88570</span>
                            <span>Email: contact@jewelsutra.in</span>
                        </div>
                    </div>
                </footer>
            </div>
        </CartProvider>
    );
}
