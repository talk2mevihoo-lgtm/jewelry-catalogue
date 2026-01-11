import { getProducts } from "@/lib/actions/product-actions";
import { getMetals, getCategories } from "@/lib/actions/configuration-actions";
import { ProductActionsMenu } from "@/components/admin/product-actions-menu";
import { ProductFilter } from "@/components/admin/product-filter";
import { ProductSearch } from "@/components/admin/product-search";
import { ProductWeightDisplay } from "@/components/admin/product-weight-display";
import { BulkImportModal } from "@/components/admin/bulk-import-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductsPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const categoryId = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;

    // Parallel fetching
    const [products, metals, categories] = await Promise.all([
        getProducts(categoryId, query),
        getMetals(),
        getCategories()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Product Management</h2>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <ProductSearch />
                    <div className="flex gap-2 w-full sm:w-auto">
                        <ProductFilter categories={categories} />
                        <BulkImportModal />
                        <Link href="/admin/products/new">
                            <Button variant="premium" className="whitespace-nowrap">
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-muted/20 rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">No products found. Start by adding one.</p>
                    </div>
                ) : (
                    products.map(product => (
                        <Card key={product.id} className={`overflow-hidden group hover:shadow-lg transition-all duration-300 border-gold-100 relative ${!product.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>

                            {/* Actions Menu Overlay - Always Visible */}
                            <div className="absolute top-2 left-2 z-20">
                                <div className="bg-white/90 rounded-md shadow-sm backdrop-blur-sm">
                                    <ProductActionsMenu id={product.id} isActive={product.isActive} />
                                </div>
                            </div>

                            <div className="aspect-square bg-muted relative overflow-hidden">
                                {!product.isActive && (
                                    <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center">
                                        <div className="bg-charcoal text-ivory text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                            <EyeOff className="w-3 h-3" /> BLOCKED
                                        </div>
                                    </div>
                                )}

                                {product.mainImage ? (
                                    <Image
                                        src={product.mainImage}
                                        alt={product.modelNo}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary">No Image</div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                                    {product.category?.name || "Uncategorized"}
                                </div>
                            </div>
                            <CardContent className="p-3">
                                <div className="font-semibold text-charcoal">{product.modelNo}</div>
                                <div className="text-xs text-muted-foreground truncate">{product.title || "No Title"}</div>

                                <div className="mt-2">
                                    <ProductWeightDisplay baseWeight={product.baseWeight} metals={metals} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
