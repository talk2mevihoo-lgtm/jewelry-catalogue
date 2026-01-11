"use server";

import { prisma } from "@/lib/prisma";

export type ProductFilter = {
    query?: string;
    categoryId?: string;
    minWeight?: number;
    maxWeight?: number;
    tags?: string[];
};

export async function searchProducts(filter: ProductFilter) {
    const whereClause: any = {
        isActive: true,
        // Exclude products that are in any collection
        collections: { none: {} }
    };

    if (filter.query) {
        whereClause.OR = [
            { modelNo: { contains: filter.query } },
            { title: { contains: filter.query } },
        ];
    }

    if (filter.categoryId && filter.categoryId !== "all") {
        whereClause.categoryId = filter.categoryId;
    }

    if (filter.minWeight || filter.maxWeight) {
        whereClause.baseWeight = {};
        if (filter.minWeight) whereClause.baseWeight.gte = filter.minWeight;
        if (filter.maxWeight) whereClause.baseWeight.lte = filter.maxWeight;
    }

    if (filter.tags && filter.tags.length > 0) {
        // Simple OR filter for tags - contains string
        whereClause.OR = [
            ...(whereClause.OR || []),
            ...filter.tags.map(tag => ({ tags: { contains: tag } }))
        ];
        // Note: Prisma 'contains' matches substring. If tags are "Gold, Wedding" and we search "Gold", it matches.
        // For strict array filtering, we'd need a better schema or raw query. This is sufficient for now.
    }

    try {
        const products = await prisma.product.findMany({
            where: whereClause,
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });
        return products;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function getShopConfiguration() {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const materials = await prisma.material.findMany({
        // @ts-ignore
        where: { isVisible: true },
        include: { metals: { where: { isVisible: true }, orderBy: { conversionRatio: 'asc' } } }
    });
    const sizes = await prisma.size.findMany({ orderBy: { name: 'asc' } });

    // Flatten all metals for easier lookup
    const allMetals = (materials as any[]).flatMap(m => m.metals);

    // Get unique tags
    const allProducts = await prisma.product.findMany({ select: { tags: true }, where: { isActive: true } });
    const tagsSet = new Set<string>();
    allProducts.forEach(p => {
        if (p.tags) {
            p.tags.split(',').forEach(t => tagsSet.add(t.trim()));
        }
    });
    const tags = Array.from(tagsSet).sort();

    return { categories, materials, sizes, metals: allMetals, tags };
}
