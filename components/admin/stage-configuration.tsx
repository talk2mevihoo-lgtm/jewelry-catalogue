"use client";

import { useTransition, useState, useRef } from "react";
import { createStage, updateStage, deleteStage } from "@/lib/actions/stage-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, GripVertical, Plus } from "lucide-react";

type Stage = {
    id: string;
    name: string;
    type: string;
    sequence: number;
    requiresReason: boolean;
    reasons?: string | null;
};

export function StageConfiguration({ stages }: { stages: Stage[] }) {
    return (
        <Card className="h-fit col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Order Stages (Kanban)</CardTitle>
                        <CardDescription>Configure dynamic pipeline stages.</CardDescription>
                    </div>
                    <AddStageDialog />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {stages.map((stage) => (
                        <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                                <span className="bg-muted text-muted-foreground p-1 rounded cursor-move">
                                    <GripVertical className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {stage.name}
                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                            {stage.type.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Sequence: {stage.sequence}
                                        {stage.requiresReason && " • Requires Reason"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <EditStageDialog stage={stage} />
                                <DeleteStageButton id={stage.id} />
                            </div>
                        </div>
                    ))}
                    {stages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed rounded-lg">
                            No stages defined. Add one to start.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AddStageDialog() {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" /> Add Stage
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Stage</DialogTitle>
                </DialogHeader>
                <StageForm onSubmit={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function EditStageDialog({ stage }: { stage: Stage }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Stage</DialogTitle>
                </DialogHeader>
                <StageForm stage={stage} onSubmit={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function DeleteStageButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            disabled={isPending}
            onClick={() => {
                if (confirm("Delete this stage?")) {
                    startTransition(async () => {
                        await deleteStage(id);
                    });
                }
            }}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}

function StageForm({ stage, onSubmit }: { stage?: Stage, onSubmit: () => void }) {
    const [type, setType] = useState(stage?.type || "STANDARD");
    const [requiresReason, setRequiresReason] = useState(stage?.requiresReason || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        // Force checkbox value
        if (requiresReason) formData.set("requiresReason", "on");

        const res = stage ? await updateStage(stage.id, formData) : await createStage(formData);
        setLoading(false);

        if (res.success) {
            onSubmit();
        } else {
            alert(res.message);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4 py-2">
            <div className="grid gap-2">
                <Label>Stage Name</Label>
                <Input name="name" defaultValue={stage?.name} required placeholder="e.g. Design Approved" />
            </div>

            <div className="grid gap-2">
                <Label>Stage Type</Label>
                <Select name="type" value={type} onValueChange={setType} required>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STANDARD">Standard (Process Step)</SelectItem>
                        <SelectItem value="PENDING">Pending (Waiting for Action)</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold (Issue/Pause)</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled (Terminal)</SelectItem>
                        <SelectItem value="COMPLETED">Completed (Terminal)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {(type === "PENDING" || type === "ON_HOLD") && (
                <div className="space-y-4 border p-3 rounded-md bg-muted/20">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="req-reason"
                            name="requiresReason"
                            checked={requiresReason}
                            onCheckedChange={(c) => setRequiresReason(c === true)}
                        />
                        <Label htmlFor="req-reason">Require Reason Selection</Label>
                    </div>

                    {requiresReason && (
                        <div className="grid gap-2">
                            <Label>Pre-defined Reasons (Comma Separated)</Label>
                            <Textarea
                                name="reasons"
                                defaultValue={stage?.reasons || ""}
                                placeholder="e.g. Customer Request, Payment Pending, Design Issue"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">Users will select from these options when moving to this stage.</p>
                        </div>
                    )}
                </div>
            )}

            <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Stage"}
                </Button>
            </DialogFooter>
        </form>
    );
}
