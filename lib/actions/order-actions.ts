"use server";

import { prisma } from "@/lib/prisma";
import { CartItem } from "@/components/providers/cart-provider";
import { revalidatePath } from "next/cache";

export async function submitOrder(items: CartItem[], instructionNote?: string, requestedDeliveryDate?: Date) {
    if (items.length === 0) return { message: "Cart is empty.", success: false };

    try {
        // 1. Validate Delivery Date (Server-side enforcement)
        if (requestedDeliveryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const minDate = new Date(today);
            minDate.setDate(minDate.getDate() + 12);

            // Normalize requested date to start of day for comparison
            const checkDate = new Date(requestedDeliveryDate);
            checkDate.setHours(0, 0, 0, 0);

            if (checkDate < minDate) {
                return { message: "Delivery date must be at least 12 days from today.", success: false };
            }
        }

        // Mock Auth: Get first distributor user or fail
        const distributorProfile = await prisma.distributorProfile.findFirst();

        if (!distributorProfile) {
            return { message: "No distributor account found. Debug mode.", success: false };
        }

        // 2. Validate Minimum Order Weight per Material
        // Fetch necessary data
        const productIds = Array.from(new Set(items.map(i => i.productId)));
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, baseWeight: true }
        });

        const metals = await prisma.metal.findMany({
            include: { material: true }
        });

        // Map for quick lookup
        const productMap = new Map(products.map(p => [p.id, p]));
        const metalMap = new Map(metals.map(m => [m.name, m]));

        // Accumulate weights by Material
        const materialWeights: Record<string, { current: number, min: number, name: string }> = {};

        for (const item of items) {
            const product = productMap.get(item.productId);
            const metal = metalMap.get(item.metalType || "");

            if (product && metal) {
                const itemWeight = product.baseWeight * metal.conversionRatio * item.quantity;
                const materialId = metal.material.id;

                if (!materialWeights[materialId]) {
                    materialWeights[materialId] = {
                        current: 0,
                        min: (metal.material as any).minOrderWeight || 0,
                        name: metal.material.name
                    };
                }
                materialWeights[materialId].current += itemWeight;
            }
        }

        // Check if rules are met
        for (const matId in materialWeights) {
            const { current, min, name } = materialWeights[matId];
            if (current < min) {
                return {
                    message: `Minimum order weight for ${name} is ${min}g. Your cart has ${current.toFixed(2)}g.`,
                    success: false
                };
            }
        }

        await prisma.$transaction(async (tx) => {
            // Generate Order Number
            const count = await tx.order.count();
            const orderNumber = `ORD-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    distributorId: distributorProfile.id,
                    status: "PENDING",
                    instructionNote,
                    // @ts-ignore - Field exists in schema but TS types are stale
                    requestedDeliveryDate,
                    stageReason: "Order Submitted",
                    stages: {
                        create: {
                            stage: "PENDING",
                            reason: "Initial Submission"
                        }
                    }
                }
            });

            // Create Items
            await tx.orderItem.createMany({
                data: items.map(item => ({
                    orderId: order.id,
                    productId: item.productId,
                    metalType: item.metalType,
                    metalColor: item.metalColor,
                    size: item.size,
                    quantity: item.quantity,
                    instructions: item.instructions
                }))
            });
        });

        revalidatePath("/distributor/orders");
        revalidatePath("/admin/orders");
        return { message: "Order submitted successfully!", success: true };

    } catch (e: any) {
        console.error(e);
        return { message: "Failed to submit order: " + e.message, success: false };
    }
}
