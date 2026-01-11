"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Printer, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { OrderItemStageManager } from "@/components/admin/order-item-actions";

type DistributorOrderRowProps = {
    order: any;
    stages: any[];
    materials: any[];
};

export function DistributorOrderRow({ order, stages, materials }: DistributorOrderRowProps) {
    const [isOpen, setIsOpen] = useState(false);

    // --- Calculations ---
    const allMetals = materials.flatMap(m => m.metals);

    // Helper to calculate weights for an item
    const calculateItemWeights = (item: any) => {
        const metal = allMetals.find((m: any) => m.name === item.metalType);
        const ratio = metal?.conversionRatio || 1;
        const purity = metal?.purity || 0; // e.g. 0.916

        const grossWeight = (item.product.baseWeight || 0) * ratio * item.quantity;
        const pureWeight = grossWeight * (purity > 1 ? purity / 100 : purity); // Handle 91.6 vs 0.916 if needed, assuming < 1 based on schema comment "0.0 to 1.0"

        return { grossWeight, pureWeight, metal, purity };
    };

    // 1. Group by Metal Group (Material)
    const materialSummary = order.items.reduce((acc: any, item: any) => {
        const { grossWeight, pureWeight, metal } = calculateItemWeights(item);
        // Find parent material name
        const parentMaterial = materials.find(mat => mat.metals.some((m: any) => m.id === metal?.id)) || { name: "Other" };
        const matName = parentMaterial.name;

        if (!acc[matName]) acc[matName] = { gross: 0, pure: 0 };
        acc[matName].gross += grossWeight;
        acc[matName].pure += pureWeight;
        return acc;
    }, {});

    // 2. Group by Metal Type
    const metalTypeSummary = order.items.reduce((acc: any, item: any) => {
        const { grossWeight, pureWeight } = calculateItemWeights(item);
        const typeName = item.metalType;
        if (!acc[typeName]) acc[typeName] = { gross: 0, pure: 0 };
        acc[typeName].gross += grossWeight;
        acc[typeName].pure += pureWeight;
        return acc;
    }, {});

    // 3. Category Summary
    const categorySummary = order.items.reduce((acc: any, item: any) => {
        const { grossWeight, pureWeight } = calculateItemWeights(item);
        const catName = item.product.category?.name || "Uncategorized";

        if (!acc[catName]) acc[catName] = { count: 0, gross: 0, pure: 0 };
        acc[catName].count += item.quantity;
        acc[catName].gross += grossWeight;
        acc[catName].pure += pureWeight;
        return acc;
    }, {});

    // Totals
    const totalGross = Object.values(materialSummary).reduce((sum: number, val: any) => sum + val.gross, 0);
    const totalPure = Object.values(materialSummary).reduce((sum: number, val: any) => sum + val.pure, 0);
    const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    // Progress Calculation
    const maxSeq = Math.max(...stages.map(s => s.sequence || 0), 1);
    const totalMaxSeq = order.items.length * maxSeq;
    let currentTotalSeq = 0;
    order.items.forEach((item: any) => {
        const stage = stages.find(s => s.name === item.stage) || stages.find(s => s.type === "PENDING");
        currentTotalSeq += stage?.sequence || 0;
    });
    const progress = totalMaxSeq > 0 ? Math.round((currentTotalSeq / totalMaxSeq) * 100) : 0;

    let progressColor = "bg-blue-600";
    if (progress >= 100) progressColor = "bg-green-600";
    else if (progress < 20) progressColor = "bg-slate-400";


    return (
        <>
            <tr className={cn("border-b transition-colors hover:bg-muted/50 cursor-pointer print:hidden", isOpen && "bg-muted/50")} onClick={() => setIsOpen(!isOpen)}>
                <td className="p-4 align-middle font-medium">
                    <div className="flex items-center gap-2">
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        {order.orderNumber}
                    </div>
                </td>
                <td className="p-4 align-middle">
                    {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 align-middle">
                    {order.requestedDeliveryDate ? (
                        new Date(order.requestedDeliveryDate).toLocaleDateString()
                    ) : "-"}
                </td>
                <td className="p-4 align-middle w-[150px]">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </td>
                <td className="p-4 align-middle">
                    <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent",
                        order.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                                "bg-secondary text-secondary-foreground"
                    )}>
                        {order.status}
                    </span>
                </td>
                <td className="p-4 align-middle font-medium text-right">
                    {order.items.length} Items
                    <div className="text-xs text-muted-foreground font-normal">
                        {totalGross.toFixed(1)}g
                    </div>
                </td>
            </tr>

            {(isOpen) && (
                <tr className="print:table-row">
                    <td colSpan={6} className="p-0 bg-slate-50/50 dark:bg-slate-900/50 print:bg-white">
                        <div className="p-4 border-b print:border-none">
                            {/* Detailed Header for Print */}
                            <div className="hidden print:block mb-6">
                                <h1 className="text-2xl font-bold mb-2">Order # {order.orderNumber}</h1>
                                <div className="flex justify-between text-sm">
                                    <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span>Distributor: {order.distributor?.companyName} ({order.distributor?.distributorCode})</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4 print:hidden">
                                <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Order Items</h4>
                                <Button size="sm" variant="outline" onClick={(e) => {
                                    e.stopPropagation();
                                    window.print();
                                }}>
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print / Save PDF
                                </Button>
                            </div>

                            <div className="rounded-md border bg-white dark:bg-card print:border-black">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 font-medium text-muted-foreground print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="p-3">Product</th>
                                            <th className="p-3">Details</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Weight (Est)</th>
                                            <th className="p-3 w-[200px] print:hidden">Stage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y print:divide-black">
                                        {order.items.map((item: any) => {
                                            const { grossWeight, pureWeight } = calculateItemWeights(item);
                                            return (
                                                <tr key={item.id}>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 relative rounded overflow-hidden bg-muted border print:hidden">
                                                                {item.product?.mainImage && (
                                                                    <Image src={item.product.mainImage} alt={item.product.title} fill className="object-cover" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{item.product?.title}</div>
                                                                <div className="text-xs text-muted-foreground print:text-black">{item.product?.modelNo}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-xs">
                                                        <div>{item.metalType} {item.metalColor}</div>
                                                        <div>Size: {item.size}</div>
                                                        {item.instructions && <div className="italic text-slate-500 mt-1">"{item.instructions}"</div>}
                                                    </td>
                                                    <td className="p-3 text-right font-medium">{item.quantity}</td>
                                                    <td className="p-3 text-right">
                                                        <div>{grossWeight.toFixed(2)}g</div>
                                                        <div className="text-[10px] text-muted-foreground print:text-gray-600">Pure: {pureWeight.toFixed(2)}g</div>
                                                    </td>
                                                    <td className="p-3 print:hidden">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-medium rounded bg-secondary px-2 py-1 w-fit">
                                                                {item.stage || "PENDING"}
                                                            </span>
                                                            {item.stageReason && <span className="text-[10px] text-muted-foreground">{item.stageReason}</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Section - Always visible when expanded, optimized for print */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:text-sm">

                                {/* Left Column: Metal Analysis */}
                                <div className="space-y-6">
                                    <div className="border rounded p-4 print:border-black">
                                        <h4 className="font-bold text-primary border-b pb-2 mb-3 print:text-black print:border-black">Material Summary</h4>
                                        <div className="space-y-2">
                                            {Object.entries(materialSummary).map(([name, stats]: any) => (
                                                <div key={name} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium">{name}</span>
                                                    <div className="text-right">
                                                        <div>{stats.gross.toFixed(2)}g <span className="text-xs text-muted-foreground print:hidden">Gross</span></div>
                                                        <div className="text-xs font-semibold text-emerald-600 print:text-black">{stats.pure.toFixed(2)}g Pure</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border rounded p-4 print:border-black">
                                        <h4 className="font-bold text-primary border-b pb-2 mb-3 print:text-black print:border-black">Metal Type Breakdown</h4>
                                        <div className="space-y-2">
                                            {Object.entries(metalTypeSummary).map(([name, stats]: any) => (
                                                <div key={name} className="flex justify-between items-center text-sm">
                                                    <span>{name}</span>
                                                    <div className="text-right flex gap-3">
                                                        <span>{stats.gross.toFixed(2)}g</span>
                                                        <span className="font-semibold">{stats.pure.toFixed(2)}g Pure</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Category & Grand Total */}
                                <div className="space-y-6">
                                    <div className="border rounded p-4 print:border-black">
                                        <h4 className="font-bold text-primary border-b pb-2 mb-3 print:text-black print:border-black">Category Summary</h4>
                                        <div className="space-y-2">
                                            {Object.entries(categorySummary).map(([name, stats]: any) => (
                                                <div key={name} className="flex justify-between text-sm border-b border-dashed last:border-0 pb-1 last:pb-0 print:border-gray-400">
                                                    <span>{name} <small>({stats.count} pcs)</small></span>
                                                    <div className="text-right">
                                                        <span>{stats.gross.toFixed(2)}g</span>
                                                        {/* Optional: Show pure for category too if needed, user asked "Jewelry Category wise number of item and its weight with pure metal weight" */}
                                                        <span className="ml-2 font-mono text-xs">({stats.pure.toFixed(2)}g P)</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded border border-slate-200 print:bg-transparent print:border-black">
                                        <h4 className="font-bold text-lg mb-4 text-center border-b pb-2 print:border-black">Grand Total</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Total Items</span>
                                                <span className="font-bold">{totalItems}</span>
                                            </div>
                                            <div className="flex justify-between text-base">
                                                <span>Gross Weight</span>
                                                <span className="font-bold">{totalGross.toFixed(2)}g</span>
                                            </div>
                                            <div className="flex justify-between text-lg text-emerald-700 font-bold print:text-black">
                                                <span>Pure Weight</span>
                                                <span>{totalPure.toFixed(2)}g</span>
                                            </div>
                                        </div>
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
