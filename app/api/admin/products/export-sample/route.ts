import { NextResponse } from "next/server";

export async function GET() {
    const csvHeader = "modelNo,title,category,baseWeight,tags,visibility";
    const sampleRow1 = "RING-002,Sample Diamond Ring,Rings,3.5,\"Diamond,Gold\",ALL";
    const sampleRow2 = "PENDANT-005,Gold Heart Pendant,Pendants,2.1,\"Heart,Gift\",SELECTED";

    const csvContent = `${csvHeader}\n${sampleRow1}\n${sampleRow2}`;

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=product_import_sample.csv"
        }
    });
}
