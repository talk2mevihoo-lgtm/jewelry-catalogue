"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid credentials. Please checking your email or password.");
            setLoading(false);
        } else {
            // Redirect based on role not easily available here without checking session?
            // For MVP we can assume based on email or fetch session.
            // Or simpler: Just hard redirect based on "knowledge" or generic dashboard. 
            // Better: Check email substring to route for now (since we have strict separation).

            // Note: In real app we would use useSession to redirect.
            // Let's do a simple check on email string to decide destination for UX speed:
            if (email.includes("admin")) {
                router.push("/admin/dashboard");
            } else {
                router.push("/distributor/shop");
            }
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center opacity-5 pointer-events-none" />

            <Card className="w-full max-w-md shadow-lg border-gold-200 z-10 bg-white/95 backdrop-blur">
                <CardHeader className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-primary font-serif">Jewelry Catalogue</h1>
                    <CardDescription>Associated with JewelSutra</CardDescription>
                    <CardTitle className="mt-4">Welcome Back</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Any password works for now"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 mt-4 text-center">{error}</p>
                        )}

                        <div className="mt-6 flex flex-col gap-2">
                            <Button className="w-full" variant="premium" type="submit" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        <strong>Test Credentials:</strong><br />
                        Admin: admin@jewelsutra.com<br />
                        Distributor: distributor@jewelsutra.com
                    </p>
                </CardFooter>
            </Card>

            <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
                <p>© {new Date().getFullYear()} Jewelry Catalogue & Ordering System</p>
            </footer>
        </main>
    );
}

