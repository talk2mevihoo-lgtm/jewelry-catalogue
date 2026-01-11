"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Workaround for prisma client type not updating immediately due to lock
// casting prisma to any to access 'collection'

export async function createCollection(name: string) {
    try {
        const collection = await (prisma as any).collection.create({
            data: { name }
        });
        revalidatePath("/admin/collections");
        return { success: true, collection };
    } catch (error: any) {
        console.error("Create collection error:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteCollection(id: string) {
    try {
        await (prisma as any).collection.delete({
            where: { id }
        });
        revalidatePath("/admin/collections");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function toggleCollectionVisibility(id: string, isVisible: boolean) {
    try {
        await (prisma as any).collection.update({
            where: { id },
            data: { isVisible }
        });
        revalidatePath("/admin/collections");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function addProductsToCollection(collectionId: string, productIds: string[]) {
    try {
        // Find existing to avoid duplicates if needed, but connect should handle valid IDs
        await (prisma as any).collection.update({
            where: { id: collectionId },
            data: {
                products: {
                    connect: productIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath("/admin/collections");
        return { success: true };
    } catch (error: any) {
        console.error("Add products error:", error);
        return { success: false, message: error.message };
    }
}

export async function removeProductFromCollection(collectionId: string, productId: string) {
    try {
        await (prisma as any).collection.update({
            where: { id: collectionId },
            data: {
                products: {
                    disconnect: { id: productId }
                }
            }
        });
        revalidatePath("/admin/collections");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getCollectionWithProducts(id: string) {
    return (prisma as any).collection.findUnique({
        where: { id },
        include: {
            products: true
        }
    });
}
