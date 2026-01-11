"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/providers/cart-provider";
import { toast } from "sonner";

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

interface ShopProductCardProps {
    product: Product;
    metals: Metal[];
    isSelected: boolean;
    onToggleSelect: (checked: boolean) => void;
}

export function ShopProductCard({ product, metals, isSelected, onToggleSelect }: ShopProductCardProps) {
    const [showDetails, setShowDetails] = useState(false);

    // State
    const [selectedMetalId, setSelectedMetalId] = useState(metals[0]?.id);
    const [selectedColor, setSelectedColor] = useState("Yellow");
    const [selectedSize, setSelectedSize] = useState("12");
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState("");

    // Calculations
    const currentMetal = metals.find(m => m.id === selectedMetalId) || metals[0];
    const displayWeight = (product.baseWeight * (currentMetal?.conversionRatio || 1)).toFixed(2);

    const { addToCart } = useCart();

    const handleQuickAdd = () => {
        const metalName = metals.find(m => m.id === selectedMetalId)?.name || "Unknown";
        // Calculate unit weight
        const conversion = metals.find(m => m.id === selectedMetalId)?.conversionRatio || 1;
        const unitWeight = product.baseWeight * conversion;

        addToCart({
            productId: product.id,
            modelNo: product.modelNo,
            mainImage: product.mainImage || "",
            metalType: metalName,
            metalColor: selectedColor,
            size: selectedSize,
            quantity: quantity,
            weight: parseFloat(unitWeight.toFixed(2)), // Store unit weight
            instructions: instructions
        });
        toast.success("Added to Order Selection");
        setShowDetails(false);
    };

    return (
        <Card className={cn("overflow-hidden hover:shadow-lg transition-all border-muted group relative bg-white", isSelected && "ring-2 ring-primary border-primary")}>
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-20">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(c) => onToggleSelect(!!c)}
                    className="bg-white/90 border-gold-300 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
            </div>

            {/* Image Area */}
            <div className="aspect-square bg-white relative overflow-hidden">
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="cursor-zoom-in w-full h-full relative">
                            {product.mainImage ? (
                                <Image
                                    src={product.mainImage}
                                    alt={product.modelNo}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs bg-slate-50">No Image</div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <ZoomIn className="w-8 h-8 text-white drop-shadow-md opacity-70" />
                            </div>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
                        <div className="relative aspect-square w-full max-h-[80vh] bg-white rounded-lg overflow-hidden">
                            {product.mainImage && (
                                <Image src={product.mainImage} alt={product.modelNo} fill className="object-contain" />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Tag/Category Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                    <p className="text-white text-xs font-medium truncate">{product.category?.name}</p>
                </div>
            </div>

            <CardContent className="p-3">
                <div className="flex justify-between items-start">
                    <div className="font-bold text-charcoal text-sm">{product.modelNo}</div>
                    {/* Weight Display - Dynamic */}
                    <div className="text-xs font-medium text-primary bg-gold-50 px-1.5 py-0.5 rounded">
                        {displayWeight}g <span className="text-[9px] text-muted-foreground uppercase">{currentMetal?.name}</span>
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t flex flex-col gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-6 text-xs text-muted-foreground hover:text-primary flex justify-between px-0"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? "Hide Details" : "Show Details"}
                        {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>

                    {showDetails && (
                        <div className="space-y-3 animate-in slide-in-from-top-1 bg-slate-50 p-2 rounded border border-slate-100">
                            {/* Metal Type */}
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Metal</span>
                                <Select value={selectedMetalId} onValueChange={setSelectedMetalId}>
                                    <SelectTrigger className="h-7 text-xs bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {metals.map(m => (
                                            <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Metal Color & Size Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Color</span>
                                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                                        <SelectTrigger className="h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Yellow", "White", "Rose"].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Size</span>
                                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                                        <SelectTrigger className="h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["10", "12", "14", "16", "18"].map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Qty & Instructions */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Qty & Note</span>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={e => setQuantity(parseInt(e.target.value))}
                                        className="h-7 w-12 text-xs bg-white px-1 text-center"
                                    />
                                    <Input
                                        placeholder="Note..."
                                        value={instructions}
                                        onChange={e => setInstructions(e.target.value)}
                                        className="h-7 text-xs bg-white flex-1"
                                    />
                                </div>
                            </div>

                            {/* Add Button */}
                            <Button size="sm" className="w-full h-7 text-xs" variant="premium" onClick={handleQuickAdd}>
                                Add to Order
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
