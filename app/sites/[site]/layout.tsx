import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// We need to define metadata dynamic generation or just basic layout
export async function generateMetadata({ params }: { params: { site: string } }): Promise<Metadata> {
    const tenant = await getTenant(params.site);
    if (!tenant) return {};
    return {
        title: tenant.name,
        icons: tenant.faviconUrl ? [{ rel: "icon", url: tenant.faviconUrl }] : undefined
    };
}

import { TenantThemeProvider } from "@/components/providers/tenant-theme-provider";

export default async function TenantLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { site: string };
}) {
    const tenant = await getTenant(params.site);

    if (!tenant) {
        notFound();
    }

    return (
        <TenantThemeProvider tenant={tenant}>
            <div className="min-h-screen">
                <div className="bg-primary text-primary-foreground p-2 text-center text-xs font-medium">
                    {tenant.name} Official Portal
                </div>
                {children}
            </div>
        </TenantThemeProvider>
    );
}
