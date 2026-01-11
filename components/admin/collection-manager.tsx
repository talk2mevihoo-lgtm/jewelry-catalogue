"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Search } from "lucide-react";
import Image from "next/image";
import { addProductsToCollection, removeProductFromCollection } from "@/lib/actions/collection-actions";
import { useRouter } from "next/navigation";

type CollectionManagerProps = {
    collection: any;
    allProducts: any[]; // Passed to allows selection. If too large, we might need search API.
    // For now assume reasonable size or simple filtering.
};

export function CollectionManager({ collection, allProducts }: CollectionManagerProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Products already in collection
    const existingIds = new Set(collection.products.map((p: any) => p.id));

    // Filter available products
    const availableProducts = allProducts.filter((p: any) =>
        !existingIds.has(p.id) &&
        (p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.modelNo?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleRemove = async (productId: string) => {
        if (!confirm("Remove this product from collection?")) return;
        await removeProductFromCollection(collection.id, productId);
        router.refresh();
    };

    const handleBulkAdd = async () => {
        setIsSaving(true);
        const res = await addProductsToCollection(collection.id, selectedToAdd);
        setIsSaving(false);
        if (res.success) {
            setIsAddOpen(false);
            setSelectedToAdd([]);
            router.refresh();
        } else {
            alert("Failed to add products: " + res.message);
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedToAdd.includes(id)) {
            setSelectedToAdd(selectedToAdd.filter(i => i !== id));
        } else {
            setSelectedToAdd([...selectedToAdd, id]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Products in Collection ({collection.products.length})</h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Products
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Add Products to {collection.name}</DialogTitle>
                        </DialogHeader>

                        <div className="flex items-center gap-2 my-4">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or model..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={selectedToAdd.length === availableProducts.length && availableProducts.length > 0}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedToAdd(availableProducts.map((p: any) => p.id));
                                                    else setSelectedToAdd([]);
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Category</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableProducts.slice(0, 50).map((product: any) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedToAdd.includes(product.id)}
                                                    onCheckedChange={() => toggleSelect(product.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-10 w-10 relative bg-muted rounded overflow-hidden">
                                                    {product.mainImage && <Image src={product.mainImage} alt="" fill className="object-cover" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{product.title}</div>
                                                <div className="text-xs text-muted-foreground">{product.modelNo}</div>
                                            </TableCell>
                                            <TableCell>{product.category?.name}</TableCell>
                                        </TableRow>
                                    ))}
                                    {availableProducts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No matching products found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleBulkAdd} disabled={selectedToAdd.length === 0 || isSaving}>
                                {isSaving ? "Adding..." : `Add ${selectedToAdd.length} Products`}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List Existing Products */}
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collection.products.map((product: any) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="h-12 w-12 relative bg-muted rounded overflow-hidden">
                                        {product.mainImage && <Image src={product.mainImage} alt="" fill className="object-cover" />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{product.title}</div>
                                    <div className="text-xs text-muted-foreground">{product.modelNo}</div>
                                </TableCell>
                                <TableCell>{product.category?.name || "-"}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemove(product.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {collection.products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    This collection is empty.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
