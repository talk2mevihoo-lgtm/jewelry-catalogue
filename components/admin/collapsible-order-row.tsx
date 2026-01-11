"use client";

import { useState } from "react";
import { splitOrder } from "@/lib/actions/admin-order-actions";
import { OrderItemStageManager, OrderItemEditor } from "./order-item-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Split } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type CollapsibleOrderRowProps = {
    order: any;
    stages: any[];
    materials: any[];
    sizes: any[];
};

export function CollapsibleOrderRow({ order, stages, materials, sizes }: CollapsibleOrderRowProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isSplitting, setIsSplitting] = useState(false);

    const allMetals = materials.flatMap(m => m.metals);

    const toggleSelect = (itemId: string) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const handleSplit = async () => {
        if (!confirm(`Create a new order with ${selectedItems.length} selected items?`)) return;
        setIsSplitting(true);
        const res = await splitOrder(order.id, selectedItems);
        setIsSplitting(false);
        if (res.success) {
            setSelectedItems([]);
            // You might want to close the row or show a success message
        } else {
            alert(res.message);
        }
    };

    return (
        <>
            <tr className={cn("border-b transition-colors hover:bg-muted/50 cursor-pointer", isOpen && "bg-muted/50")} onClick={() => setIsOpen(!isOpen)}>
                <td className="p-4 align-middle font-medium flex items-center gap-2">
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    {order.orderNumber}
                </td>
                <td className="p-4 align-middle">
                    <div className="font-medium">{order.distributor?.companyName}</div>
                    <div className="text-xs text-muted-foreground">{order.distributor?.distributorCode}</div>
                </td>
                <td className="p-4 align-middle">
                    {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 align-middle">
                    {order.requestedDeliveryDate ? (
                        (() => {
                            const deliveryDate = new Date(order.requestedDeliveryDate);
                            const now = new Date();
                            const diffTime = deliveryDate.getTime() - now.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const isUrgent = diffDays <= 2 && diffDays >= -1; // Incoming or just overdue

                            return (
                                <div className={cn("text-sm font-medium", isUrgent ? "text-red-600 flex items-center gap-1" : "")}>
                                    {isUrgent && <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse block" />}
                                    {deliveryDate.toLocaleDateString()}
                                    {isUrgent && <span className="text-xs ml-1">(Urgent)</span>}
                                </div>
                            );
                        })()
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )}
                </td>
                <td className="p-4 align-middle">
                    {(() => {
                        const maxSeq = Math.max(...stages.map(s => s.sequence || 0), 1);
                        let totalSeq = 0;
                        let totalMaxSeq = order.items.length * maxSeq;

                        if (totalMaxSeq === 0) return <span className="text-sm text-muted-foreground">Empty</span>;

                        order.items.forEach((item: any) => {
                            const stageName = item.stage || "PENDING";
                            const stageDef = stages.find(s => s.type === stageName);
                            // If PENDING and no stage def, assume 0. 
                            const seq = stageDef ? stageDef.sequence : 0;
                            totalSeq += seq;
                        });

                        const progress = Math.round((totalSeq / totalMaxSeq) * 100);

                        // Color coding based on progress
                        let colorClass = "bg-blue-600";
                        if (progress >= 100) colorClass = "bg-green-600";
                        else if (progress < 20) colorClass = "bg-slate-400";

                        return (
                            <div className="w-[120px]">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium">{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${colorClass}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </td>
                <td className="p-4 align-middle">{order.items.length} items</td>
                <td className="p-4 align-middle text-primary text-sm">
                    {isOpen ? "Hide Details" : "View Details"}
                </td>
            </tr>
            {isOpen && (
                <tr>
                    <td colSpan={7} className="p-0 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="p-4 border-b">
                            {order.instructionNote && (
                                <div className="mb-4 bg-yellow-50 text-yellow-800 p-2 rounded text-sm border border-yellow-100">
                                    <strong>Note:</strong> {order.instructionNote}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Order Items</h4>
                                {selectedItems.length > 0 && (
                                    <Button size="sm" variant="secondary" onClick={handleSplit} disabled={isSplitting} className="gap-2">
                                        <Split className="h-4 w-4" />
                                        Split {selectedItems.length} Items to New Order
                                    </Button>
                                )}
                            </div>

                            <div className="rounded-md border bg-white dark:bg-card">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 font-medium text-muted-foreground">
                                        <tr>
                                            <th className="p-3 w-10">
                                                {/* Select All? */}
                                            </th>
                                            <th className="p-3">Product</th>
                                            <th className="p-3">Details</th>
                                            <th className="p-3">Instructions</th>
                                            <th className="p-3">Qty</th>
                                            <th className="p-3">Stage & Progress</th>
                                            <th className="p-3 w-10">Edit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {order.items.map((item: any) => (
                                            <tr key={item.id} className={cn(selectedItems.includes(item.id) && "bg-blue-50/50")}>
                                                <td className="p-3">
                                                    <Checkbox
                                                        checked={selectedItems.includes(item.id)}
                                                        onCheckedChange={() => toggleSelect(item.id)}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 relative rounded overflow-hidden bg-muted border">
                                                            {item.product?.mainImage ? (
                                                                <Image src={item.product.mainImage} alt={item.product.title} fill className="object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full bg-slate-200" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{item.product?.title || "Unknown Product"}</div>
                                                            <div className="text-xs text-muted-foreground">{item.product?.modelNo}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs">
                                                    <div><span className="text-muted-foreground">Metal:</span> {item.metalType} {item.metalColor}</div>
                                                    <div><span className="text-muted-foreground">Size:</span> {item.size}</div>
                                                </td>
                                                <td className="p-3 text-xs italic text-muted-foreground max-w-[200px] truncate">
                                                    {item.instructions || "-"}
                                                </td>
                                                <td className="p-3 font-medium">
                                                    {item.quantity}
                                                </td>
                                                <td className="p-3">
                                                    <OrderItemStageManager
                                                        item={item}
                                                        stages={stages}
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <OrderItemEditor
                                                        item={item}
                                                        materials={materials}
                                                        sizes={sizes}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Order Summary Section */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-lg border">
                                {/* 1. Metal Group (Material) Grand Total */}
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-2 border-b pb-1">Metal Group Totals</h4>
                                    <div className="space-y-1">
                                        {Object.entries(
                                            order.items.reduce((acc: Record<string, number>, item: any) => {
                                                const metal = allMetals.find((m: any) => m.name === item.metalType);
                                                // If metal not found, fallback to 1? Or 0? 
                                                // Usually conversionRatio is 1.0 if base weight is actual weight.
                                                const ratio = metal?.conversionRatio || 1;
                                                const weight = (item.product.baseWeight || 0) * ratio * item.quantity;

                                                // Find Material Name: Either from metal.material or we assume we know it.
                                                // The 'materials' prop has the structure, so we can find the parent material name.
                                                // metal object here comes from materials.flatMap, so it might NOT have 'material' property populated 
                                                // unless we specifically included it in the flatMap logic or if prisma result has it deeper.
                                                // BUT 'allMetals' came from 'materials'.
                                                // We can look up which material this metal belongs to.
                                                const parentMaterial = materials.find(mat => mat.metals.some((m: any) => m.id === metal?.id));
                                                const matName = parentMaterial?.name || "Other";

                                                acc[matName] = (acc[matName] || 0) + weight;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        ).map(([mat, wt]: [string, any]) => (
                                            <div key={mat} className="flex justify-between text-sm">
                                                <span>{mat}</span>
                                                <span className="font-bold">{(Number(wt) || 0).toFixed(2)}g</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Metal Type Subtotals */}
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-2 border-b pb-1">Metal Type Subtotals</h4>
                                    <div className="space-y-1">
                                        {Object.entries(
                                            order.items.reduce((acc: Record<string, number>, item: any) => {
                                                const metal = allMetals.find((m: any) => m.name === item.metalType);
                                                const ratio = metal?.conversionRatio || 1;
                                                const weight = (item.product.baseWeight || 0) * ratio * item.quantity;
                                                acc[item.metalType] = (acc[item.metalType] || 0) + weight;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        ).map(([type, wt]: [string, any]) => (
                                            <div key={type} className="flex justify-between text-sm">
                                                <span>{type}</span>
                                                <span className="font-medium text-slate-700">{(Number(wt) || 0).toFixed(2)}g</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Category Summary */}
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-2 border-b pb-1">Category Summary</h4>
                                    <div className="space-y-1">
                                        {Object.entries(
                                            order.items.reduce((acc: Record<string, { count: number, weight: number }>, item: any) => {
                                                const cat = item.product.category?.name || "Unknown";
                                                const metal = allMetals.find((m: any) => m.name === item.metalType);
                                                const ratio = metal?.conversionRatio || 1;
                                                const weight = (item.product.baseWeight || 0) * ratio * item.quantity;

                                                if (!acc[cat]) acc[cat] = { count: 0, weight: 0 };
                                                acc[cat].count += item.quantity;
                                                acc[cat].weight += weight;
                                                return acc;
                                            }, {} as Record<string, { count: number, weight: number }>)
                                        ).map(([cat, stats]: [string, any]) => (
                                            <div key={cat} className="flex justify-between text-sm">
                                                <span>{cat} <span className="text-xs text-muted-foreground">({stats.count})</span></span>
                                                <span className="font-medium text-slate-700">{(stats.weight || 0).toFixed(2)}g</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
