import { prisma } from "@/lib/prisma";
import { DistributorOrderList } from "@/components/distributor/distributor-order-list";

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
    // Mock Auth: Get first distributor user
    const distributorProfile = await prisma.distributorProfile.findFirst();

    if (!distributorProfile) {
        return <div className="p-8 text-center text-muted-foreground">Access Denied. No distributor profile found.</div>;
    }

    // Fetch Orders with Deep Relations for Weight Calculations
    const orders = await prisma.order.findMany({
        where: { distributorId: distributorProfile.id },
        orderBy: { createdAt: 'desc' },
        include: {
            distributor: true, // Needed for print header
            items: {
                include: {
                    product: {
                        include: {
                            category: true
                        }
                    }
                }
            }
        }
    });

    // Fetch Configuration for Lookups
    const stages = await (prisma as any).orderStageDefinition.findMany({
        orderBy: { sequence: 'asc' }
    });

    const materials = await prisma.material.findMany({
        include: {
            metals: true
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-serif text-primary">My Orders</h1>
            </div>

            <DistributorOrderList
                orders={orders}
                stages={stages}
                materials={materials}
            />
        </div>
    );
}
