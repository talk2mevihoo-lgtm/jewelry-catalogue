"use client";

import { useState, useEffect } from "react";
import { getReportData, ReportFilter } from "@/lib/actions/report-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ReportData = Awaited<ReturnType<typeof getReportData>>;

export default function ReportsPage() {
    const [filterType, setFilterType] = useState<ReportFilter["type"]>("ORDER");
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const [filters, setFilters] = useState({
        distributorId: "",
        orderNumber: "",
        startDate: "",
        endDate: "",
        metalGroup: "",
        metalType: "",
        metalColor: "",
        category: ""
    });

    const [initialData, setInitialData] = useState<{ distributors: any[], orders: any[], materials: any[], metals: any[] }>({
        distributors: [], orders: [], materials: [], metals: []
    });

    useEffect(() => {
        import("@/lib/actions/report-options").then(mod => {
            mod.getReportOptions().then(data => setInitialData(data));
        });
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const fetchReport = async () => {
        setLoading(true);
        const data = await getReportData({
            type: filterType,
            distributorId: filters.distributorId === "all" ? undefined : filters.distributorId,
            orderNumber: filters.orderNumber === "all" ? undefined : filters.orderNumber,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            metalType: filters.metalType === "all" ? undefined : filters.metalType,
            metalColor: filters.metalColor === "all" ? undefined : filters.metalColor,
            // Category id or name? Filter expects Id? Or we used product.category.name logic before?
            // Checking report-actions: if (filter.categoryId) itemWhere.product = { categoryId: filter.categoryId };
            // So we need ID.
            categoryId: filters.category === "all" ? undefined : filters.category
        });
        setReportData(data);
        setLoading(false);
    };

    // Derived State for Cascading Filters
    const distributors = initialData.distributors || [];
    const materials = initialData.materials || [];
    const metals = initialData.metals || [];
    const allOrders = initialData.orders || [];

    // Filter orders for Distributor tab
    const [distributorOrders, setDistributorOrders] = useState<any[]>([]);

    // Filter metals for Advanced tab
    const [filteredMetals, setFilteredMetals] = useState<any[]>([]);

    useEffect(() => {
        if (filters.distributorId && filters.distributorId !== "all") {
            setDistributorOrders(allOrders.filter((o: any) => o.distributorId === filters.distributorId));
        } else {
            setDistributorOrders([]);
        }
    }, [filters.distributorId, allOrders]);

    useEffect(() => {
        if (filters.metalGroup && filters.metalGroup !== "all") {
            const mat = materials.find((m: any) => m.name === filters.metalGroup);
            if (mat) {
                setFilteredMetals(metals.filter((m: any) => m.materialId === mat.id));
            } else {
                setFilteredMetals(metals);
            }
        } else {
            setFilteredMetals(metals);
        }
    }, [filters.metalGroup, materials, metals]);


    // Export Functions
    const exportPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Order Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

        let yPos = 35;

        reportData.orders.forEach((order: any) => {
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPos, 182, 10, 'F');
            doc.setFont("helvetica", "bold");
            doc.text(`${order.orderNumber} - ${order.distributor.companyName} (${new Date(order.createdAt).toLocaleDateString()})`, 16, yPos + 7);

            yPos += 12;

            const tableBody = order.items.map((item: any) => [
                item.product.modelNo,
                `${item.metalType} ${item.metalColor}`,
                item.size,
                item.quantity,
                `${item.weight.toFixed(2)}g`,
                item.materialName !== "Silver" ? `${item.pureWeight.toFixed(2)}g` : "-"
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Model', 'Metal', 'Size', 'Qty', 'Gr. Wt', 'Pure Wt']],
                body: tableBody,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 66, 66] }
            });

            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 10;
        });

        // Grand Summary
        if (reportData.grandTotal) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text("Grand Summary", 14, 20);

            const summaryBody = Object.entries(reportData.grandTotal.byMaterial).map(([mat, stats]: any) => [
                mat,
                `${stats.totalWeight.toFixed(2)}g`,
                mat !== "Silver" ? `${stats.pureWeight.toFixed(2)}g` : "-"
            ]);

            autoTable(doc, {
                startY: 25,
                head: [['Material', 'Total Gross Weight', 'Total Pure Weight']],
                body: summaryBody,
            });
        }

        doc.save("order-report.pdf");
    };

    const exportExcel = () => {
        if (!reportData) return;
        const wb = XLSX.utils.book_new();

        const flatData: any[] = [];
        reportData.orders.forEach((order: any) => {
            order.items.forEach((item: any) => {
                flatData.push({
                    "Order No": order.orderNumber,
                    "Distributor": order.distributor.companyName,
                    "Date": new Date(order.createdAt).toLocaleDateString(),
                    "Model": item.product.modelNo,
                    "Metal": `${item.metalType} ${item.metalColor}`,
                    "Size": item.size,
                    "Qty": item.quantity,
                    "Material": item.materialName,
                    "Gross Weight": item.weight,
                    "Pure Weight": item.materialName !== "Silver" ? item.pureWeight : 0
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(flatData);
        XLSX.utils.book_append_sheet(wb, ws, "Orders");
        XLSX.writeFile(wb, "order_report.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
                    <FileText className="h-6 w-6" /> Reports Center
                </h1>
                {reportData && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
                        <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="h-4 w-4 mr-2" /> PDF</Button>
                        <Button variant="outline" size="sm" onClick={exportExcel}><Download className="h-4 w-4 mr-2" /> Excel</Button>
                    </div>
                )}
            </div>

            <Tabs defaultValue="order" className="w-full" onValueChange={(v: any) => handleFilterChange("type", v)}>
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="ORDER">By Order No</TabsTrigger>
                    <TabsTrigger value="DISTRIBUTOR">By Distributor</TabsTrigger>
                    <TabsTrigger value="DATE">By Date</TabsTrigger>
                    <TabsTrigger value="ADVANCED">Advanced</TabsTrigger>
                </TabsList>

                <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm">
                    {/* By Order No */}
                    <TabsContent value="ORDER" className="mt-0 space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Select Order</label>
                            <Select
                                value={filters.orderNumber}
                                onValueChange={(v) => handleFilterChange("orderNumber", v)}
                            >
                                <SelectTrigger className="w-full md:w-[400px]">
                                    <SelectValue placeholder="Select an order..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Orders</SelectItem>
                                    {allOrders.map((o: any) => (
                                        <SelectItem key={o.id} value={o.orderNumber}>
                                            {o.orderNumber} - {o.distributor?.companyName} - {new Date(o.createdAt).toLocaleDateString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="pt-2">
                            <Button onClick={fetchReport} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Generate Report"}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* By Distributor */}
                    <TabsContent value="DISTRIBUTOR" className="mt-0 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Distributor</label>
                                <Select
                                    value={filters.distributorId}
                                    onValueChange={(v) => {
                                        setFilters(prev => ({ ...prev, distributorId: v, orderNumber: "all" })); // Reset order on dist change
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select distributor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Distributors</SelectItem>
                                        {distributors.map((d: any) => (
                                            <SelectItem key={d.id} value={d.id}>{d.companyName} ({d.distributorCode})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Order (Optional)</label>
                                <Select
                                    value={filters.orderNumber}
                                    onValueChange={(v) => handleFilterChange("orderNumber", v)}
                                    disabled={!filters.distributorId || filters.distributorId === "all"}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!filters.distributorId || filters.distributorId === "all" ? "Select distributor first" : "Select order..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Orders</SelectItem>
                                        {distributorOrders.map((o: any) => (
                                            <SelectItem key={o.id} value={o.orderNumber}>
                                                {o.orderNumber} - {new Date(o.createdAt).toLocaleDateString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button onClick={fetchReport} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Generate Report"}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* By Date */}
                    <TabsContent value="DATE" className="mt-0 space-y-4">
                        <div className="flex gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">End Date</label>
                                <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
                            </div>
                            <Button onClick={fetchReport} className="mb-0.5" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Generate Report"}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Advanced */}
                    <TabsContent value="ADVANCED" className="mt-0 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Metal Group (Material)</label>
                                <Select
                                    value={filters.metalGroup}
                                    onValueChange={(v) => {
                                        setFilters(prev => ({ ...prev, metalGroup: v, metalType: "all" })); // Reset type
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Materials" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Materials</SelectItem>
                                        {materials.map((m: any) => (
                                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Metal Type</label>
                                <Select
                                    value={filters.metalType}
                                    onValueChange={(v) => handleFilterChange("metalType", v)}
                                    disabled={!filters.metalGroup || filters.metalGroup === "all"}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Basic Metals" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {filteredMetals.map((m: any) => (
                                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Metal Color</label>
                                <Select value={filters.metalColor} onValueChange={(v) => handleFilterChange("metalColor", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Colors" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Colors</SelectItem>
                                        <SelectItem value="Yellow">Yellow</SelectItem>
                                        <SelectItem value="White">White</SelectItem>
                                        <SelectItem value="Rose">Rose</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button onClick={fetchReport} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Generate Report"}
                            </Button>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {reportData && (
                <div className="space-y-6 print:block">
                    {/* Summary Cards */}
                    {reportData.grandTotal && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                            {Object.entries(reportData.grandTotal.byMaterial).map(([mat, stats]: any) => (
                                <Card key={mat} className="bg-slate-50 border-slate-200">
                                    <CardContent className="pt-6">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{mat} Summary</div>
                                        <div className="text-2xl font-bold mt-1">{stats.totalWeight.toFixed(2)}g</div>
                                        {mat !== "Silver" && (
                                            <div className="text-sm text-gold-600 font-medium">Pure: {stats.pureWeight.toFixed(2)}g</div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Report Table */}
                    <Card className="print:shadow-none print:border-0">
                        <CardContent className="p-0">
                            {reportData.orders.map(order => (
                                <div key={order.id} className="border-b last:border-0 p-6 break-inside-avoid">
                                    <div className="flex justify-between mb-4 bg-muted/30 p-2 rounded">
                                        <div>
                                            <div className="font-bold">{order.orderNumber}</div>
                                            <div className="text-sm text-muted-foreground">{order.distributor.companyName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</div>
                                            <div className="font-mono text-xs text-muted-foreground">{order.status}</div>
                                        </div>
                                    </div>

                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-muted-foreground text-left">
                                                <th className="pb-2 pl-2">Model</th>
                                                <th className="pb-2">Details</th>
                                                <th className="pb-2 text-right">Qty</th>
                                                <th className="pb-2 text-right">Gross Wt</th>
                                                <th className="pb-2 text-right">Pure Wt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item: any) => (
                                                <tr key={item.id} className="border-b last:border-0">
                                                    <td className="py-2 pl-2 font-medium">{item.product.modelNo}</td>
                                                    <td className="py-2 text-xs text-muted-foreground">
                                                        {item.metalType} {item.metalColor}, Size {item.size}
                                                    </td>
                                                    <td className="py-2 text-right">{item.quantity}</td>
                                                    <td className="py-2 text-right">{item.weight.toFixed(2)}g</td>
                                                    <td className="py-2 text-right">
                                                        {item.materialName !== "Silver" ? `${item.pureWeight.toFixed(2)}g` : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Order Subtotal */}
                                        <tfoot className="bg-slate-50 font-medium">
                                            {Object.entries(order.summary.byMaterial).map(([mat, stats]: any) => (
                                                <tr key={mat}>
                                                    <td colSpan={3} className="py-2 text-right pr-4 text-xs uppercase text-muted-foreground">
                                                        {mat} Subtotal
                                                    </td>
                                                    <td className="py-2 text-right text-xs">
                                                        {stats.totalWeight.toFixed(2)}g
                                                    </td>
                                                    <td className="py-2 text-right text-xs">
                                                        {mat !== "Silver" ? `${stats.pureWeight.toFixed(2)}g` : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
