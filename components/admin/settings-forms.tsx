"use client";

import { createCategory, createMaterial, createMetal, createSize, deleteCategory, deleteMaterial, deleteMetal, deleteSize, toggleMetalVisibility, toggleMaterialVisibility as toggleMaterialVisibilityAction, updateMaterial, updateMetal } from "@/lib/actions/configuration-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

export function AddCategoryForm() {
    const ref = useRef<HTMLFormElement>(null);
    return (
        <form action={async (formData) => { await createCategory(formData); ref.current?.reset(); }} ref={ref} className="flex gap-2 items-end">
            <div className="grid gap-1 flex-1">
                <Label htmlFor="cat-name" className="sr-only">Category Name</Label>
                <Input id="cat-name" name="name" placeholder="New Category (e.g. Ring)" required />
            </div>
            <Button type="submit" size="sm">Add</Button>
        </form>
    );
}

export function AddMaterialForm() {
    const ref = useRef<HTMLFormElement>(null);
    return (
        <form action={async (formData) => { await createMaterial(formData); ref.current?.reset(); }} ref={ref} className="flex gap-2 items-end">
            <div className="grid gap-1 flex-1">
                <Label htmlFor="mat-name" className="sr-only">Material Name</Label>
                <Input id="mat-name" name="name" placeholder="New Material (e.g. Gold)" required />
            </div>
            <div className="grid gap-1 w-32">
                <Label htmlFor="min-weight" className="sr-only">Min Weight</Label>
                <Input id="min-weight" name="minOrderWeight" type="number" step="0.01" placeholder="Min. Order Wt." className="h-9" />
            </div>
            <Button type="submit" size="sm">Add</Button>
        </form>
    );
}

export function AddMetalForm({ materials }: { materials: { id: string, name: string }[] }) {
    const ref = useRef<HTMLFormElement>(null);
    return (
        <form action={async (formData) => { await createMetal(formData); ref.current?.reset(); }} ref={ref} className="grid gap-3 p-4 border rounded-md bg-muted/20">
            <div className="font-medium text-sm">Add New Metal Variation</div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label htmlFor="metal-name">Metal Name</Label>
                    <Input id="metal-name" name="name" placeholder="e.g. 18K Gold" required />
                </div>
                <div className="space-y-1">
                    <Label>Base Material</Label>
                    <Select name="materialId" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {materials.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label htmlFor="conv-ratio">Conversion Ratio</Label>
                    <Input id="conv-ratio" name="conversionRatio" type="number" step="0.001" defaultValue="1.0" required />
                    <p className="text-[10px] text-muted-foreground">Weight Multiplier vs Base</p>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="purity">Purity (%)</Label>
                    <Input id="purity" name="purity" type="number" step="0.01" defaultValue="0" />
                    <p className="text-[10px] text-muted-foreground">e.g. 75.0 for 18K (Optional)</p>
                </div>
            </div>
            <Button type="submit" size="sm" className="w-full">Add Metal Type</Button>
        </form>
    );
}

export function AddSizeForm({ categories }: { categories: { id: string, name: string }[] }) {
    const ref = useRef<HTMLFormElement>(null);
    return (
        <form action={async (formData) => { await createSize(formData); ref.current?.reset(); }} ref={ref} className="flex gap-2 items-end">
            <div className="grid gap-1 flex-1">
                <Label htmlFor="size-name" className="sr-only">Size Name</Label>
                <Input id="size-name" name="name" placeholder="New Size (e.g. 12 or M)" required />
            </div>
            <div className="grid gap-1 w-32">
                <Label htmlFor="size-cat" className="sr-only">Category</Label>
                <Select name="category" required>
                    <SelectTrigger>
                        <SelectValue placeholder="For..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" size="sm">Add</Button>
        </form>
    );
}

export function DeleteItem({ id, type }: { id: string, type: 'category' | 'material' | 'metal' | 'size' }) {
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        let res: any;
        if (type === 'category') res = await deleteCategory(id);
        else if (type === 'material') res = await deleteMaterial(id);
        else if (type === 'metal') res = await deleteMetal(id);
        else if (type === 'size') res = await deleteSize(id);

        if (res && !res.success) {
            alert(res.message || "Failed to delete item.");
        }
    };

    return (
        <form action={handleDelete}>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50">
                <span className="sr-only">Delete</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            </Button>
        </form>
    );
}

export function ToggleMetalVisibility({ id, isVisible }: { id: string, isVisible: boolean }) {
    return (
        <form action={async () => await toggleMetalVisibility(id, isVisible)}>
            <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${isVisible ? "text-green-600 hover:text-green-700" : "text-slate-300 hover:text-slate-500"}`}
                title={isVisible ? "Visible (Click to Hide)" : "Hidden (Click to Show)"}
            >
                {isVisible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                )}
                <span className="sr-only">Toggle Visibility</span>
            </Button>
        </form>
    );
}

export function ToggleMaterialVisibility({ id, isVisible }: { id: string, isVisible: boolean }) {
    return (
        <form action={async () => await toggleMaterialVisibilityAction(id, isVisible)}>
            <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${isVisible ? "text-green-600 hover:text-green-700" : "text-slate-300 hover:text-slate-500"}`}
                title={isVisible ? "Visible (Click to Hide)" : "Hidden (Click to Show)"}
            >
                {isVisible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                )}
                <span className="sr-only">Toggle Visibility</span>
            </Button>
        </form>
    );
}

export function EditMaterialDialog({ material }: { material: { id: string, name: string, minOrderWeight: number } }) {
    const ref = useRef<HTMLFormElement>(null);
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-700">
                    <span className="sr-only">Edit</span>
                    <Pencil className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Material Group</DialogTitle>
                    <DialogDescription>Update material details.</DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    const res = await updateMaterial(material.id, formData);
                    if (res?.success) {
                        setOpen(false);
                    } else {
                        alert(res?.message);
                    }
                }} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" name="name" defaultValue={material.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minWeight" className="text-right">Min Wt.</Label>
                        <Input id="minWeight" name="minOrderWeight" type="number" step="0.01" defaultValue={material.minOrderWeight} className="col-span-3" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function EditMetalDialog({ metal }: { metal: { id: string, name: string, conversionRatio: number, purity: number } }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-700">
                    <span className="sr-only">Edit</span>
                    <Pencil className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Metal Type</DialogTitle>
                    <DialogDescription>Update metal details.</DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    const res = await updateMetal(metal.id, formData);
                    if (res?.success) {
                        setOpen(false);
                    } else {
                        alert(res?.message);
                    }
                }} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="metal-name-edit" className="text-right">Name</Label>
                        <Input id="metal-name-edit" name="name" defaultValue={metal.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="metal-ratio-edit" className="text-right">Ratio</Label>
                        <Input id="metal-ratio-edit" name="conversionRatio" type="number" step="0.001" defaultValue={metal.conversionRatio} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="metal-purity-edit" className="text-right">Purity %</Label>
                        <Input id="metal-purity-edit" name="purity" type="number" step="0.01" defaultValue={metal.purity} className="col-span-3" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
