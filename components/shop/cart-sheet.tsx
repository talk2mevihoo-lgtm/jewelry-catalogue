"use client";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { submitOrder } from "@/lib/actions/order-actions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function CartSheet() {
    const { items, itemCount, removeFromCart, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");

    const handleSubmit = async () => {
        setLoading(true);
        const dateObj = deliveryDate ? new Date(deliveryDate) : undefined;
        const res = await submitOrder(items, note, dateObj);
        setLoading(false);
        if (res.success) {
            clearCart();
            setIsOpen(false);
            setNote(""); // Reset
            setDeliveryDate("");
            alert("Order Submitted!"); // Simple feedback
        } else {
            alert(res.message);
        }
    };

    // Group items by metal type
    const metalTotals = items.reduce((acc, item) => {
        const key = item.metalType || "Other";
        if (!acc[key]) acc[key] = { qty: 0, weight: 0 };
        acc[key].qty += item.quantity;
        acc[key].weight += (item.weight || 0) * item.quantity;
        return acc;
    }, {} as Record<string, { qty: number; weight: number }>);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-auto py-1">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        {Object.keys(metalTotals).length === 0 ? (
                            <span className="font-semibold">0</span>
                        ) : (
                            <div className="flex gap-1">
                                {Object.entries(metalTotals).map(([metal, stats]) => (
                                    <div key={metal} className="flex items-center text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border">
                                        <span className="font-bold mr-1">{stats.weight.toFixed(2)}g</span>
                                        <span className="text-muted-foreground mr-1">|</span>
                                        <span className="font-bold mr-1">{stats.qty}</span>
                                        <span className="text-muted-foreground uppercase text-[8px]">Pcs {metal}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="text-xl font-serif text-primary">Order Selection</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-auto py-6 space-y-4 max-h-[70vh]">
                    {items.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            Your selection is empty.
                        </div>
                    ) : (
                        items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 border-b pb-4">
                                <div className="h-16 w-16 bg-muted rounded overflow-hidden relative flex-shrink-0">
                                    {item.mainImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.mainImage} alt="" className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="font-medium">{item.modelNo}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {item.metalType} {item.metalColor} · Size {item.size}
                                    </div>
                                    <div className="text-xs">Qty: {item.quantity} {item.instructions && <span className="italic block mt-1 text-muted-foreground">Note: {item.instructions}</span>}</div>
                                </div>
                                <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeFromCart(item.productId, idx.toString())}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Requested Delivery Date (Min 12 Days)</label>
                            <Input
                                type="date"
                                value={deliveryDate}
                                min={new Date(new Date().setDate(new Date().getDate() + 12)).toISOString().split('T')[0]} // Min 12 days from today
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeliveryDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Order Notes</label>
                            <Textarea
                                placeholder="Any special instructions for the entire order..."
                                value={note}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                            />
                        </div>
                        <SheetFooter>
                            <Button className="w-full" variant="premium" disabled={loading} onClick={handleSubmit}>
                                {loading ? "Submitting..." : "Submit Order"}
                            </Button>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
