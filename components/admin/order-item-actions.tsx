"use client";

import { useState } from "react";
import { updateOrderItemStage, updateOrderItemDetails } from "@/lib/actions/admin-order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type OrderItemProps = {
    item: any; // OrderItem with Product
    stages?: any[];
    materials?: any[];
    sizes?: any[];
};

// Component for the Stage Column
export function OrderItemStageManager({ item, stages = [] }: OrderItemProps) {
    // Optimistic State
    const [optimisticStage, setOptimisticStage] = useState(item.stage);

    // Sync when server data arrives
    const [prevPropStage, setPrevPropStage] = useState(item.stage);
    if (item.stage !== prevPropStage) {
        setPrevPropStage(item.stage);
        setOptimisticStage(item.stage);
    }

    const currentStageDef = stages.find(s => s.name === optimisticStage);
    const totalStages = stages.length;
    const currentSequence = currentStageDef?.sequence || 0;
    const progress = totalStages > 0 ? (currentSequence / totalStages) * 100 : 0;

    return (
        <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="flex items-center justify-between gap-2">
                <UpdateStageDialog
                    item={item}
                    stages={stages}
                    currentStage={optimisticStage}
                    currentReason={item.stageReason}
                    onUpdate={(newStage, newReason) => {
                        setOptimisticStage(newStage);
                    }}
                />
                <span className="text-xs font-mono text-muted-foreground">
                    {currentSequence}/{totalStages}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-500",
                        optimisticStage === "COMPLETED" ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Reason Display */}
            {(item.stageReason) && (
                <div className="text-xs text-muted-foreground bg-muted p-1 rounded px-2 border">
                    <span className="font-semibold text-foreground/80">Reason:</span> {item.stageReason}
                </div>
            )}
        </div>
    );
}

// Component for the Edit Column
export function OrderItemEditor({ item, materials = [], sizes = [] }: OrderItemProps) {
    // Case insensitive check
    const isPending = item.stage?.toUpperCase() === "PENDING";

    if (!isPending) return <span className="text-muted-foreground text-xs text-center block">-</span>;

    return <EditItemDialog item={item} materials={materials} sizes={sizes} />;
}

function UpdateStageDialog({ item, stages, currentStage, currentReason, onUpdate }: { item: any; stages: any[]; currentStage: string; currentReason?: string; onUpdate: (s: string, r: string) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [selectedStageType, setSelectedStageType] = useState(currentStage);
    const [selectedReason, setSelectedReason] = useState(currentReason || "");

    // Sync open state
    if (open && selectedStageType !== currentStage) {
        // Only if user hasn't changed it? 
        // Actually, initial state when opening dialog.
    }

    // Effect to reset form when opening
    // We can use the open change handler

    const currentStageDef = stages.find(s => s.type === selectedStageType);
    const reasonOptions = currentStageDef?.reasons ? currentStageDef.reasons.split(",").map((r: string) => r.trim()) : [];
    const requiresReason = currentStageDef?.requiresReason || false;

    const router = useRouter();

    const handleUpdate = async () => {
        if (requiresReason && !selectedReason) {
            alert("Please select a reason for this stage.");
            return;
        }

        setLoading(true);
        // Optimistic update call
        onUpdate(selectedStageType, selectedReason);
        setOpen(false); // Close immediately

        const res = await updateOrderItemStage(item.id, selectedStageType, selectedReason);
        setLoading(false);

        if (res.success) {
            router.refresh();
        } else {
            alert(res.message || "Failed to update stage.");
            // Revert? (Optional, would need revert callback)
            router.refresh(); // Sync back to real state
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) {
                setSelectedStageType(currentStage);
                setSelectedReason(currentReason || "");
            }
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 text-xs font-medium border flex-1 justify-between",
                        currentStage === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" :
                            currentStage === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                                "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    )}
                >
                    <span className="truncate">{stages.find(s => s.name === currentStage)?.name || currentStage}</span>
                    <ArrowRight className="h-3 w-3 opacity-50 ml-2 shrink-0" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Item Stage</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>New Stage</Label>
                        <Select
                            value={selectedStageType}
                            onValueChange={(v) => {
                                setSelectedStageType(v);
                                setSelectedReason("");
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {stages.map((s) => (
                                    <SelectItem key={s.id} value={s.name}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {reasonOptions.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Reason {requiresReason && <span className="text-red-500">*</span>}</Label>
                            <Select
                                value={selectedReason}
                                onValueChange={setSelectedReason}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {reasonOptions.map((r: string) => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? "Updating..." : "Update Stage"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditItemDialog({ item, materials, sizes }: { item: any; materials: any[]; sizes: any[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        metalType: item.metalType,
        metalColor: item.metalColor,
        size: item.size,
        quantity: item.quantity,
        instructions: item.instructions || ""
    });

    const allMetals = materials.reduce((acc: any[], m: any) => {
        return [...acc, ...m.metals.map((met: any) => ({ ...met, materialName: m.name }))];
    }, []);

    const handleSave = async () => {
        setLoading(true);
        await updateOrderItemDetails(item.id, formData);
        setLoading(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Item Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Same form content as before */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Metal</Label>
                            <Select
                                value={formData.metalType}
                                onValueChange={(v) => setFormData({ ...formData, metalType: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allMetals.map((m: any) => (
                                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* More fields abbreviated for brevity, assuming standard form */}
                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <Select value={formData.metalColor} onValueChange={(v) => setFormData({ ...formData, metalColor: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yellow">Yellow</SelectItem>
                                    <SelectItem value="White">White</SelectItem>
                                    <SelectItem value="Rose">Rose</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Size</Label>
                            <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {sizes.map((s: any) => (<SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <Input type="number" min={1} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Instructions</Label>
                        <Textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
