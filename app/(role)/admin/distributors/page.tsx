import { getDistributors } from "@/lib/actions/distributor-actions";
import { DistributorForm } from "@/components/admin/distributor-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DistributorsPage() {
    const distributors = await getDistributors();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Distributor Management</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Distributors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Code</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Company</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Contact</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Region</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {distributors.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                    No distributors found. Create one.
                                                </td>
                                            </tr>
                                        ) : (
                                            distributors.map((distributor) => (
                                                <tr key={distributor.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{distributor.distributorCode}</td>
                                                    <td className="p-4 align-middle">{distributor.companyName}</td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex flex-col">
                                                            <span>{distributor.contactPerson}</span>
                                                            <span className="text-xs text-muted-foreground">{distributor.contactNo}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">{distributor.region}</td>
                                                    <td className="p-4 align-middle">
                                                        <Button size="sm" variant="ghost" className="text-primary hover:text-primary">Edit</Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Create Column */}
                <div>
                    <DistributorForm />
                </div>
            </div>
        </div>
    );
}
