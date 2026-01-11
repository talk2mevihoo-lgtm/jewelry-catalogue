import Link from "next/link";

export default function TenantHome({ params }: { params: { site: string } }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
            <h1 className="text-4xl font-bold font-serif">Welcome to {params.site}</h1>
            <p className="text-muted-foreground">This is a white-labeled storefront.</p>

            <div className="flex gap-4">
                <Link href="/distributor" className="text-primary underline">
                    Go to Distributor Portal
                </Link>
            </div>
        </div>
    );
}
