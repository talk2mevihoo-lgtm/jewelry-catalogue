import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/", // Custom login page
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                let user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { distributorProfile: true }
                });

                // --- DEV ONLY: AUTO-SEED USERS ---
                if (!user && credentials.password === "password123") {
                    if (credentials.email === "admin@jewelsutra.com") {
                        user = await prisma.user.create({
                            data: { email: credentials.email, password: "password123", role: "SUPER_ADMIN" },
                            include: { distributorProfile: true }
                        });
                    } else if (credentials.email === "distributor@jewelsutra.com") {
                        // Create basic distributor wrapper
                        user = await prisma.user.create({
                            data: {
                                email: credentials.email,
                                password: "password123",
                                role: "DISTRIBUTOR",
                                distributorProfile: {
                                    create: {
                                        distributorCode: "TEST-001",
                                        companyName: "Test Jewelry Co",
                                        contactPerson: "John Doe",
                                        contactNo: "1234567890",
                                        address: "123 Gem Street",
                                        region: "Mumbai"
                                    }
                                }
                            },
                            include: { distributorProfile: true }
                        });
                    }
                }
                // ----------------------------------

                if (!user) {
                    return null;
                }

                // In a real app, verify password hash here.
                if (credentials.password === user.password) { // Simple compare for demo
                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        name: user.distributorProfile?.contactPerson || "Admin",
                    };
                }

                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        }
    }
};
