"use client";

import { useState, useMemo } from "react";
import { format, isSameDay, isWithinInterval, startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subMonths, parseISO, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CalendarIcon, TrendingUp, Package, BarChart3, AlertCircle } from "lucide-react";

type DashboardAnalyticsProps = {
    orders: any[];
    stages: any[];
    materials: any[];
};

export function DashboardAnalytics({ orders = [], stages = [], materials = [] }: DashboardAnalyticsProps) {
    const [dateRange, setDateRange] = useState("all");
    const [selectedStage, setSelectedStage] = useState<string | null>(null);

    // Ensure arrays
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeStages = Array.isArray(stages) ? stages : [];
    const safeMaterials = Array.isArray(materials) ? materials : [];

    // --- 1. Filter Logic ---
    const filteredOrders = useMemo(() => {
        const now = new Date();
        const startOfToday = startOfDay(now);

        return safeOrders.filter(order => {
            if (dateRange === "all") return true;

            const date = new Date(order.createdAt);

            if (dateRange === "today") return isSameDay(date, now);
            if (dateRange === "week") return date >= startOfWeek(now);
            if (dateRange === "month") return date >= startOfMonth(now);
            if (dateRange === "last_quarter") {
                const startLastQ = startOfQuarter(subMonths(now, 3));
                const endLastQ = startOfQuarter(now); // Not inclusive
                return date >= startLastQ && date < endLastQ;
            }
            if (dateRange === "six_months") return date >= subMonths(now, 6);
            if (dateRange === "year") return date >= startOfYear(now);

            return true;
        });
    }, [safeOrders, dateRange]);

    // --- 2. Metrics Calculation ---

    // Overall Stats
    const totalOrders = filteredOrders.length;
    const totalItems = filteredOrders.reduce((sum, o) => sum + ((o.items || []).length), 0);

    // Metal Group Subtotals for Filtered Orders
    const metalGroupTotals = useMemo(() => {
        const acc: Record<string, number> = {};
        const allMetals = (safeMaterials || []).flatMap(m => m.metals || []);

        filteredOrders.forEach(order => {
            (order.items || []).forEach((item: any) => {
                const metal = allMetals.find((m: any) => m.name === item.metalType);
                const ratio = metal?.conversionRatio || 1;
                const weight = (item.product?.baseWeight || 0) * ratio * item.quantity;

                // Find parent material
                const parentMaterial = safeMaterials.find(mat => (mat.metals || []).some((m: any) => m.id === metal?.id));
                const matName = parentMaterial?.name || "Other";

                if (matName) {
                    acc[matName] = (acc[matName] || 0) + weight;
                }
            });
        });
        return acc;
    }, [filteredOrders, safeMaterials]);

    // Progress Calculation
    const maxSeq = safeStages.length > 0 ? Math.max(...safeStages.map(s => s.sequence || 0), 1) : 1;
    const totalSeqPossible = filteredOrders.reduce((sum, o) => sum + ((o.items || []).length * maxSeq), 0);

    let currentTotalSeq = 0;
    filteredOrders.forEach(order => {
        (order.items || []).forEach((item: any) => {
            const stage = safeStages.find(s => s.name === item.stage) || safeStages.find(s => s.type === "PENDING");
            currentTotalSeq += stage?.sequence || 0;
        });
    });

    const overallProgress = totalSeqPossible > 0 ? Math.round((currentTotalSeq / totalSeqPossible) * 100) : 0;

    // --- 3. Repeated Orders Analysis ---
    const repeatedProducts = useMemo(() => {
        const counts: Record<string, { count: number, product: any }> = {};

        filteredOrders.forEach(order => {
            (order.items || []).forEach((item: any) => {
                // We track order repetition, so maybe we count how many *orders* contain this product?
                // Or total quantity? "reputation" usually implies frequency.
                // Converting productId to count of ORDERS containing it.
                if (!counts[item.productId]) {
                    // Guard product access
                    if (item.product) {
                        counts[item.productId] = { count: 0, product: item.product };
                    }
                }

                if (counts[item.productId]) {
                    counts[item.productId].count += 1; // Increment per occurrence in an order item (essentially per line item)
                }
            });
        });

        // Filter for products bought > 1 time and sort
        return Object.values(counts)
            .filter(c => c.count > 1 && c.product) // Ensure product exists
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [filteredOrders]);

    // --- 4. Stage Breakdown (Animatic Cards) ---
    const stageAllocations = useMemo(() => {
        const acc: Record<string, { count: number, weight: number, items: any[], metalBreakdown: Record<string, number> }> = {};
        const allMetals = safeMaterials.flatMap(m => m.metals || []);

        filteredOrders.forEach(order => {
            (order.items || []).forEach((item: any) => {
                const stageName = item.stage || "Pending";
                if (!acc[stageName]) acc[stageName] = { count: 0, weight: 0, items: [], metalBreakdown: {} };

                const metal = allMetals.find((m: any) => m.name === item.metalType);
                const ratio = metal?.conversionRatio || 1;
                const weight = (item.product?.baseWeight || 0) * ratio * item.quantity;

                acc[stageName].count += item.quantity;
                acc[stageName].weight += weight;
                acc[stageName].items.push({ ...item, orderNumber: order.orderNumber }); // Attach order number for detail view

                // Metal Type Breakdown per stage
                if (!acc[stageName].metalBreakdown[item.metalType]) acc[stageName].metalBreakdown[item.metalType] = 0;
                acc[stageName].metalBreakdown[item.metalType] += weight;

            });
        });
        return acc;
    }, [filteredOrders, safeMaterials]);


    return (
        <div className="space-y-8">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="last_quarter">Last Quarter</SelectItem>
                        <SelectItem value="six_months">Last 6 Months</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 1. Analysis Summary Table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Order Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-muted/20 p-4 rounded-lg">
                            <span className="text-sm text-muted-foreground">Total Orders</span>
                            <div className="text-2xl font-bold">{totalOrders}</div>
                        </div>
                        <div className="bg-muted/20 p-4 rounded-lg">
                            <span className="text-sm text-muted-foreground">Total Items</span>
                            <div className="text-2xl font-bold text-primary">{totalItems}</div>
                        </div>
                        <div className="bg-muted/20 p-4 rounded-lg">
                            <span className="text-sm text-muted-foreground">Total Weight</span>
                            <div className="text-2xl font-bold text-emerald-600">
                                {Object.values(metalGroupTotals).reduce((a, b) => a + b, 0).toFixed(1)}g
                            </div>
                        </div>
                        <div className="bg-muted/20 p-4 rounded-lg">
                            <span className="text-sm text-muted-foreground">Active Stages</span>
                            <div className="text-2xl font-bold">{Object.keys(stageAllocations).length}</div>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 font-medium text-muted-foreground">
                                <tr>
                                    <th className="p-3">Order #</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Delivery</th>
                                    <th className="p-3 w-32">Progress</th>
                                    <th className="p-3 text-right">Items</th>
                                    {/* Metal Group Columns Dynamic? Or just total? "Subtotal of Metal Group" requested. Just summing standard groups for now or maybe "Gold" and "Silver" specifically if we knew them. Let's list a consolidated string or separate column per major group if space implies. */}
                                    <th className="p-3 text-right">Weight Est.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredOrders.slice(0, 10).map((order) => { // Limit to 10 rows for dashboard, full list on Orders page
                                    // Quick calc for this row
                                    let rItems = order.items.length;
                                    let rWeight = 0;
                                    // progress row
                                    let rMax = rItems * maxSeq;
                                    let rCur = 0;
                                    const allMetals = materials.flatMap(m => m.metals);

                                    order.items.forEach((item: any) => {
                                        const s = stages.find(s => s.name === item.stage) || stages.find(s => s.type === "PENDING");
                                        rCur += s?.sequence || 0;

                                        const m = allMetals.find((m: any) => m.name === item.metalType);
                                        const r = m?.conversionRatio || 1;
                                        rWeight += (item.product.baseWeight || 0) * r * item.quantity;
                                    });
                                    const p = rMax > 0 ? Math.round((rCur / rMax) * 100) : 0;

                                    return (
                                        <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-medium">{order.orderNumber}</td>
                                            <td className="p-3 text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy")}</td>
                                            <td className="p-3 text-muted-foreground">{order.requestedDeliveryDate ? format(new Date(order.requestedDeliveryDate), "MMM d") : "-"}</td>
                                            <td className="p-3">
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${p}%` }} />
                                                </div>
                                                <div className="text-[10px] text-right text-muted-foreground mt-0.5">{p}%</div>
                                            </td>
                                            <td className="p-3 text-right">{rItems}</td>
                                            <td className="p-3 text-right font-medium">{rWeight.toFixed(1)}g</td>
                                        </tr>
                                    )
                                })}
                                {filteredOrders.length > 10 && (
                                    <tr>
                                        <td colSpan={6} className="p-2 text-center text-xs text-muted-foreground bg-muted/10">
                                            + {filteredOrders.length - 10} more orders (View all in My Orders)
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Overall Progress & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Overall Production Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Average Completion</span>
                                    <span>{overallProgress}%</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000"
                                        style={{ width: `${overallProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center pt-2">
                                    Across {filteredOrders.length} active orders and {totalItems} individual items.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Stage Animatic Cards (Interactive) */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Stage Distribution
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {safeStages.map((stage) => {
                                const data = stageAllocations[stage.name];
                                if (!data && !stage.isVisible) return null; // Skip empty hidden stages, show empty visible ones? Or just show active?
                                // Let's show all configured stages to show full pipeline visual even if empty
                                const count = data?.count || 0;
                                const weight = data?.weight || 0;

                                return (
                                    <div
                                        key={stage.id}
                                        onClick={() => count > 0 && setSelectedStage(stage.name)}
                                        className={cn(
                                            "relative p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden group",
                                            count === 0 && "opacity-60 grayscale hover:opacity-100 hover:grayscale-0 cursor-default"
                                        )}
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            {/* Could add stage specific icons if map available */}
                                            <Package className="h-12 w-12" />
                                        </div>

                                        <h4 className="text-sm font-medium truncate mb-1">{stage.name}</h4>
                                        <div className="text-2xl font-bold mb-1">{count} <span className="text-xs font-normal text-muted-foreground">pcs</span></div>
                                        <div className="text-xs font-medium text-emerald-600">
                                            {weight > 0 ? `${weight.toFixed(1)}g` : "-"}
                                        </div>

                                        {/* Hover Effect Bar */}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/10">
                                            <div className="h-full bg-primary" style={{ width: `${(count / totalItems) * 100}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Repeated Orders (Top Products) */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                Top Re-ordered Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {repeatedProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No repeated orders in this period.</p>
                            ) : (
                                repeatedProducts.map((item: any, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                        <div className="h-12 w-12 relative rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border">
                                            {item.product.mainImage ? (
                                                <Image src={item.product.mainImage} alt={item.product.title} fill className="object-cover" />
                                            ) : <div className="w-full h-full bg-slate-200" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{item.product.title}</div>
                                            <div className="text-xs text-muted-foreground truncate">{item.product.modelNo}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-primary">{item.count}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">Orders</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Detailed Stage Popup */}
            <Dialog open={!!selectedStage} onOpenChange={(open) => !open && setSelectedStage(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Items in {selectedStage}</DialogTitle>
                    </DialogHeader>

                    <div className="mt-4">
                        {selectedStage && stageAllocations[selectedStage] && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-muted p-3 rounded">
                                        <div className="text-xs text-muted-foreground">Total Items</div>
                                        <div className="text-xl font-bold">{stageAllocations[selectedStage].count}</div>
                                    </div>
                                    <div className="bg-muted p-3 rounded">
                                        <div className="text-xs text-muted-foreground">Total Weight</div>
                                        <div className="text-xl font-bold text-primary">{stageAllocations[selectedStage].weight.toFixed(2)}g</div>
                                    </div>
                                </div>

                                <h4 className="font-semibold text-sm mb-2">Item Breakdown</h4>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-2">Order #</th>
                                            <th className="p-2">Product</th>
                                            <th className="p-2">Metal</th>
                                            <th className="p-2 text-right">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {stageAllocations[selectedStage].items.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="p-2 font-medium">{item.orderNumber}</td>
                                                <td className="p-2">{item.product.modelNo}</td>
                                                <td className="p-2 text-muted-foreground">{item.metalType}</td>
                                                <td className="p-2 text-right">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
