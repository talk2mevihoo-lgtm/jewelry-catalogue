"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { type?: "single" | "multiple", collapsible?: boolean }
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm", className)} {...props} />
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

// Simple Context for state management would be ideal but for speed we might stick to Radix API surface
// Actually, since I'm simulating, I'll just use a basic details/summary or controlled state if I can.
// But the `CollectionList` expects `AccordionItem`, `Trigger`, `Content`.

// Let's implement a context-based one quickly.
const AccordionContext = React.createContext<{ expanded: string | null, setExpanded: (v: string | null) => void }>({ expanded: null, setExpanded: () => { } });

const AccordionRoot = ({ type, collapsible, className, children, ...props }: any) => {
    const [expanded, setExpanded] = React.useState<string | null>(null);
    return (
        <AccordionContext.Provider value={{ expanded, setExpanded: (val) => setExpanded(val === expanded && collapsible ? null : val) }}>
            <div className={cn(className)} {...props}>{children}</div>
        </AccordionContext.Provider>
    )
}

const AccordionItemWrapper = ({ value, className, children, ...props }: any) => {
    // We pass value down? No, Trigger needs to know.
    return (
        <div data-value={value} className={cn("border-b", className)} {...props}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { value });
                }
                return child;
            })}
        </div>
    );
};

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
    const { expanded, setExpanded } = React.useContext(AccordionContext);
    const isOpen = expanded === value;

    return (
        <div className="flex">
            <button
                ref={ref}
                onClick={() => value && setExpanded(value)}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={isOpen ? "open" : "closed"}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
        </div>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
    const { expanded } = React.useContext(AccordionContext);
    const isOpen = expanded === value;

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn("overflow-hidden text-sm transition-all animate-in slide-in-from-top-2", className)}
            {...props}
        >
            <div className="pb-4 pt-0">{children}</div>
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

export { AccordionRoot as Accordion, AccordionItemWrapper as AccordionItem, AccordionTrigger, AccordionContent }
