"use client";

import { useState, useEffect } from "react";
import { getDashboardStats, DateRangeType } from "@/lib/actions/dashboard-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Calendar, Package, CheckCircle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
    const [range, setRange] = useState<DateRangeType>("ALL");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [range]);

    const fetchData = async () => {
        setLoading(true);
        const start = customStart ? new Date(customStart) : undefined;
        const end = customEnd ? new Date(customEnd) : undefined;
        const res = await getDashboardStats(range, start, end);
        setData(res);
        setLoading(false);
    };

    if (loading && !data) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-serif text-primary">Dashboard</h1>

                <div className="flex flex-col items-end gap-2">
                    <Tabs value={range} onValueChange={(v: any) => setRange(v)}>
                        <TabsList>
                            <TabsTrigger value="TODAY">Today</TabsTrigger>
                            <TabsTrigger value="THIS_WEEK">Week</TabsTrigger>
                            <TabsTrigger value="THIS_MONTH">Month</TabsTrigger>
                            <TabsTrigger value="LAST_3_MONTHS">3 Months</TabsTrigger>
                            <TabsTrigger value="THIS_YEAR">Year</TabsTrigger>
                            <TabsTrigger value="ALL">All Time</TabsTrigger>
                            <TabsTrigger value="CUSTOM">Date Range</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {/* Custom Range Inputs */}
                    {range === "CUSTOM" && (
                        <div className="flex gap-2 items-center bg-white p-1 rounded border">
                            <Input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="h-8 w-[130px] text-xs"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="date"
                                value={customEnd}
                                onChange={e => {
                                    setCustomEnd(e.target.value);
                                    if (customStart && e.target.value) {
                                        // Trigger fetch if both set (useEffect depends on range, but for custom we might need manual trigger or effect on dates)
                                        // The existing useEffect only listens to 'range'. 
                                        // I'll add a manual trigger button or add dates to dep array.
                                    }
                                }}
                                className="h-8 w-[130px] text-xs"
                            />
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={fetchData}>Go</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* 1. Alerts Section (Red) */}
            {data.urgentAlerts.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 fill-red-600 text-white" />
                            Urgent Deliveries (Next 48 Hours)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 overflow-x-auto py-2">
                            {data.urgentAlerts.map((alert: any, i: number) => (
                                <div key={i} className="min-w-[250px] bg-white p-3 rounded shadow-sm border border-red-100 flex gap-3 items-center">
                                    <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {alert.image && <img src={alert.image} className="h-full w-full object-cover" alt="" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-sm truncate">{alert.productName}</div>
                                        <div className="text-xs text-muted-foreground">{alert.modelNo}</div>
                                        <div className="text-xs font-medium text-red-600">Due: {new Date(alert.deliveryDate).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{alert.distributorName}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 2. Stage Progress & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Stage Progress</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Progress Bar Visualization */}
                            <div className="flex w-full h-4 rounded-full overflow-hidden bg-slate-100">
                                {data.allStages.map((stage: any, i: number) => {
                                    const stats = data.stageStats[stage.name];
                                    if (!stats || stats.count === 0) return null;
                                    // Calculate precise colors or use a palette
                                    const colors = ["bg-blue-400", "bg-indigo-400", "bg-purple-400", "bg-pink-400", "bg-orange-400", "bg-green-400"];
                                    const color = colors[i % colors.length];
                                    const totalCount = Object.values(data.stageStats).reduce((a: any, b: any) => a + (b.count || 0), 0) as number;
                                    if (!totalCount) return null;

                                    const width = (stats.count / totalCount) * 100;

                                    return (
                                        <div key={stage.id} className={`${color} h-full`} style={{ width: `${width}%` }} title={`${stage.name}: ${stats.count}`} />
                                    );
                                })}
                            </div>

                            {/* Stage Analytics Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {data.allStages.map((stage: any) => {
                                    const stats = data.stageStats[stage.name];
                                    return (
                                        <div key={stage.id} className="p-3 bg-muted/20 rounded border text-center">
                                            <div className="text-xs font-bold uppercase text-muted-foreground mb-1">{stage.name}</div>
                                            <div className="text-2xl font-bold text-primary">{stats?.count || 0}</div>
                                            <div className="text-xs text-muted-foreground">{(stats?.weight || 0).toFixed(1)}g</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Top Products</CardTitle></CardHeader>
                    <CardContent className="space-y-4 max-h-[400px] overflow-auto">
                        {data.topProducts.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 border-b last:border-0 pb-3">
                                <div className="h-10 w-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {item.product.mainImage && <img src={item.product.mainImage} className="h-full w-full object-cover" alt="" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{item.product.title}</div>
                                    <div className="text-xs text-muted-foreground">{item.product.modelNo}</div>
                                </div>
                                <div className="font-bold text-lg">{item.count}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* 3. Weight Summaries (Active / Delivered) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-blue-700 flex items-center gap-2">
                            <Package className="h-5 w-5" /> Active Orders Summary
                        </CardTitle>
                        <CardDescription>Grand Total Weight by Material & Metal Type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Grand Totals (Material) */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            {Object.entries(data.activeOrdersSummary.grandTotal).map(([mat, wt]: any) => (
                                <div key={mat} className="bg-blue-50 px-4 py-2 rounded border border-blue-100 min-w-[120px]">
                                    <div className="text-xs font-bold uppercase text-blue-800">{mat} Total</div>
                                    <div className="text-lg font-bold text-blue-900">{wt.toFixed(2)}g</div>
                                </div>
                            ))}
                        </div>

                        {/* Breakdown by Metal Type */}
                        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
                            {Object.entries(data.activeOrdersSummary.byMetalType || {}).map(([type, wt]: any) => (
                                <span key={type} className="px-2 py-1 bg-white border border-blue-200 text-blue-700 text-xs rounded-full font-medium">
                                    {type}: {wt.toFixed(2)}g
                                </span>
                            ))}
                        </div>

                        {/* List */}
                        <div className="max-h-[300px] overflow-auto border rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left">Order #</th>
                                        <th className="p-2 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.activeOrdersSummary.orders.map((o: any, i: number) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="p-2 font-medium">{o.orderNumber}</td>
                                            <td className="p-2 text-right">
                                                {Object.entries(o.weights).map(([mat, wt]: any) => (
                                                    <div key={mat} className="text-xs">
                                                        <span className="text-muted-foreground">{mat}:</span> {wt.toFixed(1)}g
                                                    </div>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivered Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-700 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" /> Delivered Orders Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Grand Totals */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            {Object.entries(data.deliveredOrdersSummary.grandTotal).map(([mat, wt]: any) => (
                                <div key={mat} className="bg-green-50 px-4 py-2 rounded border border-green-100">
                                    <div className="text-xs font-bold uppercase text-green-800">{mat} Total</div>
                                    <div className="text-lg font-bold text-green-900">{wt.toFixed(2)}g</div>
                                </div>
                            ))}
                        </div>
                        {/* List */}
                        <div className="max-h-[300px] overflow-auto border rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left">Order #</th>
                                        <th className="p-2 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.deliveredOrdersSummary.orders.map((o: any, i: number) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="p-2 font-medium">{o.orderNumber}</td>
                                            <td className="p-2 text-right">
                                                {Object.entries(o.weights).map(([mat, wt]: any) => (
                                                    <div key={mat} className="text-xs">
                                                        <span className="text-muted-foreground">{mat}:</span> {wt.toFixed(1)}g
                                                    </div>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 4. Distributor Wise Summary */}
            <Card>
                <CardHeader><CardTitle>Distributor Performance</CardTitle></CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted [&_tr]:border-b">
                                <tr className="text-left">
                                    <th className="p-3 font-medium">Distributor Name</th>
                                    <th className="p-3 text-center font-medium">Total Orders</th>
                                    <th className="p-3 font-medium">Category Breakdown</th>
                                    <th className="p-3 font-medium">Metal Type Breakdown</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(data.distributorSummary).map(([name, stats]: any, i) => (
                                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-3 font-medium">{name}</td>
                                        <td className="p-3 text-center font-bold text-lg">{stats.count}</td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(stats.categories).map(([cat, count]: any) => (
                                                    <span key={cat} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs border">
                                                        {cat}: {count}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(stats.metalTypes).map(([met, count]: any) => (
                                                    <span key={met} className="px-1.5 py-0.5 bg-yellow-50 text-yellow-800 rounded text-xs border border-yellow-100">
                                                        {met}: {count}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
