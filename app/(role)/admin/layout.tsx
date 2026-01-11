import Link from "next/link";
import { LayoutDashboard, Users, Gem, Settings, Package, LogOut, FileText, Download, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-premium font-serif text-primary">JewelSutra Admin</h2>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link href="/admin/distributors" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <Users className="h-4 w-4" />
                        Distributors
                    </Link>
                    <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <Gem className="h-4 w-4" />
                        Products
                    </Link>
                    <Link href="/admin/collections" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <Library className="h-4 w-4" />
                        My Collections
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <Package className="h-4 w-4" />
                        Orders
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <Settings className="h-4 w-4" />
                        Configuration
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <FileText className="h-4 w-4" />
                        Print Reports
                    </Link>
                    <Link href="/admin/cad-downloads" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gold-100 text-charcoal">
                        <Download className="h-4 w-4" />
                        Download CAD Files
                    </Link>
                </nav>
                <div className="p-4 border-t border-border">
                    <Button variant="ghost" className="w-full justify-start text-destructive gap-2">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-muted/20">
                <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
                    <h1 className="text-lg font-semibold text-charcoal">Admin Portal</h1>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-gold-200 border-2 border-gold-400"></div>
                    </div>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
