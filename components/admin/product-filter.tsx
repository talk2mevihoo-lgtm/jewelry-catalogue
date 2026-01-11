"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ProductFilterProps {
    categories: { id: string, name: string }[];
}

export function ProductFilter({ categories }: ProductFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get current category from URL or default to 'all'
    const currentCategory = searchParams.get("category") || "all";

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "all") {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const onValueChange = (value: string) => {
        const queryString = createQueryString("category", value);
        router.push(`?${queryString}`);
    };

    return (
        <div className="w-[200px]">
            <Select value={currentCategory} onValueChange={onValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
