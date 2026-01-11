"use client";

import { useEffect } from "react";
import { hexToHsl } from "@/lib/utils/color";

type Tenant = {
    primaryColor: string;
    secondaryColor: string;
    fontFamily?: string;
};

export function TenantThemeProvider({ tenant, children }: { tenant: Tenant, children: React.ReactNode }) {
    useEffect(() => {
        if (tenant) {
            const root = document.documentElement;
            // Primary
            if (tenant.primaryColor) {
                root.style.setProperty('--primary', hexToHsl(tenant.primaryColor));
                // We might want to set --ring etc too
                root.style.setProperty('--ring', hexToHsl(tenant.primaryColor));
            }
            // Secondary
            if (tenant.secondaryColor) {
                // root.style.setProperty('--secondary', hexToHsl(tenant.secondaryColor)); 
                // Note: Secondary in our app is usually ivory/light.
            }

            // Font?
            if (tenant.fontFamily) {
                // If we want dynamic fonts, we need to load them or map them.
                // For now, assume mapped class handles it or ignored.
            }
        }
    }, [tenant]);

    return <>{children}</>;
}
