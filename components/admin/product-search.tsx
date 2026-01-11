"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

// Let's implement inline debouncing to be self-contained for now, or use timeout.
export function ProductSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get initial value from URL
    const initialQuery = searchParams.get("query") || "";
    const [value, setValue] = useState(initialQuery);

    // Debounce effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set("query", value);
            } else {
                params.delete("query");
            }
            router.push(`?${params.toString()}`);
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [value, router, searchParams]);

    return (
        <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by Model No or Title..."
                className="pl-8"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
}
