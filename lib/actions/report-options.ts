"use server";

import { prisma } from "@/lib/prisma";

export async function getReportOptions() {
    const distributors = await prisma.distributorProfile.findMany({
        select: { id: true, companyName: true, distributorCode: true }
    });

    const orders = await prisma.order.findMany({
        select: { id: true, orderNumber: true, createdAt: true, distributorId: true, distributor: { select: { companyName: true } } },
        orderBy: { createdAt: 'desc' }
    });

    const materials = await prisma.material.findMany({
        // @ts-ignore
        where: { isVisible: true },
        include: {
            metals: {
                where: { isVisible: true }
            }
        }
    });

    const metals = await prisma.metal.findMany({
        where: { isVisible: true }
    });

    return {
        distributors,
        orders: orders.map(o => ({ ...o, createdAt: o.createdAt.toISOString() })),
        materials,
        metals
    };
}
