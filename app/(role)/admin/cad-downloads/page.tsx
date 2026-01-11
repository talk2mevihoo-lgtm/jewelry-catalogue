"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Archive } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getOrdersWithCads } from "@/lib/actions/cad-actions";
import { SearchInput } from "@/components/admin/search-input";

export default function CadDownloadsPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q")?.toString();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getOrdersWithCads(query).then(data => {
            setOrders(data);
            setLoading(false);
        });
    }, [query]);

    const handleDownloadZip = async (order: any) => {
        setDownloadingId(order.id);
        try {
            const zip = new JSZip();
            const folder = zip.folder(order.orderNumber);

            // Collect all unique CAD files in this order
            const filesToDownload: { url: string; name: string }[] = [];

            order.items.forEach((item: any) => {
                if (item.product.cadFile) {
                    // Avoid duplicates? Or maybe include item details in filename?
                    // Let's use modelNo_cad.stl
                    const ext = item.product.cadFile.split('.').pop() || 'stl';
                    const filename = `${item.product.modelNo}_CAD.${ext}`;
                    filesToDownload.push({ url: item.product.cadFile, name: filename });
                }
            });

            if (filesToDownload.length === 0) {
                alert("No CAD files found for this order.");
                setDownloadingId(null);
                return;
            }

            // Fetch and add to zip
            const promises = filesToDownload.map(async file => {
                try {
                    const response = await fetch(file.url);
                    const blob = await response.blob();
                    folder?.file(file.name, blob);
                } catch (err) {
                    console.error("Failed to fetch CAD", file.url, err);
                }
            });

            await Promise.all(promises);

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${order.orderNumber}_CADs.zip`);

        } catch (error) {
            console.error("Zip Error", error);
            alert("Failed to create ZIP file.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-serif text-primary">CAD File Manager</h1>
            </div>

            <div className="flex w-full max-w-sm items-center space-x-2">
                <SearchInput placeholder="Search Order No or Model No..." />
            </div>

            <Card>
                <CardHeader><CardTitle>Orders with CAD Files</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>
                    ) : orders.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8">No orders found matching your search.</div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => {
                                const cadCount = order.items.filter((i: any) => i.product.cadFile).length;
                                if (cadCount === 0) return null;

                                return (
                                    <div key={order.id} className="flex items-center justify-between border p-4 rounded-lg bg-slate-50">
                                        <div>
                                            <div className="font-bold text-lg">{order.orderNumber}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {order.distributor.companyName} • {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs mt-1 bg-blue-100 text-blue-800 inline-block px-2 py-0.5 rounded">
                                                {cadCount} CAD Files Available
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleDownloadZip(order)}
                                            disabled={downloadingId === order.id}
                                        >
                                            {downloadingId === order.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Archive className="h-4 w-4 mr-2" />
                                            )}
                                            Download ZIP
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
