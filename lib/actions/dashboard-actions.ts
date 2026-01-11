"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";

export type DateRangeType = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_3_MONTHS" | "THIS_YEAR" | "ALL" | "CUSTOM";

export async function getDashboardStats(rangeType: DateRangeType, customStart?: Date, customEnd?: Date) {
    // 1. Determine Date Range
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined = endOfDay(now);

    switch (rangeType) {
        case "TODAY":
            startDate = startOfDay(now);
            break;
        case "THIS_WEEK":
            startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            break;
        case "THIS_MONTH":
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case "LAST_3_MONTHS":
            startDate = subMonths(startOfDay(now), 3);
            break;
        case "THIS_YEAR":
            startDate = startOfYear(now);
            break;
        case "ALL":
            startDate = undefined; // No lower bound
            break;
        case "CUSTOM":
            // Use customStart/End passed in arguments
            break;
    }

    if (customStart) startDate = customStart;
    if (customEnd) endDate = customEnd;

    const dateFilter = startDate ? {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    } : {};

    // 2. Fetch Data (Optimized for Aggregation)
    // We need granular item data to calculate weights correctly (Item Qty * Conversion * BaseWeight)
    const orders = await prisma.order.findMany({
        where: { ...dateFilter },
        include: {
            distributor: { select: { id: true, companyName: true } },
            items: {
                include: {
                    product: { select: { id: true, modelNo: true, title: true, mainImage: true, baseWeight: true, categoryId: true, category: true } },
                    // We need to fetch metal details to get conversion ratio/material
                }
            }
        }
    });

    const metals = await prisma.metal.findMany({ include: { material: true } });
    const metalMap = new Map(metals.map(m => [m.name, m]));

    // --- Processing ---

    // Stats Objects
    const distributorSummary: Record<string, any> = {};
    const activeOrdersSummary: any = { grandTotal: {}, byMetalType: {}, orders: [] };
    const deliveredOrdersSummary: any = { grandTotal: {}, byMetalType: {}, orders: [] };
    const stageStats: Record<string, { count: number, weight: number }> = {};
    const topProducts: Record<string, { product: any, count: number }> = {};
    const urgentAlerts: any[] = [];

    // Stage Definitions (to label stages correctly)
    const allStages = await prisma.orderStageDefinition.findMany({ orderBy: { sequence: 'asc' } });

    // Initialize Stage Stats
    allStages.forEach(s => stageStats[s.name] = { count: 0, weight: 0 });
    // Also handle "PENDING" or legacy statuses if they exist
    if (!stageStats["PENDING"]) stageStats["PENDING"] = { count: 0, weight: 0 };


    for (const order of orders) {
        // --- Alerts --- 
        // Logic: specific items might have stages, but alerts are typically order-level or item-level? 
        // "products... which delivery is nearby 2 days" -> Item level or Order level?
        // Let's assume Order Level delivery date for now as per `requestedDeliveryDate`
        if (order.requestedDeliveryDate) {
            const deliveryDate = new Date(order.requestedDeliveryDate);
            const diffTime = deliveryDate.getTime() - now.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);

            if (diffDays >= 0 && diffDays <= 2) {
                // Add items to alerts
                for (const item of order.items) {
                    urgentAlerts.push({
                        distributorName: order.distributor.companyName,
                        modelNo: item.product.modelNo,
                        productName: item.product.title,
                        image: item.product.mainImage,
                        deliveryDate: order.requestedDeliveryDate
                    });
                }
            }
        }


        // --- Distributor Summary ---
        const distName = order.distributor.companyName;
        if (!distributorSummary[distName]) {
            distributorSummary[distName] = {
                count: 0,
                categories: {} as Record<string, number>,
                metalTypes: {} as Record<string, number>
            };
        }
        distributorSummary[distName].count++;

        // --- Active vs Delivered ---
        // Definition: Delivered if all items are in a "COMPLETED" stage type? 
        // Or if Order.status is "DELIVERED"?
        // Let's us Order.status "COMPLETED" or "DELIVERED"
        // Actually, we should check `allStages`. Let's assume there is a stage type "COMPLETED".

        // For now, let's treat "Pending", "Processing", "In Production" as Active.
        // And "Delivered", "Completed" as Delivered.
        // We will sum weights.

        // Per-Order Weight Calculation
        const orderWeightMap: Record<string, number> = {}; // Material -> Weight

        for (const item of order.items) {
            const metal = metalMap.get(item.metalType);
            const weight = (item.product.baseWeight || 0) * (metal?.conversionRatio || 1) * item.quantity;
            const materialName = metal?.material.name || "Other";

            // Distributor Stats
            distributorSummary[distName].categories[item.product.category.name] = (distributorSummary[distName].categories[item.product.category.name] || 0) + item.quantity;
            distributorSummary[distName].metalTypes[item.metalType] = (distributorSummary[distName].metalTypes[item.metalType] || 0) + item.quantity;

            // Stage Stats (Item Level)
            const itemStage = item.stage || "PENDING";
            if (!stageStats[itemStage]) stageStats[itemStage] = { count: 0, weight: 0 };
            stageStats[itemStage].count += item.quantity;
            stageStats[itemStage].weight += weight;

            // Top Products
            if (!topProducts[item.product.id]) topProducts[item.product.id] = { product: item.product, count: 0 };
            topProducts[item.product.id].count += item.quantity;

            // Order Weight Map
            orderWeightMap[materialName] = (orderWeightMap[materialName] || 0) + weight;
        }

        // Classify Order as Active or Delivered
        const headerStatus = order.status?.toUpperCase();
        const isDelivered = headerStatus === "DELIVERED" || headerStatus === "COMPLETED";

        const targetSummary = isDelivered ? deliveredOrdersSummary : activeOrdersSummary;

        if (!targetSummary.byMetalType) targetSummary.byMetalType = {}; // Init if needed

        targetSummary.orders.push({
            orderNumber: order.orderNumber,
            weights: orderWeightMap
        });

        // Add to Grand Total (Material)
        for (const [mat, wt] of Object.entries(orderWeightMap)) {
            targetSummary.grandTotal[mat] = (targetSummary.grandTotal[mat] || 0) + wt;
        }

        // Add to Metal Type Total
        for (const item of order.items) {
            const metal = metalMap.get(item.metalType);
            const weight = (item.product.baseWeight || 0) * (metal?.conversionRatio || 1) * item.quantity;
            const typeKey = `${item.metalType} ${item.metalColor}`; // e.g. "18K Gold Yellow" or just "18K Gold" if color differs. User asked Metal Type wise.
            // Actually, usually "Metal Type" refers to "18K Gold", "22K Gold". "Color" is separate.
            // Let's stick to metalType for now as requested.
            const key = item.metalType;
            targetSummary.byMetalType[key] = (targetSummary.byMetalType[key] || 0) + weight;
        }
    }

    // Convert Top Products to array and sort
    const topProductsArray = Object.values(topProducts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

    return {
        distributorSummary,
        activeOrdersSummary,
        deliveredOrdersSummary,
        stageStats,
        urgentAlerts: urgentAlerts.slice(0, 20), // Limit alerts
        topProducts: topProductsArray,
        allStages
    };
}
