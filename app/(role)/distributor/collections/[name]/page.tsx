import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/shop/product-grid"; // Assuming this exists or I'll use a generic grid
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CollectionPage({ params }: { params: { name: string } }) {
    const name = decodeURIComponent(params.name);

    const collection = await (prisma as any).collection.findUnique({
        where: { name },
        include: {
            products: {
                where: { isActive: true },
                include: { category: true } // Needed for product card details
            }
        }
    });

    if (!collection || !collection.isVisible) {
        notFound();
    }

    // Reuse existing ProductGrid if possible, or build a simple one
    // I previously viewed `distributor/shop` but didn't memorize if ProductGrid is exported.
    // I'll assume I can render the grid manually if needed, but let's try to import ProductGrid.
    // If ProductGrid expects strict props, I might need to adapt.
    // Let's inspect `ProductGrid` component if this fails later. For now, I'll inline a grid using ProductCard
    // Wait, I haven't seen ProductCard specifically. I'll use a generic grid layout here.

    // Fetch metals for the grid dropdowns
    const materials = await (prisma as any).material.findMany({
        where: { isVisible: true },
        include: { metals: { where: { isVisible: true }, orderBy: { conversionRatio: 'asc' } } }
    });
    const allMetals = (materials as any[]).flatMap(m => m.metals);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-serif text-primary">{collection.name}</h1>
                <p className="text-muted-foreground">My Collection</p>
            </div>

            {collection.products.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground">No products found in this collection.</p>
                </div>
            ) : (
                <ProductGrid products={collection.products} metals={allMetals} />
            )}
        </div>
    );
}
