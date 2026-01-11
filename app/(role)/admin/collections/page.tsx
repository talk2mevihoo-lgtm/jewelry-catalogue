import { prisma } from "@/lib/prisma";
import { CreateCollectionDialog } from "@/components/admin/create-collection-dialog";
import { CollectionList } from "@/components/admin/collection-list";

export const dynamic = 'force-dynamic';

export default async function AdminCollectionsPage() {
    const collections = await (prisma as any).collection.findMany({
        include: { products: { include: { category: true } } },
        orderBy: { name: 'asc' }
    });

    const allProducts = await prisma.product.findMany({
        where: { isActive: true },
        include: { category: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Collections</h1>
                    <p className="text-muted-foreground">Create and manage curated product collections.</p>
                </div>
                <CreateCollectionDialog />
            </div>

            <CollectionList
                collections={collections}
                allProducts={allProducts}
            />
        </div>
    );
}
