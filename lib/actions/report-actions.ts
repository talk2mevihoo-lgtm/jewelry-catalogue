"use server";

import { prisma } from "@/lib/prisma";

export type ReportFilter = {
    type: "DISTRIBUTOR" | "ORDER" | "DATE" | "ADVANCED";
    distributorId?: string;
    orderNumber?: string;
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    metalType?: string;
    metalColor?: string;
};

export async function getReportData(filter: ReportFilter) {
    try {
        const where: any = {};

        // Basic Filters
        if (filter.type === "DISTRIBUTOR" && filter.distributorId) {
            where.distributorId = filter.distributorId;
        } else if (filter.type === "ORDER" && filter.orderNumber) {
            where.orderNumber = { contains: filter.orderNumber };
        } else if (filter.type === "DATE") {
            if (filter.startDate && filter.endDate) {
                where.createdAt = {
                    gte: filter.startDate,
                    lte: filter.endDate
                };
            }
        }

        // Advanced Item-Level Filters (Category, Metal Type, Color)
        // If advanced filters are present, we might need to filter Orders based on items, 
        // OR just filter items within the report if the requirement is to only show matching items.
        // User said: "View Orders by Jewelry Category...". Usually means orders containing such items, 
        // but typically reports show the specific line items.
        // Let's filter the *items* included in the aggregation.

        const itemWhere: any = {};
        if (filter.type === "ADVANCED") {
            if (filter.categoryId) itemWhere.product = { categoryId: filter.categoryId };
            if (filter.metalType) itemWhere.metalType = filter.metalType;
            if (filter.metalColor) itemWhere.metalColor = filter.metalColor;
        }

        const orders = await prisma.order.findMany({
            where: {
                ...where,
                // For advanced filter, ensure order has at least one matching item?
                // Or just fetch all and filter items later? 
                // Better to filter Orders first to reduce load if possible.
                items: Object.keys(itemWhere).length > 0 ? { some: itemWhere } : undefined
            },
            include: {
                distributor: true, // For headers
                items: {
                    where: itemWhere, // Only fetch matching items for aggregation if advanced
                    include: {
                        product: { include: { category: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch Metals for Purity and aggregating
        const metals = await prisma.metal.findMany({ include: { material: true } });
        const metalMap = new Map(metals.map(m => [m.name, m]));

        // Process Data for Report
        // Structure: List of Orders. Each Order has Items.
        // Summary: Total Weight per Metal Group (Gold, Silver), Total Pure Weight.

        let globalSummary = {
            byMaterial: {} as Record<string, { totalWeight: number, pureWeight: number }>
        };

        const enrichedOrders = orders.map(order => {
            let orderSummary = {
                byMaterial: {} as Record<string, { totalWeight: number, pureWeight: number }>
            };

            const enrichedItems = order.items.map(item => {
                const metal = metalMap.get(item.metalType);
                const weight = (item.product.baseWeight || 0) * (metal?.conversionRatio || 1) * item.quantity;

                // Pure Weight = Weight * Purity
                // Silver typically has no pure weight shown as per requirement "(no pure weight seen for Silver)"
                // We will calculate it but UI can hide it based on material name.
                const navPurity = metal?.purity || 0;
                const pureWeight = weight * (navPurity / 100);
                const materialName = metal?.material.name || "Unknown";

                // Aggregate Order Summary
                if (!orderSummary.byMaterial[materialName]) {
                    orderSummary.byMaterial[materialName] = { totalWeight: 0, pureWeight: 0 };
                }
                orderSummary.byMaterial[materialName].totalWeight += weight;
                orderSummary.byMaterial[materialName].pureWeight += pureWeight;

                // Aggregate Global Summary
                if (!globalSummary.byMaterial[materialName]) {
                    globalSummary.byMaterial[materialName] = { totalWeight: 0, pureWeight: 0 };
                }
                globalSummary.byMaterial[materialName].totalWeight += weight;
                globalSummary.byMaterial[materialName].pureWeight += pureWeight;

                return { ...item, weight, pureWeight, materialName };
            });

            return { ...order, items: enrichedItems, summary: orderSummary };
        });

        return { orders: enrichedOrders, grandTotal: globalSummary };

    } catch (error) {
        console.error("Report Error:", error);
        return { orders: [], grandTotal: null }; // Handle error gracefully
    }
}
