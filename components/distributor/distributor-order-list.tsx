"use client";

import { DistributorOrderRow } from "./distributor-order-row";

type DistributorOrderListProps = {
    orders: any[];
    stages: any[];
    materials: any[];
};

export function DistributorOrderList({ orders, stages, materials }: DistributorOrderListProps) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed">
                <h3 className="text-lg font-medium text-muted-foreground">No orders found</h3>
                <p className="text-sm text-muted-foreground mt-1">Orders you place will appear here.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="border rounded-md overflow-hidden bg-white dark:bg-card">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                        <tr className="[&_th]:px-4 [&_th]:h-12 [&_th]:align-middle [&_th]:font-medium [&_th]:text-muted-foreground">
                            <th className="w-[180px]">Order #</th>
                            <th>Date</th>
                            <th>Delivery Date</th>
                            <th className="w-[150px]">Progress</th>
                            <th>Status</th>
                            <th className="text-right">Summary</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.map((order) => (
                            <DistributorOrderRow
                                key={order.id}
                                order={order}
                                stages={stages}
                                materials={materials}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
