import { getAdminOrders } from "@/lib/actions/admin-order-actions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleOrderRow } from "@/components/admin/collapsible-order-row";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
    const orders = await getAdminOrders();
    const stages = await (prisma as any).orderStageDefinition.findMany({ orderBy: { sequence: 'asc' } });
    const materials = await prisma.material.findMany({
        // @ts-ignore
        where: { isVisible: true },
        include: { metals: { where: { isVisible: true } } }
    });
    const sizes = await prisma.size.findMany({ orderBy: { name: 'asc' } });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-serif text-primary">Order Management</h1>

            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-40">Order #</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Distributor</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Delivery Date</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Progress</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Items</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {orders.length === 0 ? (
                                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No orders found.</td></tr>
                                ) : (
                                    orders.map((order: any) => (
                                        <CollapsibleOrderRow
                                            key={order.id}
                                            order={order}
                                            stages={stages}
                                            materials={materials}
                                            sizes={sizes}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
