import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
    const hostname = req.headers.get("host");

    // Get the current environment's root domain
    // In dev, usually "localhost:3000". In prod, "yourdomain.com"
    // For now, we assume "localhost:3000" is the root.
    // We can configure this via env var ROOT_DOMAIN
    const rootDomain = "localhost:3000";
    const isDev = process.env.NODE_ENV === "development";

    // Clean hostname
    let currentHost = hostname?.replace(`.${rootDomain}`, "") || ""; // "tenant1"

    // If we are on the root domain itself (e.g. localhost:3000 or app.com)
    // currentHost would be "localhost:3000" (if regex failed) or empty depending on logic.
    // Let's refine:
    if (hostname === rootDomain) {
        currentHost = "main"; // Or null
    } else {
        // It's a subdomain 
        // hostname is "tenant1.localhost:3000" -> replace ".localhost:3000" -> "tenant1"
        currentHost = hostname!.replace(`.${rootDomain}`, "");
    }

    // If it's the main domain, proceed as normal (maps to app/page.tsx etc)
    // UNLESS we want to rewrite main domain to a specific site too?
    // Let's assume Main Domain = Standard Layout.
    // Subdomain = Tenant Layout.

    if (currentHost === "main") {
        return NextResponse.next();
    }

    // Rewrite to /sites/[site]
    // e.g. tenant1.localhost:3000/distributor -> /sites/tenant1/distributor
    return NextResponse.rewrite(new URL(`/sites/${currentHost}${url.pathname}`, req.url));
}
