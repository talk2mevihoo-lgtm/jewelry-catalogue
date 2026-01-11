"use client";
// Collection List Component

import { CollectionManager } from "./collection-manager";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCollection } from "@/lib/actions/collection-actions";
import { useRouter } from "next/navigation";

type CollectionListProps = {
    collections: any[];
    allProducts: any[];
};

export function CollectionList({ collections, allProducts }: CollectionListProps) {
    const router = useRouter();

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this collection?")) return;
        await deleteCollection(id);
        router.refresh();
    };

    if (collections.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No collections created yet.</p>
            </div>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {collections.map((col) => (
                <AccordionItem key={col.id} value={col.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 flex-1">
                            <span className="font-medium text-lg">{col.name}</span>
                            <Badge variant="secondary">{col.products.length} Products</Badge>
                            <div className="flex-1" />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive z-50"
                                onClick={(e) => handleDelete(col.id, e)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6 border-t">
                        <CollectionManager collection={col} allProducts={allProducts} />
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
