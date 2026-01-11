"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductWeightDisplayProps {
    baseWeight: number;
    metals: { id: string; name: string; conversionRatio: number }[];
}

export function ProductWeightDisplay({ baseWeight, metals }: ProductWeightDisplayProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-2 border-t pt-2">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Scale className="w-3 h-3" />
                    <span>Base: <span className="font-medium text-foreground">{baseWeight}g</span></span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 text-primary hover:text-primary/80 hover:bg-gold-50"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? "Hide" : "Calculate"}
                    {isOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
            </div>

            {isOpen && (
                <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                    {metals.map(metal => (
                        <div
                            key={metal.id}
                            className="bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded flex flex-col items-center justify-center text-center leading-tight shadow-sm"
                        >
                            <span className="opacity-80 text-[9px] uppercase tracking-wider">{metal.name}</span>
                            <span className="font-bold">
                                {(baseWeight * metal.conversionRatio).toFixed(1)}g
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
