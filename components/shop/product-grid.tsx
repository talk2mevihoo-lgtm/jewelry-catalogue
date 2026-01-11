"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/providers/cart-provider";
import { ShopProductCard } from "./shop-product-card";
import { ShoppingBag, X } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner or generic toast

type Product = {
    id: string;
    modelNo: string;
    mainImage: string | null;
    baseWeight: number;
    title: string | null;
    category: { name: string } | null;
};

type Metal = {
    id: string;
    name: string;
    conversionRatio: number;
};

interface ProductGridProps {
    products: Product[];
    metals: Metal[];
}

export function ProductGrid({ products, metals }: ProductGridProps) {
    const { addToCart } = useCart();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Bulk Config State
    const [bulkMetal, setBulkMetal] = useState((metals && metals.length > 0) ? metals[0].id : "");
    const [bulkColor, setBulkColor] = useState("Yellow"); // Mock colors for now
    const [bulkSize, setBulkSize] = useState("12"); // Mock sizes
    const [bulkQty, setBulkQty] = useState(1);

    const toggleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(x => x !== id));
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(products.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkAdd = () => {
        if (selectedIds.length === 0) return;

        const selectedMetalName = metals.find(m => m.id === bulkMetal)?.name || "Unknown";
        const conversion = metals.find(m => m.id === bulkMetal)?.conversionRatio || 1;

        selectedIds.forEach(id => {
            const product = products.find(p => p.id === id);
            if (product) {
                const unitWeight = parseFloat((product.baseWeight * conversion).toFixed(2));
                addToCart({
                    productId: product.id,
                    modelNo: product.modelNo,
                    mainImage: product.mainImage || "",
                    metalType: selectedMetalName,
                    metalColor: bulkColor,
                    size: bulkSize,
                    quantity: bulkQty,
                    weight: unitWeight,
                    instructions: "Bulk Added"
                });
            }
        });

        // Feedback and Reset
        // toast.success(`${selectedIds.length} items added to cart!`);
        setSelectedIds([]);
    };

    return (
        <div className="relative min-h-[500px]">
            {/* Select All Bar (Top) */}
            <div className="flex items-center space-x-2 mb-4 bg-white p-2 rounded shadow-sm border w-fit">
                <Checkbox
                    id="select-all"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onCheckedChange={(c) => toggleSelectAll(!!c)}
                />
                <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                    Select All ({selectedIds.length} selected)
                </Label>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-20">
                {products.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground">No products found matching filters.</div>
                ) : (
                    products.map(product => (
                        <ShopProductCard
                            key={product.id}
                            product={product}
                            metals={metals}
                            isSelected={selectedIds.includes(product.id)}
                            onToggleSelect={(c) => toggleSelect(product.id, c)}
                        />
                    ))
                )}
            </div>

            {/* Sticky Bulk Action Bar (Bottom) */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 bg-charcoal text-white p-4 rounded-lg shadow-2xl z-40 animate-in slide-in-from-bottom-4 duration-300 flex flex-col lg:flex-row items-center justify-between gap-4 border border-gold-500/30">
                    <div className="flex items-center gap-4 w-full flex-wrap">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-gold-300" />
                            <span className="font-bold whitespace-nowrap">{selectedIds.length} Items</span>
                        </div>

                        <div className="h-6 w-px bg-white/20 hidden lg:block" />

                        <div className="flex gap-2 items-center">
                            <Select value={bulkMetal} onValueChange={setBulkMetal}>
                                <SelectTrigger className="h-8 w-24 bg-white/10 border-white/20 text-white text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(metals || []).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={bulkColor} onValueChange={setBulkColor}>
                                <SelectTrigger className="h-8 w-24 bg-white/10 border-white/20 text-white text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["Yellow", "White", "Rose"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={bulkSize} onValueChange={setBulkSize}>
                                <SelectTrigger className="h-8 w-20 bg-white/10 border-white/20 text-white text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["10", "12", "14", "16", "18"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center bg-white/10 rounded border border-white/20 h-8">
                                <span className="px-2 text-[10px] text-white/70">Qty</span>
                                <Input
                                    type="number"
                                    min="1"
                                    value={bulkQty}
                                    onChange={e => setBulkQty(parseInt(e.target.value))}
                                    className="h-full w-12 border-0 bg-transparent text-white text-xs focus-visible:ring-0 p-1 text-center"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto">
                        <Button
                            variant="premium"
                            className="bg-gold-400 hover:bg-gold-500 text-black border-none w-full whitespace-nowrap"
                            onClick={handleBulkAdd}
                        >
                            Add to Order
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10"
                            onClick={() => setSelectedIds([])}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
