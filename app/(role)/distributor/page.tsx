import { prisma } from "@/lib/prisma";
import { DashboardAnalytics } from "@/components/distributor/dashboard-analytics";

export const dynamic = 'force-dynamic';

export default async function DistributorDashboardPage() {
    // Mock Auth: Get first distributor user (In real app, use session)
    const distributorProfile = await prisma.distributorProfile.findFirst();

    if (!distributorProfile) {
        return <div className="p-8 text-center text-muted-foreground">Access Denied. No distributor profile found.</div>;
    }

    // Fetch All Orders for Analytics (Client-side filtering for interactivity)
    const orders = await prisma.order.findMany({
        where: { distributorId: distributorProfile.id },
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    // Fetch Config
    const stages = await (prisma as any).orderStageDefinition.findMany({ // Using cast per previous fix
        orderBy: { sequence: 'asc' }
    });

    const materials = await prisma.material.findMany({
        include: {
            metals: true
        }
    });

    return (
        <div className="space-y-6">
            <DashboardAnalytics
                orders={orders}
                stages={stages}
                materials={materials}
            />
        </div>
    );
}
