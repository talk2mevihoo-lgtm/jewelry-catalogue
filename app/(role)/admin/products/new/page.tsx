import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { getDistributors } from "@/lib/actions/distributor-actions";

export default async function NewProductPage() {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const distributors = await getDistributors();

    const simpleDistributors = distributors.map(d => ({
        id: d.userId,
        name: `${d.companyName} (${d.distributorCode})`
    }));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-primary font-serif">Add New Product</h2>
            <ProductForm categories={categories} distributors={simpleDistributors} />
        </div>
    );
}
