"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStages() {
    return await prisma.orderStageDefinition.findMany({
        orderBy: { sequence: 'asc' }
    });
}

export async function createStage(formData: FormData) {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const requiresReason = formData.get("requiresReason") === "on";
    const reasons = formData.get("reasons") as string;

    if (!name || !type) return { message: "Name and Type are required.", success: false };

    try {
        const count = await prisma.orderStageDefinition.count();
        await prisma.orderStageDefinition.create({
            data: {
                name,
                type,
                sequence: count + 1,
                requiresReason,
                reasons: requiresReason ? reasons : null
            }
        });
        revalidatePath("/admin/settings");
        revalidatePath("/admin/orders");
        return { message: "Stage created.", success: true };
    } catch (e) {
        return { message: "Error creating stage.", success: false };
    }
}

export async function updateStage(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const requiresReason = formData.get("requiresReason") === "on";
    const reasons = formData.get("reasons") as string;

    if (!name || !type) return { message: "Name and Type are required.", success: false };

    try {
        await prisma.orderStageDefinition.update({
            where: { id },
            data: {
                name,
                type,
                requiresReason,
                reasons: requiresReason ? reasons : null
            }
        });
        revalidatePath("/admin/settings");
        revalidatePath("/admin/orders");
        return { message: "Stage updated.", success: true };
    } catch (e) {
        return { message: "Error updating stage.", success: false };
    }
}

export async function deleteStage(id: string) {
    try {
        await prisma.orderStageDefinition.delete({ where: { id } });
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        return { message: "Error deleting stage.", success: false };
    }
}

export async function reorderStages(orderedIds: string[]) {
    try {
        const transaction = orderedIds.map((id, index) =>
            prisma.orderStageDefinition.update({
                where: { id },
                data: { sequence: index + 1 }
            })
        );
        await prisma.$transaction(transaction);
        revalidatePath("/admin/settings");
        revalidatePath("/admin/orders");
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
