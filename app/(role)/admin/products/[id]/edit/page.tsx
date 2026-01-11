import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/actions/configuration-actions";
import { getDistributors } from "@/lib/actions/distributor-actions";

interface EditProductPageProps {
    params: {
        id: string;
    };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const product = await prisma.product.findUnique({
        where: { id: params.id },
        include: { allowedDistributors: true }
    });

    if (!product) {
        notFound();
    }

    const categories = await getCategories();
    const distributors = await getDistributors();

    const simpleDistributors = distributors.map(d => ({
        id: d.userId,
        name: `${d.companyName} (${d.distributorCode})`
    }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Edit Product</h2>
                <p className="text-muted-foreground">Manage product details and visibility.</p>
            </div>

            <ProductForm categories={categories} distributors={simpleDistributors} initialData={product} />
        </div>
    );
}
