"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { z } from "zod";
import { bucket } from "@/lib/firebase"; // Keep this for server-side fallback or if we pass files

const ProductSchema = z.object({
    modelNo: z.string().min(1, "Model No is required"),
    title: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    baseWeight: z.string().transform((val) => parseFloat(val)),
    tags: z.string().optional(),
    visibility: z.string().optional().default("ALL"),
    allowedDistributors: z.array(z.string()).optional(), // Array of ID strings
});

// Helper to save file - mixed strategy
async function handleFileOrUrl(input: File | string, subDir: string = ""): Promise<string> {
    if (typeof input === "string") {
        // Assume it's already a URL (Client Side Upload)
        return input;
    }

    // File Object -> Server Side Upload
    if (bucket) {
        const bytes = await input.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(input.name);
        const filename = `${subDir ? subDir + '/' : ''}${uniqueSuffix}${ext}`;
        const fileRef = bucket.file(filename);

        await fileRef.save(buffer, { metadata: { contentType: input.type }, public: true });
        return fileRef.publicUrl();
    } else {
        // Local Fallback
        const bytes = await input.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(input.name);
        const filename = `${uniqueSuffix}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
        await mkdir(uploadDir, { recursive: true });
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);
        return `/uploads/${subDir ? subDir + '/' : ''}${filename}`;
    }
}

export async function createProduct(prevState: any, formData: FormData) {
    console.log("--- CREATE PRODUCT ACTION STARTED ---");
    try {
        // 1. Validate fields
        const rawData = {
            modelNo: formData.get("modelNo"),
            title: formData.get("title"),
            categoryId: formData.get("categoryId"),
            baseWeight: formData.get("baseWeight"),
            tags: formData.get("tags"),
            visibility: formData.get("visibility"),
            allowedDistributors: formData.getAll("allowedDistributors"),
        };
        console.log("Raw Data:", rawData);

        const validatedFields = ProductSchema.safeParse(rawData);

        if (!validatedFields.success) {
            console.error("Validation Error:", validatedFields.error.flatten());
            return { message: "Validation Error: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
        }

        // Check payload size roughly
        const mainImageInput = formData.get("mainImage");
        console.log("Main Image Type:", mainImageInput instanceof File ? "File" : typeof mainImageInput);
        if (mainImageInput instanceof File) console.log("Main Image Size:", mainImageInput.size);


        // 2. Handle Images
        let mainImageUrl = "";
        try {
            if (mainImageInput instanceof File && mainImageInput.size > 0) {
                console.log("Processing Main Image File...");
                mainImageUrl = await handleFileOrUrl(mainImageInput, "products");
                console.log("Main Image Processed:", mainImageUrl);
            } else if (typeof mainImageInput === "string" && mainImageInput.length > 0) {
                mainImageUrl = mainImageInput;
                console.log("Main Image URL accepted.");
            } else {
                return { message: "Main Image is required." };
            }
        } catch (fileErr: any) {
            console.error("Main Image Error:", fileErr);
            return { message: "Failed to process Main Image: " + fileErr.message };
        }

        const additionalFiles = formData.getAll("additionalImages");
        const additionalImageUrls: string[] = [];

        // ... (Similar logic for extras would go here, simplified for debug) ...
        for (const item of additionalFiles) {
            if (item instanceof File && item.size > 0) {
                const url = await handleFileOrUrl(item, "products");
                additionalImageUrls.push(url);
            } else if (typeof item === "string" && item.length > 0) {
                additionalImageUrls.push(item);
            }
        }

        const cadInput = formData.get("cadFile");
        let cadFileUrl = "";
        if (cadInput instanceof File && cadInput.size > 0) {
            cadFileUrl = await handleFileOrUrl(cadInput, "cads");
        } else if (typeof cadInput === "string" && cadInput.length > 0) {
            cadFileUrl = cadInput;
        }

        // 3. Database
        console.log("Attempting DB Insert...");
        const { modelNo, title, categoryId, baseWeight, tags, visibility, allowedDistributors } = validatedFields.data;

        await prisma.product.create({
            data: {
                modelNo,
                title,
                categoryId,
                baseWeight,
                mainImage: mainImageUrl,
                additionalImages: additionalImageUrls.join(","),
                cadFile: cadFileUrl || null,
                tags: tags || null,
                visibility: visibility || "ALL",
                allowedDistributors: allowedDistributors && allowedDistributors.length > 0 ? {
                    connect: allowedDistributors.map(id => ({ id }))
                } : undefined
            }
        });

        console.log("DB Insert Success!");
        revalidatePath("/admin/products");
        return { message: "Product created successfully!", success: true };

    } catch (e: any) {
        console.error("CRITICAL SERVER ERROR:", e);
        if (e.code === 'P2002') {
            return { message: "Error: Model Number already exists." };
        }
        return { message: "Server Error: " + (e.message || "Unknown error") };
    }
}

export async function getProducts(categoryId?: string, query?: string) {
    const where: any = {};

    if (categoryId && categoryId !== 'all') {
        where.categoryId = categoryId;
    }

    if (query && query.trim() !== '') {
        where.OR = [
            { modelNo: { contains: query } }, // SQLite is case-insensitive by default roughly, but let's assume standard behavior
            { title: { contains: query } }
        ];
    }

    return await prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
    });
}

// --- Product Management Actions ---

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({ where: { id } });
        revalidatePath("/admin/products");
        return { success: true, message: "Product deleted successfully." };
    } catch (e) {
        return { success: false, message: "Failed to delete product." };
    }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
    try {
        await prisma.product.update({
            where: { id },
            data: { isActive: !currentStatus }
        });
        revalidatePath("/admin/products");
        revalidatePath("/distributor/shop");
        return { success: true, message: "Status updated." };
    } catch (e) {
        console.error("TOGGLE STATUS ERROR:", e);
        return { success: false, message: "Failed to update status." };
    }
}

export async function updateProduct(id: string, prevState: any, formData: FormData) {
    console.log("--- UPDATE PRODUCT ACTION ---", id);
    try {
        // Validate basic fields
        const rawData = {
            modelNo: formData.get("modelNo"),
            title: formData.get("title"),
            categoryId: formData.get("categoryId"),
            baseWeight: formData.get("baseWeight"),
            tags: formData.get("tags"),
            visibility: formData.get("visibility"),
            allowedDistributors: formData.getAll("allowedDistributors"),
        };
        const validated = ProductSchema.safeParse(rawData);

        if (!validated.success) {
            return { message: "Validation Error: " + JSON.stringify(validated.error.flatten().fieldErrors) };
        }

        // Handle File Updates (Only if new files provided)
        const mainImageInput = formData.get("mainImage");
        let mainImageUrl = undefined; // Undefined means "don't update" in Prisma
        if (mainImageInput instanceof File && mainImageInput.size > 0) {
            mainImageUrl = await handleFileOrUrl(mainImageInput, "products");
        }

        // Additional Images (Replace all if provided, or logic to append? 
        // For simplicity, if provided, we replace. If not, we keep old.)
        // But formData from standard input usually sends empty if not touched? 
        // We need a specific logic. For now, let's assume we ONLY update if files are present.
        // A robust Edit form usually separates "Current Images" from "New Uploads".
        // We will implement that in the UI later.

        const updates: any = {
            modelNo: validated.data.modelNo,
            title: validated.data.title,
            categoryId: validated.data.categoryId,
            baseWeight: validated.data.baseWeight,
            tags: validated.data.tags,
            visibility: validated.data.visibility,
        };

        if (mainImageUrl) updates.mainImage = mainImageUrl;

        // Handle Allowed Distributors Update (Transaction or explicit set)
        // For implicit m-n, we can use set
        if (validated.data.allowedDistributors) {
            updates.allowedDistributors = {
                set: validated.data.allowedDistributors.map(id => ({ id }))
            };
        }

        await prisma.product.update({
            where: { id },
            data: updates
        });

        revalidatePath("/admin/products");
        return { success: true, message: "Product updated successfully." };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Update failed." };
    }
}

// --- Bulk Import Action ---
export async function bulkImportProducts(csvData: string) {
    const Papa = require("papaparse");

    // Parse CSV
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0) {
        return { success: false, message: "CSV Parsing Error", errors: parsed.errors };
    }

    const rows = parsed.data;
    const report = {
        successCount: 0,
        failureCount: 0,
        errors: [] as string[]
    };

    console.log(`Starting bulk import of ${rows.length} rows...`);

    // Fetch categories to map names to IDs
    const allCategories = await prisma.category.findMany();

    for (let i = 0; i < rows.length; i++) {
        const row: any = rows[i];
        const rowNum = i + 2; // 1-based, +1 for header

        try {
            // Validation
            if (!row.modelNo) throw new Error("Missing Model Number");
            if (!row.category) throw new Error("Missing Category");
            if (!row.baseWeight) throw new Error("Missing Base Weight");

            // Check duplicate
            const existing = await prisma.product.findFirst({ where: { modelNo: row.modelNo } });
            if (existing) throw new Error(`Model Number '${row.modelNo}' already exists`);

            // Find Category ID
            const category = allCategories.find(c => c.name.toLowerCase() === row.category.toLowerCase().trim());
            if (!category) throw new Error(`Category '${row.category}' not found`);

            // Parse Weight
            const baseWeight = parseFloat(row.baseWeight);
            if (isNaN(baseWeight)) throw new Error(`Invalid Base Weight '${row.baseWeight}'`);

            // Insert
            await prisma.product.create({
                data: {
                    modelNo: row.modelNo,
                    title: row.title || undefined,
                    categoryId: category.id,
                    baseWeight: baseWeight,
                    tags: row.tags || null,
                    visibility: row.visibility && ["ALL", "SELECTED"].includes(row.visibility) ? row.visibility : "ALL",
                    mainImage: "",
                    additionalImages: ""
                }
            });

            report.successCount++;

        } catch (err: any) {
            report.failureCount++;
            report.errors.push(`Row ${rowNum}: ${err.message}`);
        }
    }

    revalidatePath("/admin/products");
    return { success: true, report };
}
