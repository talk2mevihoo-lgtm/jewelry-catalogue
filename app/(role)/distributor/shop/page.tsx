import { searchProducts, getShopConfiguration } from "@/lib/actions/shop-actions";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ProductGrid } from "@/components/shop/product-grid";

export default async function ShopPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const { categories, metals, tags } = await getShopConfiguration();

    // Handle tags param which can be string or array
    const rawTags = searchParams.tags;
    const tagList = Array.isArray(rawTags) ? rawTags : (rawTags ? [rawTags] : undefined);

    const products = await searchProducts({
        categoryId: typeof searchParams.categoryId === 'string' ? searchParams.categoryId : undefined,
        minWeight: typeof searchParams.minWeight === 'string' ? parseFloat(searchParams.minWeight) : undefined,
        maxWeight: typeof searchParams.maxWeight === 'string' ? parseFloat(searchParams.maxWeight) : undefined,
        tags: tagList
    });

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Filters */}
            <div className="w-full md:w-64 flex-shrink-0">
                <ShopFilters categories={categories} tags={tags} />
            </div>

            {/* Product Grid */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-serif text-primary">Jewelry Collection</h1>
                    <div className="text-sm text-muted-foreground">
                        Showing {products.length} items
                    </div>
                </div>

                <ProductGrid products={products} metals={metals} />
            </div>
        </div>
    );
}
