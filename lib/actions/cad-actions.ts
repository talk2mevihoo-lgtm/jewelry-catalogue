"use server";

import { prisma } from "@/lib/prisma";

export async function getOrdersWithCads(query?: string) {
    try {
        const where: any = {
            items: {
                some: {
                    product: {
                        cadFile: { not: null }
                    }
                }
            }
        };

        if (query) {
            where.OR = [
                { orderNumber: { contains: query } },
                {
                    items: {
                        some: {
                            product: {
                                modelNo: { contains: query }
                            }
                        }
                    }
                }
            ];
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                distributor: true,
                items: {
                    include: {
                        product: true // Need cadFile property
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit for performance
        });
        return orders;
    } catch (e) {
        console.error(e);
        return [];
    }
}
