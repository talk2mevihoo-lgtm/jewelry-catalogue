"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileDown, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { bulkImportProducts } from "@/lib/actions/product-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BulkImportModal() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [report, setReport] = useState<{ successCount: number; failureCount: number; errors: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setReport(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const text = await file.text();
            const result = await bulkImportProducts(text);

            if (result.success && result.report) {
                setReport(result.report);
                if (result.report.failureCount === 0) {
                    // Optional: Auto close on pure success after delay, but showing report is better
                }
            } else {
                setReport({ successCount: 0, failureCount: 1, errors: [result.message || "Unknown error"] });
            }
        } catch (e) {
            setReport({ successCount: 0, failureCount: 1, errors: ["Failed to read file."] });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Bulk Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bulk Product Import</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to add multiple products at once.
                    </DialogDescription>
                </DialogHeader>

                {!report ? (
                    <div className="space-y-6 py-4">
                        <div className="bg-slate-50 p-4 rounded-md border flex justify-between items-center">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium">Step 1: Get Template</h4>
                                <p className="text-xs text-muted-foreground">Download the formatted CSV sample.</p>
                            </div>
                            <a href="/api/admin/products/export-sample" download>
                                <Button variant="secondary" size="sm">
                                    <FileDown className="mr-2 h-4 w-4" /> Download Sample
                                </Button>
                            </a>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Step 2: Upload CSV</h4>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="csvFile">Select File</Label>
                                <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
                            </div>
                        </div>

                        {file && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="font-mono bg-slate-100 px-1 rounded">{file.name}</span> selected.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 border border-green-200 p-4 rounded-md flex flex-col items-center">
                                <span className="text-green-600 font-bold text-2xl">{report.successCount}</span>
                                <span className="text-green-800 text-sm">Valid Rows</span>
                            </div>
                            <div className="bg-red-50 border border-red-200 p-4 rounded-md flex flex-col items-center">
                                <span className="text-red-600 font-bold text-2xl">{report.failureCount}</span>
                                <span className="text-red-800 text-sm">Failed Rows</span>
                            </div>
                        </div>

                        {report.errors.length > 0 && (
                            <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2 bg-slate-50 text-xs">
                                {report.errors.map((err, i) => (
                                    <div key={i} className="text-red-600 flex gap-2">
                                        <XCircle className="w-4 h-4 shrink-0" /> {err}
                                    </div>
                                ))}
                            </div>
                        )}

                        {report.failureCount === 0 && (
                            <div className="flex items-center justify-center text-green-600 gap-2">
                                <CheckCircle className="w-5 h-5" /> Import Successful!
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {!report ? (
                        <>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={!file || uploading}>
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {uploading ? "Importing..." : "Start Import"}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => { setOpen(false); setReport(null); setFile(null); }}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
