"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Ban, CheckCircle } from "lucide-react";
import { deleteProduct, toggleProductStatus } from "@/lib/actions/product-actions";
import Link from "next/link";
import { startTransition } from "react";

interface ProductActionsProps {
    id: string;
    isActive: boolean;
}

export function ProductActionsMenu({ id, isActive }: ProductActionsProps) {

    const displayId = id; // Avoid closure issues if needed, strictly id string

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
        const res = await deleteProduct(displayId);
        if (!res.success) alert(res.message);
    };

    const handleToggle = async () => {
        // Optimistic toggle could be done here, but for now standard server action
        const res = await toggleProductStatus(displayId, isActive);
        if (!res.success) alert(res.message);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/admin/products/${displayId}/edit`} className="flex items-center cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleToggle} className="cursor-pointer">
                    {isActive ? (
                        <>
                            <Ban className="mr-2 h-4 w-4 text-amber-600" />
                            <span className="text-amber-600">Block / Hide</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            <span className="text-green-600">Activate / Show</span>
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
