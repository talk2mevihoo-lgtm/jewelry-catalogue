import { prisma } from "@/lib/prisma";
import { cache } from "react";

// Use React cache to dedupe requests
export const getTenant = cache(async (slug: string) => {
    // If slug is 'main', return null or default
    if (slug === 'main') return null;

    const tenant = await (prisma as any).tenant.findUnique({
        where: { slug: slug }
    });

    return tenant;
});
