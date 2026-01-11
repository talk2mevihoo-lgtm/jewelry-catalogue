"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for validation
const DistributorSchema = z.object({
    companyName: z.string().min(2, "Company name is required"),
    distributorCode: z.string().min(3, "Code must be at least 3 chars"),
    contactPerson: z.string().min(2, "Contact person is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    contactNo: z.string().min(10, "Invalid contact number"),
    address: z.string().min(5, "Address is required"),
    region: z.string().min(2, "Region is required"),
    gstNo: z.string().optional(),
});

export type DistributorState = {
    errors?: {
        companyName?: string[];
        email?: string[];
        password?: string[];
        _form?: string[];
    };
    message?: string;
};

export async function createDistributor(prevState: DistributorState, formData: FormData) {
    const validatedFields = DistributorSchema.safeParse({
        companyName: formData.get("companyName"),
        distributorCode: formData.get("distributorCode"),
        contactPerson: formData.get("contactPerson"),
        email: formData.get("email"),
        password: formData.get("password"),
        contactNo: formData.get("contactNo"),
        address: formData.get("address"),
        region: formData.get("region"),
        gstNo: formData.get("gstNo"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Distributor.",
        };
    }

    const { email, password, distributorCode, ...data } = validatedFields.data;

    try {
        // Check uniqueness
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return { message: "Email already exists." };

        const existingCode = await prisma.distributorProfile.findUnique({
            where: { distributorCode }
        });
        if (existingCode) return { message: "Distributor Code must be unique." };

        // Create User and Profile transaction
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: password, // Use provided password
                    role: "DISTRIBUTOR"
                }
            });

            await tx.distributorProfile.create({
                data: {
                    userId: user.id,

                    distributorCode,
                    ...data
                }
            });
        });

        revalidatePath("/admin/distributors");
        return { message: "Distributor created successfully!" };
    } catch (error) {
        return { message: "Database Error: Failed to Create Distributor." };
    }
}

export async function getDistributors() {
    try {
        const distributors = await prisma.distributorProfile.findMany({
            include: {
                user: true
            },
            orderBy: {
                distributorCode: 'asc'
            }
        });
        return distributors;
    } catch (error) {
        console.error("Failed to fetch distributors:", error);
        throw new Error("Failed to fetch distributors.");
    }
}
