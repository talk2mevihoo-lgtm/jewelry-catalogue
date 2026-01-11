"use client";

import { createProduct, updateProduct } from "@/lib/actions/product-actions";
// @ts-ignore
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Eye, FileImage } from "lucide-react";
import Image from "next/image";

const initialState = {
    message: "",
    success: false,
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button variant="premium" type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Product" : "Save Product")}
        </Button>
    );
}

interface ProductFormProps {
    categories: { id: string, name: string }[];
    distributors: { id: string, name: string }[];
    initialData?: any;
}

export function ProductForm({ categories, distributors, initialData }: ProductFormProps) {
    const isEdit = !!initialData;
    const action = isEdit ? updateProduct.bind(null, initialData.id) : createProduct;
    // @ts-ignore
    const [state, dispatch] = useFormState(action, initialState);

    // -- State --
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.mainImage || null);
    const [visibility, setVisibility] = useState<string>(initialData?.visibility || "ALL");

    // Handle Image Preview
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    return (
        <Card className="max-w-5xl mx-auto border-gold-200 shadow-md">
            <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-2xl font-serif text-primary flex items-center gap-2">
                    {isEdit ? "Edit Product" : "Add New Product"}
                </CardTitle>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="space-y-8 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: Images */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-base">Main Image</Label>
                                <div className="aspect-square bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden group">
                                    {previewUrl ? (
                                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="text-center p-4 text-muted-foreground">
                                            <FileImage className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <span className="text-xs">No image selected</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Label htmlFor="mainImage" className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-100 transition-colors">
                                            {previewUrl ? "Change Image" : "Upload Image"}
                                        </Label>
                                    </div>
                                    <Input
                                        id="mainImage"
                                        name="mainImage"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                        required={!isEdit}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center">Recommended: 1000x1000px JPG/PNG</p>
                            </div>

                            <div className="space-y-3">
                                <Label>Additional Images</Label>
                                <Input
                                    id="additionalImages"
                                    name="additionalImages"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="cursor-pointer file:text-primary"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>CAD File</Label>
                                <Input
                                    id="cadFile"
                                    name="cadFile"
                                    type="file"
                                    accept=".3dm,.stl,.mgx,.obj,.zip"
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Details Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="modelNo">Model Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="modelNo"
                                        name="modelNo"
                                        placeholder="e.g. RING-001"
                                        required
                                        defaultValue={initialData?.modelNo}
                                        className="font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="baseWeight">Base Weight (g) <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="baseWeight"
                                        name="baseWeight"
                                        type="number"
                                        step="0.01"
                                        required
                                        defaultValue={initialData?.baseWeight}
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <Label htmlFor="title">Product Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        placeholder="e.g. Princess Cut Diamond Ring"
                                        defaultValue={initialData?.title || ""}
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <Label htmlFor="categoryId">Category <span className="text-red-500">*</span></Label>
                                    <Select name="categoryId" required defaultValue={initialData?.categoryId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="tags">Tags <span className="text-muted-foreground text-xs">(Comma separated)</span></Label>
                                <Input
                                    id="tags"
                                    name="tags"
                                    placeholder="e.g. Wedding, Solitaire, Best Seller"
                                    defaultValue={initialData?.tags || ""}
                                />
                            </div>

                            {/* Visibility Control */}
                            <div className="space-y-4 pt-4 border-t bg-slate-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye className="w-5 h-5 text-primary" />
                                    <h4 className="font-medium text-lg">Visibility Settings</h4>
                                </div>

                                <div className="space-y-2">
                                    <Label>Who can see this product?</Label>
                                    <Select name="visibility" value={visibility} onValueChange={setVisibility}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Distributors</SelectItem>
                                            <SelectItem value="SELECTED">Selected Distributors Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="visibility" value={visibility} />
                                </div>

                                {visibility === "SELECTED" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label>Select Allowed Distributors</Label>
                                        <div className="border rounded-md bg-white max-h-48 overflow-y-auto p-2 space-y-1">
                                            {distributors.length === 0 && <p className="text-sm text-muted-foreground p-2">No distributors found.</p>}
                                            {distributors.map(d => (
                                                <div key={d.id} className="flex items-center space-x-2 hover:bg-slate-50 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        name="allowedDistributors"
                                                        value={d.id}
                                                        id={`dist-${d.id}`}
                                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                                        // Check if initially selected if editing
                                                        defaultChecked={initialData?.allowedDistributors?.some((ad: any) => ad.id === d.id)}
                                                    />
                                                    <Label htmlFor={`dist-${d.id}`} className="flex-1 cursor-pointer font-normal text-sm">
                                                        {d.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Status Feedback */}
                    {state?.message && (
                        <div className={`p-4 rounded-md text-sm border ${state.success ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                            <strong>Status:</strong> {state.message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between bg-slate-50 p-6 rounded-b-lg border-t sticky bottom-0 z-10">
                    <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                    <SubmitButton isEdit={isEdit} />
                </CardFooter>
            </form>
        </Card>
    );
}
