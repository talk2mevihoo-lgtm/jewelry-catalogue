"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("q")?.toString() || "");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchTerm) {
                params.set("q", searchTerm);
            } else {
                params.delete("q");
            }
            router.replace(`?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, searchParams]);

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={placeholder}
                className="pl-8 bg-white"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
            />
        </div>
    );
}
