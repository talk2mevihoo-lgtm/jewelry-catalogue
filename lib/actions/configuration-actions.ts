"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Categories ---
export async function getCategories() {
    return await prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name || name.trim().length < 2) return { message: "Category name required." };

    try {
        await prisma.category.create({ data: { name } });
        revalidatePath("/admin/settings");
        return { message: "Category added.", success: true };
    } catch (e) {
        return { message: "Category already exists.", success: false };
    }
}

export async function deleteCategory(id: string) {
    try {
        await prisma.category.delete({ where: { id } });
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        return { success: false, message: "Cannot delete: Category is in use." };
    }
}


// --- Materials ---
export async function createMaterial(formData: FormData) {
    const name = formData.get("name") as string;
    const minOrderWeight = parseFloat(formData.get("minOrderWeight") as string || "0");

    if (!name) return { message: "Material name required." };

    try {
        // @ts-ignore
        await prisma.material.create({ data: { name, minOrderWeight } });
        revalidatePath("/admin/settings");
        return { message: "Material added.", success: true };
    } catch (e) {
        return { message: "Error adding material.", success: false };
    }
}

export async function updateMaterial(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const minOrderWeight = parseFloat(formData.get("minOrderWeight") as string || "0");

    if (!name) return { message: "Material name required.", success: false };

    try {
        await prisma.material.update({
            where: { id },
            // @ts-ignore
            data: { name, minOrderWeight }
        });
        revalidatePath("/admin/settings");
        return { message: "Material updated.", success: true };
    } catch (e) {
        return { message: "Error updating material.", success: false };
    }
}

export async function deleteMaterial(id: string) {
    try {
        await prisma.material.delete({ where: { id } });
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        return { success: false, message: "Cannot delete: Material is in use." };
    }
}

// --- Metals ---
export async function getMetals() {
    return await prisma.metal.findMany({
        where: { isVisible: true },
        orderBy: { name: 'asc' }
    });
}

export async function createMetal(formData: FormData) {
    const name = formData.get("name") as string;
    const materialId = formData.get("materialId") as string;
    const conversionRatio = parseFloat(formData.get("conversionRatio") as string || "1.0");
    const purity = parseFloat(formData.get("purity") as string || "0");

    if (!name || !materialId) return { message: "Invalid metal data." };

    try {
        // Enforce Single Base Metal Rule
        if (conversionRatio === 1.0) {
            const existingBase = await prisma.metal.findFirst({
                where: {
                    materialId,
                    conversionRatio: 1.0
                }
            });

            if (existingBase) {
                return { message: "Error: This material already has a Base Metal (Ratio 1.0).", success: false };
            }
        }

        await prisma.metal.create({
            // @ts-ignore
            data: { name, materialId, conversionRatio, purity }
        });
        revalidatePath("/admin/settings");
        return { message: "Metal added.", success: true };
    } catch (e) {
        return { message: "Error adding metal.", success: false };
    }
}

export async function updateMetal(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const conversionRatio = parseFloat(formData.get("conversionRatio") as string || "1.0");
    const purity = parseFloat(formData.get("purity") as string || "0");

    if (!name) return { message: "Invalid metal data.", success: false };

    try {
        const metal = await prisma.metal.findUnique({ where: { id } });
        // Enforce Single Base Metal Rule if changing to 1.0 (and not already 1.0)
        if (conversionRatio === 1.0 && metal?.conversionRatio !== 1.0) {
            const existingBase = await prisma.metal.findFirst({
                where: {
                    materialId: metal?.materialId,
                    conversionRatio: 1.0,
                    id: { not: id }
                }
            });

            if (existingBase) {
                return { message: "Error: This material already has a Base Metal (Ratio 1.0).", success: false };
            }
        }

        await prisma.metal.update({
            where: { id },
            // @ts-ignore
            data: { name, conversionRatio, purity }
        });
        revalidatePath("/admin/settings");
        revalidatePath("/admin/configuration"); // Just in case
        return { message: "Metal updated.", success: true };
    } catch (e) {
        return { message: "Error updating metal.", success: false };
    }
}


export async function toggleMetalVisibility(id: string, currentStatus: boolean) {
    await prisma.metal.update({
        where: { id },
        // @ts-ignore
        data: { isVisible: !currentStatus }
    });
    revalidatePath("/admin/settings");
}

export async function deleteMetal(id: string) {
    try {
        await prisma.metal.delete({ where: { id } });
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        return { success: false, message: "Cannot delete: Metal is in use." };
    }
}

// --- Sizes ---
export async function createSize(formData: FormData) {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string || "General";

    if (!name) return { message: "Size name required." };

    try {
        await prisma.size.create({ data: { name, category } });
        revalidatePath("/admin/settings");
        return { message: "Size created.", success: true };
    } catch (e) {
        return { message: "Error.", success: false };
    }
}

export async function deleteSize(id: string) {
    try {
        await prisma.size.delete({ where: { id } });
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        return { success: false, message: "Cannot delete: Size is in use." };
    }
}

export async function toggleMaterialVisibility(id: string, currentStatus: boolean) {
    if (typeof currentStatus === 'undefined') {
        // Handle case where visibility might be undefined (legacy data before migration)
        currentStatus = true;
    }

    await prisma.material.update({
        where: { id },
        // @ts-ignore
        data: { isVisible: !currentStatus }
    });
    revalidatePath("/admin/settings");
}
