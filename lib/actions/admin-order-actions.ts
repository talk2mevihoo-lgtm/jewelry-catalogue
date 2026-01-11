"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Generate a simple order number
function generateOrderNumber() {
    return `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });
        revalidatePath("/admin/orders");
        return { success: true };
    } catch (e) {
        return { success: false, message: "Failed to update order status" };
    }
}

export async function updateOrderItemStage(itemId: string, stage: string, reason?: string) {
    console.log("updateOrderItemStage called:", { itemId, stage, reason });
    try {
        // 1. Update the specific item
        const updatedItem = await prisma.orderItem.update({
            where: { id: itemId },
            data: {
                // @ts-ignore
                stage: stage,
                stageReason: reason
            },
            include: { order: { include: { items: true } } }
        });

        // @ts-ignore
        const order = updatedItem.order;
        const allItems = order.items;

        // 2. Determine new Order Status based on all items
        // Fetch definitions to map Names to Types
        const definitions = await (prisma as any).orderStageDefinition.findMany();
        const typeMap = new Map(definitions.map((d: any) => [d.name, d.type]));

        let newOrderStatus = "PROCESSING"; // Default active state

        // Helper to check type
        const checkType = (stageName: string, type: string) => {
            // Fallback: if stageName IS the type (legacy data), check equality
            const mappedType = typeMap.get(stageName);
            return mappedType === type || stageName === type;
        };

        const allCompleted = allItems.every((i: any) => checkType(i.stage, "COMPLETED"));
        const allCancelled = allItems.every((i: any) => checkType(i.stage, "CANCELLED"));
        const allPending = allItems.every((i: any) => checkType(i.stage, "PENDING"));
        // const allHold = allItems.every((i: any) => checkType(i.stage, "ON_HOLD")); 

        if (allCompleted) {
            newOrderStatus = "COMPLETED";
        } else if (allCancelled) {
            newOrderStatus = "CANCELLED";
        } else if (allPending) {
            newOrderStatus = "PENDING";
        } else {
            // Mixed state, usually implies Processing
            newOrderStatus = "PROCESSING";
        }

        // 3. Update Order Status if changed
        if (order.status !== newOrderStatus) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: newOrderStatus,
                    stages: {
                        create: {
                            stage: newOrderStatus,
                            reason: `Auto-updated: Item(s) moved to ${stage}`,
                            changedBy: "System"
                        }
                    }
                }
            });
        }

        revalidatePath("/admin/orders");
        return { success: true };
    } catch (e: any) {
        console.error("Error updating item stage:", e);
        return { success: false, message: "Failed to update item stage: " + e.message };
    }
}

export async function updateOrderItemDetails(itemId: string, data: { metalType: string, metalColor: string, size: string, quantity: number, instructions?: string }) {
    try {
        await prisma.orderItem.update({
            where: { id: itemId },
            data: {
                metalType: data.metalType,
                metalColor: data.metalColor,
                size: data.size,
                quantity: data.quantity,
                instructions: data.instructions
            }
        });
        revalidatePath("/admin/orders");
        return { success: true };
    } catch (e) {
        console.error("Error updating item details:", e);
        return { success: false, message: "Failed to update item details" };
    }
}

export async function splitOrder(originalOrderId: string, itemIds: string[]) {
    try {
        const originalOrder = await prisma.order.findUnique({
            where: { id: originalOrderId },
            include: { items: true }
        });

        if (!originalOrder) throw new Error("Original order not found");

        const newOrderNumber = generateOrderNumber();

        // Create new order for the same distributor
        const newOrder = await prisma.order.create({
            data: {
                orderNumber: newOrderNumber,
                distributorId: originalOrder.distributorId,
                status: "PENDING", // Default status for new split order
                instructionNote: `Split from ${originalOrder.orderNumber}`,
                // @ts-ignore
                requestedDeliveryDate: originalOrder.requestedDeliveryDate
            }
        });

        // Move items to new order
        await prisma.orderItem.updateMany({
            where: {
                id: { in: itemIds },
                orderId: originalOrderId
            },
            data: {
                orderId: newOrder.id
            }
        });

        revalidatePath("/admin/orders");
        return { success: true, message: "Order split successfully" };
    } catch (e) {
        console.error("Error splitting order:", e);
        return { success: false, message: "Failed to split order" };
    }
}

export async function getAdminOrders() {
    return await prisma.order.findMany({
        include: {
            distributor: true,
            items: {
                include: {
                    product: {
                        include: {
                            category: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}
