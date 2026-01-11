"use client";

import { updateOrderStatus } from "@/lib/actions/admin-order-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";


const STATUSES = [
    "PENDING", "CAD_PREPARATION", "FILLING", "STONE_SETTING",
    "POLISHING", "RHODIUM", "READY_FOR_DELIVERY", "DELIVERED", "ON_HOLD"
];

export function OrderStatusUpdater({ order }: { order: any }) {
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (newStatus: string) => {
        setLoading(true);
        await updateOrderStatus(order.id, newStatus as any);
        setLoading(false);
    };

    return (
        <Select value={order.status} onValueChange={handleUpdate} disabled={loading}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-muted/50 border-gold-200">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
