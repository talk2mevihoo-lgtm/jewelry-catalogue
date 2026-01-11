"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

type Props = {
    categories: { id: string, name: string }[];
    tags: string[];
};

export function ShopFilters({ categories, tags }: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "all");
    const [minWeight, setMinWeight] = useState(searchParams.get("minWeight") || "");
    const [maxWeight, setMaxWeight] = useState(searchParams.get("maxWeight") || "");
    const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.getAll("tags"));

    const handleTagChange = (tag: string, checked: boolean) => {
        if (checked) {
            setSelectedTags([...selectedTags, tag]);
        } else {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        }
    };

    const applyFilters = () => {
        const params = new URLSearchParams(); // Reset params for clean state or append? better to replace based on current state.
        // Actually, let's keep other unrelated params if any? No, filters usually drive the query.

        if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
        if (minWeight) params.set("minWeight", minWeight);
        if (maxWeight) params.set("maxWeight", maxWeight);

        selectedTags.forEach(tag => params.append("tags", tag));

        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <Card className="h-fit sticky top-20">
            <CardHeader>
                <CardTitle className="text-lg">Refine Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Weight Range (g)</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Min"
                            type="number"
                            value={minWeight}
                            onChange={(e) => setMinWeight(e.target.value)}
                            className="w-full"
                        />
                        <Input
                            placeholder="Max"
                            type="number"
                            value={maxWeight}
                            onChange={(e) => setMaxWeight(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                {tags.length > 0 && (
                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <div key={tag} className="flex items-center space-x-2 border rounded px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id={`tag-${tag}`}
                                        checked={selectedTags.includes(tag)}
                                        onChange={(e) => handleTagChange(tag, e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-3 w-3"
                                    />
                                    <Label htmlFor={`tag-${tag}`} className="cursor-pointer font-normal">{tag}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Button className="w-full" variant="premium" onClick={applyFilters}>
                    Apply Filters
                </Button>

                <Button className="w-full" variant="ghost" onClick={() => {
                    setCategoryId("all");
                    setMinWeight("");
                    setMaxWeight("");
                    setSelectedTags([]);
                    router.replace(pathname);
                }}>
                    Reset
                </Button>
            </CardContent>
        </Card>
    );
}
